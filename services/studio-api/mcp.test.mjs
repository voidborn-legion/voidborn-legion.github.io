import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {oauthRoute,mcpGithubCallback,mcpIdentity,validateMcpAuthorization} from './mcp-oauth.mjs';
import {challenge} from './security.mjs';import {saveGrant,grantFor} from './grants.mjs';import {callTool,toolDefinitions} from './mcp-tools.mjs';
function setup(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('./migration-manager.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('./migration-mcp-refresh.sql',import.meta.url),'utf8'));
 const DB={prepare(query){return {bind(...args){return {
  first:async()=>sql.prepare(query).get(...args)||null,
  run:async()=>sql.prepare(query).run(...args),
  all:async()=>({results:sql.prepare(query).all(...args)})
 };}};}};
 DB.batch=async statements=>{sql.exec('BEGIN');try{const result=[];for(const s of statements){const r=await s.run();result.push({meta:{changes:Number(r.changes)}});}sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}};
 return {DB,API_ORIGIN:'https://api.example',OWNER_GITHUB_ID:'123',GITHUB_CLIENT_ID:'fake',GITHUB_CLIENT_SECRET:'fake'};
}
test('MCP OAuth rejects unknown redirects and uses browser-bound PKCE and single-use codes',async()=>{
 const env=setup(),base=env.API_ORIGIN;
 let r=await oauthRoute(new Request(base+'/mcp-oauth/register',{method:'POST',body:JSON.stringify({redirect_uris:['https://evil.example/callback']})}),env);assert.equal(r.status,400);
 r=await oauthRoute(new Request(base+'/mcp-oauth/register',{method:'POST',body:JSON.stringify({redirect_uris:['https://chatgpt.com/connector_platform_oauth_redirect']})}),env);const client=await r.json();assert.ok(client.client_id);
 const verifier='a'.repeat(64),qs=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0],resource:base+'/mcp',response_type:'code',state:'synthetic-state',code_challenge:await challenge(verifier),code_challenge_method:'S256'});
 r=await oauthRoute(new Request(base+'/mcp-oauth/authorize?'+qs),env);assert.equal(r.status,302);const cookie=r.headers.get('Set-Cookie').split(';')[0],state=new URL(r.headers.get('Location')).searchParams.get('state');
 await assert.rejects(mcpGithubCallback(new Request(base+'/auth/callback?state='+state+'&code=fake'),env),/anderer Browser/);
 const original=globalThis.fetch;globalThis.fetch=async u=>new Response(JSON.stringify(String(u).includes('access_token')?{access_token:'synthetic'}:{id:123,login:'synthetic-owner'}),{headers:{'Content-Type':'application/json'}});
 try{r=await mcpGithubCallback(new Request(base+'/auth/callback?state='+state+'&code=fake',{headers:{Cookie:cookie}}),env);}finally{globalThis.fetch=original;}
 assert.equal(r.headers.get('Referrer-Policy'),'same-origin');
 const html=await r.text();assert.ok(!html.includes('synthetic-provider-token'));const consent=/name="consent" value="([a-f0-9]+)"/.exec(html)[1];
 const form=new URLSearchParams({consent,approve:'yes'});
 for(const origin of ['https://evil.example','null',''])await assert.rejects(oauthRoute(new Request(base+'/mcp-oauth/consent',{method:'POST',headers:{...(origin?{Origin:origin}:{}),Cookie:cookie},body:form}),env),/Ungültiger Absender/);
 r=await oauthRoute(new Request(base+'/mcp-oauth/consent',{method:'POST',headers:{Origin:base,Cookie:cookie},body:form}),env);const redirect=new URL(r.headers.get('Location'));assert.equal(redirect.searchParams.get('iss'),base);assert.equal(redirect.searchParams.get('state'),'synthetic-state');
 const tokenForm=new URLSearchParams({grant_type:'authorization_code',code:redirect.searchParams.get('code'),client_id:client.client_id,redirect_uri:client.redirect_uris[0],resource:base+'/mcp',code_verifier:'b'.repeat(64)});
 r=await oauthRoute(new Request(base+'/mcp-oauth/token',{method:'POST',body:tokenForm}),env);assert.equal(r.status,400);
 tokenForm.set('code_verifier',verifier);r=await oauthRoute(new Request(base+'/mcp-oauth/token',{method:'POST',body:tokenForm}),env);const token=await r.json();assert.ok(token.access_token);assert.ok(token.refresh_token);assert.notEqual(token.access_token,token.refresh_token);
 const identity=await mcpIdentity(new Request(base+'/mcp',{headers:{Authorization:'Bearer '+token.access_token}}),env);assert.equal(identity.actor,'github:123');
 r=await oauthRoute(new Request(base+'/mcp-oauth/token',{method:'POST',body:tokenForm}),env);assert.equal(r.status,400);
 await assert.rejects(mcpGithubCallback(new Request(base+'/auth/callback?state='+state+'&code=fake',{headers:{Cookie:cookie}}),env));
});
test('grants revoke access immediately and reject conflicting or owner changes',async()=>{const env=setup();assert.equal((await grantFor(env,'github:456')).role,'player');let r=await saveGrant(env,'github:123',{subject:'github:456',expectedRevision:0,grant:{role:'commentator'}});assert.equal(r.revision,1);assert.equal((await grantFor(env,'456:someone')).role,'commentator');await assert.rejects(saveGrant(env,'github:456',{subject:'github:789',expectedRevision:0,grant:{role:'administrator'}}));await assert.rejects(saveGrant(env,'github:123',{subject:'github:456',expectedRevision:0,grant:{role:'administrator'}}),/CONFLICT/);await assert.rejects(saveGrant(env,'github:123',{subject:'github:123',expectedRevision:0,grant:{role:'reader'}}));await saveGrant(env,'github:123',{subject:'github:456',expectedRevision:1,grant:{role:'commentator',disabled:true}});assert.equal((await grantFor(env,'github:456')).disabled,true);});
test('tool validation and scoped writes fail before any commit',async()=>{let writes=0;const ctx={grant:{role:'commentator',guideIds:null,overrides:{}},read:async()=>({snapshot:{bundles:[]}}),command:async()=>writes++};await assert.rejects(callTool('academy_save_guide',{expectedHead:'a'.repeat(40),guideId:'guide:one',title:'Test',body:'Text'},ctx));assert.equal(writes,0);await assert.rejects(callTool('academy_save_guide',{expectedHead:'main',guideId:'guide:one',title:'Test',body:'Text'},ctx));assert.equal(new Set(toolDefinitions.map(t=>t.name)).size,toolDefinitions.length);});

