import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateSnapshot } from './index.mjs';
const read = file => JSON.parse(readFileSync(file, 'utf8'));
export function loadSnapshot(root) {
  const directory = join(root, '.academy/studio/guides');
  const pets = read(join(root, 'data/game/pets.json'));
  if (pets.schemaVersion !== 1 || !Array.isArray(pets.records) || Object.keys(pets).some(k => !['schemaVersion', 'records'].includes(k))) throw new Error('Invalid game-data container');
  return validateSnapshot({
    schemaVersion: 1,
    catalog: read(join(root, '.academy/studio/catalog.json')),
    sources: read(join(root, 'data/sources.json')),
    bundles: readdirSync(directory).filter(x => x.endsWith('.json')).sort().map(file => read(join(directory, file))),
    gameValues: pets.records
  });
}
