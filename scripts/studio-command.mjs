// The Manager can use the same commands as the browser through a trusted local executor.
import { LocalGitRepository } from '../packages/academy-model/git-local.mjs';
import { readWorkspace, runCommand } from '../packages/academy-model/commands.mjs';
const repo = new LocalGitRepository(process.cwd());
let input = ''; for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input || '{"op":"read"}');
const result = request.op === 'read' ? readWorkspace(repo) : runCommand(repo, request);
console.log(JSON.stringify(result));
