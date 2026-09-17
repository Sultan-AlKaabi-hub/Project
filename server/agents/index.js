import {adminInsights} from './attendance-insights.js';
import {installAgentLab} from './laboratory.js';
import {flush} from "../db.js";
import {hasAI} from '../subjects.js';
import {initialize,learner,summary,eraseLearner,now} from './memory.js';
import {allowedLesson} from './knowledge.js';
import {gradePractice} from './practice.js';
import {createProject,updateMilestone,projectTypes,localizeProject} from './projects.js';
import {respond} from './service.js';
import {ACTIVE} from './router.js';
import {newsApiStatus} from '../pipeline/newsapi.js';
import {provider} from './provider.js';
export function installAgents(app,{db,save,requireUser,getArticle=()=>null}){
 initialize(db);const buckets=new Map(),active=new Set();
 app.use('/api/agents',requireUser,(req,res,next)=>hasAI(req.user)?next():res.status(403).json({error:'subject_restricted'}));
 app.use('/api/agents',(req,res,next)=>{if(req.method==='GET')return next();const key=req.user.email,now=Date.now();let b=buckets.get(key);if(!b||b.until<now){b={until:now+60000,n:0};buckets.set(key,b);}if(++b.n>15){res.set('Retry-After','60');return res.status(429).json({error:'rate_limited'});}for(const [k,v]of buckets)if(v.until<now)buckets.delete(k);next();});
 const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){if(!res.headersSent)res.status(400).json({error:['lesson_unavailable','attempt_not_found','attempt_expired','invalid_answer','project_not_found','invalid_submission','unknown_project','project_limit'].includes(e.message)?e.message:'invalid_request'});}};
 app.get('/api/agents/profile',(req,res)=>res.json({...summary(db,req.user,req.user.lang||'en'),projects:(db.aiLearning.projects[req.user.email]||[]).map(p=>localizeProject(p,req.user.lang||'en')),capabilities:{generative:provider.enabled,agents:ACTIVE,projects:projectTypes,newsApi:newsApiStatus(),retrieval:'bilingual-latent-semantic-analysis',historyRetentionHours:24}}));
 app.post('/api/agents/profile',wrap((req,res)=>{
  const body=req.body;if(typeof body.goals!=='string'||body.goals.length>500||!['beginner','some','experienced'].includes(body.experience)||!['simple','technical','examples'].includes(body.style)||!Number.isInteger(body.minutesPerWeek)||body.minutesPerWeek<15||body.minutesPerWeek>2400||typeof body.historyEnabled!=='boolean')throw new Error('invalid_profile');
  const p=learner(db,req.user);Object.assign(p,{goals:body.goals,experience:body.experience,style:body.style,minutesPerWeek:body.minutesPerWeek,historyEnabled:body.historyEnabled,updatedAt:now()});if(!p.historyEnabled)delete db.aiLearning.conversations[req.user.email];save();res.json({profile:p});
 }));
 app.post('/api/agents/profile/reset',(req,res)=>{eraseLearner(db,req.user.email);save();res.json({ok:true});});
 app.get('/api/agents/export',(req,res)=>{const a=initialize(db),id=req.user.email;res.json({profile:a.profiles[id]||null,mastery:a.mastery[id]||{},practice:a.attempts[id]||[],projects:a.projects[id]||[],conversations:a.conversations[id]||[],activity:a.activity[id]||[],lab:a.labs?.[id]||null});});
 app.post('/api/agents/activity',wrap((req,res)=>{const {lessonId,seconds}=req.body;if(!allowedLesson(req.user,lessonId)||!Number.isInteger(seconds)||seconds<1||seconds>60)throw new Error('invalid_activity');const a=initialize(db);a.activity[req.user.email]||=[];const rows=a.activity[req.user.email],last=rows.at(-1);if(last&&Date.now()-Date.parse(last.createdAt)<seconds*800)throw new Error('activity_too_fast');rows.push({lessonId,seconds,createdAt:now()});a.activity[req.user.email]=rows.slice(-200);save();res.json({ok:true});}));
 app.post('/api/agents/practice/:id/answer',wrap((req,res)=>{const result=gradePractice(db,req.user,req.params.id,req.body.answer);save();res.json(result);}));
 app.post('/api/agents/projects',wrap((req,res)=>{const project=createProject(db,req.user,req.body.type,req.user.lang||'en');save();res.status(201).json({project});}));
 app.post('/api/agents/projects/:id/milestones/:mid',wrap((req,res)=>{const project=updateMilestone(db,req.user,req.params.id,req.params.mid,req.body.submission,req.body.completed);save();res.json({project});}));
 app.get('/api/agents/metrics',(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({error:'admin_required'});res.json({events:initialize(db).telemetry});});
 app.get('/api/agents/insights',(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({error:'admin_required'});res.json({...adminInsights(db,req.user,req.user.lang||'en'),classes:(db.classes||[]).filter(c=>c.status!=='cancelled'&&c.start<Date.now()).slice(-100).map(c=>({id:c.id,title:c.title,host:c.host,start:c.start}))});});
 installAgentLab(app,{db,save});
 app.post('/api/agents/chat',async(req,res)=>{
  const body=req.body;
  if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({error:'invalid_request'});
  if(typeof body.question!=='string'||!body.question.trim()||body.question.length>4000||body.agent&&!['auto',...ACTIVE].includes(body.agent)||body.mode&&!['direct','guided'].includes(body.mode)||body.selection&&(typeof body.selection!=='string'||body.selection.length>1000)||body.lessonId&&!allowedLesson(req.user,body.lessonId))return res.status(400).json({error:'invalid_context'});
  if(active.has(req.user.email))return res.status(429).json({error:'request_in_progress'});
  active.add(req.user.email);const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
  const streaming=req.get('accept')?.includes('text/event-stream');
  if(streaming){res.set({'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-store','X-Accel-Buffering':'no'});res.flushHeaders();}
  const send=(event,data)=>{if(streaming&&!res.destroyed)res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);};
  const timer=streaming?setInterval(()=>send('ping',{}),15000):null;
  try{const result=await respond(db,req.user,body,{signal:controller.signal,article:body.useArticle?getArticle(req.user):null,onStatus:r=>send('route',r),onText:text=>send('delta',{text})});save();await flush();if(streaming){send('result',result);res.end();}else res.json(result);}
  catch{if(!controller.signal.aborted){if(streaming){send('error',{error:'assistant_unavailable'});res.end();}else res.status(503).json({error:'assistant_unavailable'});}}
  finally{clearInterval(timer);active.delete(req.user.email);}
 });
 const cleanup=setInterval(()=>{let changed=false;for(const [key,rows]of Object.entries(db.aiLearning.conversations)){const kept=rows.filter(r=>Date.now()-Date.parse(r.createdAt)<86400000);if(kept.length!==rows.length){db.aiLearning.conversations[key]=kept;changed=true;}}if(changed)save();},3600000);cleanup.unref();
}
