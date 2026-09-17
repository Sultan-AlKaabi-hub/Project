// Estimates use recorded attendance only. Missing observations are never absences.
export function attendanceTrend(rows,now=Date.now()){
 const cutoff=now-56*86400000,unique=new Map();
 for(const r of rows){const value=r.start||r.at,at=typeof value==='number'?value:Date.parse(value);if(!Number.isFinite(at)||at>now||at<cutoff||!['present','remote','late','absent'].includes(r.status))continue;unique.set(r.classId||at,{...r,time:at});}
 const data=[...unique.values()].sort((a,b)=>a.time-b.time),rate=xs=>xs.length?Math.round(100*xs.filter(r=>r.status!=='absent').length/xs.length):null;
 const recent=data.filter(r=>r.time>=now-28*86400000),prior=data.filter(r=>r.time<now-28*86400000),current=rate(recent),previous=rate(prior),enough=recent.length>=6&&prior.length>=6;
 const delta=enough?current-previous:null;
 return {records:data.length,recentRecords:recent.length,previousRecords:prior.length,currentRate:current,previousRate:previous,changePoints:delta,projection:enough?Math.max(0,Math.min(100,current+delta)):null,needsAttention:recent.length>=6&&(current<75||delta!==null&&delta<=-15),late:recent.filter(r=>r.status==='late').length};
}
export function adminInsights(db,user,lang='en'){
 if(user.role!=='admin')throw new Error('admin_required');
 const users=Object.values(db.users),students=users.filter(u=>u.role==='student'),teachers=users.filter(u=>u.role==='teacher');
 const classes=new Map((db.classes||[]).map(c=>[c.id,c]));
 const people=[...students,...teachers].map(u=>({name:u.name||u.email,role:u.role,isDemo:!!u.isDemo,...attendanceTrend((db.attendance||[]).filter(r=>r.email===u.email).map(r=>({...r,start:classes.get(r.classId)?.start||r.at})))}));
 return {students:students.length,teachers:teachers.length,testStudents:students.filter(u=>u.isDemo).length,people,method:lang==='ar'?'مقارنة آخر ٢٨ يوماً بالـ٢٨ السابقة. التوقع امتداد حسابي للتغير وليس احتمالاً أو حكماً. يلزم ستة سجلات في كل فترة. لا تُستنتج الغيابات من السجلات المفقودة.':'Compares the last 28 days with the previous 28. Projection extends the observed change; it is a scenario, not a probability or judgment. Requires six records in each period. Missing records are never counted as absence.'};
}
export function insightsAnswer(question,db,user,lang){
 if(!/how many students|student count|attendance.*(?:trend|predict|risk|improv|recommend|low|declin|poor|drop)|(?:trend|predict|risk|improv|recommend|low|declin|poor|drop).*attendance|كم.*طالب|عدد الطلاب|توقع.*حضور|اتجاه.*حضور|توصيات.*حضور|انخفاض.*الحضور/i.test(question))return null;
 const ar=lang==='ar';if(user.role!=='admin')return {text:ar?'إحصاءات المؤسسة متاحة للمسؤول فقط.':'Organization-wide insights are available to administrators only.',cards:[]};
 const d=adminInsights(db,user,lang),flagged=d.people.filter(p=>p.needsAttention);
 const text=ar?`عدد الطلاب ${d.students}، منهم ${d.testStudents} حسابات تجريبية. عدد المعلمين ${d.teachers}.`:`There are ${d.students} students, including ${d.testStudents} test accounts, and ${d.teachers} teachers.`;
 return {text,cards:[{type:'explanation',title:ar?'طريقة التحليل':'How the analysis works',text:d.method},...flagged.map(p=>({type:'explanation',title:p.name+(p.isDemo?' · DEMO':''),text:ar?`الحضور المسجل ${p.currentRate}% (${p.recentRecords} سجلات). تواصل بشكل داعم، وتحقق من صحة البيانات والعوائق، ثم اتفق على خطة متابعة. لا تتخذ إجراءً عقابياً تلقائياً.`:`Recorded attendance: ${p.currentRate}% (${p.recentRecords} records). ${p.projection===null?'Not enough history for a projection.':`If the same change continued: ${p.projection}% next period.`} Check data quality and barriers in a supportive conversation, then agree on a follow-up plan. Do not automate punitive decisions.`})),{type:'explanation',title:ar?'حدود البيانات':'Data limits',text:ar?`${d.people.filter(p=>!p.records).length} أشخاص دون سجلات حضور كافية؛ لا يمكن توقع حضورهم.`:`${d.people.filter(p=>!p.records).length} people have no recorded attendance; no trajectory is inferred for them. ${flagged.length? '':'No recorded trend meets the review threshold; this does not establish that everyone is doing well.'}`}],sources:[]};
}
