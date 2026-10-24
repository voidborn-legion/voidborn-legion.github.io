import {randomSecret,digest} from './security.mjs';
import {grantFor} from './grants.mjs';
import {can} from './permissions.mjs';
const now=()=>Math.floor(Date.now()/1000);
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Pragma':'no-cache'}});
const invalid=()=>response({error:'invalid_grant'},400);

// Store only token digests. Sessions expire after 30 days and may be revoked
// immediately on replay; every tool call still rechecks current Academy rights.
export async function issueMcpTokens(env,grant,sessionId=null){
 const access=randomSecret(),refresh=randomSecret(),accessId=await digest(access),refreshId=await digest(refresh),time=now();
 const session=sessionId||randomSecret(),expires=sessionId?grant.expires:time+30*86400;
 const statements=[];
 if(!sessionId)statements.push(env.DB.prepare('INSERT INTO mcp_refresh_sessions(id,client_id,resource,scope,actor,current_digest,expires) VALUES(?,?,?,?,?,?,?)').bind(session,grant.client_id,grant.resource,grant.scope,grant.actor,refreshId,expires));
 statements.push(
  env.DB.prepare('INSERT INTO mcp_refresh_history(id,session_id,expires) VALUES(?,?,?)').bind(refreshId,session,expires),
  env.DB.prepare('INSERT INTO mcp_tokens(id,client_id,resource,scope,actor,expires) VALUES(?,?,?,?,?,?)').bind(accessId,grant.client_id,grant.resource,grant.scope,grant.actor,time+3600),
  env.DB.prepare('INSERT INTO mcp_token_sessions(id,session_id,expires) VALUES(?,?,?)').bind(accessId,session,time+3600)
 );
 // During refresh, atomically replace exactly the token claimed by this caller.
 if(sessionId)statements.unshift(env.DB.prepare('UPDATE mcp_refresh_sessions SET current_digest=? WHERE id=? AND current_digest=? AND revoked=0 AND expires>?').bind(refreshId,session,grant.current_digest,time));
 const result=await env.DB.batch(statements);
 if(sessionId&&result[0].meta.changes!==1){
  await env.DB.prepare('UPDATE mcp_refresh_sessions SET revoked=1 WHERE id=?').bind(session).run();
  return invalid();
 }
 return response({access_token:access,refresh_token:refresh,token_type:'Bearer',expires_in:3600,scope:grant.scope});
}

export async function refreshMcpTokens(env,input){
 if(!/^[a-f0-9]{64}$/.test(input.refresh_token||'')||typeof input.client_id!=='string')return invalid();
 const id=await digest(input.refresh_token);
 const row=await env.DB.prepare('SELECT s.* FROM mcp_refresh_history h JOIN mcp_refresh_sessions s ON s.id=h.session_id WHERE h.id=?').bind(id).first();
 if(!row||row.client_id!==input.client_id||row.resource!==env.API_ORIGIN+'/mcp'||(input.resource!==undefined&&input.resource!==row.resource)||row.scope!=='academy')return invalid();
 if(input.scope!==undefined&&input.scope!==row.scope)return response({error:'invalid_scope'},400);
 if(row.revoked||row.expires<=now())return invalid();
 if(row.current_digest!==id){await env.DB.prepare('UPDATE mcp_refresh_sessions SET revoked=1 WHERE id=?').bind(row.id).run();return invalid();}
 const client=await env.DB.prepare('SELECT id FROM mcp_clients WHERE id=? AND expires>?').bind(row.client_id,now()).first();
 if(!client||!can(await grantFor(env,row.actor),'draft.read')){
  await env.DB.prepare('UPDATE mcp_refresh_sessions SET revoked=1 WHERE id=?').bind(row.id).run();return invalid();
 }
 return issueMcpTokens(env,row,row.id);
}
