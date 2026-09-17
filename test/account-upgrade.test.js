import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import vm from 'node:vm';
import {validPassword,hashPin,checkLogin} from '../server/auth.js';
test('Password policy is identical in browser and server, including boundaries and common passwords',()=>{
 const sandbox={window:{},document:{documentElement:{lang:'en'}}};vm.runInNewContext(fs.readFileSync('public/js/account-ux.js','utf8'),sandbox);
 const cases=[['Aa1!abcd',true],['Aa1!abc',false],['alllower123!',false],['ALLUPPER123!',false],['NoNumbers!',false],['NoSymbols123',false],['123321',false],['Password1!',false],['Welcome123!',false],['Aa1!'+ 'x'.repeat(124),true],['Aa1!'+ 'x'.repeat(125),false],['Aa1!\nlong',false],['عربيAa1!',true]];
 for(const [p,want]of cases){assert.equal(validPassword(p),want);assert.equal(sandbox.window.AccountUX.validPassword(p),want);}
});
test('Optional PIN cannot replace a required password, legacy accounts keep access',()=>{
 const u={pinHash:hashPin('A-test-2026!'),passwordSet:true,quickPinHash:hashPin('826194')};assert.ok(checkLogin('A-test-2026!',u));assert.ok(checkLogin('826194',u));delete u.quickPinHash;assert.equal(checkLogin('826194',u),false);assert.ok(checkLogin('123321',{pinHash:hashPin('123321')}));
});
test('Signup requires password; credentials revoke other sessions, PIN opt-in and removal work',async t=>{
 const root=process.cwd(),dir=fs.mkdtempSync(path.join(root,'.test-credentials-')),port=3234,base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,PORT:String(port),PUBLIC_ORIGIN:base,RASID_DATA_DIR:dir,RASID_SEED_DEMO:'0',RASID_NO_UPDATE:'1',RASID_OWNER_PIN_HASH:'',SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:'',TURNSTILE_SITE_KEY:'',TURNSTILE_SECRET_KEY:''},stdio:'ignore'});
 t.after(async()=>{child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));if(path.dirname(dir)===root&&path.basename(dir).startsWith('.test-credentials-'))fs.rmSync(dir,{recursive:true,force:true});});
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/status')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 let cookie='';const call=(url,body,c=cookie)=>fetch(base+url,{method:body?'POST':'GET',headers:{'content-type':'application/json',cookie:c},body:body?JSON.stringify(body):undefined});
 const email='upgrade@example.test',password='Eight-characters1!';
 assert.equal((await call('/api/auth/signup',{email,pin:'123321',privacyAccepted:true})).status,400);
 assert.equal((await call('/api/auth/signup',{email,password:'password1!',privacyAccepted:true})).status,400);
 assert.equal((await call('/api/auth/signup',{email,password,optionalPin:'123',privacyAccepted:true})).status,400);
 let r=await call('/api/auth/signup',{email,password,privacyAccepted:true});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];let u=(await r.json()).user;assert.equal(u.passwordSet,true);assert.equal(u.pinEnabled,false);assert.equal(u.pinHash,undefined);
 r=await call('/api/auth/login',{email,pin:password});const other=r.headers.get('set-cookie').split(';')[0];assert.equal(r.status,200);
 assert.equal((await call('/api/security/credentials',{currentPassword:'wrong',password,optionalPin:'826194'})).status,401);
 assert.equal((await call('/api/security/credentials',{currentPassword:password,password,optionalPin:'826194'})).status,200);
 assert.equal((await (await call('/api/me',null,other)).json()).user,null);
 assert.equal((await call('/api/auth/login',{email,pin:'826194'})).status,200);
 assert.equal((await call('/api/security/totp/setup',{pin:'826194'})).status,401);
 assert.equal((await call('/api/security/credentials',{currentPassword:password,password,optionalPin:''})).status,200);
 assert.equal((await call('/api/auth/login',{email,pin:'826194'})).status,401);
 assert.equal((await call('/api/auth/login',{email,pin:password})).status,200);
 const install=await (await call('/api/install')).json();assert.equal(install.url,base);assert.match(install.qr,/^data:image\/png;base64,/);
});
