import crypto from 'node:crypto';
import {buildAgentContext,chooseStrategy,retrieveChunks,rewriteQuery,redact} from './context.js';
import {initialize} from './memory.js';
export const INTENTS=['EXPLAIN','SIMPLIFY','EXAMPLE','PRACTICE','CHALLENGE','PROJECT','PROGRESS','REVIEW','PATH','SIMULATION','BUILDER','RESEARCH','SUPPORT'];
export const intentAgent={PRACTICE:'practice',PROJECT:'project',PROGRESS:'progress',REVIEW:'review',PATH:'path',SIMULATION:'simulation',BUILDER:'builder',RESEARCH:'research',SUPPORT:'support'};
const owner=user=>crypto.createHash('sha256').update(user.email).digest('hex').slice(0,20);
export function prepare(db,user,input,language){
 const context=buildAgentContext(db,user,input,language),plan=chooseStrategy(input.question,context,input),tools=[];
 const call=(name,run)=>{const started=Date.now();const result=run();tools.push({name,status:'ok',latencyMs:Date.now()-started});return result;};
 call('learner_mastery',()=>context.mastery);
 call('prerequisites',()=>plan.weakPrerequisite);
 const query=rewriteQuery(input.question,context);
 // All tools are fixed server functions. Learner instructions cannot add tools or change identity.
 const noSearch=input.agent==='builder'&&!db.aiLearning.labs?.[user.email]?.config?.tools.includes('course_search');
 context.retrievedKnowledge=noSearch?[]:call('course_search',()=>retrieveChunks(query,context));
 return {context,plan,tools,query};
}
export function recordTrace(db,user,input,state,result,started,error=null){
 const a=initialize(db);a.traces||=[];
 // Full debug capture is an explicit admin action. Normal learner chats retain metadata only.
 const detailed=user.role==='admin'&&input.debug===true;
 const trace={schemaVersion:1,policyVersion:'2026-09-17',id:crypto.randomUUID(),owner:owner(user),createdAt:new Date().toISOString(),detailed,question:detailed?redact(input.question):'[content not retained]',intent:input.intent||result?.route?.intent,route:result?.route,plan:state.plan,learner:{level:state.context.learner.skillLevel,mastery:state.context.mastery},query:detailed?redact(state.query):null,retrieved:state.context.retrievedKnowledge.map(c=>({id:c.id,title:c.title,score:c.score,scores:c.scores,lessonId:c.lessonId,...(detailed?{content:c.content}: {})})),tools:state.tools,model:result?.model||'course-guided',response:detailed?redact(result?.text):null,latencyMs:Date.now()-started,error};
 a.traces=a.traces.filter(t=>Date.now()-Date.parse(t.createdAt)<86400000).slice(-199);a.traces.push(trace);return trace.id;
}
export function tracesForAdmin(db){return (initialize(db).traces||[]).filter(t=>Date.now()-Date.parse(t.createdAt)<86400000).map(({owner,...t})=>t);}
export function deleteTraces(db,user){const a=initialize(db);a.traces=(a.traces||[]).filter(t=>t.owner!==owner(user));}
export function reportDeviceResponse(db,user,id,text){
 const t=(initialize(db).traces||[]).find(t=>t.id===id&&t.owner===owner(user)&&Date.now()-Date.parse(t.createdAt)<600000);
 if(!t)return false;
 t.device={model:'Qwen3-0.6B',provenance:'unverified client report',response:t.detailed?redact(text):null};return true;
}
