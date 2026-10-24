import { randomUUID, createHash } from 'node:crypto';
import matter from 'gray-matter';
import { validateSnapshot, dashboard, resolveAnchor, addComment, replyToComment, setTaskStatus, assignAsset } from './index.mjs';
const json = value => JSON.stringify(value, null, 2) + '\n';
const uid = prefix => `${prefix}:${randomUUID()}`;
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const requireText = (s, label, max = 5000) => { if (typeof s !== 'string' || !s.trim() || s.length > max) throw new Error(`${label} fehlt oder ist zu lang.`); return s.trim(); };
const slug = s => { if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(s)) throw new Error('Bitte einen kurzen Namen aus Kleinbuchstaben, Zahlen und Bindestrichen verwenden.'); return s; };
const replaceScreenshot=(body,quote,image,caption='')=>{
 const blocks=[...body.matchAll(/^(:{3,}) info [^\n]*\n/gm)].map(start=>{const rest=body.slice(start.index+start[0].length);const end=new RegExp(`^${start[1]}[ \\t]*$`,'m').exec(rest);return end?body.slice(start.index,start.index+start[0].length+end.index+end[0].length):null;}).filter(Boolean).filter(block=>/^:{3,} info Screenshot fehlt:/m.test(block)&&block.includes(quote)).sort((a,b)=>a.length-b.length);
 const insertion=`\n\n${image}\n\n${caption}\n`;
 return blocks.length?body.replace(blocks[0],insertion):body.replace(quote,quote+insertion);
};

