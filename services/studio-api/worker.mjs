import {oauthRoute,mcpGithubCallback} from './mcp-oauth.mjs';
import {handleMcp} from './mcp.mjs';
import {grantFor} from './grants.mjs';
import {authorizeCommand,visibleState,requirePermission} from './permissions.mjs';
import {installationToken} from './github-app.mjs';
import { randomSecret,digest,challenge,seal,open,validateOrigin,validateBranch } from './security.mjs';
import { assertPermission,remoteWorkspace,remoteCommand,historyRemote,diffRemote } from './github.mjs';
const age=seconds=>Math.floor(Date.now()/1000)+seconds;
const reply=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const ready=env=>{if(!env.DB||!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET||!env.TOKEN_KEY||!env.STUDIO_ORIGIN||!env.API_ORIGIN)throw new Error('Studio-Anmeldung ist noch nicht eingerichtet.');validateBranch(env.DRAFT_BRANCH);};
export default {async fetch(request,env){
 const url=new URL(request.url);let cors={};
 try{
  ready(env);
  const oauth=await oauthRoute(request,env);if(oauth)return oauth;
  if(url.pathname==='/mcp')return await handleMcp(request,env);
  if(url.pathname==='/auth/callback'&&url.searchParams.get('state')?.startsWith('mcp_'))return await mcpGithubCallback(request,env);
  if(url.pathname.startsWith('/api/')||url.pathname==='/auth/exchange'){
   validateOrigin(request.headers.get('Origin'),env.STUDIO_ORIGIN);
   cors={'Access-Control-Allow-Origin':env.STUDIO_ORIGIN,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  }
  if(url.pathname==='/auth/start'&&request.method==='GET'){
   const ip=await digest(request.headers.get('CF-Connecting-IP')||'unknown');const bucket=Math.floor(Date.now()/600000);
   const limit=await env.DB.prepare('INSERT INTO rate_limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(ip+':'+bucket,age(1200)).first();
   if(limit.count>20)return reply({error:'Zu viele Anmeldeversuche. Bitte später erneut versuchen.'},429);
   const uiChallenge=url.searchParams.get('challenge');if(!/^[A-Za-z0-9_-]{43}$/.test(uiChallenge||''))throw new Error('Ungültige Anmeldeanfrage.');
   const state=randomSecret(),verifier=randomSecret();
   await env.DB.prepare('INSERT INTO oauth_states(id,verifier,ui_challenge,expires) VALUES(?,?,?,?)').bind(state,verifier,uiChallenge,age(600)).run();
   const target=new URL('https://github.com/login/oauth/authorize');target.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:env.API_ORIGIN+'/auth/callback',state,code_challenge:await challenge(verifier),code_challenge_method:'S256'}).toString();
   return Response.redirect(target,302);
  }
  if(url.pathname==='/auth/callback'&&request.method==='GET'){
   const state=url.searchParams.get('state');const row=await env.DB.prepare('DELETE FROM oauth_states WHERE id=? AND expires>? RETURNING *').bind(state,age(0)).first();
   if(!row||!url.searchParams.get('code'))throw new Error('Anmeldung abgelaufen. Bitte erneut starten.');
   const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:env.API_ORIGIN+'/auth/callback',code_verifier:row.verifier})});
   const token=await tokenResponse.json();if(!tokenResponse.ok||!token.access_token)throw new Error('GitHub-Anmeldung fehlgeschlagen.');
   const userResponse=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${token.access_token}`,Accept:'application/vnd.github+json','User-Agent':'Voidborn-Academy-Studio'}});const user=await userResponse.json();if(!userResponse.ok||!user.id)throw new Error('Identität konnte nicht geprüft werden.');
   requirePermission(await grantFor(env,String(user.id)+':'+user.login),'draft.read');
   const ticket=randomSecret();await env.DB.prepare('INSERT INTO login_tickets(id,token_cipher,actor,ui_challenge,expires) VALUES(?,?,?,?,?)').bind(await digest(ticket),await seal(token.access_token,env.TOKEN_KEY),String(user.id)+':'+user.login,row.ui_challenge,age(60)).run();
   const payload=JSON.stringify({type:'voidborn-login',ticket}).replaceAll('<','\\u003c');const origin=JSON.stringify(env.STUDIO_ORIGIN).replaceAll('<','\\u003c');
   const nonce=randomSecret();return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><title>Anmeldung abgeschlossen</title><body><p>Anmeldung geprüft. Du kannst dieses Fenster schließen.</p><script nonce="${nonce}">if(window.opener){window.opener.postMessage(${payload},${origin});window.close();}</script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'`}});
  }
  if(url.pathname==='/auth/exchange'&&request.method==='POST'){
   const input=await request.json();if(typeof input.ticket!=='string'||typeof input.verifier!=='string'||input.verifier.length>128)throw new Error('Ungültiges Einmalticket.');
   const id=await digest(input.ticket);const row=await env.DB.prepare('SELECT * FROM login_tickets WHERE id=? AND expires>?').bind(id,age(0)).first();
   if(!row||await challenge(input.verifier)!==row.ui_challenge)throw new Error('Anmeldung nicht zuordenbar.');
   const consumed=await env.DB.prepare('DELETE FROM login_tickets WHERE id=? RETURNING id').bind(id).first();if(!consumed)throw new Error('Anmeldung bereits verwendet.');
   const session=randomSecret();await env.DB.prepare('INSERT INTO sessions(id,token_cipher,actor,expires) VALUES(?,?,?,?)').bind(await digest(session),row.token_cipher,row.actor,age(1800)).run();
   return reply({session,expiresIn:1800},200,cors);
  }
  const bearer=/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization')||'');
  const session=bearer?await env.DB.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').bind(await digest(bearer[1]),age(0)).first():null;
  if(!session)return reply({error:'Bitte mit GitHub anmelden.'},401,cors);
  const grant=await grantFor(env,session.actor);
  requirePermission(grant,'draft.read');
  const token=await installationToken(env);
  if(url.pathname==='/api/state'&&request.method==='GET'){return reply(visibleState((await remoteWorkspace(token,env.DRAFT_BRANCH)).state,grant),200,cors);}
  if(url.pathname==='/api/history'&&request.method==='GET'){requirePermission(grant,'draft.read',url.searchParams.get('guide'));return reply({versions:await historyRemote(token,env.DRAFT_BRANCH,url.searchParams.get('guide'))},200,cors);}
  if(url.pathname==='/api/diff'&&request.method==='GET'){requirePermission(grant,'draft.read',url.searchParams.get('guide'));return reply({diff:await diffRemote(token,env.DRAFT_BRANCH,url.searchParams.get('guide'),url.searchParams.get('before'))},200,cors);}
  if(url.pathname==='/api/command'&&request.method==='POST'){
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('Nur JSON-Aufträge sind erlaubt.');
   const raw=await request.text();if(raw.length>3100000)throw new Error('Auftrag zu groß.');
   const input=JSON.parse(raw),workspace=await remoteWorkspace(token,env.DRAFT_BRANCH);authorizeCommand(grant,input,workspace.state);
   const result=await remoteCommand(token,env.DRAFT_BRANCH,input,session.actor,true,workspace);return reply(result,200,cors);
  }
  if(url.pathname==='/api/logout'&&request.method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(await digest(bearer[1])).run();return reply({loggedOut:true},200,cors);}
  return reply({error:'Aktion ist nicht verfügbar.'},404,cors);
 }catch(error){return reply({error:error.message},error.status||(error.message.includes('CONFLICT')?409:400),cors);}
},async scheduled(event,env,ctx){
 if(!env.DB)return;
 ctx.waitUntil(env.DB.batch(['oauth_states','login_tickets','sessions','rate_limits','mcp_clients','mcp_requests','mcp_consents','mcp_codes','mcp_tokens','mcp_refresh_sessions','mcp_refresh_history','mcp_token_sessions'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE expires<=?`).bind(age(0)))));
}};
