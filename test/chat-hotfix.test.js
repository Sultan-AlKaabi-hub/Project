import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {respond} from '../server/agents/service.js';
import {PRESENTATIONS,PRESENTATION_NOTES,PRESENTATION_CONCEPTS} from '../data/knowledge/presentations.js';
import {prepare} from '../server/agents/orchestration.js';
import {createConceptPractice,gradePractice} from '../server/agents/practice.js';
import {PRESENTATION_PRACTICE} from '../data/knowledge/presentation-practice.js';
import {provider} from '../server/agents/provider.js';
test('Lesson example is a concrete scenario, not a copied lesson, in both languages',async()=>{for(const lang of ['en','ar']){const u={email:'test@example.test',role:'admin',level:'beginner',lang,course:{modules:{}}};const r=await respond({users:{[u.email]:u}},u,{question:lang==='en'?'Give an example of this concept':'أعطني مثالاً على هذا المفهوم',lessonId:'b6-1',agent:'tutor',lang});assert.match(r.text,lang==='en'?/Dubai office/:/مكتب دبي/);assert.equal(r.learningContext.conceptId,'hallucination');}});

test('All supplied decks retain physical slide numbers, provenance and explicit extraction gaps',()=>{
 assert.equal(PRESENTATIONS.length,11);assert.equal(PRESENTATIONS.reduce((n,d)=>n+d.slideCount,0),193);assert.equal(PRESENTATIONS.reduce((n,d)=>n+d.textSlides,0),192);
 for(const d of PRESENTATIONS){assert.match(d.sha256,/^[a-f0-9]{64}$/);assert.equal(d.slides.length,d.slideCount);d.slides.forEach((s,i)=>assert.equal(s.slide,i+1));assert.ok(PRESENTATION_NOTES.some(n=>n.deckId===d.id));}
 for(const c of PRESENTATION_CONCEPTS){const d=PRESENTATIONS.find(d=>d.id===c.source.deckId);assert.ok(c.source.slides.every(n=>d.slides[n-1]?.text));assert.notEqual(c.foundation.en,c.example.en);assert.notEqual(c.foundation.ar,c.example.ar);}
});

test('Training topics retrieve presentation evidence and examples in both languages',async()=>{
 for(const [question,lang,concept] of [['Give a worked example of forward chaining','en','training-rules'],['أعطني مثالاً عن الرؤية الحاسوبية','ar','training-vision'],['Explain PHP GET versus POST with an example','en','training-php'],['أعطني مثالاً عن لوحة البيانات','ar','training-dashboard']]){
  const u={email:'deck-'+concept+lang+'@test',role:'student',subject:'ai',level:'beginner',lang,course:{modules:{}}},db={users:{}};
  const r=await respond(db,u,{question,lang,agent:'tutor'});assert.equal(r.learningContext.conceptId,concept);assert.ok(r.sources.some(s=>s.deckId),question);assert.ok(r.text.includes(PRESENTATION_CONCEPTS.find(c=>c.id===concept).example[lang]));
 }
});

test('All presentation practices explain mistakes, hide keys and keep learner ownership',()=>{
 const db={},u={email:'practice@test',level:'beginner'},other={email:'other@test',level:'beginner'};
 for(const q of PRESENTATION_PRACTICE){const quiz=createConceptPractice(db,u,q.concept,'ar');assert.ok(quiz);assert.equal(quiz.answer,undefined);assert.throws(()=>gradePractice(db,other,quiz.id,1),/attempt_not_found/);const result=gradePractice(db,u,quiz.id,0);assert.equal(result.correct,false);assert.equal(result.text,q.why[1]);assert.equal(gradePractice(db,u,quiz.id,1),result);}
});

test('Lab agents use the configured provider and preserve exercise context',async()=>{
 const saved={enabled:provider.enabled,stream:provider.stream};provider.enabled=true;let captured;
 provider.stream=async(system,input)=>{captured={system,input};return {text:'A concrete review with a reason.',model:'claude-test',usage:{input:10,output:10}};};
 try{const u={email:'review@test',role:'student',level:'beginner'};const r=await respond({},u,{question:'Review my Python code: print(1)',agent:'review',lang:'en',conversation:[{question:'Review this function',answer:'Check the input type.'}]} );assert.deepEqual(captured.input.history,[{question:'Review this function',answer:'Check the input type.'}]);assert.equal(r.model,'claude-test');assert.match(r.text,/concrete review/);assert.ok(captured.input.exercise);assert.match(captured.system,/Never claim execution/);assert.equal(r.localContext,null);}finally{Object.assign(provider,saved);}
});

test('Device cancellation interrupts inference while preserving the loaded worker',async()=>{
 let worker;class WorkerMock{constructor(){worker=this;this.sent=[];}postMessage(x){this.sent.push(x);}terminate(){this.dead=true;}}
 const el=()=>({children:[],append(...xs){this.children.push(...xs);},setAttribute(){}});
 const sandbox={window:{addEventListener(){}},document:{documentElement:{lang:'en'},createElement:el},navigator:{gpu:{requestAdapter:async()=>({features:new Set(['shader-f16'])})}},Worker:WorkerMock,setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync('public/js/local-tutor.js','utf8'),sandbox);const parent=el(),local=sandbox.window.LocalTutor;local.settings(parent);const section=parent.children[0],enable=section.children[2];await enable.onclick();worker.onmessage({data:{type:'ready'}});assert.equal(local.ready,true);
 const controller=new AbortController(),reply=local.generate({},controller.signal);controller.abort();await assert.rejects(reply,/cancelled/);assert.equal(worker.dead,undefined);assert.equal(local.ready,true);assert.equal(worker.sent.at(-1).type,'cancel');worker.onmessage({data:{type:'result',text:''}});
 const next=local.generate({});worker.onmessage({data:{type:'error',phase:'generate',reason:'context too long'}});await assert.rejects(next,/context too long/);assert.equal(local.ready,true);
 local.stop();assert.equal(local.ready,false);
});
