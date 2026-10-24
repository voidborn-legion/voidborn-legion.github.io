import {normalizeGrant,requirePermission} from './permissions.mjs';
export function subjectFromActor(actor){const id=/^(?:github:)?([0-9]+)(?::[^:]*)?$/.exec(actor||'')?.[1];if(!id)throw new Error('Unbekannte Anmeldeidentität.');return 'github:'+id;}
export async function grantFor(env,actor){
 const subject=subjectFromActor(actor);
 if(env.OWNER_GITHUB_ID&&subject==='github:'+env.OWNER_GITHUB_ID)return {...normalizeGrant({role:'administrator'}),subject,owner:true};
 const row=await env.DB.prepare('SELECT grant_json,revision FROM academy_grants WHERE subject=?').bind(subject).first();
 return {...normalizeGrant(row?JSON.parse(row.grant_json):{role:'player'}),subject,revision:row?.revision||0,owner:false};
}
export async function listGrants(env,actor){requirePermission(await grantFor(env,actor),'user.manage');const r=await env.DB.prepare('SELECT subject,grant_json,revision,updated_at,updated_by FROM academy_grants ORDER BY subject LIMIT 200').all();return r.results.map(row=>({...row,grant_json:JSON.parse(row.grant_json)}));}
export async function saveGrant(env,actor,input){
 requirePermission(await grantFor(env,actor),'user.manage');
 if(!/^github:[0-9]+$/.test(input.subject||''))throw new Error('Nur verifizierte GitHub-Konto-IDs werden derzeit unterstützt.');
 if(input.subject==='github:'+env.OWNER_GITHUB_ID)throw new Error('Der Inhaberzugang kann hier nicht entzogen werden.');
 if(!Number.isInteger(input.expectedRevision)||input.expectedRevision<0)throw new Error('Revisionsnummer fehlt.');
 const grant=normalizeGrant(input.grant),time=Math.floor(Date.now()/1000);
 // CAS prevents two administrators from silently overwriting each other's grants.
 const sql=input.expectedRevision===0?'INSERT INTO academy_grants(subject,grant_json,revision,updated_at,updated_by) VALUES(?,?,1,?,?) ON CONFLICT(subject) DO NOTHING RETURNING revision':'UPDATE academy_grants SET grant_json=?,revision=revision+1,updated_at=?,updated_by=? WHERE subject=? AND revision=? RETURNING revision';
 const args=input.expectedRevision===0?[input.subject,JSON.stringify(grant),time,actor]:[JSON.stringify(grant),time,actor,input.subject,input.expectedRevision];
 const row=await env.DB.prepare(sql).bind(...args).first();if(!row)throw new Error('CONFLICT: Benutzerrechte wurden inzwischen geändert.');
 await env.DB.prepare('INSERT INTO academy_access_audit(actor,subject,action,at) VALUES(?,?,?,?)').bind(actor,input.subject,'grant.updated',time).run();
 return {subject:input.subject,grant,revision:row.revision};
}
