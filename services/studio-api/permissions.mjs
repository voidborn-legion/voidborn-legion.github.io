// Shared authorization policy for Studio HTTP actions and Academy MCP tools.
// Never derive privileges from a display name, unverified email or repository visibility.
export const permissions = ['draft.read','comment.write','comment.moderate','guide.create','guide.edit','guide.organize','guide.archive','image.write','task.write','version.restore','source.write','site.edit','content.publish','user.manage'];
export const roles = {
 player: [], reader: ['draft.read'],
 commentator: ['draft.read','comment.write'],
 author: ['draft.read','comment.write','guide.create','guide.edit','image.write','task.write'],
 editor: permissions.filter(p=>!['user.manage','content.publish'].includes(p)), administrator: [...permissions]
};
export function normalizeGrant(input) {
 if(!input || !Object.hasOwn(roles,input.role))throw new Error('Unknown role');
 const overrides=input.overrides||{};
 if(Object.entries(overrides).some(([key,value])=>!permissions.includes(key)||typeof value!=='boolean'))throw new Error('Invalid permission override');
 const scope=input.guideIds===undefined?null:input.guideIds;
 if(scope!==null&&(!Array.isArray(scope)||scope.some(x=>!/^guide:[a-zA-Z0-9_-]+$/.test(x))||new Set(scope).size!==scope.length))throw new Error('Invalid guide scope');
 return {role:input.role,overrides,guideIds:scope,disabled:input.disabled===true};
}
export function can(grant,permission,guideId=null) {
 if(!grant||grant.disabled||!permissions.includes(permission))return false;
 const allowed=Object.hasOwn(grant.overrides||{},permission)?grant.overrides[permission]:roles[grant.role]?.includes(permission);
 return !!allowed&&(!guideId||grant.guideIds===null||grant.guideIds===undefined||grant.guideIds.includes(guideId));
}
export function requirePermission(grant,permission,guideId=null){if(!can(grant,permission,guideId)){const error=new Error('Für diese Aktion fehlt die Academy-Berechtigung.');error.status=403;throw error;}}
export const commandPermissions={
 'site.save':'site.edit','site.image':'site.edit','guide.submit':'guide.edit',
 'guide.save':'guide.edit','guide.create':'guide.create','guide.archive':'guide.archive','guide.move':'guide.organize','guide.assign':'guide.organize','guide.reorder':'guide.organize','guide.restore':'version.restore','guide.migrate-tasks':'task.write',
 'comment.add':'comment.write','comment.reply':'comment.write','comment.status':'comment.moderate',
 'task.add':'task.write','task.status':'task.write',
 'screenshot.add':'image.write','screenshot.insert':'image.write','screenshot.archive':'image.write','screenshot.upload':'image.write','screenshot.reuse':'image.write','screenshot.details':'image.write','screenshot.restore':'image.write',
 'category.create':'guide.organize','category.rename':'guide.organize','category.reorder':'guide.organize','source.save':'source.write'
};
export function commandGuideIds(input,state){
 if(input.id){const b=state.snapshot.bundles.find(b=>[...b.comments,...b.tasks,...b.placeholders,...b.assets].some(x=>x.id===input.id));if(b)return [b.guideId];throw new Error('Zielobjekt nicht gefunden.');}
 if(input.guideId)return [input.guideId];
 return [];
}
export function authorizeCommand(grant,input,state){
 const permission=commandPermissions[input.op];if(!permission)throw new Error('Aktion ist nicht für den Academy-Dienst freigegeben.');
 requirePermission(grant,permission);
 if(['site.save','site.image','category.create','category.rename','category.reorder','guide.reorder','source.save'].includes(input.op)&&grant.guideIds!==null&&grant.guideIds!==undefined)throw new Error('Diese Aktion benötigt Zugriff auf die gesamte Academy.');
 if(input.op==='screenshot.reuse'){const source=state.snapshot.bundles.find(b=>b.assets.some(a=>a.id===input.assetId));if(!source)throw new Error('Bild nicht gefunden.');requirePermission(grant,'draft.read',source.guideId);}
 const ids=commandGuideIds(input,state);for(const id of ids)requirePermission(grant,permission,id);
 // Whole-catalog actions and creating guides are deliberately unavailable to scoped grants.
 if(!ids.length&&grant.guideIds!==null&&grant.guideIds!==undefined)throw new Error('Diese Aktion benötigt Zugriff auf die gesamte Academy.');
 if(input.op==='guide.reorder'&&grant.guideIds!==null&&grant.guideIds!==undefined)throw new Error('Globale Reihenfolge ist nicht freigegeben.');
}
export function visibleState(state,grant){
 requirePermission(grant,'draft.read');const out=structuredClone(state);
 if(grant.guideIds!==null&&grant.guideIds!==undefined){
  const allowed=new Set(grant.guideIds);out.guides=out.guides.filter(g=>allowed.has(g.id));out.snapshot.catalog.guides=out.snapshot.catalog.guides.filter(g=>allowed.has(g.id));out.snapshot.bundles=out.snapshot.bundles.filter(b=>allowed.has(b.guideId));out.snapshot.gameValues=out.snapshot.gameValues.filter(v=>allowed.has(v.guideId));
  // Dashboard is recomputed by the caller; never return global task/comment summaries.
  const collect=(field,predicate)=>out.snapshot.bundles.flatMap(b=>b[field].filter(predicate).map(i=>({...i,guideId:b.guideId,document:b.document})));
  out.dashboard={missingScreenshots:collect('placeholders',p=>['missing','needs-review'].includes(p.status)),openComments:collect('comments',c=>c.status!=='done'),openTasks:collect('tasks',t=>t.status!=='done')};
 }
 if(grant.guideIds!==null&&grant.guideIds!==undefined){delete out.site;delete out.publication;}
 out.permissions=permissions.filter(p=>can(grant,p));out.studioAccess=true;return out;
}
