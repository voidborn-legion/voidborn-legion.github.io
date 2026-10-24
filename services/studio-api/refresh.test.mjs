import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {issueMcpTokens} from './mcp-refresh.mjs';
import {oauthRoute,mcpIdentity} from './mcp-oauth.mjs';
import {saveGrant} from './grants.mjs';
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const file of ['schema.sql','migration-manager.sql','migration-mcp-refresh.sql'])sql.exec(readFileSync(new URL(file,import.meta.url),'utf8'));
 const DB={prepare(query){return {bind(...args){return {first:async()=>sql.prepare(query).get(...args)||null,run:async()=>sql.prepare(query).run(...args)};}};}};
 DB.batch=async items=>{sql.exec('BEGIN');try{const out=[];for(const s of items){const r=await s.run();out.push({meta:{changes:Number(r.changes)}});}sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}};
 const time=Math.floor(Date.now()/1000);
 sql.prepare('INSERT INTO mcp_clients VALUES(?,?,?)').run('client-one','https://chatgpt.com/connector_platform_oauth_redirect',time+365*86400);
 sql.prepare('INSERT INTO mcp_clients VALUES(?,?,?)').run('client-two','https://chatgpt.com/connector_platform_oauth_redirect',time+365*86400);
 const env={DB,API_ORIGIN:'https://api.example',OWNER_GITHUB_ID:'123'};
 return {env,sql,grant:{client_id:'client-one',resource:env.API_ORIGIN+'/mcp',scope:'academy',actor:'github:123'}};
}
const refresh=(env,token,overrides={})=>oauthRoute(new Request(env.API_ORIGIN+'/mcp-oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',client_id:'client-one',refresh_token:token,...overrides})}),env);
const identity=(env,token)=>mcpIdentity(new Request(env.API_ORIGIN+'/mcp',{headers:{Authorization:'Bearer '+token}}),env);

test('OAuth advertises refresh and renews after access expiry with hashed, rotating tokens',async()=>{
 const {env,sql,grant}=setup();const clock=Date.now;
 try{
  const metadata=await (await oauthRoute(new Request(env.API_ORIGIN+'/.well-known/oauth-authorization-server'),env)).json();assert.ok(metadata.grant_types_supported.includes('refresh_token'));
  const first=await (await issueMcpTokens(env,{...grant,expires:Math.floor(clock()/1000)+60})).json();
  const session=sql.prepare('SELECT * FROM mcp_refresh_sessions').get();assert.ok(session.expires>Math.floor(clock()/1000)+29*86400);
  assert.ok(!JSON.stringify(sql.prepare('SELECT * FROM mcp_refresh_history').all()).includes(first.refresh_token));
  Date.now=()=>clock()+3700*1000;assert.equal(await identity(env,first.access_token),null);
  const r=await refresh(env,first.refresh_token);assert.equal(r.status,200);const second=await r.json();
  assert.equal(second.expires_in,3600);assert.notEqual(second.refresh_token,first.refresh_token);assert.equal((await identity(env,second.access_token)).actor,'github:123');
  assert.equal(await identity(env,second.refresh_token),null);
  assert.equal((await refresh(env,second.refresh_token)).status,200);
 }finally{Date.now=clock;sql.close();}
});
test('wrong client, resource or scope cannot refresh or revoke another client session',async()=>{
 const {env,sql,grant}=setup();try{
  const first=await (await issueMcpTokens(env,grant)).json();
  for(const input of [{client_id:'client-two'},{resource:'https://evil.example/mcp'},{refresh_token:'bad'},{scope:'admin'}])assert.equal((await refresh(env,first.refresh_token,input)).status,400);
  assert.equal((await identity(env,first.access_token)).actor,'github:123');
  assert.equal((await refresh(env,first.refresh_token,{resource:grant.resource,scope:'academy'})).status,200);
 }finally{sql.close();}
});
test('replayed refresh revokes its own session including current access, but preserves other sessions',async()=>{
 const {env,sql,grant}=setup();try{
  const first=await (await issueMcpTokens(env,grant)).json(),other=await (await issueMcpTokens(env,grant)).json();
  const second=await (await refresh(env,first.refresh_token)).json();
  assert.equal((await refresh(env,first.refresh_token)).status,400);
  assert.equal((await refresh(env,second.refresh_token)).status,400);assert.equal(await identity(env,second.access_token),null);assert.equal(await identity(env,first.access_token),null);
  assert.equal((await identity(env,other.access_token)).actor,'github:123');
 }finally{sql.close();}
});
test('removed rights or expired session prevent renewal without extending authorization',async()=>{
 const {env,sql,grant}=setup();try{
  await saveGrant(env,'github:123',{subject:'github:456',expectedRevision:0,grant:{role:'editor'}});
  const first=await (await issueMcpTokens(env,{...grant,actor:'github:456'})).json();
  await saveGrant(env,'github:123',{subject:'github:456',expectedRevision:1,grant:{role:'editor',disabled:true}});
  assert.equal((await refresh(env,first.refresh_token)).status,400);assert.equal(await identity(env,first.access_token),null);
  const second=await (await issueMcpTokens(env,grant)).json();sql.prepare('UPDATE mcp_refresh_sessions SET expires=0').run();
  assert.equal((await refresh(env,second.refresh_token)).status,400);assert.equal(await identity(env,second.access_token),null);
 }finally{sql.close();}
});
