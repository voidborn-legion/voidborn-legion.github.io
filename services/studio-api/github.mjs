import { runCommand, readWorkspace } from '../../packages/academy-model/commands.mjs';
const REPO='voidborn-legion/voidborn-legion.github.io';
const BASE=`https://api.github.com/repos/${REPO}`;
const allowedBranch=b=>/^(?:draft|dev)\/[a-zA-Z0-9/_-]+$/.test(b)&&!b.includes('..');
async function gh(token,path,body){
 if(path!==''&&!path.startsWith('/'))throw new Error('Invalid GitHub path');
 const result=await fetch(BASE+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Voidborn-Academy-Studio','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await result.json();if(!result.ok)throw new Error(`GitHub ${result.status}: ${data.message||'Request failed'}`);return data;
}
export async function assertPermission(token){const data=await gh(token,'');if(!data.permissions?.push)throw new Error('Kein Schreibzugriff auf das Academy-Repository.');return data;}
export async function remoteWorkspace(token,branch){
 if(!allowedBranch(branch))throw new Error('Nur Entwicklungs- oder Entwurfsbranches erlaubt.');
 const head=(await gh(token,`/git/ref/heads/${branch.split('/').map(encodeURIComponent).join('/')}`)).object.sha;
 const commit=await gh(token,`/git/commits/${head}`);
 const tree=await gh(token,`/git/trees/${commit.tree.sha}?recursive=1`);if(tree.truncated)throw new Error('Repository-Baum zu groß für diesen Adapter.');
 const entries=new Map(tree.tree.filter(e=>e.type==='blob'&&e.mode==='100644').map(e=>[e.path,e]));
 const paths=[...entries.keys()].filter(p=>p==='.academy/studio/catalog.json'||p.startsWith('.academy/studio/guides/')||p==='data/sources.json'||p==='data/categories.json'||p==='data/game/pets.json'||p.startsWith('docs/guides/'));
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
  if(!/^(?:\.academy\/studio\/(?:catalog|guides\/[a-zA-Z0-9-]+)\.json|data\/(?:categories|sources|game\/[a-zA-Z0-9-]+)\.json|docs\/guides\/[a-zA-Z0-9/-]+\.md|docs\/public\/images\/uploads\/[a-f0-9]+\.(?:png|jpg|webp))$/.test(path)||path.includes('..'))throw new Error('Pfad außerhalb des Studio-Inhaltsbereichs.');
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

export async function readImageRemote(token,asset,head){
 if(!/^docs\/public\/images\/[a-zA-Z0-9/_.-]+$/.test(asset.path)||asset.path.includes('..')||!/^[a-f0-9]{40}$/.test(head))throw new Error('Ungültiges Bildziel.');
 const result=await gh(token,`/contents/${asset.path}?ref=${head}`);
 if(result.type!=='file'||result.encoding!=='base64'||result.size>2097152)throw new Error('Bild ist nicht direkt lesbar.');
 const data=result.content.replace(/\s/g,'');const bytes=Buffer.from(data,'base64');
 const mimeType=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'image/webp':null;
 if(!mimeType)throw new Error('Unbekanntes Bildformat.');return {data,mimeType};
}
