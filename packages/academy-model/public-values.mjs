/** Build-time projection only. Never send draft/unverified records to public bundles. */
export function publicGameValues(records) {
 return records.filter(r=>r.publication==='published'&&r.verification.status==='verified').map(r=>structuredClone(r));
}
