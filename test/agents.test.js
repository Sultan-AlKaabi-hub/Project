import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {route} from '../server/agents/router.js';
import {retrieve} from '../server/agents/knowledge.js';
import {initialize,learner,history,eraseLearner,summary} from '../server/agents/memory.js';
import {createPractice,createAdaptivePractice,gradePractice} from '../server/agents/practice.js';
import {createProject,updateMilestone} from '../server/agents/projects.js';
import {installAgents} from '../server/agents/index.js';
import {moduleById} from '../server/curriculum.js';
import {provider,AIProvider} from '../server/agents/provider.js';
import {newsApiStatus} from '../server/pipeline/newsapi.js';
const student=(email='one@example.test')=>({email,role:'student',subject:'ai',lang:'en',level:'beginner',course:{modules:{}}});
test('Router selects learning intents in English and Arabic, with explicit override',()=>{
 for(const [q,a]of [['Quiz me','practice'],['اختبرني','practice'],['Build a RAG project','project'],['أخبار الذكاء الاصطناعي','research'],['What should I learn next?','progress'],['What is an embedding?','tutor']])assert.equal(route(q).agent,a);
 assert.equal(route('quiz me',{agent:'tutor'}).method,'manual');assert.equal(route('quiz me',{agent:'database'}).agent,'practice');
});
test('Latent course retrieval is bilingual, level-filtered and rejects unsupported context',()=>{
 const u=student();assert.ok(retrieve('machine learning',u,{lang:'en'}).some(d=>d.title.en.includes('learning')));
 assert.ok(retrieve('التعلم الآلي',u,{lang:'ar'}).length);assert.equal(retrieve('zzzzxxqv',u).length,0);
 assert.ok(retrieve('Explain this',u,{lessonId:'b1-1'}).some(d=>d.lessonId==='b1-1'));
 assert.ok(retrieve('transformer architecture',u).every(d=>d.difficulty==='beginner'));
});
test('Practice grades once, explains answers and stores concept-specific evidence; users are isolated',()=>{
 const db={},u=student(),other=student('two@example.test');initialize(db);
 const q=createPractice(db,u,'b1-1','en');assert.equal(q.answer,undefined);const row=db.aiLearning.attempts[u.email][0],answer=moduleById(row.moduleId).quiz[row.index].answer;
 const r=gradePractice(db,u,q.id,answer);assert.equal(r.correct,true);assert.ok(r.text.includes('Expected answer:'));assert.equal(r.mastery.attempts,1);
 assert.deepEqual(gradePractice(db,u,q.id,answer),r);assert.throws(()=>gradePractice(db,other,q.id,answer),/not_found/);
 assert.equal(summary(db,u).concepts[0].attempts,1);assert.equal(summary(db,other).concepts.length,0);
});
test('Learning memory defaults off, expires history, resets separately and restricts project updates',()=>{
 const db={},u=student(),other=student('two@example.test');initialize(db);const p=learner(db,u);assert.equal(p.historyEnabled,false);
 db.aiLearning.conversations[u.email]=[{createdAt:new Date(0).toISOString(),question:'old'}];assert.deepEqual(history(db,u),[]);
 p.historyEnabled=true;db.aiLearning.conversations[u.email]=[{createdAt:new Date(0).toISOString(),question:'old'}];assert.deepEqual(history(db,u),[]);
 const project=createProject(db,u,'rag','en');assert.equal(project.milestones.length,5);assert.throws(()=>updateMilestone(db,other,project.id,'1','secret',true),/not_found/);
 updateMilestone(db,u,project.id,'1','A user and measurable goal',true);assert.equal(project.milestones[0].completed,true);
 eraseLearner(db,u.email);assert.equal(summary(db,u).projects.length,0);assert.ok(u.course);
});
test('Agent API authenticates, authorizes, streams structured cards, rejects forged lessons, hides metrics and exports only self',async t=>{
 provider.enabled=false;const db={users:{}},users={one:student(),two:student('two@example.test'),math:{...student('teacher@example.test'),role:'teacher',subject:'math'}};
 const app=express();app.use(express.json());installAgents(app,{db,save(){},requireUser:(req,res,next)=>{req.user=users[req.get('x-test-user')];return req.user?next():res.status(401).json({error:'auth'});}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());const base='http://127.0.0.1:'+server.address().port;
 const call=(path,user='one',body,accept)=>fetch(base+'/api/agents'+path,{method:body===undefined?'GET':'POST',headers:{'x-test-user':user,'content-type':'application/json',...(accept?{accept}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 assert.equal((await call('/profile','missing')).status,401);assert.equal((await call('/profile','math')).status,403);assert.equal((await call('/metrics')).status,403);
 assert.equal((await call('/chat','one',{question:'hi',lessonId:'not-a-lesson'})).status,400);
 const r=await call('/chat','one',{question:'Quiz me',lessonId:'b1-1',userEmail:users.two.email},'text/event-stream');const stream=await r.text();assert.match(stream,/event: route/);assert.match(stream,/event: result/);assert.match(stream,/"type":"quiz"/);assert.ok(!stream.includes('"answer":'));
 const first=await (await call('/export')).json(),second=await (await call('/export','two')).json();assert.equal(first.practice.length,1);assert.equal(second.practice.length,0);
 assert.equal((await call('/chat','math',{question:'student scores'})).status,403);
});
test('Free NewsAPI integration fails closed in production',()=>{const env={...process.env};process.env.NEWSAPI_KEY='test';process.env.NODE_ENV='production';process.env.NEWSAPI_PRODUCTION_ALLOWED='false';assert.equal(newsApiStatus().enabled,false);process.env.NEWSAPI_PRODUCTION_ALLOWED='true';assert.equal(newsApiStatus().enabled,true);for(const k of ['NEWSAPI_KEY','NODE_ENV','NEWSAPI_PRODUCTION_ALLOWED'])if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];});

test('Paid generation requires explicit opt-in even when an unrelated key exists',()=>{
 const prior=process.env.RASID_AGENT_PROVIDER,key=process.env.ANTHROPIC_API_KEY;
 try{delete process.env.RASID_AGENT_PROVIDER;process.env.ANTHROPIC_API_KEY='test';assert.equal(new AIProvider().enabled,false);}finally{if(prior===undefined)delete process.env.RASID_AGENT_PROVIDER;else process.env.RASID_AGENT_PROVIDER=prior;if(key===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=key;}
});
test('Generated practice validates schemas and never sends its answer key',async()=>{
 const enabled=provider.enabled,generate=provider.generate;
 try{provider.enabled=true;provider.generate=async()=>({text:JSON.stringify({question:'Ignore the lesson',choices:['one'],answer:900}),model:'mock'});const db={},u=student();const fallback=await createAdaptivePractice(db,u,'b1-1','en');assert.ok(fallback.choices.length>1);assert.equal(db.aiLearning.attempts[u.email][0].generated,undefined);
 provider.generate=async()=>({text:JSON.stringify({question:'What distinguishes AI from fixed instructions?',choices:['Learning from examples','Always conscious','No data needed'],answer:0,explanation:'AI finds patterns in examples rather than following only explicit rules.'}),model:'mock'});const q=await createAdaptivePractice(db,u,'b1-1','en');assert.equal(q.answer,undefined);assert.equal(gradePractice(db,u,q.id,0).correct,true);
 }finally{provider.enabled=enabled;provider.generate=generate;}
});
