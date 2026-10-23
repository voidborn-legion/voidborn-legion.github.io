import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadSnapshot } from '../packages/academy-model/repository.mjs';
import { dashboard, resolveAnchor } from '../packages/academy-model/index.mjs';
import { schema } from '../packages/academy-model/schema.mjs';
const root = process.cwd();
const snapshot = loadSnapshot(root);
const storedSchema = JSON.parse(readFileSync('schemas/studio-snapshot.schema.json', 'utf8'));
if (JSON.stringify(storedSchema) !== JSON.stringify(schema)) throw new Error('Exported JSON schema is out of date');
const categories = JSON.parse(readFileSync('data/categories.json', 'utf8'));
for (const category of snapshot.catalog.categories) {
  if (!categories.some(x => x.slug === category.slug)) throw new Error(`Category binding missing: ${category.slug}`);
}
for (const category of categories) {
  if (!snapshot.catalog.categories.some(x => x.slug === category.slug)) throw new Error(`Unregistered category: ${category.slug}`);
}
for (const guide of snapshot.catalog.guides) readFileSync(guide.path, 'utf8');
for (const file of readdirSync('docs/guides', { recursive: true }).filter(x => x.endsWith('.md') && !/(^|[\\/])index\.md$/.test(x))) {
  const path = `docs/guides/${file.replaceAll('\\', '/')}`;
  if (!snapshot.catalog.guides.some(x => x.path === path)) throw new Error(`Unregistered guide: ${path}`);
}
const result = dashboard(snapshot);
const anchorWarnings=[];
if (process.argv.includes('--check-anchors')) {
  for (const bundle of snapshot.bundles) {
    const guide = snapshot.catalog.guides.find(x => x.id === bundle.guideId);
    const actualBlob = execFileSync('git', ['rev-parse', `${bundle.document.commitSha}:${guide.path}`], { encoding: 'utf8' }).trim();
    if (actualBlob !== bundle.document.blobSha) throw new Error('Pinned draft blob does not match commit');
    const markdown = execFileSync('git', ['show', `${bundle.document.commitSha}:${guide.path}`], { encoding: 'utf8' });
    const current=readFileSync(guide.path,'utf8');
    const currentBlob=execFileSync('git',['hash-object',guide.path],{encoding:'utf8'}).trim();
    for (const item of [...bundle.sections, ...bundle.placeholders, ...bundle.comments, ...bundle.tasks]) {
      if(!item.anchor)continue;
      const imported=item.anchor.baseCommitSha===bundle.document.commitSha;
      const resolution=resolveAnchor(item.anchor,imported?markdown:current,imported?actualBlob:currentBlob);
      // Content can legitimately change after a comment was created. Preserve
      // stale/ambiguous anchors for review; never require new targets in the old import.
      if(['stale','ambiguous','unresolved'].includes(resolution.state))anchorWarnings.push({id:item.id,state:resolution.state});
    }
  }
}
console.log(JSON.stringify({
  guides: snapshot.catalog.guides.length, bundles: snapshot.bundles.length,
  missingScreenshots: result.missingScreenshots.length, openComments: result.openComments.length,
  openTasks: result.openTasks.length, gameValues: snapshot.gameValues.length,
  anchorsChecked: process.argv.includes('--check-anchors'), anchorWarnings, published: false
}, null, 2));
