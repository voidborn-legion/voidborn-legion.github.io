import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runCommand,readWorkspace} from './commands.mjs';
const pixel='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
function repository(){const files=new Map();for(const dir of ['.academy/studio','data','docs/guides'])for(const item of readdirSync(dir,{recursive:true,withFileTypes:true})){if(!item.isFile())continue;const parent=item.parentPath||item.path;const path=(parent+'/'+item.name).replaceAll('\\','/');if(/\.(json|md)$/.test(path))files.set(path,readFileSync(path,'utf8'));}
let revision=1;let head=()=>revision.toString(16).padStart(40,'0');return {branch:'draft/studio-memory-test',head,read:p=>{if(!files.has(p))throw new Error('missing '+p);return files.get(p);},list:prefix=>[...files.keys()].filter(p=>p.startsWith(prefix)),blob:p=>{const x=Buffer.from(files.get(p));return createHash('sha1').update(`blob ${x.length}\0`).update(x).digest('hex');},history:()=>[],commit:(expected,changes)=>{assert.equal(expected,head());for(const [p,v]of Object.entries(changes)){if(v===null)files.delete(p);else files.set(p,v);}revision++;return head();}};}
test('image insertion preserves surrounding info text; replacement and restore manage captions without losing feedback',()=>{
 const repo=repository();let s=readWorkspace(repo);const send=c=>(s=runCommand(repo,{...c,expectedHead:s.head}));
 send({op:'guide.save',guideId:'guide:pets',title:'Synthetic',body:'::: info Context\n\nKeep this explanation exactly.\n\n:::\n'});
 send({op:'screenshot.add',guideId:'guide:pets',quote:'Keep this explanation exactly.',title:'Test',description:'Test screenshot'});
 const p=s.snapshot.bundles.find(b=>b.guideId==='guide:pets').placeholders.at(-1);
 send({op:'screenshot.upload',id:p.id,alt:'First',caption:'First caption',base64:pixel});
 assert.ok(s.guides.find(g=>g.id==='guide:pets').body.includes('Keep this explanation exactly.'));
 send({op:'screenshot.upload',id:p.id,alt:'Second',caption:'Second caption',base64:pixel});
 let body=s.guides.find(g=>g.id==='guide:pets').body;assert.ok(body.includes('Second caption'));assert.ok(!body.includes('First caption'));
 send({op:'screenshot.restore',id:p.id});body=s.guides.find(g=>g.id==='guide:pets').body;assert.ok(body.includes('Screenshot fehlt: Test'));assert.ok(!body.includes('Second caption'));assert.ok(body.includes('Keep this explanation exactly.'));
 assert.equal(s.snapshot.bundles.find(b=>b.guideId==='guide:pets').placeholders.at(-1).id,p.id);
});
