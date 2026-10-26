import test from 'node:test';
import assert from 'node:assert/strict';
import {readTextBlobs} from './github.mjs';
import {preparePublication,publishSelection} from './publication.mjs';

const sha=n=>n.toString(16).padStart(40,'0');
test('120 immutable workspace files are read in six requests; incomplete responses fail closed',async()=>{
 const original=globalThis.fetch,entries=Array.from({length:120},(_,i)=>({path:'file-'+i,sha:sha(i+1)}));let calls=0,truncated=false;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.github.com/graphql');calls++;const query=JSON.parse(options.body).query,repository={};
  for(const match of query.matchAll(/(f\d+): object\(oid: "([a-f0-9]{40})"\)/g))repository[match[1]]={oid:match[2],text:'ü',byteSize:2,isBinary:false,isTruncated:truncated};
  return Response.json({data:{repository}});
 };
 try{const result=await readTextBlobs('synthetic',entries);assert.equal(calls,6);assert.equal(result.size,120);assert.equal(result.get('file-119'),'ü');truncated=true;await assert.rejects(readTextBlobs('synthetic',entries),/unvollständig/);}finally{globalThis.fetch=original;}
});

test('50 existing guides publish atomically in fewer than 20 requests, without per-document blob writes',async()=>{
 const original=globalThis.fetch,head=sha(1000),main=sha(2000),guides=Array.from({length:50},(_,i)=>({id:'guide:g'+i,title:'Guide '+i,path:'docs/guides/g'+i+'.md',lifecycle:'active'}));
 const catalog=JSON.stringify({guides,categories:[]}),publicFiles={'.academy/studio/catalog.json':sha(1),'data/categories.json':sha(2)},draftFiles={'.academy/studio/catalog.json':sha(3),'data/categories.json':sha(2)};
 guides.forEach((g,i)=>{publicFiles[g.path]=sha(i+10);draftFiles[g.path]=sha(i+100);});
 const texts=new Map([[sha(1),catalog],[sha(2),'[]']]);guides.forEach((g,i)=>texts.set(sha(i+10),'---\ntitle: Old\n---\n# Old'));
 const workspace={state:{head,guides,snapshot:{bundles:[]}},files:draftFiles,repo:{read:path=>path==='.academy/studio/catalog.json'?catalog:path==='data/categories.json'?'[]':'---\ntitle: New\n---\n# New'}};
 const adapters={workspace:async()=>workspace,publication:async()=>({head:main,tree:'main-tree',files:publicFiles,receipt:{}})};
 let calls=0,writes=[];
 globalThis.fetch=async(url,options={})=>{calls++;assert.ok(calls<20,'publication must stay below the Worker budget');
  if(url==='https://api.github.com/graphql'){const repository={};for(const match of JSON.parse(options.body).query.matchAll(/(f\d+): object\(oid: "([a-f0-9]{40})"\)/g)){const text=texts.get(match[2]);repository[match[1]]={oid:match[2],text,isBinary:false,isTruncated:false,byteSize:Buffer.byteLength(text)};}return Response.json({data:{repository}});}
  if(options.method&&options.method!=='GET'){writes.push({url,body:JSON.parse(options.body)});return Response.json({sha:sha(3000)});}
  const text=texts.get(new URL(url).pathname.split('/').at(-1));assert.ok(text);return Response.json({content:Buffer.from(text).toString('base64')});
 };
 try{const targets=guides.map(g=>g.id),preview=await preparePublication('synthetic','draft/test',targets,adapters);assert.equal(writes.length,0);calls=0;
  await publishSelection('synthetic','draft/test',preview,'admin',adapters);
  assert.equal(writes.length,3);assert.equal(writes[0].body.tree.filter(e=>e.path.startsWith('docs/guides/')&&typeof e.content==='string').length,50);
  assert.equal(writes.at(-1).body.force,false);assert.ok(!writes.some(w=>w.url.endsWith('/git/blobs')));
 }finally{globalThis.fetch=original;}
});
