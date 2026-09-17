import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import nodemailer from 'nodemailer';
import {route} from '../server/agents/router.js';
import {laboratoryAnswer,roadmap,reviewCode} from '../server/agents/laboratory.js';
import {attendanceTrend,insightsAnswer} from '../server/agents/attendance-insights.js';
import {initialize,learner,eraseLearner} from '../server/agents/memory.js';
import {installAgents} from '../server/agents/index.js';
import {acceptTotp,captchaCheck,startOtp,finishOtp} from '../server/security.js';
import {totp} from '../server/auth.js';
const u={email:'lab@example.test',role:'student',subject:'ai',lang:'en',level:'beginner'};
test('New agents route separately; code remains data and review admits its limits',()=>{
 for(const [q,a]of [['Review my code','review'],['Learning path','path'],['Simulation','simulation'],['Build an agent','builder']])assert.equal(route(q).agent,a);
 const r=reviewCode('element.innerHTML = userText; eval(userText)');assert.equal(r.cards.length,3);assert.match(r.text,/not executed/);assert.match(reviewCode('const n=1').cards[0].text,/does not prove/);
});
test('Learning path respects level, history, goals and weekly time; simulations isolate and reset',()=>{
 const db={};initialize(db);learner(db,u).minutesPerWeek=30;const path=roadmap(db,u);assert.equal(path.length,8);assert.match(path[1].text,/Week 2/);
 const first=laboratoryAnswer(db,u,{agent:'simulation',question:'start'},'en');assert.match(first.text,/CTO/);
 const second=laboratoryAnswer(db,u,{agent:'simulation',question:'My proposed use case'},'en');assert.match(second.text,/baseline/);
 const other={...u,email:'other@example.test'};assert.match(laboratoryAnswer(db,other,{agent:'simulation',question:'start'},'en').text,/CTO/);
 for(let i=0;i<4;i++)laboratoryAnswer(db,u,{agent:'simulation',question:'I need help'},'en');
 const debrief=laboratoryAnswer(db,u,{agent:'simulation',question:'Done'},'en');assert.ok(debrief.cards.some(c=>c.text.includes('Improvement prompt')));
 eraseLearner(db,u.email);assert.equal(db.aiLearning.labs[u.email],undefined);
});
test('Attendance estimates handle numeric dates, duplicates, remote, exclusions and insufficient history',()=>{
 const now=Date.UTC(2026,8,17),day=86400000;
 const rows=Array.from({length:12},(_,i)=>({classId:String(i),at:now-(i<6?i+1:i+30)*day,status:i<3?'absent':i===3?'remote':'present'}));
 const r=attendanceTrend(rows,now);assert.equal(r.currentRate,50);assert.equal(r.previousRate,100);assert.equal(r.projection,0);assert.equal(r.needsAttention,true);
 assert.deepEqual(attendanceTrend([...rows,rows[0],{at:now+day,status:'absent'},{at:now-day,status:'excused'}],now),r);
 assert.equal(attendanceTrend(rows.slice(0,2),now).projection,null);
 const db={users:{one:u,two:{...u,email:'demo@test',isDemo:true}},attendance:[],classes:[]};assert.match(insightsAnswer('how many students',db,u,'en').text,/administrators only/);assert.match(insightsAnswer('how many students',db,{role:'admin'},'en').text,/2 students, including 1 test/);
});
test('Agent configs reject unauthorized tools and cross-user access',async t=>{
 const db={users:{}},app=express();app.use(express.json());installAgents(app,{db,save(){},requireUser(req,res,next){req.user={...u,email:req.get('x-user')||u.email};next();}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());const base='http://127.0.0.1:'+server.address().port;
 const call=(path,body,email)=>fetch(base+'/api/agents'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(email?{'x-user':email}:{})},body:body?JSON.stringify(body):undefined});
 assert.equal((await call('/lab/config',{name:'x',instructions:'',tools:['database_query']})).status,400);
 assert.equal((await call('/lab/config',{name:'Mine',instructions:'Explain simply',tools:['course_search']})).status,200);
 assert.equal((await (await call('/lab',null,'other@test')).json()).config,null);
 assert.equal((await call('/insights')).status,403);
});
test('Authenticator rejects replay, invalid codes and out-of-window codes',()=>{
 const now=Date.now(),step=Math.floor(now/30000),factor={secret:'JBSWY3DPEHPK3PXP'};
 assert.equal(acceptTotp(factor,totp(factor.secret,step),now),true);
 assert.equal(acceptTotp(factor,totp(factor.secret,step),now),false);
 assert.equal(acceptTotp(factor,totp(factor.secret,step+5),now),false);
 assert.equal(acceptTotp(factor,'abcdef',now),false);
});
test('CAPTCHA verifies hostname and action and fails closed when partially configured',async()=>{
 const old=[process.env.TURNSTILE_SITE_KEY,process.env.TURNSTILE_SECRET_KEY];
 try{process.env.TURNSTILE_SITE_KEY='test';delete process.env.TURNSTILE_SECRET_KEY;assert.equal(await captchaCheck('t','auth','site.test'),false);process.env.TURNSTILE_SECRET_KEY='test';const response=d=>async()=>({ok:true,json:async()=>d});assert.equal(await captchaCheck('t','auth','site.test',response({success:true,hostname:'evil.test',action:'auth'})),false);assert.equal(await captchaCheck('t','auth','site.test',response({success:true,hostname:'site.test',action:'auth'})),true);}finally{['TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY'].forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
test('Email OTP is purpose-bound, account-bound, one-use and rate-limited; no actual email is sent',async()=>{
 const original=nodemailer.createTransport,old=[process.env.SMTP_HOST,process.env.SMTP_FROM];let code;
 nodemailer.createTransport=()=>({sendMail:async mail=>{code=mail.text.match(/\b\d{6}\b/)[0];}});process.env.SMTP_HOST='test.invalid';process.env.SMTP_FROM='test@example.test';
 try{const id=await startOtp(u,'email',u.email,'enroll');assert.equal(await finishOtp(id,code,'login'),null);assert.equal(await finishOtp(id,code,'enroll','other@test'),null);assert.equal(await finishOtp(id,'000000'===code?'111111':'000000','enroll',u.email),null);assert.equal((await finishOtp(id,code,'enroll',u.email)).email,u.email);assert.equal(await finishOtp(id,code,'enroll',u.email),null);await assert.rejects(()=>startOtp(u,'email',u.email,'enroll'),/rate_limited/);}finally{nodemailer.createTransport=original;['SMTP_HOST','SMTP_FROM'].forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});

test('Actual authentication routes require PIN for enrollment and a fresh factor to disable',async t=>{
 const root=process.cwd(),dir=fs.mkdtempSync(path.join(root,'.test-security-')),port=3229,base='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,PORT:String(port),RASID_DATA_DIR:dir,RASID_SEED_DEMO:'0',RASID_NO_UPDATE:'1',PUBLIC_ORIGIN:base,SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:'',TURNSTILE_SITE_KEY:'',TURNSTILE_SECRET_KEY:'',RASID_OWNER_PIN_HASH:''},stdio:'ignore'});
 t.after(async()=>{child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));if(path.dirname(dir)===root&&path.basename(dir).startsWith('.test-security-'))fs.rmSync(dir,{recursive:true,force:true});});
 for(let i=0;i<80;i++){try{if((await fetch(base+'/api/status')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 let cookie='';const call=(url,body)=>fetch(base+url,{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(body)});
 const signup=await call('/api/auth/signup',{email:'security@example.test',password:'Secure-lab-2026!',privacyAccepted:true,lang:'en'});assert.equal(signup.status,200);cookie=signup.headers.get('set-cookie').split(';')[0];
 assert.equal((await call('/api/security/totp/setup',{})).status,401);
 const setup=await (await call('/api/security/totp/setup',{pin:'Secure-lab-2026!'})).json();assert.ok(setup.secret);
 assert.equal((await call('/api/security/totp/confirm',{code:totp(setup.secret,Math.floor(Date.now()/30000)-1)})).status,200);
 assert.equal((await call('/api/security/totp/setup',{pin:'Secure-lab-2026!'})).status,409);
 assert.equal((await call('/api/security/totp/disable',{})).status,401);
 const login=await (await call('/api/auth/login',{email:'security@example.test',pin:'Secure-lab-2026!'})).json();assert.equal(login.needTotp,true);
 assert.equal((await call('/api/auth/totp',{ticket:login.ticket,code:totp(setup.secret)})).status,200);
 assert.equal((await call('/api/security/totp/disable',{pin:'Secure-lab-2026!',code:totp(setup.secret)})).status,401);
 assert.equal((await call('/api/security/totp/disable',{pin:'Secure-lab-2026!',code:totp(setup.secret,Math.floor(Date.now()/30000)+1)})).status,200);
 const final=await (await call('/api/auth/login',{email:'security@example.test',pin:'Secure-lab-2026!'})).json();assert.equal(final.user.email,'security@example.test');
});
