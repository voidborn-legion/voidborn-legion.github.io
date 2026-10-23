// Local development gateway only. Never deploy this process as a public API.
import { createServer } from 'node:http';
import { LocalGitRepository } from '../packages/academy-model/git-local.mjs';
import { initializeWorkspace, readWorkspace, runCommand } from '../packages/academy-model/commands.mjs';
const repo = new LocalGitRepository(process.cwd());
const origin = 'http://127.0.0.1:4180';
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (!['127.0.0.1:4181', 'localhost:4181'].includes(req.headers.host)) throw new Error('Invalid host');
    if (req.headers.origin && req.headers.origin !== origin) throw new Error('Invalid origin');
    const url = new URL(req.url, 'http://127.0.0.1:4181');
    if (req.method === 'GET' && url.pathname.startsWith('/images/')) {
      if (!/^\/images\/[a-zA-Z0-9_./-]+$/.test(url.pathname) || url.pathname.includes('..')) throw new Error('Invalid image path');
      const ext = url.pathname.split('.').pop().toLowerCase();
      const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
      if (!types[ext]) throw new Error('Unsupported image type');
      res.setHeader('Content-Type', types[ext]); res.end(repo.read(`docs/public${url.pathname}`, repo.head(), true)); return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/api/state') {
      if (!repo.exists()) { res.writeHead(409); res.end(JSON.stringify({ error: 'NOT_INITIALIZED' })); return; }
      res.end(JSON.stringify(readWorkspace(repo))); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/diff') {
      const state = readWorkspace(repo); const guide = state.guides.find(g => g.id === url.searchParams.get('guide'));
      if (!guide) throw new Error('Unknown guide');
      res.end(JSON.stringify({ diff: repo.diff(url.searchParams.get('before'), state.head, guide.path) })); return;
    }
    if (req.method !== 'POST' || req.headers.origin !== origin || !req.headers['content-type']?.startsWith('application/json')) throw new Error('Only same-origin JSON writes are accepted');
    let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 3100000) throw new Error('Request too large'); }
    const input = JSON.parse(body || '{}');
    if (url.pathname === '/api/init') res.end(JSON.stringify(initializeWorkspace(repo)));
    else if (url.pathname === '/api/command') res.end(JSON.stringify(runCommand(repo, input)));
    else { res.writeHead(404); res.end(JSON.stringify({ error: 'Unknown endpoint' })); }
  } catch (error) { res.statusCode = error.message.includes('CONFLICT') ? 409 : 400; res.end(JSON.stringify({ error: error.message })); }
});
server.listen(4181, '127.0.0.1', () => console.log('Local Studio gateway: 127.0.0.1:4181. Draft-only; no remote push or publish.'));
