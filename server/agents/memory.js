import {conceptById} from '../../data/knowledge/concepts.js';
import crypto from 'node:crypto';
import {documents,allowedLesson} from './knowledge.js';
export const now=()=>new Date().toISOString();
export function initialize(db){db.aiLearning ||= {version:1,profiles:{},mastery:{},attempts:{},projects:{},conversations:{},activity:{},telemetry:[]};return db.aiLearning;}
export function learner(db,user){const a=initialize(db),id=user.email;if(!Object.hasOwn(a.profiles,id))a.profiles[id]={goals:'',experience:'beginner',profession:'',minutesPerWeek:90,style:'simple',historyEnabled:false,createdAt:now(),updatedAt:now()};return a.profiles[id];}
export function eraseLearner(db,email){const a=initialize(db);for(const key of ['profiles','mastery','attempts','projects','conversations','activity','labs'])if(a[key])delete a[key][email];const owner=crypto.createHash('sha256').update(email).digest('hex').slice(0,20);a.traces=(a.traces||[]).filter(t=>t.owner!==owner);}
export function completed(user){return Object.values(user.course?.modules||{}).flatMap(m=>m.read||[]);}
export function history(db,user){const a=initialize(db),p=learner(db,user);if(!p.historyEnabled){delete a.conversations[user.email];return [];}
 const rows=(a.conversations[user.email]||[]).filter(r=>Date.now()-Date.parse(r.createdAt)<86400000).slice(-6);a.conversations[user.email]=rows;return rows;
}
export function remember(db,user,question,text){const a=initialize(db);if(!learner(db,user).historyEnabled)return;const rows=history(db,user);rows.push({question:question.slice(0,1000),answer:text.slice(0,2500),createdAt:now()});a.conversations[user.email]=rows.slice(-6);}
export function evidence(db,user,moduleId,correct,questionId){const a=initialize(db);a.mastery[user.email]||={};const m=a.mastery[user.email][moduleId]||{evidence:[],createdAt:now()};m.evidence.push({correct,questionId,at:now()});m.evidence=m.evidence.slice(-20);m.updatedAt=now();a.mastery[user.email][moduleId]=m;return masteryView(m);}
export function masteryView(m){
 const rows=(m.evidence||[]).slice(-20),unique=new Set(rows.map(x=>x.questionId)).size;
 const score=rows.length?Math.round(rows.filter(r=>r.correct).length/rows.length*100):null;
 // Repeated attempts on one item cannot create high confidence. Recency reduces stale evidence.
 const ages=rows.map(r=>Math.max(0,(Date.now()-Date.parse(r.at||m.updatedAt||new Date()))/86400000));
 const recency=ages.length?ages.reduce((n,d)=>n+Math.exp(-d/90),0)/ages.length:0;
 const confidence=Number((Math.min(1,unique/8)*Math.min(1,rows.length/8)*recency).toFixed(3));
 const recent=rows.slice(-5),previous=rows.slice(-10,-5),rate=rs=>rs.filter(r=>r.correct).length/rs.length;
 return {score,masteryScore:score===null?null:score/100,confidence,attempts:rows.length,distinctQuestions:unique,trend:previous.length>=3&&recent.length>=3?Number((rate(recent)-rate(previous)).toFixed(2)):null,status:rows.length<3||unique<3?'gathering_evidence':score>=80?'demonstrated':score<60?'needs_practice':'developing',updatedAt:m.updatedAt};
}
export function summary(db,user,lang='en'){
 const a=initialize(db),read=completed(user),concepts=Object.entries(a.mastery[user.email]||{}).map(([id,m])=>({id,title:documents.find(d=>d.lessonId===id)?.title[lang]||conceptById(id)?.title[lang]||id,...masteryView(m)}));
 const weak=concepts.filter(c=>c.status==='needs_practice');
 const next=documents.find(d=>weak.some(w=>w.id===d.lessonId)&&allowedLesson(user,d.lessonId))||documents.find(d=>!read.includes(d.lessonId)&&allowedLesson(user,d.lessonId));
 return {profile:learner(db,user),completedLessons:read,concepts,projects:a.projects[user.email]||[],activity:(a.activity[user.email]||[]).slice(-20),activeSeconds:(a.activity[user.email]||[]).reduce((n,r)=>n+r.seconds,0),courseQuizAttempts:Object.values(user.course?.modules||{}).reduce((n,m)=>n+(m.attempts||0),0),next:next?{lessonId:next.lessonId,title:next.title[lang],reason:weak.length?'review':'continue'}:null};
}
export const id=()=>crypto.randomUUID();
// Short-lived topic continuity. Holds only a concept id and a lesson title in memory, never the conversation itself.
const sessionTopics=new Map();
export function rememberTopic(user,{conceptId=null,title=null}={}){if(!conceptId&&!title)return;sessionTopics.set(user.email,{conceptId,title,at:Date.now()});if(sessionTopics.size>5000)sessionTopics.delete(sessionTopics.keys().next().value);}
export function sessionTopic(user){const t=sessionTopics.get(user.email);if(!t)return null;if(Date.now()-t.at>900000){sessionTopics.delete(user.email);return null;}return t;}