import {handleMcp} from './mcp.mjs';
test('anonymous discovery exposes schemas only and a tool call returns the ChatGPT OAuth challenge without touching data',async()=>{
 const env={API_ORIGIN:'https://api.example',DB:{prepare(){throw new Error('No database access permitted before authentication');}}};
 const rpc=async(method,params={})=>handleMcp(new Request(env.API_ORIGIN+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),env);
 let r=await rpc('initialize',{protocolVersion:'2025-06-18'});assert.equal(r.status,200);assert.equal((await r.json()).result.serverInfo.name,'voidborn-academy-manager');
 r=await rpc('tools/list');const listed=(await r.json()).result.tools;assert.equal(listed.length,35);assert.ok(listed.every(t=>t.securitySchemes[0].type==='oauth2'));assert.deepEqual(listed.find(t=>t.name==='academy_upload_image')._meta['openai/fileParams'],['file']);
 r=await rpc('tools/call',{name:'academy_get_access',arguments:{}});const result=(await r.json()).result;assert.equal(result.isError,true);assert.ok(result._meta['mcp/www_authenticate'][0].includes('error_description='));assert.ok(!JSON.stringify(result).includes('github:152614168'));
});

import {remoteCommand} from './github.mjs';
test('repository-scoped installation writes do not require user-only push metadata; user-token mode still checks it',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({permissions:{push:false}}),{headers:{'Content-Type':'application/json'}});};
 try{
  await assert.rejects(remoteCommand('synthetic','draft/studio-test',{expectedHead:'b'.repeat(40)},'github:123',true,{repo:{},state:{head:'a'.repeat(40)},baseTree:'a'.repeat(40)}),/CONFLICT/);assert.equal(calls,0);
  await assert.rejects(remoteCommand('synthetic','draft/studio-test',{},'github:123'),/Kein Schreibzugriff/);assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
});

test('native file download uses Worker-compatible manual redirects and refuses redirected files before writing',async()=>{
 const original=globalThis.fetch;let commits=0;let redirect=false;
 globalThis.fetch=async(url,options)=>{assert.equal(options.redirect,'manual');return redirect?new Response(null,{status:302,headers:{Location:'https://evil.example/'}}):new Response(new Uint8Array([137,80,78,71,13,10,26,10]));};
 const ctx={grant:{role:'administrator',overrides:{},guideIds:null},read:async()=>({guides:[{id:'guide:test'}],snapshot:{bundles:[{guideId:'guide:test',comments:[],tasks:[],assets:[],placeholders:[{id:'screenshot:test'}]}]}}),command:async input=>{commits++;assert.equal(input.file,undefined);assert.ok(input.base64);return {published:false};}};
 const args={expectedHead:'a'.repeat(40),id:'screenshot:test',file:{download_url:'https://files.oaiusercontent.com/synthetic',file_id:'synthetic'},alt:'Test'};
 try{await callTool('academy_upload_image',args,ctx);assert.equal(commits,1);redirect=true;await assert.rejects(callTool('academy_upload_image',args,ctx),/Weiterleitungen/);assert.equal(commits,1);}finally{globalThis.fetch=original;}
});