export function readWorkspace(repo) {
  const head = repo.head(); const read = path => JSON.parse(repo.read(path, head));
  const snapshot = validateSnapshot({ schemaVersion: 1, catalog: read('.academy/studio/catalog.json'), sources: read('data/sources.json'), bundles: repo.list('.academy/studio/guides', head).filter(p => p.endsWith('.json')).map(read), gameValues: read('data/game/pets.json').records });
  const categories = read('data/categories.json');
  const guides = snapshot.catalog.guides.map(guide => {
    const raw = repo.read(guide.path, head); const { data, content } = matter(raw);
    return { ...guide, title: data.title || guide.id, status: data.status, review: data.review, body: content, frontmatter: data, blobSha: repo.blob(guide.path, head), versions: repo.history(guide.path) };
  });
  return { head, branch: repo.branch, snapshot, categories, guides, dashboard: dashboard(snapshot), mode: 'local-only', publishEnabled: false };
}
export function initializeWorkspace(repo) {
  const head = repo.initialize();
  const bundle = JSON.parse(repo.read('.academy/studio/guides/pets.json', head));
  // Import the immutable existing draft once; the public main checkout is never edited.
  const current = repo.read('docs/guides/pets.md', head);
  if (matter(current).data.status !== 'draft') {
    const draft = repo.read('docs/guides/pets.md', bundle.document.commitSha);
    repo.commit(head, { 'docs/guides/pets.md': draft }, 'Studio: bestehenden Pets-Entwurf als lokalen Arbeitsstand öffnen');
  }
  return readWorkspace(repo);
}
export function runCommand(repo, input, actorId = 'local-owner') {
  if (!input || typeof input !== 'object') throw new Error('Ungültiger Auftrag.');
  const state = readWorkspace(repo);
  if (input.expectedHead !== state.head) throw new Error('CONFLICT: Der Entwurf wurde inzwischen geändert. Bitte neu laden.');
  let snapshot = structuredClone(state.snapshot);
  const files = {}; const event = action => ({ id: uid('event'), action, actorId, at: now(), note: '' });
  const guide = state.guides.find(g => g.id === input.guideId);
  const needGuide = () => { if (!guide) throw new Error('Guide nicht gefunden.'); return guide; };
  const bundleFor = () => {
    needGuide(); let bundle = snapshot.bundles.find(b => b.guideId === guide.id);
    if (!bundle) { bundle = { schemaVersion: 1, guideId: guide.id, visibility: 'public', document: { ref: repo.branch, commitSha: state.head, blobSha: guide.blobSha }, sections: [], assets: [], placeholders: [], comments: [], tasks: [] }; snapshot.bundles.push(bundle); }
    return bundle;
  };
  const anchor = quote => {
    needGuide(); requireText(quote, 'Markierte Textstelle', 15000);
    const value = { kind: 'text', sectionId: null, quote, prefix: '', suffix: '', targetId: null, baseCommitSha: state.head, baseBlobSha: guide.blobSha };
    if (resolveAnchor(value, guide.body, guide.blobSha).state !== 'attached') throw new Error('Die Textstelle ist nicht eindeutig. Bitte eine längere Passage markieren.');
    return value;
  };
  switch (input.op) {
    case 'guide.migrate-tasks': {
      needGuide();const b=bundleFor();
      const legacy=/\n## Redaktionelle Prüfliste\n([\s\S]*?)(?=\n## |$)/.exec(guide.body);
      if(!legacy)throw new Error('Keine alte Prüfliste vorhanden.');
      const lines=legacy[1].split('\n').filter(line=>/^- \[[ x]\] /.test(line));
      if(!lines.length)throw new Error('Keine übernehmbaren Aufgaben gefunden.');
      for(const [index,line] of lines.entries()){
        const title=line.replace(/^- \[[ x]\] /,'').replaceAll('**','');
        const id=index===0?'task:pets-eu-values':`task:legacy-${createHash('sha256').update(title).digest('hex').slice(0,16)}`;
        const existing=b.tasks.find(t=>t.id===id);
        const taskAnchor=index===0?anchor('Alle Zahlen benötigen einen Abgleich mit dem aktuellen EU-Client.'):null;
        if(existing){existing.anchor=taskAnchor;existing.history.push(event('legacy-task-migrated'));}
        else b.tasks.push({id,title,anchor:taskAnchor,status:line.startsWith('- [x]')?'done':'open',kind:'verification',sourceIds:[],history:[event('legacy-task-migrated')]});
      }
      files[guide.path]=matter.stringify(guide.body.replace(legacy[0],'\n'),{...guide.frontmatter,status:'draft'});break;
    }
    case 'guide.save': {
      needGuide(); if (typeof input.body !== 'string' || input.body.length > 500000) throw new Error('Ungültiger Guide-Text.');
      const metadata = { ...guide.frontmatter, title: requireText(input.title, 'Titel', 160), updated: now().slice(0, 10), status: 'draft' };
      files[guide.path] = matter.stringify(input.body, metadata); break;
    }
    case 'guide.create': {
      const name = slug(input.slug); const id = uid('guide'); const path = `docs/guides/${name}.md`;
      if (snapshot.catalog.guides.some(g => g.path === path)) throw new Error('Dieser Dateiname ist bereits vergeben.');
      snapshot.catalog.guides.push({ id, path, categoryId: input.categoryId || null, lifecycle: 'active' });
      files[path] = matter.stringify(`# ${requireText(input.title, 'Titel', 160)}\n\n`, { title: input.title, author: 'Voidborn Academy', status: 'draft', review: 'pending', updated: now().slice(0, 10) }); break;
    }
    case 'guide.assign': {
      needGuide(); if(input.categoryId!==null&&!snapshot.catalog.categories.some(c=>c.id===input.categoryId))throw new Error('Thema nicht gefunden.');
      snapshot.catalog.guides.find(g=>g.id===guide.id).categoryId=input.categoryId;break;
    }
    case 'guide.reorder': {
      if(!Array.isArray(input.ids)||input.ids.length!==snapshot.catalog.guides.length||new Set(input.ids).size!==input.ids.length||input.ids.some(id=>!snapshot.catalog.guides.some(g=>g.id===id)))throw new Error('Ungültige Guidereihenfolge.');
      snapshot.catalog.guides=input.ids.map(id=>snapshot.catalog.guides.find(g=>g.id===id));break;
    }
    case 'category.create': {
      const name=slug(input.slug);if(snapshot.catalog.categories.some(c=>c.slug===name))throw new Error('Thema existiert bereits.');
      snapshot.catalog.categories.push({id:uid('category'),slug:name});
      files['data/categories.json']=json([...state.categories,{slug:name,title:requireText(input.title,'Thema',160),description:typeof input.description==='string'?input.description.slice(0,1000):'',group:'start',icon:'compass',keywords:''}]);break;
    }
    case 'category.rename': {
      const c=snapshot.catalog.categories.find(c=>c.id===input.categoryId);if(!c)throw new Error('Thema nicht gefunden.');
      files['data/categories.json']=json(state.categories.map(x=>x.slug===c.slug?{...x,title:requireText(input.title,'Thema',160)}:x));break;
    }
    case 'source.save': {
      if(typeof input.url!=='string'||!/^https:\/\/[^\s]+$/.test(input.url))throw new Error('Ungültige Quellenadresse.');
      const old=input.id?snapshot.sources.find(x=>x.id===input.id):null;if(input.id&&!old)throw new Error('Quelle nicht gefunden.');
      const value={id:old?.id||uid('source'),title:requireText(input.title,'Quellentitel',200),url:input.url,checkedAt:null};
      if(old)Object.assign(old,value);else snapshot.sources.push(value);files['data/sources.json']=json(snapshot.sources);break;
    }
    case 'screenshot.restore': {
      const b=snapshot.bundles.find(b=>b.placeholders.some(p=>p.id===input.id));const p=b?.placeholders.find(p=>p.id===input.id);
      if(!p||!p.assetId)throw new Error('Kein Bild zum Zurücksetzen vorhanden.');
      const target=state.guides.find(g=>g.id===b.guideId),asset=snapshot.bundles.flatMap(b=>b.assets).find(a=>a.id===p.assetId);
      const image=`![${asset.alt.replace(/[\[\]\n]/g,'')}](/${asset.path.slice('docs/public/'.length)})`;
      if(target.body.split(image).length!==2)throw new Error('Bildstelle ist nicht eindeutig.');
      const marker=`<!-- academy-screenshot:${p.id} -->`,box=`::: info Screenshot fehlt: ${p.title.replace(/[\r\n]/g,' ')}\n\n${p.description}\n\n${marker}\n\n:::`;
      const existingBlock=image+(asset.caption?`\n\n${asset.caption}`:'');
      files[target.path]=matter.stringify(target.body.replace(target.body.includes(existingBlock)?existingBlock:image,()=>box),{...target.frontmatter,status:'draft'});
      p.assetId=null;p.status='missing';p.anchor={...p.anchor,quote:marker};p.history.push(event('image-restored-to-placeholder'));break;
    }
    case 'screenshot.details': {
      const p=snapshot.bundles.flatMap(b=>b.placeholders).find(p=>p.id===input.id);if(!p)throw new Error('Platzhalter nicht gefunden.');
      if(input.title!==undefined)p.title=requireText(input.title,'Bildtitel',160);
      if(input.description!==undefined)p.description=requireText(input.description,'Bildbeschreibung');p.history.push(event('screenshot-details-changed'));break;
    }
    case 'guide.archive': needGuide(); snapshot.catalog.guides.find(g => g.id === guide.id).lifecycle = input.archived === false ? 'active' : 'archived'; break;
    case 'guide.move': {
      needGuide(); const name = slug(input.slug); const nextPath = `docs/guides/${name}.md`;
      if (snapshot.catalog.guides.some(g => g.path === nextPath)) throw new Error('Der Zielname ist bereits vergeben.');
      const old = guide.path.split('/').pop().slice(0, -3);
      snapshot.catalog.guides.find(g => g.id === guide.id).path = nextPath;
      files[guide.path] = null; files[nextPath] = repo.read(guide.path, state.head);
      for (const item of state.guides) {
        const raw = repo.read(item.path, state.head);
        const next = raw.replaceAll(`](./${old})`, `](./${name})`).replaceAll(`](/guides/${old})`, `](/guides/${name})`).replaceAll(`](/guides/${old}.html)`, `](/guides/${name}.html)`);
        if (next !== raw) files[item.id === guide.id ? nextPath : item.path] = next;
      }
      const categories = state.categories.map(c => c.slug === old ? { ...c, slug: name } : c);
      for (const binding of snapshot.catalog.categories) if (binding.slug === old) binding.slug = name;
      files['data/categories.json'] = json(categories); break;
    }
    case 'guide.restore': {
      needGuide(); if (!guide.versions.some(v => v.sha === input.version)) throw new Error('Version ist nicht in der Guide-Historie.');
      const previous = matter(repo.read(guide.path, input.version));
      files[guide.path] = matter.stringify(previous.content, { ...previous.data, status: 'draft', updated: now().slice(0, 10) }); break;
    }
    case 'comment.add': {
      bundleFor(); const at = now();
      snapshot = addComment(snapshot, guide.id, { id: uid('comment'), anchor: anchor(input.quote), body: requireText(input.body, 'Kommentar'), authorId: actorId, status: 'open', replies: [], createdAt: at, updatedAt: at, history: [] }); break;
    }
    case 'comment.reply': snapshot = replyToComment(snapshot, input.id, { id: uid('reply'), authorId: actorId, body: requireText(input.body, 'Antwort'), createdAt: now() }); break;
    case 'comment.status': {
      const c = snapshot.bundles.flatMap(b => b.comments).find(c => c.id === input.id); if (!c) throw new Error('Kommentar nicht gefunden.');
      c.status = input.status; c.updatedAt = now(); c.history.push(event('comment-status-changed')); break;
    }
    case 'task.add': bundleFor().tasks.push({ id: uid('task'), title: requireText(input.title, 'Aufgabe', 200), anchor: input.quote ? anchor(input.quote) : null, status: 'open', kind: 'general', sourceIds: [], history: [] }); break;
    case 'task.status': snapshot = setTaskStatus(snapshot, input.id, input.status, event('task-status-changed')); break;
    case 'screenshot.insert': {
      const b=bundleFor();
      if(!/^screenshot:[a-f0-9-]{36}$/.test(input.id||''))throw new Error('Ungültige Platzhalter-ID.');
      const marker=`<!-- academy-screenshot:${input.id} -->`;
      if(typeof input.body!=='string'||input.body.length>500000||input.body.split(marker).length!==2||guide.body.includes(marker))throw new Error('Der neue Bildplatzhalter ist nicht eindeutig im Text vorhanden.');
      const title=requireText(input.title,'Bildtitel',160),description=requireText(input.description,'Bildbeschreibung');
      const raw=matter.stringify(input.body,{...guide.frontmatter,title:input.guideTitle===undefined?guide.title:requireText(input.guideTitle,'Guide-Titel',160),status:'draft',updated:now().slice(0,10)});
      const bytes=Buffer.from(raw);
      const blobSha=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      b.placeholders.push({id:input.id,title,description,anchor:{kind:'text',sectionId:null,quote:marker,prefix:'',suffix:'',targetId:null,baseCommitSha:state.head,baseBlobSha:blobSha},status:'missing',assetId:null,sourceIds:[],history:[event('screenshot-inserted')]});
      files[guide.path]=raw;break;
    }
    case 'screenshot.add': {
      const b = bundleFor(); b.placeholders.push({ id: uid('screenshot'), title: requireText(input.title, 'Bildtitel', 160), description: requireText(input.description, 'Bildbeschreibung'), anchor: anchor(input.quote), status: 'missing', assetId: null, sourceIds: [], history: [] }); break;
    }
    case 'screenshot.archive': {
      const p = snapshot.bundles.flatMap(b => b.placeholders).find(p => p.id === input.id); if (!p) throw new Error('Platzhalter nicht gefunden.'); p.status = 'archived'; p.history.push(event('screenshot-archived')); break;
    }
    case 'screenshot.reuse': {
      const b = snapshot.bundles.find(b => b.placeholders.some(p => p.id === input.id)); if (!b) throw new Error('Platzhalter nicht gefunden.');
      const p = b.placeholders.find(p => p.id === input.id);
      if(p.assetId)throw new Error('Das Bild ist bereits zugeordnet. Zum Austausch bitte eine neue Bilddatei hochladen oder zuerst zum Platzhalter zurücksetzen.');
      const asset = snapshot.bundles.flatMap(b => b.assets).find(a => a.id === input.assetId); if (!asset) throw new Error('Bild nicht gefunden.');
      const target = state.guides.find(g => g.id === b.guideId);
      if (resolveAnchor(p.anchor, target.body, target.blobSha).state === 'stale') throw new Error('Textstelle fehlt.');
      const image = `![${asset.alt.replace(/[\[\]\n]/g, '')}](/${asset.path.slice('docs/public/'.length)})`;
      files[target.path] = matter.stringify(replaceScreenshot(target.body,p.anchor.quote,image,asset.caption), { ...target.frontmatter, status: 'draft' });
      p.assetId = asset.id; p.status = 'ready'; p.history.push(event('image-reused')); break;
    }
    case 'category.reorder': {
      if (!Array.isArray(input.ids) || new Set(input.ids).size !== snapshot.catalog.categories.length || input.ids.length !== snapshot.catalog.categories.length || input.ids.some(id=>!snapshot.catalog.categories.some(c=>c.id===id))) throw new Error('Ungültige Themenreihenfolge.');
      snapshot.catalog.categories = input.ids.map(id=>snapshot.catalog.categories.find(c=>c.id===id));
      files['data/categories.json'] = json(snapshot.catalog.categories.map(binding=>state.categories.find(c=>c.slug===binding.slug))); break;
    }
    case 'screenshot.upload': {
      const b = snapshot.bundles.find(b => b.placeholders.some(p => p.id === input.id)); if (!b) throw new Error('Platzhalter nicht gefunden.');
      const p = b.placeholders.find(p => p.id === input.id); const target = state.guides.find(g => g.id === b.guideId);
      if (!/^[a-zA-Z0-9+/]+=*$/.test(input.base64 || '')) throw new Error('Ungültige Bilddatei.');
      const bytes = Buffer.from(input.base64, 'base64'); if (bytes.length > 2 * 1024 * 1024) throw new Error('Bild ist zu groß. Maximal 2 MB.');
      const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp = bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
      if (!png && !jpg && !webp) throw new Error('Bitte PNG, JPEG oder WebP verwenden.');
      let replaceQuote=p.anchor.quote,replaceCaption='';
      if(p.assetId){const old=snapshot.bundles.flatMap(b=>b.assets).find(a=>a.id===p.assetId);replaceCaption=old.caption;replaceQuote=`![${old.alt.replace(/[\[\]\n]/g,'')}](/${old.path.slice('docs/public/'.length)})`;}
      if(target.body.split(replaceQuote).length!==2)throw new Error('Bildstelle fehlt oder ist nicht eindeutig.');
      const hash = createHash('sha256').update(bytes).digest('hex'); const path = `docs/public/images/uploads/${hash.slice(0,20)}.${png ? 'png' : jpg ? 'jpg' : 'webp'}`;
      const asset = { id: uid('asset'), path, alt: requireText(input.alt, 'Bildbeschreibung', 500), caption: typeof input.caption === 'string' ? input.caption.slice(0,1000) : '', sourceIds: [], rights: '', sha256: hash };
      snapshot = assignAsset(snapshot, p.id, asset, event('image-uploaded'));
      const updated = snapshot.bundles.find(x => x.guideId === b.guideId).placeholders.find(x => x.id === p.id);
      const image = `![${asset.alt.replace(/[\[\]\n]/g, '')}](/${path.slice('docs/public/'.length)})`;
      const oldBlock=replaceQuote+(replaceCaption?`\n\n${replaceCaption}`:'');
      const body = p.assetId?target.body.replace(target.body.includes(oldBlock)?oldBlock:replaceQuote,()=>image+(asset.caption?`\n\n${asset.caption}`:'')):replaceScreenshot(target.body,replaceQuote,image,asset.caption);
      files[target.path] = matter.stringify(body, { ...target.frontmatter, status: 'draft', updated: now().slice(0,10) });
      files[path] = bytes; updated.status = 'ready';updated.anchor={...updated.anchor,quote:image}; break;
    }
    case 'game.save': snapshot.gameValues = input.records.map(record=>({...record,publication:'draft'})); break;
    default: throw new Error('Unbekannte Studio-Aktion.');
  }
  validateSnapshot(snapshot);
  if(JSON.stringify(snapshot.catalog)!==JSON.stringify(state.snapshot.catalog))files['.academy/studio/catalog.json'] = json(snapshot.catalog);
  if(JSON.stringify(snapshot.gameValues)!==JSON.stringify(state.snapshot.gameValues))files['data/game/pets.json'] = json({ schemaVersion: 1, records: snapshot.gameValues });
  for (const b of snapshot.bundles) {
    const existing = state.snapshot.bundles.find(old => old.guideId === b.guideId);
    const file = existing ? repo.list('.academy/studio/guides', state.head).find(p => JSON.parse(repo.read(p, state.head)).guideId === b.guideId) : `.academy/studio/guides/${b.guideId.split(':')[1]}.json`;
    if(!existing||JSON.stringify(existing)!==JSON.stringify(b))files[file] = json(b);
  }
  repo.commit(state.head, files, `Studio: ${input.op}`);
  return readWorkspace(repo);
}
