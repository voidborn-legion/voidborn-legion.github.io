// Build a reviewable Pages artifact. This command never uploads or deploys it.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
const origin = process.env.VITE_STUDIO_API_ORIGIN;
if (!origin || new URL(origin).protocol !== 'https:' || new URL(origin).origin !== origin) {
  throw new Error('Set VITE_STUDIO_API_ORIGIN to the configured HTTPS authentication service origin before building the release artifact.');
}
const run = script => execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', ...script], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/vitepress/bin/vitepress.js', 'build', 'docs'], { stdio: 'inherit' });
run(['build', '--config', 'studio/vite.config.mjs']);
mkdirSync('docs/.vitepress/dist/studio', { recursive: true });
cpSync('studio-dist', 'docs/.vitepress/dist/studio', { recursive: true });
console.log('Review artifact prepared at docs/.vitepress/dist. Nothing published.');
