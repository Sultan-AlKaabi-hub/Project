import {documents,allowedLesson,embedCourse,tokens} from './knowledge.js';
import {summary,history,initialize,masteryView,sessionTopic} from './memory.js';
import {conceptFor,conceptById,CONCEPTS} from '../../data/knowledge/concepts.js';
import {projectFor} from './projects.js';
export const redact=text=>String(text||'').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[email]').replace(/(?:api[_ -]?key|password|secret|token)\s*[:=]\s*["']?[^\s"']+/gi,'[credential]').slice(0,5000);
const levelRank={beginner:0,intermediate:1,expert:2,advanced:2};
let chunks;
function chunkIndex(){
 if(chunks)return chunks;
 chunks=[];
 for(const d of documents){for(const lang of ['en','ar']){const sentences=String(d.body[lang]||'').match(/[^.!؟\n]+[.!؟]?/g)||[];let part='',number=0;const add=()=>{if(part.trim()){const content=part.trim();chunks.push({id:(d.lessonId||d.id||d.title.en)+':'+lang+':'+number++,courseId:d.courseId,moduleId:d.moduleId,lessonId:d.lessonId,conceptId:d.conceptId||conceptFor(d.title.en+' '+content)?.id||null,title:d.title[lang],content,difficulty:d.difficulty,sourceType:d.contentType,view:d.view,url:d.url,lang,vector:embedCourse(content+' '+d.title[lang])});}part='';};for(const sentence of sentences){if(part.length+sentence.length>700)add();part+=sentence+' ';}add();}}
 return chunks;
}
export function rewriteQuery(question,context){
 const vague=/\b(this|that|it|these|they|why|again)\b|هذا|هذه|ذلك|لماذا|مرة أخرى|ما فهمت/i.test(question);
 const topic=context.currentLesson?.title||context.sessionTopic;
 return (vague||/^(quiz me|challenge me|give an example|explain simply|اختبرني|تحدني|أعطني مثالاً)$/i.test(question.trim()))&&topic?`${topic}: ${question}`:question;
}
export function retrieveChunks(query,context,{limit=4}={}){
 const q=embedCourse(query),terms=new Set(tokens(query)),topic=conceptFor(query),rank=levelRank[context.learner.skillLevel]??0;
 return chunkIndex().filter(c=>c.lang===context.language&&(levelRank[c.difficulty]??0)<=rank&&(!context.currentCourse||c.courseId===context.currentCourse.id)).map(c=>{
  const overlap=tokens(c.title+' '+c.content).filter(t=>terms.has(t)).length,semantic=Math.max(0,c.vector.reduce((n,x,i)=>n+x*q[i],0));
  const lexical=Math.min(1,overlap/Math.max(3,terms.size)),lesson=c.lessonId===context.currentLesson?.id?1:0,concept=c.conceptId===topic?.id&&topic?1:0,level=c.difficulty===context.learner.skillLevel?1:0;
  const score=.5*semantic+.25*lexical+.12*lesson+.08*concept+.05*level;
  const {vector,...chunk}=c;return {...chunk,score:Number(score.toFixed(3)),scores:{semantic:Number(semantic.toFixed(3)),lexical,lesson,concept,level},overlap};
 }).filter(c=>c.overlap>0&&c.score>=.22).sort((a,b)=>b.score-a.score).slice(0,limit);
}
/** Builds only the authenticated learner's educational state; client-supplied mastery is ignored. */
export function buildAgentContext(db,user,input,lang){
 const s=summary(db,user,lang),hit=input.lessonId?allowedLesson(user,input.lessonId):null,a=initialize(db),recent=history(db,user);
 const conceptMastery=CONCEPTS.map(c=>{const entries=[a.mastery[user.email]?.[c.id],...c.lessons.map(id=>a.mastery[user.email]?.[id])].filter(Boolean);const evidence=entries.flatMap(m=>m.evidence||[]).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-20);return {conceptId:c.id,...masteryView({evidence,updatedAt:evidence.at(-1)?.at})};});
 const active=projectFor(db,user,input.projectId)||s.projects.find(p=>p.milestones.some(m=>!m.completed));
 const context={language:lang,currentCourse:{id:'ai',title:'AI learning'},currentModule:hit?{id:hit.module.id,title:hit.module.title[lang]}:null,currentLesson:hit?{id:hit.lesson.id,title:hit.lesson.title[lang],summary:hit.lesson.body[lang].slice(0,500),learningObjectives:[hit.lesson.title[lang]]}:null,view:input.view||null,learner:{skillLevel:user.level||'beginner',goals:[redact(s.profile.goals)].filter(Boolean),preferredExplanationStyle:s.profile.style,completedLessons:s.completedLessons,weakConcepts:conceptMastery.filter(m=>m.status==='needs_practice').map(m=>m.conceptId),strongConcepts:conceptMastery.filter(m=>m.status==='demonstrated'&&m.confidence>=.3).map(m=>m.conceptId)},mastery:conceptMastery,activeProject:active?{id:active.id,title:active.title,currentMilestone:active.milestones.find(m=>!m.completed)?.id,completedMilestones:active.milestones.filter(m=>m.completed).map(m=>m.id)}:null,recentInteractions:recent.slice(-3).map(r=>({question:redact(r.question),answer:redact(r.answer).slice(0,700)})),sessionTopic:conceptById(input.conceptId)?.title[lang]||(recent.length?conceptFor(recent.at(-1).question)?.title[lang]:null)||(sessionTopic(user)?(conceptById(sessionTopic(user).conceptId)?.title[lang]||sessionTopic(user).title):null),question:redact(input.question||'').slice(0,500),retrievedKnowledge:[]};
 if(hit&&typeof input.selection==='string'&&hit.lesson.body[lang].includes(input.selection))context.selectedText=input.selection.slice(0,1000);
 return context;
}
export function chooseStrategy(question,context,input){
 // A remembered topic only applies to vague follow-ups ('give me an example', 'why?'); a clear new question is judged on its own words.
 const vagueFollowUp=/\b(this|that|it|these|they|again|more|why|example|simpler|simply|understand)\b|هذا|هذه|ذلك|مرة أخرى|ما فهمت|لا أفهم|لم أفهم|مثال|أكثر|لماذا|ببساطة/i.test(question)||tokens(question).length<=2;
 const c=conceptFor(question)||conceptFor(context.currentLesson?.title||'')||(vagueFollowUp?conceptFor(context.sessionTopic||''):null),m=context.mastery.find(x=>x.conceptId===c?.id);
 const repeated=context.recentInteractions.filter(r=>r.question.toLowerCase()===question.toLowerCase()).length;
 const confused=/confus|don't (?:get|understand)|do not understand|makes no sense|لا أفهم|لم أفهم|ما فهمت|محتار/i.test(question)||m?.status==='needs_practice';
 let strategy=input.mode==='guided'?'SOCRATIC':input.intent==='EXAMPLE'||/example|مثال/i.test(question)?'WORKED_EXAMPLE':/difference|compare|فرق|قارن/i.test(question)?'COMPARE_AND_CONTRAST':/step.by.step|خطوة/i.test(question)?'STEP_BY_STEP':/visual|diagram|رسم|بصري/i.test(question)?'VISUAL_MENTAL_MODEL':/analogy|تشبيه/i.test(question)?'ANALOGY':/guarantee|always correct|يضمن|دائما صحيح/i.test(question)?'MISCONCEPTION_CORRECTION':'DIRECT_EXPLANATION';
 if(strategy==='DIRECT_EXPLANATION'&&context.learner.preferredExplanationStyle==='examples')strategy='WORKED_EXAMPLE';
 if(confused||repeated)strategy=repeated>=2?'DIAGNOSTIC':repeated===1?'WORKED_EXAMPLE':'ANALOGY';
 const weakPrerequisite=c?.prerequisites.map(id=>context.mastery.find(m=>m.conceptId===id)).find(m=>m&&m.attempts>=3&&m.score<60);
 const mastery=m?.confidence>=.3?m.masteryScore:null;
 const depth=input.intent==='SIMPLIFY'?'foundation':input.intent==='CHALLENGE'?'advanced':mastery!==null?(mastery<.3?'foundation':mastery>.7?'advanced':'application'):context.learner.skillLevel==='beginner'?'foundation':context.learner.skillLevel==='intermediate'?'application':'advanced';
 return {strategy,depth,conceptId:c?.id||null,confused,repeated,weakPrerequisite:weakPrerequisite?.conceptId||null,masteryUsed:mastery};
}
// The sentences that share the most terms with the question, kept in original order; falls back to the opening sentences.
export function focusedExcerpt(text,question,n=3){
 const q=new Set(tokens(question));
 const sents=String(text||'').match(/[^.!؟\n]+[.!؟]?/g)?.map(s=>s.trim()).filter(s=>s.length>20)||[];
 if(!sents.length)return String(text||'').slice(0,400);
 const scored=sents.map((s,i)=>({s,i,sc:tokens(s).reduce((a,w)=>a+(q.has(w)?1:0),0)}));
 const top=scored.slice().sort((a,b)=>b.sc-a.sc||a.i-b.i).slice(0,n);
 return (top[0]?.sc?top.sort((a,b)=>a.i-b.i):scored.slice(0,n)).map(x=>x.s).join(' ');
}
export function adaptiveTeaching(context,plan){
 const c=conceptById(plan.conceptId),lang=context.language,ar=lang==='ar',card=(type,title,text)=>({type,title,text});
 if(!context.retrievedKnowledge.length)return {text:ar?'لم أجد مقاطع موثوقة تدعم هذا السؤال في المعرفة المتاحة. افتح درساً مرتبطاً أو حدد المفهوم.':'I could not find supporting passages in the available knowledge. Open a related lesson or name the concept.',cards:[],supported:false};
 if(!c){const best=context.retrievedKnowledge[0];const excerpt=focusedExcerpt(context.retrievedKnowledge.slice(0,2).map(k=>k.content).join(' '),context.question||'',3);return {text:excerpt,cards:[card('explanation',best.title,excerpt),card('next',ar?'جرّب التطبيق':'Try applying it',ar?'ما الذي سيتغير إذا تغير أحد مدخلات هذا المثال؟':'What would change if one input in this example changed?')],supported:true};}
 const known=context.learner.strongConcepts.filter(id=>c.prerequisites.includes(id)).map(id=>conceptById(id)?.title[lang]);
 let text=c[plan.depth][lang],cards=[];
 if(known.length&&plan.depth!=='foundation')text=(ar?'بناءً على أدلة تدريبك في ':'Building on your practice evidence in ')+known.join(', ')+': '+text;
 if(plan.strategy==='ANALOGY')text=c.analogy[lang]+'\n\n'+c.foundation[lang];
 if(plan.strategy==='WORKED_EXAMPLE')text=c.example[lang]+'\n\n'+c[plan.depth][lang];
 if(plan.strategy==='MISCONCEPTION_CORRECTION')text=c.misconception[lang]+'\n\n'+c.example[lang];
 if(plan.strategy==='SOCRATIC'||plan.strategy==='DIAGNOSTIC')text=c.question[lang];
 if(plan.strategy==='STEP_BY_STEP'||plan.strategy==='VISUAL_MENTAL_MODEL')text=(c.id==='rag'?(ar?'سؤال → بحث في المستندات المسموحة → فحص المقاطع → إجابة مع دليل':'Question → permitted-document retrieval → passage check → evidence-based answer'):c.application[lang])+'\n\n'+c[plan.depth][lang];
 if(plan.strategy==='COMPARE_AND_CONTRAST')text=c.misconception[lang]+'\n\n'+c.application[lang];
 cards.push(card(plan.strategy==='SOCRATIC'?'hint':'explanation',c.title[lang],text));
 if(plan.weakPrerequisite){const p=conceptById(plan.weakPrerequisite);cards.push(card('hint',ar?'متطلب يحتاج مراجعة':'A prerequisite to revisit',p.foundation[lang]+'\n'+p.question[lang]));}
 if(!['SOCRATIC','DIAGNOSTIC','WORKED_EXAMPLE'].includes(plan.strategy))cards.push(card('example',ar?'مثال تطبيقي':'Concrete example',c.example[lang]));
 if(plan.depth==='application')cards.push(card('next',ar?'تحقق سريع':'Quick check',c.question[lang]));
 return {text,cards,supported:true};
}
