import {documents,allowedLesson,retrieve,tokens} from './knowledge.js';
import {learner,summary,initialize} from './memory.js';

export const LAB_AGENTS=['review','path','simulation','builder'];
const C=(title,text)=>({type:'explanation',title,text});
export function reviewCode(code,ar=false){
 const checks=[
  [/\beval\s*\(|new Function\s*\(/,'Dynamic code execution','Untrusted input can become executable code.','Use a parser with a fixed allowlist.','JSON.parse(text)','Code and data boundaries'],
  [/innerHTML\s*=|dangerouslySetInnerHTML/,'HTML injection risk','User or model text may contain executable markup.','Render plain text or use a maintained HTML sanitizer.','element.textContent = response','Output encoding'],
  [/shell\s*=\s*True|execSync\s*\(|os\.system\s*\(/,'Shell execution risk','Interpolated input may become a shell command.','Use a fixed executable and validated argument array without a shell.','spawn("python", [validatedFile], {shell: false})','Command injection'],
  [/SELECT[\s\S]{0,160}(?:\$\{|\+|%s)|execute\s*\(\s*f["']/i,'Possible SQL interpolation','String construction can mix SQL and untrusted values.','Use database parameters; verify the driver syntax.','db.query("SELECT * FROM users WHERE id = $1", [id])','Parameterized queries'],
  [/api[_-]?key\s*[:=]\s*["'][^"']{8,}|password\s*=\s*["'][^"']+["']/i,'Possible embedded credential','Source code and browser bundles are not secret stores.','Remove the value, rotate exposed credentials, and use server environment settings.','process.env.PROVIDER_API_KEY','Secret management'],
  [/except\s*:\s*(?:pass|return)|catch\s*\([^)]*\)\s*\{\s*\}/,'Silent error handling','Failures can look like successful work.','Handle expected errors and return an explicit failure state.','catch (error) { return {ok: false}; }','Observable failures']
 ];
 const arabic=[['تنفيذ ديناميكي للكود','قد تتحول المدخلات غير الموثوقة إلى شيفرة قابلة للتنفيذ.','استخدم محللاً بعمليات مسموحة محددة.','الفصل بين الكود والبيانات'],['خطر حقن HTML','قد يتضمن نص المستخدم أو النموذج ترميزاً قابلاً للتنفيذ.','اعرض النص مباشرة أو استخدم أداة تنقية موثوقة.','ترميز المخرجات'],['خطر تنفيذ أوامر النظام','قد تتحول المدخلات إلى أوامر للنظام.','استخدم برنامجاً ثابتاً ومعاملات متحققاً منها دون صدفة أوامر.','حقن الأوامر'],['احتمال تركيب SQL من النص','قد تختلط القيم غير الموثوقة بأوامر قاعدة البيانات.','استخدم معاملات قاعدة البيانات وتحقق من صيغة المشغل.','الاستعلامات ذات المعاملات'],['احتمال وجود بيانات اعتماد','الشيفرة وملفات المتصفح ليست مخزناً للأسرار.','احذف القيمة وغيّر أي مفتاح مكشوف واستخدم إعدادات الخادم.','إدارة الأسرار'],['تجاهل الأخطاء','قد يبدو الفشل كأنه نجاح.','عالج الأخطاء المتوقعة وأرجع حالة فشل واضحة.','رصد الفشل']];
 const findings=checks.map((c,i)=>ar?[c[0],...arabic[i].slice(0,3),c[4],arabic[i][3]]:c).filter(([r])=>r.test(code));
 return {text:ar?'مراجعة أنماط ثابتة؛ لم يُنفّذ الكود. النتائج احتمالات تحتاج التحقق وليست تدقيقاً شاملاً.':'Static pattern review; code was not executed. Findings need verification and are not a comprehensive audit.',cards:findings.map(([,p,w,f,e,c])=>C(p,`${ar?'المشكلة':'Problem'}: ${p}\n${ar?'السبب':'Why'}: ${w}\n${ar?'الإصلاح':'Fix'}: ${f}\n${ar?'مثال':'Example'}:\n\`\`\`\n${e}\n\`\`\`\n${ar?'مفهوم للتعلم':'Concept to learn'}: ${c}`)).concat(C(ar?'اختبر فرضيتك':'Test your hypothesis',findings.length?(ar?'أضف اختباراً يفشل وطبق تغييراً واحداً ثم اختبر الحدود والمدخلات غير الصالحة.':'Add a failing test, apply one change, then test boundary and invalid inputs.'):(ar?'لم يظهر نمط خطر معروف. هذا لا يثبت صحة الكود. قدم النتيجة المتوقعة والفعلية واختباراً صغيراً يفشل.':'No configured risk pattern matched. This does not prove correctness. Provide expected output, actual output, and a minimal failing test.')))};
}
export function roadmap(db,user,lang='en'){
 const p=learner(db,user),s=summary(db,user,lang),terms=tokens(p.goals),weak=new Set(s.concepts.filter(c=>c.status==='needs_practice').map(c=>c.id));
 const lessons=documents.filter(d=>d.lessonId&&allowedLesson(user,d.lessonId)&&(!s.completedLessons.includes(d.lessonId)||weak.has(d.lessonId)));
 const ranked=lessons.map((d,i)=>({d,i,score:weak.has(d.lessonId)?100:terms.filter(t=>tokens(d.title[lang]+' '+d.body[lang]).includes(t)).length})).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,8);
 return ranked.map(({d,score},i)=>({type:'next',title:d.title[lang],lessonId:d.lessonId,text:lang==='ar'?`الأسبوع ${1+Math.floor(i*30/p.minutesPerWeek)} · ٣٠ دقيقة تقديرية · ${score>=100?'مراجعة مبنية على التدريب':'متاح لمستواك وأهدافك'}`:`Week ${1+Math.floor(i*30/p.minutesPerWeek)} · estimated 30 minutes · ${score>=100?'review based on practice evidence':'available for your level and goals'}`}));
}
const prompts={en:['I am your skeptical CTO. Propose one AI use case, the user, and a measurable business outcome.','What non-AI baseline will you compare with, and what would make you reject the AI approach?','What data do you need, whose permission is required, and how will you limit sensitive information?','Describe a failure scenario, an evaluation metric, and a human escalation path.','Explain cost limits, monitoring, and a small pilot before rollout.'],ar:['أنا المدير التقني المتشكك. اقترح استخداماً واحداً للذكاء الاصطناعي ومستخدماً ونتيجة قابلة للقياس.','ما البديل دون ذكاء اصطناعي؟ ومتى سترفض الحل المقترح؟','ما البيانات المطلوبة؟ ومن يوافق على استخدامها؟ وكيف تحمي المعلومات الحساسة؟','صف حالة فشل ومقياس تقييم وطريقة تصعيد إلى إنسان.','اشرح حدود التكلفة والمراقبة وتجربة صغيرة قبل الإطلاق.']};
export function laboratoryAnswer(db,user,input,lang){
 const ar=lang==='ar',a=initialize(db);a.labs||={};const state=a.labs[user.email]||={simulation:{turn:0,answers:[]},config:null};
 if(input.agent==='review')return reviewCode(input.question,ar);
 if(input.agent==='path')return {text:ar?'مسارك يتحدث حسب أهدافك ووقتك وسجل التدريب. عدّل الملف التعليمي لتخصيصه.':'Your roadmap adapts to your goals, study time, and practice evidence. Edit your learning profile to personalize it.',cards:roadmap(db,user,lang)};
 if(input.agent==='simulation'){
  const s=state.simulation;s.answers=s.answers.slice(0,5);
  if(/^(reset|restart|start|ابدأ|إعادة)$/i.test(input.question.trim())){s.turn=0;s.answers=[];}
  else if(s.turn>0&&s.turn<=5&&s.answers.length<s.turn)s.answers.push(input.question.slice(0,2000));
  if(s.turn>=5){const text=ar?'انتهت المحاكاة. راجع إجاباتك حسب: نتيجة قابلة للقياس، بديل بسيط، موافقة البيانات، اختبار الفشل، وخطة المراقبة. لا تمثل هذه القائمة درجة آلية لجودة إجابتك.':'Simulation complete. Review your answers against: measurable outcome, simple baseline, data consent, failure test, and monitoring plan. This checklist is not an automated quality grade.';return {text,cards:[C(ar?'مراجعة ذاتية':'Debrief',text),...s.answers.map((x,i)=>{const checks=[/metric|measure|percent|\d|قياس|نسبة|دقيقة/i,/baseline|manual|without|search|بديل|يدوي|دون/i,/consent|permission|privacy|personal|موافق|خصوص|إذن/i,/fail|error|test|escalat|فشل|خطأ|اختبار|تصعيد/i,/cost|budget|monitor|pilot|تكلف|ميزان|مراقب|تجرب/i],hints=ar?['اذكر مقياس نجاح وقيمة مستهدفة قابلة للاختبار.','حدد بديلاً دون ذكاء اصطناعي وقارنه بالحل.','وضح الموافقة وتقليل البيانات وسياسة الاحتفاظ.','أضف اختبار فشل ومسار تصعيد بشري.','حدد سقف تكلفة وتجربة صغيرة ومراقبة.']:['Name a measurable success metric and a target you can test.','Specify a non-AI baseline and compare it with your proposal.','Explain consent, data minimization and retention.','Add a failure test and a human escalation path.','Set a cost cap, a small pilot and monitoring.'];return C(prompts[lang][i],x+'\n\n'+(checks[i].test(x)?(ar?'ظهرت كلمات مرتبطة بالمحور؛ تحقق من أن إجابتك محددة وقابلة للاختبار. ليست هذه درجة جودة.':'Topic-related words were found; verify that your answer is specific and testable. This is not a quality grade.'):(ar?'اقتراح للتحسين: ':'Improvement prompt: ')+hints[i]));})]};}
  const text=prompts[lang][s.turn++];return {text,cards:[C(ar?'محاكاة المدير التقني':'CTO simulation',text)]};
 }
 const config=state.config;
 if(!config)return {text:ar?'احفظ إعداد وكيلك في مختبر الوكلاء أولاً.':'Save your agent configuration in Agent Lab first.',cards:[]};
 const refs=config.tools.includes('course_search')?retrieve(input.question,user,{lang,limit:2}):[];
 const text=ar?`اختبار الوكيل «${config.name}». يعمل محلياً باسترجاع المحتوى المسموح؛ التعليمات المخصصة لا تمنح صلاحيات إضافية.`:`Testing “${config.name}”. This free mode retrieves permitted learning content; custom instructions grant no extra permissions.`;
 return {text,cards:[C(config.name,text),...refs.map(d=>({...C(d.title[lang],d.body[lang]),lessonId:d.lessonId})),...(!refs.length?[C(ar?'لا توجد نتيجة':'No match',ar?'أعد صياغة السؤال أو فعّل البحث في الدروس.':'Rephrase your question or enable course search.')]:[])]};
}
export function installAgentLab(app,{db,save}){
 app.get('/api/agents/lab',(req,res)=>{const a=initialize(db);res.json({config:a.labs?.[req.user.email]?.config||null,roadmap:roadmap(db,req.user,req.user.lang||'en')});});
 app.post('/api/agents/lab/config',(req,res)=>{
  const b=req.body;if(typeof b.name!=='string'||!b.name.trim()||b.name.length>60||typeof b.instructions!=='string'||b.instructions.length>2000||!Array.isArray(b.tools)||b.tools.some(t=>t!=='course_search'))return res.status(400).json({error:'invalid_config'});
  const a=initialize(db);a.labs||={};a.labs[req.user.email]||={simulation:{turn:0,answers:[]}};a.labs[req.user.email].config={name:b.name.trim(),instructions:b.instructions,tools:[...new Set(b.tools)],model:'course-retrieval',updatedAt:new Date().toISOString()};save();res.json({ok:true});
 });
}
