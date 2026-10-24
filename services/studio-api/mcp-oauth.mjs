import {randomSecret,digest,challenge} from './security.mjs';
import {grantFor} from './grants.mjs';
import {requirePermission} from './permissions.mjs';
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const now=()=>Math.floor(Date.now()/1000);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cookie=req=>/\bvoidborn_mcp=([a-f0-9]{64})\b/.exec(req.headers.get('Cookie')||'')?.[1];
const page=(body,headers={})=>new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Academy verbinden</title><style>body{font:18px system-ui;background:#10151c;color:#eee;max-width:620px;margin:12vh auto;padding:24px;line-height:1.6}button{font:inherit;padding:12px 20px;background:#d5b775;border:0;border-radius:6px}small{color:#b9c4cf}</style>${body}</html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",...headers}});
export function validateMcpAuthorization(input,client,env){
 if(!client||input.redirect_uri!==client.redirect_uri||input.resource!==env.API_ORIGIN+'/mcp'||input.response_type!=='code'||input.code_challenge_method!=='S256'||!/^[A-Za-z0-9_-]{43}$/.test(input.code_challenge||'')||typeof input.state!=='string'||input.state.length<1||input.state.length>2000)throw new Error('Ungültige Plugin-Anmeldeanfrage.');
 if(input.scope&&input.scope!=='academy')throw new Error('Unbekannter Plugin-Berechtigungsbereich.');
}
export async function oauthRoute(request,env){
 const url=new URL(request.url),base=env.API_ORIGIN,resource=base+'/mcp';
 if(url.pathname==='/.well-known/oauth-protected-resource'||url.pathname==='/.well-known/oauth-protected-resource/mcp')return json({resource,authorization_servers:[base],scopes_supported:['academy'],bearer_methods_supported:['header']});
 if(url.pathname==='/.well-known/oauth-authorization-server')return json({issuer:base,authorization_endpoint:base+'/mcp-oauth/authorize',token_endpoint:base+'/mcp-oauth/token',registration_endpoint:base+'/mcp-oauth/register',response_types_supported:['code'],grant_types_supported:['authorization_code'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],scopes_supported:['academy'],authorization_response_iss_parameter_supported:true});
 if(!url.pathname.startsWith('/mcp-oauth/'))return null;
 if(request.method!=='OPTIONS'){
  const key='mcp:'+await digest(request.headers.get('CF-Connecting-IP')||'unknown')+':'+Math.floor(Date.now()/60000);
  const limit=await env.DB.prepare('INSERT INTO rate_limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now()+120).first();
  if(limit.count>40)return json({error:'temporarily_unavailable'},429);
  if(Number(request.headers.get('Content-Length')||0)>16000)return json({error:'invalid_request'},413);
 }
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
 if(url.pathname==='/mcp-oauth/register'&&request.method==='POST'){
  const input=await request.json();const redirects=input.redirect_uris;
  const allowed=(env.MCP_REDIRECT_URIS||'https://chatgpt.com/connector_platform_oauth_redirect').split(',');
  if(!Array.isArray(redirects)||redirects.length!==1||!allowed.includes(redirects[0])||(input.token_endpoint_auth_method&&input.token_endpoint_auth_method!=='none'))return json({error:'invalid_client_metadata'},400);
  const client=randomSecret();await env.DB.prepare('INSERT INTO mcp_clients(id,redirect_uri,expires) VALUES(?,?,?)').bind(client,redirects[0],now()+86400*365).run();
  return json({client_id:client,redirect_uris:redirects,token_endpoint_auth_method:'none',grant_types:['authorization_code'],response_types:['code']},201);
 }
 if(url.pathname==='/mcp-oauth/authorize'&&request.method==='GET'){
  const i=Object.fromEntries(url.searchParams);const c=await env.DB.prepare('SELECT * FROM mcp_clients WHERE id=? AND expires>?').bind(i.client_id,now()).first();validateMcpAuthorization(i,c,env);
  const id=randomSecret(),browser=randomSecret(),verifier=randomSecret();
  await env.DB.prepare('INSERT INTO mcp_requests(id,client_id,redirect_uri,state,challenge,resource,scope,verifier,browser_digest,expires) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,i.client_id,i.redirect_uri,i.state,i.code_challenge,resource,'academy',verifier,await digest(browser),now()+600).run();
  const github=new URL('https://github.com/login/oauth/authorize');github.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:base+'/auth/callback',state:'mcp_'+id,code_challenge:await challenge(verifier),code_challenge_method:'S256'}).toString();
  return new Response(null,{status:302,headers:{Location:github.href,'Cache-Control':'no-store','Set-Cookie':`voidborn_mcp=${browser}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`}});
 }
 if(url.pathname==='/mcp-oauth/consent'&&request.method==='POST'){
  if(request.headers.get('Origin')!==base)throw new Error('Ungültiger Absender.');
  const form=await request.formData(),id=form.get('consent');if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))throw new Error('Ungültige Freigabe.');
  const row=await env.DB.prepare('SELECT * FROM mcp_consents WHERE id=? AND expires>?').bind(await digest(id),now()).first();if(!row)throw new Error('Freigabe abgelaufen.');
  const i=JSON.parse(row.request_json);if(!cookie(request)||await digest(cookie(request))!==i.browser_digest)throw new Error('Anmeldung gehört zu einem anderen Browser.');
  requirePermission(await grantFor(env,row.actor),'draft.read');
  const used=await env.DB.prepare('DELETE FROM mcp_consents WHERE id=? RETURNING id').bind(await digest(id)).first();if(!used)throw new Error('Freigabe bereits verwendet.');
  const redirect=new URL(i.redirect_uri);redirect.searchParams.set('state',i.state);redirect.searchParams.set('iss',base);
  if(form.get('approve')!=='yes')redirect.searchParams.set('error','access_denied');
  else{const code=randomSecret();await env.DB.prepare('INSERT INTO mcp_codes(id,client_id,redirect_uri,challenge,resource,scope,actor,expires) VALUES(?,?,?,?,?,?,?,?)').bind(await digest(code),i.client_id,i.redirect_uri,i.challenge,i.resource,i.scope,row.actor,now()+60).run();redirect.searchParams.set('code',code);}
  return new Response(null,{status:303,headers:{Location:redirect.href,'Cache-Control':'no-store','Set-Cookie':'voidborn_mcp=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}});
 }
 if(url.pathname==='/mcp-oauth/token'&&request.method==='POST'){
  const i=Object.fromEntries(await request.formData());
  if(i.grant_type!=='authorization_code'||typeof i.code!=='string'||!/^[-._~a-zA-Z0-9]{43,128}$/.test(i.code_verifier||''))return json({error:'invalid_grant'},400);
  const row=await env.DB.prepare('SELECT * FROM mcp_codes WHERE id=? AND expires>?').bind(await digest(i.code),now()).first();
  if(!row||row.client_id!==i.client_id||row.redirect_uri!==i.redirect_uri||row.resource!==i.resource||await challenge(i.code_verifier)!==row.challenge)return json({error:'invalid_grant'},400);
  requirePermission(await grantFor(env,row.actor),'draft.read');
  const used=await env.DB.prepare('DELETE FROM mcp_codes WHERE id=? RETURNING id').bind(await digest(i.code)).first();if(!used)return json({error:'invalid_grant'},400);
  const token=randomSecret();await env.DB.prepare('INSERT INTO mcp_tokens(id,client_id,resource,scope,actor,expires) VALUES(?,?,?,?,?,?)').bind(await digest(token),row.client_id,row.resource,row.scope,row.actor,now()+3600).run();
  return json({access_token:token,token_type:'Bearer',expires_in:3600,scope:'academy'});
 }
 return json({error:'not_found'},404);
}
export async function mcpGithubCallback(request,env){
 const url=new URL(request.url),id=url.searchParams.get('state')?.slice(4);if(!/^[a-f0-9]{64}$/.test(id||''))throw new Error('Ungültige Anmeldung.');
 const row=await env.DB.prepare('SELECT * FROM mcp_requests WHERE id=? AND expires>?').bind(id,now()).first();
 if(!row||!cookie(request)||await digest(cookie(request))!==row.browser_digest)throw new Error('Plugin-Anmeldung abgelaufen oder anderer Browser.');
 const used=await env.DB.prepare('DELETE FROM mcp_requests WHERE id=? RETURNING id').bind(id).first();if(!used)throw new Error('Anmeldung bereits verwendet.');
 const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:env.API_ORIGIN+'/auth/callback',code_verifier:row.verifier})});
 const value=await r.json();if(!r.ok||!value.access_token)throw new Error('GitHub-Anmeldung fehlgeschlagen.');
 const u=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+value.access_token,Accept:'application/vnd.github+json','User-Agent':'Voidborn-Academy'}});const user=await u.json();if(!u.ok||!Number.isSafeInteger(user.id))throw new Error('Identität nicht bestätigt.');
 const actor='github:'+user.id,grant=await grantFor(env,actor);requirePermission(grant,'draft.read');
 // Provider token is neither stored nor forwarded. This is a distinct Academy grant.
 const secret=randomSecret();await env.DB.prepare('INSERT INTO mcp_consents(id,request_json,actor,expires) VALUES(?,?,?,?)').bind(await digest(secret),JSON.stringify(row),actor,now()+300).run();
 return page(`<h1>Academy mit ChatGPT verbinden</h1><p>Angemeldet als <strong>${esc(user.login)}</strong>.</p><p>ChatGPT darf mit deinen Academy-Rechten arbeiten. Deine Rolle: <strong>${esc(grant.role)}</strong>. Rechte können jederzeit entzogen werden.</p><p><small>Guides, Bilder, Kommentare und Aufgaben werden im öffentlichen GitHub-Repository gespeichert. Benutzerrechte und Anmeldedaten bleiben geschützt.</small></p><form method="post" action="/mcp-oauth/consent"><input type="hidden" name="consent" value="${secret}"><button name="approve" value="yes">Verbindung erlauben</button> <button name="approve" value="no">Abbrechen</button></form>`);
}
export async function mcpIdentity(request,env){const bearer=/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization')||'');if(!bearer)return null;const row=await env.DB.prepare('SELECT * FROM mcp_tokens WHERE id=? AND expires>?').bind(await digest(bearer[1]),now()).first();return row?.resource===env.API_ORIGIN+'/mcp'&&row.scope==='academy'?row:null;}
