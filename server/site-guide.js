import crypto from 'node:crypto';
import {SITE_GUIDE,GUIDE_VERSION} from '../data/knowledge/site-guide.js';
import {hasAI} from './subjects.js';
export const guideRevision=crypto.createHash('sha256').update(JSON.stringify(SITE_GUIDE)).digest('hex').slice(0,12);
export const visibleGuide=u=>SITE_GUIDE.filter(d=>d.roles.includes(u.role||'student')&&(!d.ai||hasAI(u)));
const normalize=s=>String(s).toLowerCase().replace(/[أإآ]/g,'ا').replace(/[\u064b-\u065f]/g,'');
export function answerSite(question,u,lang='en'){
 if(!/(?:where|open|navigate|take me|which agents|what agents|face.?id|fingerprint|passkey|guide|booking|calendar|privacy|sign.?up|sign.?in|log.?in|settings|install|اين|أين|افتح|انتقل|الوكلاء|بصمة|مفتاح مرور|دليل|حجز|تقويم|خصوصية|تسجيل|إعدادات)/i.test(question))return null;
 const q=normalize(question),words=q.match(/[\p{L}\p{N}]+/gu)||[];
 const ranked=visibleGuide(u).map(d=>{const keys=normalize(d.keywords).split(' ');return{d,n:words.filter(w=>w.length>2&&keys.includes(w)).length};}).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
 const top=ranked[0]?.d;if(!top)return null;
 const text=top.body[lang==='ar'?'ar':'en'];return{route:{agent:'support',intent:'site_guide',confidence:.95,method:'rules'},lang,text,model:'site-guide',cards:[{type:'navigation',title:top.title[lang],text,view:top.view}],sources:[{title:top.title[lang],view:top.view,contentType:'site-guide',version:guideRevision}]};
}
export function installGuide(app,{requireUser}){app.get('/api/site-guide',requireUser,(req,res)=>res.json({version:GUIDE_VERSION,revision:guideRevision,pdf:'/guides/rasid-site-guide.pdf',sections:visibleGuide(req.user)}));}
