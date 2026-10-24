import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {callTool,toolDefinitions} from './mcp-tools.mjs';
import {remoteCommand} from './github.mjs';
import {handleMcp} from './mcp.mjs';
import {readWorkspace,runCommand} from '../../packages/academy-model/commands.mjs';
import {decodeImageBase64,MAX_IMAGE_BYTES} from '../../packages/academy-model/image-file.mjs';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const admin={role:'administrator',guideIds:null,overrides:{}};
function fixture(){
 const files=new Map();for(const folder of ['.academy/studio','data','docs/guides'])for(const item of readdirSync(folder,{recursive:true,withFileTypes:true})){if(!item.isFile())continue;const path=((item.parentPath||item.path)+'/'+item.name).replaceAll('\\','/');if(/\.(json|md)$/.test(path))files.set(path,readFileSync(path,'utf8'));}
 let revision=1;const head=()=>revision.toString(16).padStart(40,'0');
 const repo={branch:'draft/studio-import-test',head,read:p=>files.get(p),list:p=>[...files.keys()].filter(f=>f.startsWith(p)),blob:p=>createHash('sha1').update(files.get(p)).digest('hex'),history:()=>[],commit:(expected,changes)=>{assert.equal(expected,head());for(const [p,v]of Object.entries(changes))files.set(p,v);revision++;return head();}};
 let state=readWorkspace(repo);const send=input=>state=runCommand(repo,{...input,expectedHead:state.head});
 send({op:'guide.save',guideId:'guide:pets',title:'Image import test',body:'## Original\n\nPreserve this explanation.\n\n| Value | Note |\n| --- | --- |\n| 1 | Keep |\n'});
 send({op:'screenshot.add',guideId:'guide:pets',quote:'Preserve this explanation.',title:'Original screenshot',description:'Keep original bytes'});
 const id=state.snapshot.bundles.find(b=>b.guideId==='guide:pets').placeholders.at(-1).id;
 return {repo,files,id,state,ctx:{grant:admin,read:async()=>readWorkspace(repo),command:async input=>runCommand(repo,input)}};
}
test('direct import preserves source bytes and guide content; stale writes fail without duplication',async()=>{
 const {repo,files,id,state,ctx}=fixture();const args={expectedHead:state.head,id,base64:png,alt:'Original',caption:'Source caption'};
 const result=await callTool('academy_import_image',args,ctx);const bundle=result.snapshot.bundles.find(b=>b.guideId==='guide:pets'),p=bundle.placeholders.find(p=>p.id===id),asset=bundle.assets.find(a=>a.id===p.assetId);
 assert.deepEqual(files.get(asset.path),Buffer.from(png,'base64'));assert.equal(asset.sha256,createHash('sha256').update(Buffer.from(png,'base64')).digest('hex'));
 const body=result.guides.find(g=>g.id==='guide:pets').body;assert.ok(body.includes('Preserve this explanation.'));assert.ok(body.includes('| 1 | Keep |'));assert.ok(body.includes('Source caption'));assert.equal(p.id,id);assert.equal(p.status,'ready');
 const before=repo.head();await assert.rejects(callTool('academy_import_image',args,ctx),/CONFLICT/);assert.equal(repo.head(),before);
});
test('import rejects malformed, unsupported or oversized data and insufficient rights before writing',async()=>{
 const {id,state,ctx}=fixture();let writes=0;ctx.command=async()=>writes++;
 const args={expectedHead:state.head,id,base64:png,alt:'Original'};
 for(const data of ['data:image/png;base64,'+png,'!!!!','a===',Buffer.from('<svg/>').toString('base64'),Buffer.alloc(MAX_IMAGE_BYTES+1).toString('base64')])await assert.rejects(callTool('academy_import_image',{...args,base64:data},ctx));
 await assert.rejects(callTool('academy_import_image',args,{...ctx,grant:{role:'commentator',guideIds:null,overrides:{}}}));
 await assert.rejects(callTool('academy_import_image',args,{...ctx,grant:{role:'editor',guideIds:['guide:another'],overrides:{}}}));
 assert.equal(writes,0);
});
test('all upload paths share signature and exact decoded 2 MiB checks',()=>{
 const bytes=Buffer.alloc(MAX_IMAGE_BYTES);Buffer.from(png,'base64').copy(bytes);assert.equal(decodeImageBase64(bytes.toString('base64')).bytes.length,MAX_IMAGE_BYTES);
 assert.equal(decodeImageBase64(Buffer.from([255,216,255,0]).toString('base64')).extension,'jpg');
 assert.equal(decodeImageBase64(Buffer.from('RIFF1234WEBP').toString('base64')).extension,'webp');
 assert.throws(()=>decodeImageBase64(Buffer.concat([bytes,Buffer.from([0])]).toString('base64')),/2 MiB/);
 const native=toolDefinitions.find(t=>t.name==='academy_upload_image');assert.deepEqual(native._meta['openai/fileParams'],['file']);assert.ok(toolDefinitions.find(t=>t.name==='academy_import_image').inputSchema.required.includes('base64'));
});
test('remote image commit returns stable placeholder, asset assignment and actual byte hash',async()=>{
 const {repo,id,state}=fixture();const original=globalThis.fetch;const uploaded=[];
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;const body=options.body?JSON.parse(options.body):null;
  let result={};if(path.includes('/git/ref/heads/'))result={object:{sha:state.head}};
  else if(path.endsWith('/git/blobs')){uploaded.push(body);result={sha:'c'.repeat(40)};}
  else if(path.endsWith('/git/trees'))result={sha:'d'.repeat(40)};
  else if(path.endsWith('/git/commits'))result={sha:'e'.repeat(40)};
  return new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json'}});
 };
 try{
  const result=await remoteCommand('synthetic',repo.branch,{op:'screenshot.upload',expectedHead:state.head,id,base64:png,alt:'Original'},'github:test',true,{repo,state,baseTree:'f'.repeat(40)});
  assert.equal(result.published,false);assert.equal(result.placeholderId,id);assert.equal(result.guideId,'guide:pets');assert.equal(result.assetId,result.asset.id);assert.equal(result.commitSha,'e'.repeat(40));assert.equal(result.asset.sha256,createHash('sha256').update(Buffer.from(png,'base64')).digest('hex'));assert.ok(uploaded.some(b=>b.encoding==='base64'&&b.content===png));
 }finally{globalThis.fetch=original;}
});
test('MCP transport admits full-size Base64 import while retaining ordinary limits and a hard stream cap',async()=>{
 const env={API_ORIGIN:'https://api.example',DB:{prepare(){throw Error('Anonymous import must not access data');}}};
 const rpc=body=>handleMcp(new Request(env.API_ORIGIN+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body}),env);
 const large=Buffer.alloc(MAX_IMAGE_BYTES);Buffer.from(png,'base64').copy(large);
 const payload={jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'academy_import_image',arguments:{base64:large.toString('base64')}}};
 const r=await rpc(JSON.stringify(payload));assert.equal(r.status,200);assert.equal((await r.json()).result.isError,true);
 payload.params.name='academy_save_guide';assert.equal((await rpc(JSON.stringify(payload))).status,413);
 assert.equal((await rpc('x'.repeat(2900001))).status,413);
});
