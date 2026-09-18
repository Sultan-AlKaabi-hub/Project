import {intentAgent,INTENTS} from './orchestration.js';
/** @typedef {{agent:string,intent:string,confidence:number,method:string}} Route */
export const ACTIVE=['tutor','practice','project','progress','research','support','review','path','simulation','builder'];
const explanatory=/^\s*(?:what|how|why|explain|describe|define|is|are|does|do|can|ما|ماذا|كيف|لماذا|اشرح|هل|عرّف|عرف)\b/i;
export function route(question,{agent='auto',mode='direct',intent}={}){
 if(ACTIVE.includes(agent))return {agent,intent:'manual',confidence:1,method:'manual'};
 if(INTENTS.includes(intent))return {agent:intentAgent[intent]||'tutor',intent,confidence:1,method:'action'};
 const rules=[['review','code_review',/review.*code|code.*(?:bug|error|review)|python.*work|راجع.*كود|خطأ.*كود/i],['path','learning_path',/learning path|roadmap|مسار تعلم/i],['simulation','role_play',/simulation|role.?play|skeptical CTO|محاكاة/i],['builder','agent_builder',/build.*agent|agent builder|بناء.*وكيل/i],['research','current_news',/latest|recent|news|current developments|أخبار|اخبار|آخر المستجدات|حديثا|حديثاً/i],['practice','assessment',/quiz me|test me|practice|challenge me|اختبرني|تدريب|تمرن|تحدي|تحدني/i],['project','build_project',/project|milestone|مشروع|(?:help me|let'?s|want to|ساعدني|أريد)\s+(?:build|implement|ابني|بناء|تنفيذ)/i],['progress','next_step',/learn next|my progress|weakness|roadmap|learning path|تقدمي|ماذا أتعلم|مسار تعلم|نقاط ضعفي/i],['support','site_help',/booking|book |appointment|privacy|password|all user|student scores|حجز|موعد|خصوصية|كلمة مرور|درجات الطلاب/i]];
 for(const [agent,intent,re] of rules)if(re.test(question)){if(agent==='project'&&explanatory.test(question)&&!/project|مشروع/i.test(question))continue;return {agent,intent,confidence:.95,method:'rules'};}
 if(/\b(?:build|implement|create)\b|ابني|بناء|تنفيذ/i.test(question)&&!explanatory.test(question))return {agent:'project',intent:'build_project',confidence:.8,method:'rules'};
 return {agent:'tutor',intent:mode==='guided'?'guided_learning':'concept_explanation',confidence:.6,method:'default'};
}
