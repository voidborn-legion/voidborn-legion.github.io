import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import matter from 'gray-matter';
import {MarkdownManager} from '@tiptap/markdown';import {extensions} from './src/editor.mjs';
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
test('a native Markdown collapsible box survives editing as a custom node',()=>{
 const input='::: details Eine Frage\n\nEine **Antwort**.\n\n:::';
 const doc=manager.parse(input);assert.equal(doc.content[0].attrs.kind,'details');
 assert.match(manager.serialize(doc),/^::: details Eine Frage/m);
});
