import {COURSE,LEVELS,moduleById,lessonById} from '../curriculum.js';
import {canView,roleOf} from '../portal.js';
import {subjectOf,hasAI} from '../subjects.js';

const normalize=s=>String(s||'').toLowerCase().replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[أإآ]/g,'ا').replace(/[\u064b-\u065f]/g,'');
const modules=LEVELS.flatMap(level=>COURSE[level].modules.map(m=>({...m,level})));
const lessons=modules.flatMap(module=>module.lessons.map(lesson=>({lesson,module})));
const ordinal=q=>q.replace(/\bfirst\b|الاول(?:ى)?/g,'1').replace(/\bsecond\b|الثاني(?:ة)?/g,'2').replace(/\bthird\b|الثالث(?:ة)?/g,'3');

// Deterministic, read-only aggregation. Never send organization records to a model.
export function progressInsights(question,db,user,lang='en',context={}){
 const q=ordinal(normalize(question)),ar=lang==='ar';
 const outcome=/\b(pass(?:ed)?|fail(?:ed)?|complet(?:ed|ion|e)|finish(?:ed)?|read|results?|scores?|progress)\b|اجتاز|نجح|نجاح|اكمل|انه[ىي]|اتم|قر[اى]|رسب|نتائج|تقدم/.test(q);
 const people=/\bstudents?\b|\blearners?\b|\bhow many\b|\bnumber of\b|طلاب|طالب|طلبة|متعلمين|كم|عدد/.test(q);
 if(!outcome||!people)return null;
 const respond=(text,extra={})=>({text,cards:[],sources:[],intent:'student_progress',...extra});
 if(!['admin','teacher'].includes(roleOf(user))||!hasAI(user))return respond(ar?'إحصاءات الطلاب متاحة للمسؤول ولمعلم الذكاء الاصطناعي لطلابه المسندين فقط.':'Student statistics are available to administrators and AI teachers for their assigned students only.');
 if(/yesterday|last week|last month|today|since|امس|اليوم|الاسبوع|منذ/.test(q))return respond(ar?'السجلات الحالية تعرض التقدم التراكمي. لا يمكنني إعطاء عدد دقيق لهذه الفترة من سجلات القراءة الحالية. حدد الدرس للحصول على العدد التراكمي.':'These progress records describe cumulative completion. I cannot give an accurate count for that time period from the current reading records. Ask for a lesson’s cumulative results.');
 const modQuery=/\bmodule\b|وحد[ةه]/.test(q),lessonQuery=/\blesson\b|درس/.test(q);
 let selectedModule,selectedLesson,assumption='';
 const id=q.match(/\b[bie]\d+(?:-\d+)?\b/)?.[0];
 const level=/intermediate|متوسط/.test(q)?'intermediate':/advanced|expert|متقدم|خبير/.test(q)?'expert':/beginner|مبتدئ/.test(q)?'beginner':null;
 if(id){if(id.includes('-')){const hit=lessonById(id);selectedModule=hit?.module;selectedLesson=hit?.lesson;}else selectedModule=moduleById(id);}
 else {
  const number=lessonQuery?(q.match(/(?:lesson|الدرس|درس)\s*(?:number|رقم|#)?\s*(\d+)/)||q.match(/\b(\d+)\s+lesson/)):(q.match(/(?:module|الوحدة|الوحده|وحدة|وحده)\s*(?:number|رقم|#)?\s*(\d+)/)||q.match(/\b(\d+)\s+module/));
  const n=number?Number(number[1]||number[2]):null;
  const namedLesson=lessons.find(x=>Object.values(x.lesson.title).some(t=>q.includes(normalize(t))));
  const namedModule=modules.find(x=>Object.values(x.title).some(t=>q.includes(normalize(t))));
  if(n!==null){
   if(modQuery&&!lessonQuery){selectedModule=(level?modules.filter(m=>m.level===level):modules)[n-1];}
   else {const explicitModule=q.match(/(?:module|الوحدة|وحدة)\s*(\d+)/);const cm=explicitModule?(level?modules.filter(m=>m.level===level):modules)[Number(explicitModule[1])-1]:moduleById(context.moduleId)||lessonById(context.lessonId)?.module;
    const pool=cm?cm.lessons.map(lesson=>({lesson,module:cm})):level?lessons.filter(x=>x.module.level===level):lessons;
    const hit=pool[n-1];selectedModule=hit?.module;selectedLesson=hit?.lesson;
    if(!cm&&!level)assumption=ar?'الترقيم حسب ترتيب المسار الكامل.':'Numbering follows the full course order.';
   }
  }else if(namedLesson){selectedModule=namedLesson.module;selectedLesson=namedLesson.lesson;}
  else if(namedModule)selectedModule=namedModule;
  else if(/this lesson|current lesson|هذا الدرس/.test(q)){const hit=lessonById(context.lessonId);selectedModule=hit?.module;selectedLesson=hit?.lesson;}
 }
 if(!selectedModule)return respond(ar?'أي درس أو وحدة تقصد؟ اذكر الرقم أو العنوان، مثل «كم طالباً اجتاز الوحدة 1؟».':'Which lesson or module do you mean? Give its number or title, for example “How many students passed module 1?”');
 if(/\bfail(?:ed)?\b|رسب/.test(q))return respond(ar?'عدم الإكمال لا يعني الرسوب. اسأل عن اجتياز اختبار الوحدة أو إكمال قراءة الدرس للحصول على الأعداد المسجلة.':'Incomplete work is not a failure. Ask for module quiz passes or lesson reading completion to get the recorded counts.');
 const realOnly=/real (?:students|accounts)|exclude (?:test|demo)|excluding (?:test|demo)|without (?:test|demo)|حقيقي|بدون.*تجريب|استبعاد.*تجريب/.test(q);
 const demoOnly=/test (?:students|accounts) only|demo (?:students|accounts) only|only (?:test|demo)|تجريب.*فقط/.test(q);
 const students=Object.values(db.users||{}).filter(u=>roleOf(u)==='student'&&subjectOf(u)==='ai'&&canView(user,u)&&(!realOnly||!u.isDemo)&&(!demoOnly||u.isDemo));
 const state=u=>u.course?.modules?.[selectedModule.id];
 const passed=students.filter(u=>state(u)?.passed===true&&(!state(u).byPlacement||(u.certs||[]).some(c=>c.moduleId===selectedModule.id&&c.score>=4)));
 const placement=students.filter(u=>state(u)?.passed===true&&state(u).byPlacement&&!passed.includes(u));
 const read=selectedLesson?students.filter(u=>state(u)?.read?.includes(selectedLesson.id)):[];
 const demos=xs=>xs.filter(u=>u.isDemo).length;
 const title=(selectedLesson||selectedModule).title[ar?'ar':'en'];
 const text=selectedLesson?(ar?`الدرس «${title}» (${selectedLesson.id}): أكمل ${read.length} من ${students.length} طالباً قراءته، منهم ${demos(read)} حسابات تجريبية. لا يوجد نجاح أو رسوب منفصل لهذا الدرس؛ يُقيَّم النجاح باختبار الوحدة. اجتاز ${passed.length} طالباً اختبار الوحدة «${selectedModule.title.ar}»، منهم ${demos(passed)} تجريبيون.`:`Lesson “${title}” (${selectedLesson.id}): ${read.length} of ${students.length} students have completed the reading, including ${demos(read)} test accounts. This lesson has no separate pass/fail result; passing is assessed by the module quiz. ${passed.length} students passed the “${selectedModule.title.en}” module quiz, including ${demos(passed)} test accounts.`):(ar?`اجتاز ${passed.length} من ${students.length} طالباً اختبار الوحدة «${title}» (${selectedModule.id})، منهم ${demos(passed)} حسابات تجريبية.`:`${passed.length} of ${students.length} students passed the “${title}” module quiz (${selectedModule.id}), including ${demos(passed)} test accounts.`);
 const scope=roleOf(user)==='teacher'?(ar?'طلابك المسندون فقط.':'Your assigned students only.'):(ar?'طلاب مسار الذكاء الاصطناعي ضمن الفلتر المحدد.':'AI students within the requested account filter.');
 return respond(text,{counts:{students:students.length,read:read.length,passed:passed.length,placement:placement.length,testPassed:demos(passed),testRead:demos(read)},lessonId:selectedLesson?.id,moduleId:selectedModule.id,cards:[{type:'explanation',title:ar?'نطاق الأعداد':'What these counts mean',text:`${scope} ${assumption} ${ar?`${placement.length} اجتازوا بالتسكين فقط، ولا يُعدّون نجاحاً في الاختبار. السجلات المفقودة لا تُعد رسوباً.`:`${placement.length} students have placement-only credit, excluded from quiz passes. Missing records are not failures.`}`}],sources:[{title,view:'course',...(selectedLesson?{lessonId:selectedLesson.id}:{}),moduleId:selectedModule.id,contentType:'authorized-progress'}]});
}
