/** @typedef {{agent:string,intent:string,confidence:number,method:string}} Route */
export const ACTIVE=['tutor','practice','project','progress','research','support'];
export function route(question,{agent='auto',mode='direct'}={}){
 if(ACTIVE.includes(agent))return {agent,intent:'manual',confidence:1,method:'manual'};
 const rules=[['research','current_news',/latest|recent|news|current developments|أخبار|اخبار|آخر المستجدات|حديثا|حديثاً/i],['practice','assessment',/quiz me|test me|practice|challenge me|اختبرني|تدريب|تمرن|تحدي|تحدني/i],['project','build_project',/build|project|milestone|implementation|مشروع|ابني|بناء|تنفيذ/i],['progress','next_step',/learn next|my progress|weakness|roadmap|learning path|تقدمي|ماذا أتعلم|مسار تعلم|نقاط ضعفي/i],['support','site_help',/booking|book |appointment|privacy|password|all user|student scores|حجز|موعد|خصوصية|كلمة مرور|درجات الطلاب/i]];
 for(const [agent,intent,re] of rules)if(re.test(question))return {agent,intent,confidence:.95,method:'rules'};
 return {agent:'tutor',intent:mode==='guided'?'guided_learning':'concept_explanation',confidence:.6,method:'default'};
}
