import test from 'node:test';import assert from 'node:assert/strict';import {publicationChanges,publishRemote,checkPublicLinks} from './github.mjs';import {authorizeCommand,normalizeGrant,can} from './permissions.mjs';
test('only active catalog guides or site settings can be selected for publication',()=>{const state={guides:[{id:'guide:one',path:'docs/guides/one.md',lifecycle:'active'},{id:'guide:old',path:'docs/guides/old.md',lifecycle:'archived'}]};assert.deepEqual(publicationChanges(state,{},'site').paths,['data/site.json']);assert.deepEqual(publicationChanges(state,{},'guide:one').paths,['docs/guides/one.md']);for(const id of ['guide:old','docs/.vitepress/config.ts','../secret'])assert.throws(()=>publicationChanges(state,{},id));});
test('site editing and publishing are separately authorized; object scope cannot be spoofed',()=>{const state={snapshot:{bundles:[{guideId:'guide:other',comments:[{id:'comment:other'}],tasks:[],placeholders:[],assets:[]}]}};assert.equal(can(normalizeGrant({role:'administrator'}),'content.publish'),true);assert.equal(can(normalizeGrant({role:'editor'}),'content.publish'),false);assert.equal(can(normalizeGrant({role:'author'}),'site.edit'),false);const scoped=normalizeGrant({role:'editor',guideIds:['guide:mine']});assert.throws(()=>authorizeCommand(scoped,{op:'site.save',guideId:'guide:mine'},state));assert.throws(()=>authorizeCommand(scoped,{op:'comment.status',id:'comment:other',guideId:'guide:mine'},state));});
test('unpublished internal guide dependencies block a release before it can create broken pages',()=>{checkPublicLinks('[Self](#target) [Online](./one)','docs/guides/new.md',{'docs/guides/one.md':'sha'});assert.throws(()=>checkPublicLinks('[Other](./unpublished#part)','docs/guides/new.md',{}),/noch nicht veröffentlicht/);});
test('selective publication is atomic, rejects stale heads and excludes other drafts and feedback',async()=>{
 const original=globalThis.fetch,draft='a'.repeat(40),main='b'.repeat(40),writes=[];
 const raw={publishedCatalog:JSON.stringify({categories:[],guides:[]}),catalog:JSON.stringify({guides:[{id:'guide:one',path:'docs/guides/one.md',lifecycle:'active'}]}),document:'---\ntitle: Test\nstatus: draft\nreview: pending\nreviewRequest:\n  actor: author\n---\n# Test\n\n![Actual](/images/uploads/abc.png)\n',feedback:'Private editorial text'};
 const entries=[['.academy/studio/catalog.json','catalog'],['docs/guides/one.md','document'],['.academy/studio/guides/one.json','feedback'],['docs/guides/other.md','other'],['docs/public/images/uploads/abc.png','image']].map(([path,sha])=>({path,sha,mode:'100644',type:'blob'}));
 globalThis.fetch=async(url,options={})=>{const path=new URL(url).pathname,method=options.method||'GET';const result=value=>Response.json(value);
  if(method==='GET'){
   if(path.endsWith('/git/ref/heads/main'))return result({object:{sha:main}});
   if(path.endsWith('/git/ref/heads/draft/studio-test'))return result({object:{sha:draft}});
   if(path.endsWith('/git/commits/'+main))return result({tree:{sha:'main-tree'}});
   if(path.endsWith('/git/commits/'+draft))return result({tree:{sha:'draft-tree'}});
   if(path.endsWith('/git/trees/main-tree'))return result({tree:[{path:'.academy/studio/catalog.json',sha:'publishedCatalog',mode:'100644',type:'blob'}],truncated:false});
   if(path.endsWith('/git/trees/draft-tree'))return result({tree:entries,truncated:false});
   const name=path.split('/').at(-1);if(Object.hasOwn(raw,name))return result({content:Buffer.from(raw[name]).toString('base64')});
  }else{const body=JSON.parse(options.body);writes.push({path,method,body});return result({sha:'c'.repeat(40)});}
  throw new Error('Unexpected request '+method+' '+path);
 };
 try{
  await assert.rejects(publishRemote('synthetic','draft/studio-test',{expectedHead:'stale',expectedPublicHead:main,target:'guide:one'},'test'),/CONFLICT/);assert.equal(writes.length,0);
  const result=await publishRemote('synthetic','draft/studio-test',{expectedHead:draft,expectedPublicHead:main,target:'guide:one'},'test');assert.equal(result.buildPending,true);
  const tree=writes.find(w=>w.path.endsWith('/git/trees')).body;assert.deepEqual(tree.tree.map(f=>f.path),['docs/guides/one.md','.academy/studio/catalog.json','docs/public/images/uploads/abc.png','.academy/publication.json']);
  const markdown=writes.find(w=>w.path.endsWith('/git/blobs')).body.content;assert.match(markdown,/status: published/);assert.doesNotMatch(markdown,/reviewRequest|Private editorial/);
  assert.deepEqual(writes.at(-1).body,{sha:'c'.repeat(40),force:false});assert.deepEqual(writes.find(w=>w.path.endsWith('/git/commits')).body.parents,[main]);
 }finally{globalThis.fetch=original;}
});
