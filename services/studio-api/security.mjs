const encoder=new TextEncoder();
export const randomSecret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function challenge(value){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
async function key(secret){if(!/^[a-f0-9]{64}$/.test(secret||''))throw new Error('TOKEN_KEY muss ein sicherer 256-Bit-Schlüssel sein.');return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),'AES-GCM',false,['encrypt','decrypt']);}
export async function seal(value,secret){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(secret),encoder.encode(value)));return JSON.stringify({iv:Array.from(iv),data:Array.from(encrypted)});}
export async function open(value,secret){const data=JSON.parse(value);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(data.iv)},await key(secret),new Uint8Array(data.data)));}
export function validateOrigin(origin,expected){if(!origin||origin!==expected)throw new Error('Nicht erlaubte Studio-Origin.');return origin;}
export function validateBranch(branch){if(!/^(dev|draft)\/[a-zA-Z0-9/_-]+$/.test(branch||'')||branch.includes('..'))throw new Error('API darf nur auf einen Entwurfsbranch zugreifen.');return branch;}
