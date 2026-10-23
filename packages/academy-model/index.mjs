import Ajv from 'ajv';
import { schema } from './schema.mjs';
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
const clone = value => structuredClone(value);

/** Validate shape, referential integrity and public-storage invariants. */
export function validateSnapshot(snapshot) {
  if (!validate(snapshot)) throw new Error(`Invalid studio snapshot: ${JSON.stringify(validate.errors)}`);
  const seen = new Set();
  const own = item => {
    if (seen.has(item.id)) throw new Error(`Duplicate ID: ${item.id}`);
    seen.add(item.id);
  };
  const requireRef = (set, value) => { if (!set.has(value)) throw new Error(`Unknown reference: ${value}`); };
  const { catalog, bundles, sources, gameValues } = snapshot;
  const categoryIds = new Set(catalog.categories.map(x => x.id));
  const guideIds = new Set(catalog.guides.map(x => x.id));
  const sourceIds = new Set(sources.map(x => x.id));
  const valueIds = new Set(gameValues.map(x => x.id));
  const paths = new Set();
  const refs = values => values.forEach(x => requireRef(sourceIds, x));
  for (const item of [...catalog.categories, ...catalog.guides, ...sources, ...gameValues]) own(item);
  if (new Set(catalog.categories.map(x => x.slug)).size !== catalog.categories.length) throw new Error('Duplicate category slug');
  for (const guide of catalog.guides) {
    if (!/^docs\/guides\/[a-z0-9/-]+\.md$/.test(guide.path) || paths.has(guide.path)) throw new Error(`Invalid or duplicate guide path: ${guide.path}`);
    paths.add(guide.path);
    if (guide.categoryId !== null) requireRef(categoryIds, guide.categoryId);
  }
  const bundleGuides = new Set();
  for (const bundle of bundles) {
    requireRef(guideIds, bundle.guideId);
    if (bundleGuides.has(bundle.guideId)) throw new Error(`Duplicate guide bundle: ${bundle.guideId}`);
    bundleGuides.add(bundle.guideId);
    const sections = new Set(bundle.sections.map(x => x.id));
    const assets = new Set(bundle.assets.map(x => x.id));
    const targets = new Set([...assets, ...valueIds]);
    const anchor = value => {
      if (value.sectionId !== null) requireRef(sections, value.sectionId);
      if (value.targetId !== null) requireRef(targets, value.targetId);
    };
    for (const section of bundle.sections) { own(section); anchor(section.anchor); }
    for (const asset of bundle.assets) {
      own(asset); refs(asset.sourceIds);
      if (!asset.path.startsWith('docs/public/images/')) throw new Error('Asset outside public image directory');
    }
    for (const item of [...bundle.placeholders, ...bundle.comments, ...bundle.tasks]) {
      own(item);
      if (item.anchor) anchor(item.anchor);
      if (item.sourceIds) refs(item.sourceIds);
      for (const event of item.history) own(event);
    }
    for (const placeholder of bundle.placeholders) {
      if (placeholder.assetId !== null) requireRef(assets, placeholder.assetId);
      if (placeholder.status === 'ready' && placeholder.assetId === null) throw new Error('Ready placeholder needs an asset');
    }
    for (const comment of bundle.comments) for (const reply of comment.replies) own(reply);
  }
  for (const record of gameValues) {
    requireRef(guideIds, record.guideId); refs(record.verification.sourceIds);
    record.alternativeEffectIds.forEach(x => requireRef(valueIds, x));
    if (record.min !== null && record.max !== null && record.min > record.max) throw new Error('Minimum exceeds maximum');
    if (record.verification.status === 'verified' && (!record.verification.sourceIds.length || !record.verification.patch)) throw new Error('Verified value needs sources and patch');
    if (record.recommendation) refs(record.recommendation.sourceIds);
  }
  return snapshot;
}

/** Conservative quote matching: duplicates are ambiguous, missing quotes are stale.
 * A changed blob always requires review; we never silently reattach a comment.
 */
