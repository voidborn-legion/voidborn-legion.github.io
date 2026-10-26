import matter from 'gray-matter';
import {digest} from './security.mjs';
import {remoteWorkspace,publicationRemote,checkPublicLinks,gh,readTextBlobs} from './github.mjs';
import {validateSite} from '../../packages/academy-model/site.mjs';
const repo='voidborn-legion/voidborn-legion.github.io',base=`https://api.github.com/repos/${repo}`;
export function publicationTargets(values){
 if(!Array.isArray(values)||!values.length||values.length>50||new Set(values).size!==values.length||values.some(v=>v!=='site'&&!/^guide:[a-zA-Z0-9_-]+$/.test(v)))throw new Error('Eine eindeutige Auswahl von 1 bis 50 Veröffentlichungszielen ist erforderlich.');
 return [...values].sort();
}
async function stage(token,branch,values,adapters={}){
 const targets=publicationTargets(values),workspace=await (adapters.workspace||remoteWorkspace)(token,branch),state=workspace.state,live=await (adapters.publication||publicationRemote)(token);
 let draft=workspace.files;
 if(!draft){const draftCommit=await gh(token,`/git/commits/${state.head}`),tree=await gh(token,`/git/trees/${draftCommit.tree.sha}?recursive=1`);if(tree.truncated)throw new Error('Entwurfsbaum ist unvollständig.');draft=Object.fromEntries(tree.tree.filter(x=>x.type==='blob'&&x.mode==='100644').map(x=>[x.path,x.sha]));}
 const reads=new Map();
 const read=async(path,files=draft)=>{if(!files[path])throw new Error('Datei fehlt: '+path);if(files===draft&&workspace.repo){try{return workspace.repo.read(path,state.head);}catch{}}
  if(reads.has(files[path]))return reads.get(files[path]);const b=await gh(token,`/git/blobs/${files[path]}`),text=Buffer.from(b.content.replace(/\s/g,''),'base64').toString('utf8');reads.set(files[path],text);return text;};
 const catalog=JSON.parse(await read('.academy/studio/catalog.json')),publicCatalog=JSON.parse(await read('.academy/studio/catalog.json',live.files));
 const selected=targets.filter(t=>t!=='site').map(id=>{const g=state.guides.find(g=>g.id===id&&g.lifecycle!=='archived');if(!g||!/^docs\/guides\/[a-z0-9/-]+\.md$/.test(g.path)||g.path.includes('..'))throw new Error('Aktiver Beitrag nicht gefunden: '+id);return g;});
 const publicPaths=[...new Set([...selected.map(g=>g.path),...(selected.length?['data/categories.json']:[]),...(targets.includes('site')?['data/site.json']:[])])].filter(path=>live.files[path]);
 const publicText=await readTextBlobs(token,publicPaths.map(path=>({path,sha:live.files[path]})));for(const [path,text] of publicText)reads.set(live.files[path],text);
 const prospective={...live.files,...Object.fromEntries(selected.map(g=>[g.path,draft[g.path]]))},files=[],documents=[],warnings=[],receipt={...live.receipt};
 const put=(path,content,sha)=>{const existing=files.find(f=>f.path===path);if(existing){if(existing.content!==content||existing.sha!==sha)throw new Error('Widersprüchliche Dateien: '+path);return;}files.push({path,...(content===undefined?{sha}:{content})});};
 for(const g of selected){
  const doc=matter(await read(g.path));checkPublicLinks(doc.content,g.path,prospective);
  const frontmatter={...doc.data,status:'published',category:catalog.categories?.find(c=>c.id===g.categoryId)?.slug||null};delete frontmatter.reviewRequest;
  const content=matter.stringify(doc.content,frontmatter);put(g.path,content);receipt[g.path]=draft[g.path];
  const bundle=state.snapshot.bundles.find(b=>b.guideId===g.id),old=live.files[g.path]?await read(g.path,live.files):null;
  const notes={review:doc.data.review||null,openComments:(bundle?.comments||[]).filter(c=>c.status!=='done').length,openTasks:(bundle?.tasks||[]).filter(t=>t.status!=='done').length,missingImages:(bundle?.placeholders||[]).filter(p=>['missing','needs-review'].includes(p.status)).length};
  documents.push({target:g.id,title:g.title,path:g.path,before:old,after:content,notes});
  if(notes.review==='pending'||notes.openComments||notes.openTasks||notes.missingImages)warnings.push({target:g.id,...notes});
  const entry=catalog.guides.find(x=>x.id===g.id),at=publicCatalog.guides.findIndex(x=>x.id===g.id);if(at<0)publicCatalog.guides.push(entry);else publicCatalog.guides[at]=entry;
 }
 if(selected.length){
  const categories=JSON.parse(await read('data/categories.json',live.files)),draftCategories=JSON.parse(await read('data/categories.json'));
  let changed=false;for(const g of selected){const cat=catalog.categories?.find(c=>c.id===g.categoryId);if(cat&&!publicCatalog.categories.some(c=>c.id===cat.id)){const detail=draftCategories.find(c=>c.slug===cat.slug);if(!detail)throw new Error('Themenbeschreibung fehlt.');publicCatalog.categories.push(cat);if(!categories.some(c=>c.slug===cat.slug))categories.push(detail);changed=true;}}
  put('.academy/studio/catalog.json',JSON.stringify(publicCatalog,null,2)+'\n');if(changed)put('data/categories.json',JSON.stringify(categories,null,2)+'\n');
 }
 if(targets.includes('site')){const content=await read('data/site.json');validateSite(JSON.parse(content));put('data/site.json',content);receipt['data/site.json']=draft['data/site.json'];documents.push({target:'site',path:'data/site.json',before:await read('data/site.json',live.files),after:content});}
 const images=[...new Set(documents.flatMap(d=>[...d.after.matchAll(/\/images\/[a-zA-Z0-9/_ .-]+\.(?:png|jpe?g|webp)/g)].map(m=>'docs/public'+m[0])))];
 for(const path of images){const sha=draft[path]||live.files[path];if(!sha)throw new Error('Referenziertes Bild fehlt: '+path);put(path,undefined,sha);}
 put('.academy/publication.json',JSON.stringify(receipt,null,2)+'\n');files.sort((a,b)=>a.path.localeCompare(b.path));
 const preview={targets,expectedHead:state.head,expectedPublicHead:live.head,documents,images,warnings,paths:files.map(f=>f.path)};
 return {preview:{...preview,previewHash:await digest(JSON.stringify({preview,files}))},files,live};
}
export async function preparePublication(token,branch,targets,adapters){return (await stage(token,branch,targets,adapters)).preview;}
export async function publishSelection(token,branch,input,actor,adapters){
 const staged=await stage(token,branch,input.targets,adapters),p=staged.preview;
 if(p.expectedHead!==input.expectedHead||p.expectedPublicHead!==input.expectedPublicHead||p.previewHash!==input.previewHash)throw new Error('CONFLICT: Auswahl, Entwurf oder Online-Stand verändert. Vorschau neu erstellen.');
 // Git's tree endpoint accepts UTF-8 contents directly. All selected documents
 // are written in one request instead of another subrequest for every blob.
 const files=staged.files.map(file=>({path:file.path,mode:'100644',type:'blob',...(file.sha?{sha:file.sha}:{content:file.content})}));
 const tree=await gh(token,'/git/trees',{base_tree:staged.live.tree,tree:files}),commit=await gh(token,'/git/commits',{message:`Academy: ${p.targets.length} geprüfte Veröffentlichungsziele (${actor})`,tree:tree.sha,parents:[p.expectedPublicHead]});
 const result=await fetch(base+'/git/refs/heads/main',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'Voidborn-Academy'},body:JSON.stringify({sha:commit.sha,force:false})});
 if(!result.ok)throw new Error('CONFLICT: Online-Stand verändert; nichts überschrieben.');
 return {commitSha:commit.sha,status:'commit-created',buildPending:true,targets:p.targets,paths:p.paths,url:`https://github.com/${repo}/actions`};
}
export async function publicationStatus(token,commitSha){
 const live=await publicationRemote(token);if(!commitSha)return live;
 if(!/^[a-f0-9]{40}$/.test(commitSha))throw new Error('Ungültige Veröffentlichungsrevision.');
 const out={...live,commitSha,status:'commit-created',buildPending:true,websiteConfirmed:false};
 try{
  const r=await fetch(base+`/actions/workflows/deploy.yml/runs?head_sha=${commitSha}&per_page=10`,{headers:{Accept:'application/vnd.github+json','User-Agent':'Voidborn-Academy'}});if(!r.ok)throw new Error('Build-Status nicht erreichbar.');
  const run=(await r.json()).workflow_runs?.filter(x=>x.head_sha===commitSha).sort((a,b)=>b.run_number-a.run_number||b.run_attempt-a.run_attempt)[0];
  if(!run)return out;out.buildURL=run.html_url;
  if(run.status!=='completed'){out.status='building';return out;}
  out.buildPending=false;if(run.conclusion!=='success'){out.status='build-failed';out.conclusion=run.conclusion;return out;}
  out.status='awaiting-website';const deployed=await fetch('https://voidborn-legion.github.io/.well-known/academy-release.json?revision='+commitSha,{cache:'no-store'});
  if(deployed.ok&&(await deployed.json()).commitSha===commitSha){out.status='live';out.websiteConfirmed=true;}return out;
 }catch(e){return {...out,status:'status-unavailable',warning:e.message};}
}
