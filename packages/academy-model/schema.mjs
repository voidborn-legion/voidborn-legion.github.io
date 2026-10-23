// Shared, portable JSON Schema. No UI or GitHub credentials belong in this package.
const text = { type: 'string', minLength: 1 };
const id = { type: 'string', pattern: '^[a-z][a-z0-9-]*:[a-zA-Z0-9_-]+$' };
const sha = { type: 'string', pattern: '^[a-f0-9]{40}$' };
const ids = { type: 'array', items: id, uniqueItems: true };
const nullable = value => ({ anyOf: [value, { type: 'null' }] });
const list = name => ({ type: 'array', items: { $ref: `#/$defs/${name}` } });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const status = { enum: ['open', 'in-progress', 'done'] };
const timestamp = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$' };
const path = { type: 'string', pattern: '^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))(?!.*\\\\)[a-zA-Z0-9_./-]+$' };
export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://voidborn-legion.github.io/schemas/studio-snapshot-v1',
  ...object({
    schemaVersion: { const: 1 },
    catalog: { $ref: '#/$defs/catalog' },
    sources: list('source'),
    bundles: list('bundle'),
    gameValues: list('gameValue')
  }),
  $defs: {
    catalog: object({
      categories: list('category'), guides: list('guide')
    }),
    category: object({ id, slug: text }),
    guide: object({ id, path, categoryId: nullable(id), lifecycle: { enum: ['active', 'archived'] } }),
    source: object({ id, title: text, url: { type: 'string', pattern: '^https://[^\\s]+$' }, checkedAt: nullable(timestamp) }),
    document: object({ ref: text, commitSha: sha, blobSha: sha }),
    anchor: {
      ...object({
        kind: { enum: ['text', 'section', 'table-row', 'image'] },
        sectionId: nullable(id), quote: { type: 'string' }, prefix: { type: 'string' }, suffix: { type: 'string' },
        targetId: nullable(id), baseCommitSha: sha, baseBlobSha: sha
      }),
      allOf: [
        { if: { properties: { kind: { enum: ['text', 'section'] } } }, then: { properties: { quote: { minLength: 1 } } } },
        { if: { properties: { kind: { enum: ['table-row', 'image'] } } }, then: { properties: { targetId: id } } }
      ]
    },
    section: object({ id, title: text, anchor: { $ref: '#/$defs/anchor' } }),
    asset: object({ id, path, alt: text, caption: { type: 'string' }, sourceIds: ids, rights: { type: 'string' }, sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' } }),
    placeholder: object({
      id, title: text, description: text, anchor: { $ref: '#/$defs/anchor' },
      status: { enum: ['missing', 'needs-review', 'ready', 'archived'] },
      assetId: nullable(id), sourceIds: ids, history: list('event')
    }),
    reply: object({ id, authorId: text, body: text, createdAt: timestamp }),
    comment: object({ id, anchor: { $ref: '#/$defs/anchor' }, body: text, authorId: text, status, replies: list('reply'), createdAt: timestamp, updatedAt: timestamp, history: list('event') }),
    task: object({ id, title: text, anchor: nullable({ $ref: '#/$defs/anchor' }), status, kind: { enum: ['verification', 'source-conflict', 'screenshot', 'general'] }, sourceIds: ids, history: list('event') }),
    event: object({ id, action: text, actorId: text, at: timestamp, note: { type: 'string' } }),
    bundle: object({
      schemaVersion: { const: 1 }, guideId: id, visibility: { const: 'public' },
      document: { $ref: '#/$defs/document' }, sections: list('section'), assets: list('asset'),
      placeholders: list('placeholder'), comments: list('comment'), tasks: list('task')
    }),
    verification: object({ status: { enum: ['unverified', 'conflicting', 'verified'] }, region: text, patch: nullable(text), sourceIds: ids }),
    recommendation: object({ value: { type: 'number' }, rationale: text, sourceIds: ids }),
    gameValue: object({
      id, guideId: id, board: text, slot: { type: 'integer', minimum: 1, maximum: 9 },
      classIds: { type: 'array', items: text, uniqueItems: true }, role: text, mode: { enum: ['pve', 'pvp'] },
      effect: text, unit: { enum: ['points', 'percent'] }, min: nullable({ type: 'number' }), max: nullable({ type: 'number' }),
      alternativeEffectIds: ids, recommendation: nullable({ $ref: '#/$defs/recommendation' }),
      verification: { $ref: '#/$defs/verification' }
    })
  }
};
// Optional for compatibility with v1 fixtures; absence always means draft.
schema.$defs.gameValue.properties.publication = { enum: ['draft', 'published'] };
