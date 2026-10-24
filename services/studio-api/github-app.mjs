import {createPrivateKey,sign} from 'node:crypto';
const repo='voidborn-legion/voidborn-legion.github.io';
export async function installationToken(env){
 if(!env.GITHUB_APP_ID||!env.GITHUB_INSTALLATION_ID||!env.GITHUB_PRIVATE_KEY)throw new Error('GitHub-App-Dienstzugang fehlt.');
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const now=Math.floor(Date.now()/1000);
 const payload=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:env.GITHUB_APP_ID,iat:now-60,exp:now+540});
 const jwt=payload+'.'+sign('RSA-SHA256',Buffer.from(payload),createPrivateKey(env.GITHUB_PRIVATE_KEY)).toString('base64url');
 const r=await fetch(`https://api.github.com/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`,{method:'POST',headers:{Authorization:'Bearer '+jwt,Accept:'application/vnd.github+json','User-Agent':'Voidborn-Academy','Content-Type':'application/json'},body:JSON.stringify({repositories:[repo.split('/')[1]],permissions:{contents:'write',metadata:'read'}})});
 if(!r.ok)throw new Error('GitHub-App-Zugriff konnte nicht hergestellt werden.');const value=await r.json();if(!value.token)throw new Error('GitHub-App-Token fehlt.');return value.token;
}
