import { runCommand, readWorkspace } from '../../packages/academy-model/commands.mjs';
import matter from 'gray-matter';
import {validateSite} from '../../packages/academy-model/site.mjs';
const REPO='voidborn-legion/voidborn-legion.github.io';
const BASE=`https://api.github.com/repos/${REPO}`;
const allowedBranch=b=>/^(?:draft|dev)\/[a-zA-Z0-9/_-]+$/.test(b)&&!b.includes('..');
export async function gh(token,path,body){
 if(path!==''&&!path.startsWith('/'))throw new Error('Invalid GitHub path');
 const result=await fetch(BASE+path,{method:body?'POST':'GET',headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Voidborn-Academy-Studio','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await result.json();if(!result.ok)throw new Error(`GitHub ${result.status}: ${data.message||'Request failed'}`);return data;
}
export async function assertPermission(token){const data=await gh(token,'');if(!data.permissions?.push)throw new Error('Kein Schreibzugriff auf das Academy-Repository.');return data;}
export async function remoteWorkspace(token,branch){
 if(!allowedBranch(branch))throw new Error('Nur Entwicklungs- oder Entwurfsbranches erlaubt.');
 const head=(await gh(token,`/git/ref/heads/${branch.split('/').map(encodeURIComponent).join('/')}`)).object.sha;
 const commit=await gh(token,`/git/commits/${head}`);
 const tree=await gh(token,`/git/trees/${commit.tree.sha}?recursive=1`);if(tree.truncated)throw new Error('Repository-Baum zu groß für diesen Adapter.');
 const entries=new Map(tree.tree.filter(e=>e.type==='blob'&&e.mode==='100644').map(e=>[e.path,e]));
 const paths=[...entries.keys()].filter(p=>p==='.academy/studio/catalog.json'||p.startsWith('.academy/studio/guides/')||p==='data/site.json'||p==='data/sources.json'||p==='data/categories.json'||p==='data/game/pets.json'||p.startsWith('docs/guides/'));
 if(paths.length>120)throw new Error('Zu viele Guide-Dateien für einen einzelnen Ladevorgang.');
 const cache=new Map();
 // Bounded concurrency; no visitor credentials leave this request-scoped object.
 for(let offset=0;offset<paths.length;offset+=6){await Promise.all(paths.slice(offset,offset+6).map(async path=>{
  const blob=await gh(token,`/git/blobs/${entries.get(path).sha}`);cache.set(path,Buffer.from(blob.content.replace(/\n/g,''),'base64').toString('utf8'));
 }));}
 const histories=new Map(); // Loaded lazily for the one selected guide, not N GitHub requests per screen.
 const repo={branch,head:()=>head,read:(path,ref=head)=>{if(ref!==head||!cache.has(path))throw new Error('Dateiversion ist nicht geladen.');return cache.get(path);},list:prefix=>[...cache.keys()].filter(p=>p.startsWith(prefix)),blob:path=>entries.get(path)?.sha,history:path=>histories.get(path)||[]};
 const state=readWorkspace(repo);state.mode='github';
 return {repo,state,baseTree:commit.tree.sha};
}
export async function commitRemote(token,branch,expectedHead,files,message,baseTree){
 if(!allowedBranch(branch))throw new Error('Veröffentlichung ist in diesem Dienst gesperrt.');
 if((await gh(token,`/git/ref/heads/${branch}`)).object.sha!==expectedHead)throw new Error('CONFLICT: Der Entwurf wurde inzwischen geändert.');
 const elements=[];
 for(const [path,content] of Object.entries(files)){
  if(!/^(?:\.academy\/studio\/(?:catalog|guides\/[a-zA-Z0-9-]+)\.json|data\/(?:site|categories|sources|game\/[a-zA-Z0-9-]+)\.json|docs\/guides\/[a-zA-Z0-9/-]+\.md|docs\/public\/images\/uploads\/[a-f0-9]+\.(?:png|jpg|webp))$/.test(path)||path.includes('..'))throw new Error('Pfad außerhalb des Studio-Inhaltsbereichs.');
  if(content===null)elements.push({path,mode:'100644',type:'blob',sha:null});
  else{const blob=await gh(token,'/git/blobs',{content:Buffer.isBuffer(content)?content.toString('base64'):content,encoding:Buffer.isBuffer(content)?'base64':'utf-8'});elements.push({path,mode:'100644',type:'blob',sha:blob.sha});}
 }
 const tree=await gh(token,'/git/trees',{base_tree:baseTree,tree:elements});
 const commit=await gh(token,'/git/commits',{message,tree:tree.sha,parents:[expectedHead]});
 const response=await fetch(BASE+`/git/refs/heads/${branch}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','User-Agent':'Voidborn-Academy-Studio','Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});
 if(!response.ok)throw new Error('CONFLICT: Der Branch konnte nicht aktualisiert werden. Bitte neu laden; nicht automatisch wiederholen.');
 return commit.sha;
}
export async function remoteCommand(token,branch,input,actor,installation=false,prepared=null){
 // Installation credentials are already repository-scoped; user-token mode keeps the legacy check.
 if(!installation)await assertPermission(token);
 const {repo,state,baseTree}=prepared||await remoteWorkspace(token,branch);
 if(state.head!==input.expectedHead)throw new Error('CONFLICT: Der Entwurf wurde inzwischen geändert.');
 if(input.op==='guide.restore'){
  const guide=state.guides.find(g=>g.id===input.guideId);if(!guide)throw new Error('Guide nicht gefunden.');
  const versions=(await gh(token,`/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(guide.path)}&per_page=12`)).map(c=>({sha:c.sha,time:Date.parse(c.commit.author.date)/1000,message:c.commit.message.split('\n')[0]}));if(!versions.some(v=>v.sha===input.version))throw new Error('Version ist nicht in der Guide-Historie.');
  const old=await gh(token,`/contents/${guide.path}?ref=${input.version}`);const text=Buffer.from(old.content.replace(/\n/g,''),'base64').toString('utf8');
  const read=repo.read;repo.read=(path,ref)=>ref===input.version&&path===guide.path?text:read(path,ref);repo.history=path=>path===guide.path?versions:[];
 }
 let plan;
 // The shared command layer produces the exact same files as the local browser/CLI.
 // Its synchronous save is captured as a plan; only commitRemote performs the write.
 runCommand({...repo,commit:(head,files,message)=>{plan={head,files,message};return head;}},input,actor);
 if(!plan)throw new Error('Kein speicherbarer Auftrag.');
 if(Object.keys(plan.files).length>20)throw new Error('Die Änderung betrifft zu viele Dateien für einen einzelnen Auftrag. Bitte in kleinere Änderungen aufteilen.');
 let imageAssignment;
 if(input.op==='screenshot.upload'){
  const bundles=Object.entries(plan.files).filter(([path])=>path.startsWith('.academy/studio/guides/')&&path.endsWith('.json')).map(([,value])=>JSON.parse(value));
  const bundle=bundles.find(b=>b.placeholders.some(p=>p.id===input.id)),placeholder=bundle?.placeholders.find(p=>p.id===input.id);
  const asset=bundle?.assets.find(a=>a.id===placeholder?.assetId);
  if(!asset)throw new Error('Bildzuordnung fehlt im Speicherauftrag.');
  imageAssignment={guideId:bundle.guideId,placeholderId:placeholder.id,assetId:asset.id,asset};
 }
 const commitSha=await commitRemote(token,branch,plan.head,plan.files,plan.message,baseTree);
 // State is fetched in a separate browser request to stay within free Worker subrequest limits.
 return {commitSha,published:false,...imageAssignment};
}
export async function diffRemote(token,branch,guideId,before){
 if(!/^[a-f0-9]{40}$/.test(before||''))throw new Error('Ungültige Version.');
 const {state}=await remoteWorkspace(token,branch);const guide=state.guides.find(g=>g.id===guideId);if(!guide)throw new Error('Guide nicht gefunden.');
 const comparison=await gh(token,`/compare/${before}...${state.head}`);
 return comparison.files?.find(f=>f.filename===guide.path)?.patch||'Keine Textänderung oder Diff zu groß für die GitHub-Vorschau.';
}
export async function historyRemote(token,branch,guideId){
 const {state}=await remoteWorkspace(token,branch);const guide=state.guides.find(g=>g.id===guideId);if(!guide)throw new Error('Guide nicht gefunden.');
 return (await gh(token,`/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(guide.path)}&per_page=12`)).map(c=>({sha:c.sha,time:Date.parse(c.commit.author.date)/1000,message:c.commit.message.split('\n')[0]}));
}

export async function publicationRemote(token){
 const head=(await gh(token,'/git/ref/heads/main')).object.sha;
 const commit=await gh(token,`/git/commits/${head}`);
 const tree=await gh(token,`/git/trees/${commit.tree.sha}?recursive=1`);
 if(tree.truncated)throw new Error('Veröffentlichter Dateibaum ist unvollständig.');
 const files=Object.fromEntries(tree.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
 const receipt=files['.academy/publication.json']?JSON.parse(Buffer.from((await gh(token,`/git/blobs/${files['.academy/publication.json']}`)).content.replace(/\s/g,''),'base64').toString('utf8')):{};
 return {head,tree:commit.tree.sha,files,receipt};
}
export function publicationChanges(state,publication,target){
 if(target==='site')return {paths:['data/site.json'],guide:null};
 const guide=state.guides.find(g=>g.id===target&&g.lifecycle!=='archived');
 if(!guide)throw new Error('Aktiver Beitrag nicht gefunden.');
 return {paths:[guide.path],guide};
}
export function checkPublicLinks(body,path,publicFiles){
 for(const match of body.matchAll(/(?<!!)\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)){
  const link=match[1];if(/^(?:https?:|mailto:|#)/.test(link))continue;
  const target=new URL(link,'https://voidborn-legion.github.io/'+path.slice(5)).pathname;
  if(!target.startsWith('/guides/'))continue;
  const file='docs'+(target.endsWith('/')?target+'index.md':target.replace(/\.(?:html|md)$/,'')+'.md');
  if(file!==path&&!publicFiles[file])throw new Error('Ein verlinkter Guide ist noch nicht veröffentlicht: '+link+'. Link prüfen oder Ziel zuerst freigeben.');
 }
}
export async function publishRemote(token,branch,input,actor){
 if(!allowedBranch(branch))throw new Error('Ungültiger Entwurfsbranch.');
 const head=(await gh(token,`/git/ref/heads/${branch}`)).object.sha,live=await publicationRemote(token);
 if(input.expectedHead!==head||input.expectedPublicHead!==live.head)throw new Error('CONFLICT: Entwurf oder Online-Stand verändert. Vorschau neu öffnen.');
 const draftCommit=await gh(token,`/git/commits/${head}`),draftTree=await gh(token,`/git/trees/${draftCommit.tree.sha}?recursive=1`);
 if(draftTree.truncated)throw new Error('Entwurfsbaum ist unvollständig.');
 const draftFiles=Object.fromEntries(draftTree.tree.filter(x=>x.type==='blob'&&x.mode==='100644').map(x=>[x.path,x.sha]));
 const read=async path=>{if(!draftFiles[path])throw new Error('Datei fehlt im Entwurf: '+path);return Buffer.from((await gh(token,`/git/blobs/${draftFiles[path]}`)).content.replace(/\s/g,''),'base64').toString('utf8');};
 const catalog=JSON.parse(await read('.academy/studio/catalog.json'));
 const entry=publicationChanges({guides:catalog.guides},live,input.target).guide;
 if(input.target!=='site'&&(!entry||!/^docs\/guides\/[a-z0-9/-]+\.md$/.test(entry.path)||entry.path.includes('..')))throw new Error('Aktiver Beitrag nicht gefunden.');
 const doc=entry?matter(await read(entry.path)):null;
 const guide=entry?{...entry,body:doc.content,frontmatter:doc.data,title:doc.data.title}:null;
 if(guide)checkPublicLinks(guide.body,guide.path,live.files);
 const site=entry?null:validateSite(JSON.parse(await read('data/site.json')));
 const paths=[entry?entry.path:'data/site.json'];
 const files=[];
 if(guide){
  const data={...guide.frontmatter,status:'published',category:catalog.categories?.find(c=>c.id===guide.categoryId)?.slug||null};delete data.reviewRequest;
  const body=matter.stringify(guide.body,data);
  const blob=await gh(token,'/git/blobs',{content:body,encoding:'utf-8'});
  files.push({path:guide.path,mode:'100644',type:'blob',sha:blob.sha});
  // Register only this guide, preserving every unrelated main catalog entry.
  const readPublic=async path=>{if(!live.files[path])throw new Error('Öffentliche Metadaten fehlen: '+path);return JSON.parse(Buffer.from((await gh(token,`/git/blobs/${live.files[path]}`)).content.replace(/\s/g,''),'base64').toString('utf8'));};
  const publicCatalog=await readPublic('.academy/studio/catalog.json');
  const existing=publicCatalog.guides.findIndex(g=>g.id===guide.id);
  if(existing<0)publicCatalog.guides.push(entry);else publicCatalog.guides[existing]=entry;
  const category=catalog.categories?.find(c=>c.id===guide.categoryId);
  if(category&&!publicCatalog.categories.some(c=>c.id===category.id)){
   publicCatalog.categories.push(category);
   const publicCategories=await readPublic('data/categories.json'),draftCategories=JSON.parse(await read('data/categories.json'));
   const metadata=draftCategories.find(c=>c.slug===category.slug);if(!metadata)throw new Error('Themenbeschreibung fehlt.');
   if(!publicCategories.some(c=>c.slug===category.slug))publicCategories.push(metadata);
   const categoryBlob=await gh(token,'/git/blobs',{content:JSON.stringify(publicCategories,null,2)+'\n',encoding:'utf-8'});
   files.push({path:'data/categories.json',mode:'100644',type:'blob',sha:categoryBlob.sha});
  }
  const catalogBlob=await gh(token,'/git/blobs',{content:JSON.stringify(publicCatalog,null,2)+'\n',encoding:'utf-8'});
  files.push({path:'.academy/studio/catalog.json',mode:'100644',type:'blob',sha:catalogBlob.sha});
 }else{
  files.push({path:'data/site.json',mode:'100644',type:'blob',sha:draftFiles['data/site.json']});
 }
 // Only images actually referenced by this exact reviewed document/config are copied.
 const content=guide?guide.body:JSON.stringify(site);
 const images=[...new Set([...content.matchAll(/\/images\/[a-zA-Z0-9/_ .-]+\.(?:png|jpe?g|webp)/g)].map(m=>'docs/public'+m[0]))];
 for(const path of images){
  const sha=draftFiles[path]||live.files[path];
  if(!sha)throw new Error('Referenziertes Bild fehlt: '+path);
  files.push({path,mode:'100644',type:'blob',sha});
 }
 const receipt={...live.receipt};for(const path of paths)receipt[path]=draftFiles[path];
 const record=await gh(token,'/git/blobs',{content:JSON.stringify(receipt,null,2)+'\n',encoding:'utf-8'});
 files.push({path:'.academy/publication.json',mode:'100644',type:'blob',sha:record.sha});
 const tree=await gh(token,'/git/trees',{base_tree:live.tree,tree:files});
 const commit=await gh(token,'/git/commits',{message:`Academy: ${guide?guide.title:'Startseite und Navigation'} veröffentlichen (${actor})`,tree:tree.sha,parents:[live.head]});
 const result=await fetch(BASE+'/git/refs/heads/main',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','User-Agent':'Voidborn-Academy','Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});
 if(!result.ok)throw new Error('CONFLICT: Online-Stand verändert; nichts überschrieben.');
 return {commitSha:commit.sha,buildPending:true,url:'https://github.com/'+REPO+'/actions',paths:files.map(f=>f.path)};
}

export async function readImageRemote(token,asset,head){
 if(!/^docs\/public\/images\/[a-zA-Z0-9/_.-]+$/.test(asset.path)||asset.path.includes('..')||!/^[a-f0-9]{40}$/.test(head))throw new Error('Ungültiges Bildziel.');
 const result=await gh(token,`/contents/${asset.path}?ref=${head}`);
 if(result.type!=='file'||result.encoding!=='base64'||result.size>2097152)throw new Error('Bild ist nicht direkt lesbar.');
 const data=result.content.replace(/\s/g,'');const bytes=Buffer.from(data,'base64');
 const mimeType=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'image/webp':null;
 if(!mimeType)throw new Error('Unbekanntes Bildformat.');return {data,mimeType};
}
