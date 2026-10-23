import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { validateSnapshot, dashboard, resolveAnchor, setTaskStatus, assignAsset, planSave, addComment, replyToComment } from './index.mjs';
// Unit fixtures must not depend on an author's evolving content branch.
const baselineRef = 'bf6bff0f965308eef59d5fccfafd98d9ded40452';
const readBaseline = path => JSON.parse(execFileSync('git', ['show', `${baselineRef}:${path}`], { encoding: 'utf8' }));
const baseline = validateSnapshot({ schemaVersion: 1, catalog: readBaseline('.academy/studio/catalog.json'), sources: readBaseline('data/sources.json'), bundles: [readBaseline('.academy/studio/guides/pets.json')], gameValues: readBaseline('data/game/pets.json').records });
const fixture = () => structuredClone(baseline);
const timestamp = '2026-10-23T12:00:00Z';
const event = { id: 'event:test-status', action: 'task-status-changed', actorId: 'test-user', at: timestamp, note: 'Synthetic unit test; not persisted' };

test('seed has real draft references, five missing screenshots and no invented comments or game numbers', () => {
  const data = fixture();
  assert.equal(data.bundles[0].document.ref, 'draft/pets-spezieskenntnis-migration');
  assert.equal(dashboard(data).missingScreenshots.length, 5);
  assert.equal(dashboard(data).openComments.length, 0);
  assert.deepEqual(data.gameValues, []);
});
test('rejects confidential visibility and unknown references', () => {
  const data = fixture(); data.bundles[0].visibility = 'private';
  assert.throws(() => validateSnapshot(data), /Invalid studio snapshot/);
  const unknown = fixture(); unknown.bundles[0].placeholders[0].anchor.sectionId = 'section:missing';
  assert.throws(() => validateSnapshot(unknown), /Unknown reference/);
});
test('duplicate stable IDs are rejected across entity types', () => {
  const data = fixture(); data.bundles[0].tasks[0].id = data.bundles[0].placeholders[0].id;
  assert.throws(() => validateSnapshot(data), /Duplicate ID/);
});
test('completed tasks leave dashboard but retain history without mutating input', () => {
  const before = fixture();
  const after = setTaskStatus(before, 'task:pets-eu-values', 'done', event);
  assert.equal(dashboard(after).openTasks.length, 0);
  assert.equal(dashboard(before).openTasks.length, 1);
  assert.equal(after.bundles[0].tasks[0].history[0].id, event.id);
});
test('text anchors distinguish attached, changed, missing and duplicated passages', () => {
  const anchor = fixture().bundles[0].tasks[0].anchor;
  assert.equal(resolveAnchor(anchor, anchor.quote, anchor.baseBlobSha).state, 'attached');
  assert.equal(resolveAnchor(anchor, anchor.quote, '0'.repeat(40)).state, 'needs-review');
  assert.equal(resolveAnchor(anchor, 'Different text', anchor.baseBlobSha).state, 'stale');
  assert.equal(resolveAnchor(anchor, `${anchor.quote}\n${anchor.quote}`, anchor.baseBlobSha).state, 'ambiguous');
  assert.equal(resolveAnchor({ ...anchor, prefix: 'unique ' }, `unique ${anchor.quote}\n${anchor.quote}`, anchor.baseBlobSha).state, 'attached');
});
test('asset metadata association requires review and does not pretend to upload a picture', () => {
  const data = fixture();
  const asset = { id: 'asset:test-image', path: 'docs/public/images/uploads/test.png', alt: 'Synthetic test', caption: '', sourceIds: [], rights: '', sha256: '0'.repeat(64) };
  const updated = assignAsset(data, data.bundles[0].placeholders[0].id, asset, event);
  assert.equal(updated.bundles[0].placeholders[0].status, 'needs-review');
  assert.equal(dashboard(updated).missingScreenshots.length, 5);
  const invalid = fixture(); invalid.bundles[0].placeholders[0].status = 'ready';
  assert.throws(() => validateSnapshot(invalid), /needs an asset/);
});
test('comments and replies share the bundle and stay out of Markdown', () => {
  const data = fixture(); const bundle = data.bundles[0];
  const comment = { id: 'comment:test', anchor: bundle.tasks[0].anchor, body: 'Synthetic comment', authorId: 'test-user', status: 'open', replies: [], createdAt: timestamp, updatedAt: timestamp, history: [] };
  const added = addComment(data, bundle.guideId, comment);
  const replied = replyToComment(added, comment.id, { id: 'reply:test', authorId: 'test-user', body: 'Synthetic reply', createdAt: timestamp });
  assert.equal(dashboard(replied).openComments.length, 1);
  assert.equal(replied.bundles[0].comments[0].replies.length, 1);
  assert.equal(data.bundles[0].comments.length, 0);
});
test('save plans fail closed on stale versions, main, workflow writes and traversal', () => {
  const input = { expectedHead: 'a'.repeat(40), currentHead: 'a'.repeat(40), branch: 'dev/studio', files: [{ path: '.academy/studio/guides/pets.json', content: '{}' }] };
  assert.equal(planSave(input).publish, false);
  assert.throws(() => planSave({ ...input, currentHead: 'b'.repeat(40) }), /Version conflict/);
  assert.throws(() => planSave({ ...input, branch: 'main' }), /development or draft/);
  assert.throws(() => planSave({ ...input, files: [{ path: '.github/workflows/test.yml', content: '' }] }), /outside/);
  assert.throws(() => planSave({ ...input, files: [{ path: 'docs/guides/../../secrets.json', content: '' }] }), /outside/);
});
test('game limits are separate from recommendations; verified records require provenance', () => {
  const data = fixture();
  // Synthetic numbers only; these are not AION values and are never saved.
  const record = { id: 'value:test', guideId: 'guide:pets', board: 'synthetic', slot: 1, classIds: [], role: 'dps', mode: 'pve', effect: 'synthetic', unit: 'points', min: 1, max: 3, alternativeEffectIds: [], recommendation: { value: 2, rationale: 'Synthetic test', sourceIds: [] }, verification: { status: 'unverified', region: 'test', patch: null, sourceIds: [] } };
  data.gameValues.push(record); validateSnapshot(data);
  record.min = 4; assert.throws(() => validateSnapshot(data), /Minimum/);
  record.min = 1; record.verification.status = 'verified';
  assert.throws(() => validateSnapshot(data), /sources and patch/);
});
