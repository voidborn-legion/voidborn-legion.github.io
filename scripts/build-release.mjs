// Build a reviewable Pages artifact. This command never uploads or deploys it.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
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

const commitSha=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
mkdirSync('docs/.vitepress/dist/.well-known',{recursive:true});
writeFileSync('docs/.vitepress/dist/.well-known/academy-release.json',JSON.stringify({commitSha,builtAt:new Date().toISOString(),receipt:existsSync('.academy/publication.json')?JSON.parse(readFileSync('.academy/publication.json','utf8')):{}}));
