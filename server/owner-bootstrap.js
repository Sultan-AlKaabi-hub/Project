import crypto from 'node:crypto';
export const OWNER_EMAIL='sultan.3ami@gmail.com';
export function provisionOwner(db,env=process.env){
 const hash=env.RASID_OWNER_PIN_HASH;
 if(!hash)return false;
 if(!/^[a-f0-9]{32}:[a-f0-9]{64}$/.test(hash))throw new Error('Invalid RASID_OWNER_PIN_HASH configuration');
 db.settings ||= {};db.users ||= {};db.sessions ||= {};
 const revision=crypto.createHash('sha256').update(hash).digest('hex');
 let u=db.users[OWNER_EMAIL],changed=false;
 if(!u){u=db.users[OWNER_EMAIL]={email:OWNER_EMAIL,name:'Sultan Al Kaabi',role:'admin',subject:'ai',lang:'en',level:'beginner',created:Date.now(),read:{},badges:[],passkeys:[]};changed=true;}
 if(db.settings.ownerCredentialRevision!==revision){
  // A deployment-controlled credential proves ownership. Never trust an email-only signup.
  if(u.role!=='admin'){u.passkeys=[];delete u.totp;}
  u.pinHash=hash;for(const [k,s]of Object.entries(db.sessions))if(s.email===OWNER_EMAIL)delete db.sessions[k];
  delete u.resetCode;db.settings.ownerCredentialRevision=revision;changed=true;
 }
 if(u.role!=='admin'||u.subject!=='ai'){u.role='admin';u.subject='ai';delete u.teacherEmail;changed=true;}
 return changed;
}
