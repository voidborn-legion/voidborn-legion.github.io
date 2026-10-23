import test from 'node:test';import assert from 'node:assert/strict';
import { challenge,seal,open,validateOrigin,validateBranch } from './security.mjs';
import worker from './worker.mjs';
test('PKCE implements the RFC 7636 S256 vector',async()=>{assert.equal(await challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');});
test('encrypted provider credentials reject tampering and the wrong key',async()=>{const key='1'.repeat(64),cipher=await seal('synthetic-provider-token',key);assert.equal(await open(cipher,key),'synthetic-provider-token');await assert.rejects(open(cipher,'2'.repeat(64)));});
test('origins and production branches fail closed',()=>{assert.throws(()=>validateOrigin('https://evil.example','https://voidborn-legion.github.io'));assert.throws(()=>validateBranch('main'));assert.throws(()=>validateBranch('draft/../main'));assert.equal(validateBranch('draft/studio-pets-workspace'),'draft/studio-pets-workspace');});
test('an unconfigured deployment exposes no data and performs no network write',async()=>{const response=await worker.fetch(new Request('https://api.example/api/state'),{});assert.equal(response.status,400);assert.match((await response.json()).error,/nicht eingerichtet/);});