export function resolveAnchor(anchor, markdown, currentBlobSha) {
  if (!anchor.quote) return { state: 'unresolved', reason: 'Requires semantic target lookup' };
  const positions = [];
  for (let at = markdown.indexOf(anchor.quote); at !== -1; at = markdown.indexOf(anchor.quote, at + 1)) {
    if (anchor.prefix && !markdown.slice(0, at).endsWith(anchor.prefix)) continue;
    if (anchor.suffix && !markdown.slice(at + anchor.quote.length).startsWith(anchor.suffix)) continue;
    positions.push(at);
  }
  if (!positions.length) return { state: 'stale' };
  if (positions.length > 1) return { state: 'ambiguous', matches: positions.length };
  return { state: currentBlobSha === anchor.baseBlobSha ? 'attached' : 'needs-review', start: positions[0], end: positions[0] + anchor.quote.length };
}

export function dashboard(snapshot) {
  validateSnapshot(snapshot);
  const collect = (field, predicate) => snapshot.bundles.flatMap(bundle => bundle[field].filter(predicate).map(item => ({ ...item, guideId: bundle.guideId, document: bundle.document })));
  return {
    missingScreenshots: collect('placeholders', p => ['missing', 'needs-review'].includes(p.status)),
    openComments: collect('comments', c => c.status !== 'done'),
    openTasks: collect('tasks', t => t.status !== 'done')
  };
}

export function setTaskStatus(snapshot, taskId, status, event) {
  const next = clone(snapshot);
  const task = next.bundles.flatMap(b => b.tasks).find(x => x.id === taskId);
  if (!task) throw new Error('Unknown task');
  task.status = status; task.history.push(event);
  return validateSnapshot(next);
}

export function addComment(snapshot, guideId, comment) {
  const next = clone(snapshot);
  const bundle = next.bundles.find(x => x.guideId === guideId);
  if (!bundle) throw new Error('Unknown guide bundle');
  bundle.comments.push(clone(comment));
  return validateSnapshot(next);
}

export function replyToComment(snapshot, commentId, reply) {
  const next = clone(snapshot);
  const comment = next.bundles.flatMap(x => x.comments).find(x => x.id === commentId);
  if (!comment) throw new Error('Unknown comment');
  comment.replies.push(clone(reply));
  comment.updatedAt = reply.createdAt;
  return validateSnapshot(next);
}

/** Associates metadata only. Uploading actual bytes/replacing Markdown is a later adapter operation. */
export function assignAsset(snapshot, placeholderId, asset, event) {
  const next = clone(snapshot);
  const bundle = next.bundles.find(b => b.placeholders.some(x => x.id === placeholderId));
  if (!bundle) throw new Error('Unknown placeholder');
  const existing = bundle.assets.find(x => x.id === asset.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(asset)) throw new Error('Asset ID already has different metadata');
  if (!existing) bundle.assets.push(asset);
  const placeholder = bundle.placeholders.find(x => x.id === placeholderId);
  placeholder.assetId = asset.id;
  placeholder.status = 'needs-review'; // A metadata association is not proof of a successful upload.
  placeholder.history.push(event);
  return validateSnapshot(next);
}

/** Produce a save plan; no network I/O or publication. The adapter must perform a non-force ref update. */
export function planSave({ expectedHead, currentHead, branch, files }) {
  if (!/^[a-f0-9]{40}$/.test(expectedHead) || expectedHead !== currentHead) throw new Error('Version conflict; reload current branch');
  if (!/^(dev|draft)\/[a-zA-Z0-9/_-]+$/.test(branch) || branch.includes('..')) throw new Error('Foundation saves require a development or draft branch');
  if (!Array.isArray(files) || !files.length || new Set(files.map(x => x.path)).size !== files.length) throw new Error('Invalid or duplicate save paths');
  for (const file of files) {
    const allowed = /^(?:\.academy\/studio\/(?:catalog|guides\/[a-z0-9-]+)\.json|data\/(?:sources|game\/[a-z0-9-]+)\.json|docs\/guides\/[a-z0-9/-]+\.md)$/;
    if (!allowed.test(file.path) || file.path.includes('..') || file.path.includes('\\')) throw new Error('Path outside Studio content scope');
    if (typeof file.content !== 'string') throw new Error('Only explicit text writes supported in this foundation');
  }
  return { branch, parentSha: expectedHead, force: false, files: clone(files), publish: false };
}
