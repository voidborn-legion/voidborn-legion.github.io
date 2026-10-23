import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { LocalGitRepository } from './git-local.mjs';
import { initializeWorkspace, runCommand, readWorkspace } from './commands.mjs';

test('real Git transactions share browser/manager data, reject conflicts and preserve history', () => {
 const root=mkdtempSync(join(tmpdir(),'voidborn-studio-test-'));
 try {
  execFileSync('git',['clone','--quiet','--no-hardlinks',process.cwd(),root]);
  // Pin the one-task baseline so the same test runs on source and content branches.
  const fixture='bf6bff0f965308eef59d5fccfafd98d9ded40452';
  execFileSync('git',['checkout','--quiet','--detach',fixture],{cwd:root});
  const repo=new LocalGitRepository(root,'draft/studio-integration-test');
  let s=initializeWorkspace(repo);
  const send=command=>{s=runCommand(repo,{...command,expectedHead:s.head});return s;};
  const initial=s.head; const pets=s.guides.find(g=>g.id==='guide:pets');
  assert.equal(pets.status,'draft');
  send({op:'comment.add',guideId:'guide:pets',quote:'Mit Pets entwickelst du',body:'Synthetic integration test'});
  const comment=s.snapshot.bundles[0].comments[0];
  send({op:'comment.reply',id:comment.id,body:'Synthetic answer'});
  assert.equal(readWorkspace(repo).snapshot.bundles[0].comments[0].replies.length,1);
  assert.throws(()=>runCommand(repo,{op:'comment.status',id:comment.id,status:'done',expectedHead:initial}),/CONFLICT/);
  send({op:'task.status',id:'task:pets-eu-values',status:'done'});
  assert.equal(s.dashboard.openTasks.length,0);
  send({op:'guide.save',guideId:'guide:pets',title:pets.title,body:pets.body+'\n\nSynthetic integration line.\n'});
  assert.equal(s.guides.find(g=>g.id==='guide:pets').status,'draft');
  assert.ok(repo.diff(initial,s.head,pets.path).includes('Synthetic integration line'));
  send({op:'guide.restore',guideId:'guide:pets',version:initial});
  assert.ok(!s.guides.find(g=>g.id==='guide:pets').body.includes('Synthetic integration line'));
  const placeholder=s.snapshot.bundles[0].placeholders[0];
  // A valid one-pixel PNG used only in the disposable clone.
  send({op:'screenshot.upload',id:placeholder.id,alt:'Synthetic pixel',caption:'Test fixture',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='});
  const p=s.snapshot.bundles[0].placeholders[0];assert.equal(p.status,'ready');
  const asset=s.snapshot.bundles[0].assets[0];assert.ok(repo.read(asset.path,repo.head(),true).length>0);
  assert.ok(s.guides.find(g=>g.id==='guide:pets').body.includes(asset.path.slice('docs/public'.length)));
  assert.ok(!s.guides.find(g=>g.id==='guide:pets').body.includes('Screenshot fehlt: Pet-Sammlung'));
  assert.equal(s.dashboard.missingScreenshots.length,4);
  assert.equal(repo.git(['rev-parse','HEAD']).trim(),fixture);
 } finally {
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('voidborn-studio-test-'))throw new Error('Unsafe test cleanup path');
  rmSync(root,{recursive:true,force:true});
 }
});
