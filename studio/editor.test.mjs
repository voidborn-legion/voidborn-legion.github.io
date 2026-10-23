import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import matter from 'gray-matter';
import {MarkdownManager} from '@tiptap/markdown';import {extensions} from './src/editor.mjs';
import {getSchema} from '@tiptap/core';
import {findEditorTarget,validateImageFile} from './src/targets.mjs';
const manager=new MarkdownManager({extensions:extensions()});
const count=(node,type)=>Number(node.type===type)+(node.content||[]).reduce((n,c)=>n+count(c,type),0);
test('the real Pets draft preserves boxes, tables, tasks and source IDs through the visual editor',()=>{
 const input=matter(execFileSync('git',['show','09919b170c8aadffa6ae67856efce23265e62ecd:docs/guides/pets.md'],{encoding:'utf8'})).content;
 const before=manager.parse(input),output=manager.serialize(before),after=manager.parse(output);
 for(const type of ['academyBox','table','tableCell','tableHeader','taskItem','heading'])assert.equal(count(after,type),count(before,type),type);
 assert.ok(count(before,'academyBox')>=8);assert.equal(count(before,'taskItem'),7);
 for(const id of ['d5eb68c7-24a1-4763-b316-152c6ad93c5a','1314ff8c-9722-4cf7-9aa7-ad89d42c3114','05c499da-b415-4614-bab5-dd0a597196e0','ce0ca839-45d4-4991-9f6f-9b742e4c5def','a02d9251-bbda-4c2e-85a2-107019d6fb2f'])assert.ok(output.includes(id));
 assert.ok(output.includes('https://aion2-guides.info/en/pets/'));
 assert.ok(output.includes('vorläufige Academy-Stoppschwelle'));
});

test('screenshot blocks preserve their stable ID and exact position through Markdown',()=>{
 const id='screenshot:11111111-1111-4111-8111-111111111111';
 const input=`Vorher.\n\n::: info Screenshot fehlt: Analyse\n\nZeigt den Slot.\n\n<!-- academy-screenshot:${id} -->\n\n:::\n\nNachher.`;
 const doc=manager.parse(input),node=doc.content[1];assert.equal(node.type,'academyScreenshot');assert.equal(node.attrs.id,id);
 const output=manager.serialize(doc);assert.ok(output.indexOf('Vorher.')<output.indexOf(id)&&output.indexOf(id)<output.indexOf('Nachher.'));
 assert.equal(manager.parse(output).content[1].attrs.description,'Zeigt den Slot.');
 const schema=getSchema(extensions()),pm=schema.nodeFromJSON(doc);
 assert.ok(findEditorTarget(pm,{anchor:{quote:`<!-- academy-screenshot:${id} -->`}}));
});

test('jump finds legacy screenshot titles and text split by formatting; duplicate targets are rejected',()=>{
 const schema=getSchema(extensions());
 const doc=schema.nodeFromJSON(manager.parse('::: info Screenshot fehlt: Analyse\n\nEin Bild.\n\n:::\n\nEin **wichtiger** Satz.'));
 assert.ok(findEditorTarget(doc,{anchor:{quote:'Screenshot fehlt: Analyse'}}));
 assert.ok(findEditorTarget(doc,{anchor:{quote:'Ein wichtiger Satz.'}}));
 assert.equal(findEditorTarget(schema.nodeFromJSON(manager.parse('Doppelt.\n\nDoppelt.')),{anchor:{quote:'Doppelt.'}}),null);
});

test('a screenshot inserted inside a box preserves the surrounding paragraphs and nested structure',()=>{
 const doc={type:'doc',content:[{type:'academyBox',attrs:{kind:'warning',title:'Outer'},content:[{type:'paragraph',content:[{type:'text',text:'Preserve before.'}]},{type:'academyScreenshot',attrs:{id:'screenshot:11111111-1111-4111-8111-111111111111',title:'Inner',description:'Only the image description.'}},{type:'paragraph',content:[{type:'text',text:'Preserve after.'}]}]}]};
 const output=manager.serialize(doc);assert.match(output,/^:::: warning Outer/);
 const after=manager.parse(output);assert.equal(after.content[0].type,'academyBox');assert.equal(after.content[0].content[1].type,'academyScreenshot');
 assert.equal(after.content[0].content[0].content[0].text,'Preserve before.');assert.equal(after.content[0].content[2].content[0].text,'Preserve after.');
});

test('image selection and dropping reject unsupported files, oversized images and empty drops',()=>{
 assert.equal(validateImageFile({type:'image/png',size:100}).size,100);
 assert.throws(()=>validateImageFile({type:'image/svg+xml',size:100}),/PNG/);
 assert.throws(()=>validateImageFile({type:'image/jpeg',size:3*1024*1024}),/2 MB/);
 assert.throws(()=>validateImageFile(null),/PNG/);
});
test('a native Markdown collapsible box survives editing as a custom node',()=>{
 const input='::: details Eine Frage\n\nEine **Antwort**.\n\n:::';
 const doc=manager.parse(input);assert.equal(doc.content[0].attrs.kind,'details');
 assert.match(manager.serialize(doc),/^::: details Eine Frage/m);
});
