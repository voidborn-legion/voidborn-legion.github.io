import test from 'node:test';import assert from 'node:assert/strict';
import {preparePublication,publishSelection,publicationTargets,publicationStatus} from './publication.mjs';
import {callTool} from './mcp-tools.mjs';import {normalizeGrant} from './permissions.mjs';
test('publication is administrator-only even if an editor has a publish override',async()=>{
 for(const grant of [normalizeGrant({role:'editor',overrides:{'content.publish':true}}),normalizeGrant({role:'administrator',guideIds:['guide:one']})]){
  await assert.rejects(callTool('academy_prepare_publication',{targets:['guide:one']},{grant,read:async()=>({guides:[],snapshot:{catalog:{guides:[]},bundles:[],gameValues:[]}})}));
 }
 assert.throws(()=>publicationTargets([]));assert.throws(()=>publicationTargets(['guide:a','guide:a']));assert.throws(()=>publicationTargets(['../file']));
});
test('batch preview is read-only; a bound preview publishes selected guides atomically',async()=>{
 const original=globalThis.fetch,writes=[],draft='a'.repeat(40),main='b'.repeat(40);
 const paths={'.academy/studio/catalog.json':'catalog','data/categories.json':'cats','docs/guides/one.md':'one','docs/guides/two.md':'two','docs/guides/other.md':'other'};
 const guides=[{id:'guide:one',path:'docs/guides/one.md',title:'One',lifecycle:'active'},{id:'guide:two',path:'docs/guides/two.md',title:'Two',lifecycle:'active'}];
 const blobs={catalog:JSON.stringify({guides,categories:[]}),pub:JSON.stringify({guides:[],categories:[]}),cats:'[]',one:'---\ntitle: One\nreview: pending\n---\n# One\n[Two](./two)\n',two:'---\ntitle: Two\n---\n# Two\n',other:'# Keep private draft'};
 const adapters={workspace:async()=>({state:{head:draft,guides,snapshot:{bundles:[]}}}),publication:async()=>({head:main,tree:'main-tree',files:{'.academy/studio/catalog.json':'pub','data/categories.json':'cats'},receipt:{}})};
 globalThis.fetch=async(url,options={})=>{const path=new URL(url).pathname,method=options.method||'GET';if(method!=='GET'){writes.push({path,method,body:JSON.parse(options.body)});return Response.json({sha:'c'.repeat(40)});}
  if(path.endsWith('/git/commits/'+draft))return Response.json({tree:{sha:'draft-tree'}});
  if(path.endsWith('/git/trees/draft-tree'))return Response.json({tree:Object.entries(paths).map(([path,sha])=>({path,sha,type:'blob',mode:'100644'}))});
  const key=path.split('/').at(-1);if(blobs[key])return Response.json({content:Buffer.from(blobs[key]).toString('base64')});throw new Error(path);
 };
 try{
  await assert.rejects(preparePublication('test','draft/test',['guide:one'],adapters),/noch nicht veröffentlicht/);
  const preview=await preparePublication('test','draft/test',['guide:one','guide:two'],adapters);assert.equal(writes.length,0);assert.equal(preview.warnings.length,1);assert.equal(preview.documents.length,2);
  await assert.rejects(publishSelection('test','draft/test',{...preview,previewHash:'0'.repeat(64)},'actor',adapters),/CONFLICT/);assert.equal(writes.length,0);
  const result=await publishSelection('test','draft/test',preview,'actor',adapters);assert.equal(result.buildPending,true);
  const tree=writes.find(x=>x.path.endsWith('/git/trees')).body;assert.ok(tree.tree.some(x=>x.path==='docs/guides/two.md'));assert.ok(!tree.tree.some(x=>x.path==='docs/guides/other.md'));assert.deepEqual(writes.at(-1).body,{sha:'c'.repeat(40),force:false});
 }finally{globalThis.fetch=original;}
});
test('deployment success requires matching public revision, not merely a green workflow',async()=>{
 const original=globalThis.fetch,sha='a'.repeat(40);let liveSha='b'.repeat(40),conclusion='success';
 globalThis.fetch=async url=>{const u=String(url);if(u.includes('/git/ref/'))return Response.json({object:{sha}});if(u.includes('/git/commits/'))return Response.json({tree:{sha:'tree'}});if(u.includes('/git/trees/'))return Response.json({tree:[]});if(u.includes('/actions/'))return Response.json({workflow_runs:[{head_sha:sha,status:'completed',conclusion}]});return Response.json({commitSha:liveSha});};
 try{assert.equal((await publicationStatus('test',sha)).status,'awaiting-website');liveSha=sha;assert.equal((await publicationStatus('test',sha)).status,'live');conclusion='failure';assert.equal((await publicationStatus('test',sha)).status,'build-failed');}finally{globalThis.fetch=original;}
});
