import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

export class LocalGitRepository {
  constructor(root, branch = 'draft/studio-pets-workspace') {
    if (!/^draft\/studio-[a-z0-9-]+$/.test(branch)) throw new Error('Only local Studio draft branches are allowed');
    this.root = root; this.branch = branch;
  }
  git(args, options = {}) { return execFileSync('git', args, { cwd: this.root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], ...options }); }
  head() { return this.git(['rev-parse', '--verify', `refs/heads/${this.branch}`]).trim(); }
  exists() { try { this.head(); return true; } catch { return false; } }
  read(path, ref = this.head(), binary = false) {
    if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Expected immutable commit SHA');
    return this.git(['show', `${ref}:${path}`], { encoding: binary ? 'buffer' : 'utf8' });
  }
  list(directory, ref = this.head()) { return this.git(['ls-tree', '-r', '--name-only', ref, '--', directory]).trim().split('\n').filter(Boolean); }
  blob(path, ref = this.head()) { return this.git(['rev-parse', `${ref}:${path}`]).trim(); }
  initialize(base = 'HEAD') {
    if (this.exists()) return this.head();
    const baseSha = this.git(['rev-parse', base]).trim();
    this.git(['update-ref', `refs/heads/${this.branch}`, baseSha, '0'.repeat(40)]);
    return baseSha;
  }
  commit(expectedHead, files, message) {
    if (this.head() !== expectedHead) throw new Error('CONFLICT: Der Entwurf wurde inzwischen geändert. Bitte neu laden.');
    const index = resolve(this.root, this.git(['rev-parse', '--git-path', `studio-index-${randomUUID()}`]).trim());
    const env = { ...process.env, GIT_INDEX_FILE: index, GIT_AUTHOR_NAME: 'Voidborn Studio', GIT_AUTHOR_EMAIL: 'studio@voidborn.invalid', GIT_COMMITTER_NAME: 'Voidborn Studio', GIT_COMMITTER_EMAIL: 'studio@voidborn.invalid' };
    try {
      this.git(['read-tree', expectedHead], { env });
      for (const [path, content] of Object.entries(files)) {
        if (path.startsWith('/') || path.includes('..') || path.includes('\\')) throw new Error('Invalid repository path');
        if (content === null) this.git(['update-index', '--force-remove', '--', path], { env });
        else {
          const sha = this.git(['hash-object', '-w', '--stdin'], { input: content }).trim();
          this.git(['update-index', '--add', '--cacheinfo', '100644', sha, path], { env });
        }
      }
      const tree = this.git(['write-tree'], { env }).trim();
      const sha = this.git(['commit-tree', tree, '-p', expectedHead], { env, input: message + '\n' }).trim();
      this.git(['update-ref', `refs/heads/${this.branch}`, sha, expectedHead]);
      return sha;
    } finally { try { unlinkSync(index); } catch {} }
  }
  history(path) {
    return this.git(['log', '-12', '--format=%H%x00%at%x00%s', this.head(), '--', path]).trim().split('\n').filter(Boolean).map(line => {
      const [sha, time, message] = line.split('\0'); return { sha, time: Number(time), message };
    });
  }
  diff(before, after, path) {
    if (![before, after].every(x => /^[a-f0-9]{40}$/.test(x))) throw new Error('Invalid version');
    return this.git(['diff', '--no-ext-diff', '--unified=3', before, after, '--', path]);
  }
}
