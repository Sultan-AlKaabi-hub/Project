import {OPEN_SOURCE_NOTES} from '../../data/knowledge/open-source-notes.js';
import {CONCEPTS} from '../../data/knowledge/concepts.js';
import {REFERENCE_NOTES} from '../../data/knowledge/reference-notes.js';
import {LAB_NOTES} from '../../data/knowledge/lab-notes.js';
import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import { COURSE, LEVELS, lessonById, levelIndex } from '../curriculum.js';
const stop=new Set('the and for with that this from what how when why your are was not have into about does explain give example simply technically في من على إلى عن هذا هذه ماذا كيف التي الذي شرح اشرح مثال ما هي هو هل ماهي ماهو'.split(' '));
// Arabic normalization: unify alef/taa-marbuta/alef-maqsura variants and strip common clitic prefixes (ال، و، ب، ل، ف...) so "الشبكات" and "شبكة" share a stem.
export const normalizeArabic=w=>/[\u0600-\u06ff]/.test(w)?w.replace(/[\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة$/,'').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/^(?:وال|بال|كال|فال|لل|ال|و|ب|ل|ف|س)(?=.{3,})/,'').replace(/(?:ات|ون|ين|ها|هم)$/,(m,o,str)=>str.length-m.length>=3?'':m):w;
export const tokens=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\u064b-\u065f]/g,'').match(/[\p{L}\p{N}]{2,}/gu)?.map(normalizeArabic).filter(x=>x.length>=2&&!stop.has(x))||[];
export const documents=LEVELS.flatMap(level=>COURSE[level].modules.flatMap(m=>m.lessons.map(l=>({courseId:'ai',moduleId:m.id,lessonId:l.id,title:l.title,difficulty:level,topic:m.title,contentType:'lesson',body:l.body}))));
documents.push(...[...REFERENCE_NOTES,...LAB_NOTES,...OPEN_SOURCE_NOTES].map(d=>({...d,courseId:"ai",moduleId:"references",lessonId:null})));
documents.push(...CONCEPTS.flatMap(c=>['beginner','intermediate','expert'].map((difficulty,i)=>({id:c.id+'-'+difficulty,conceptId:c.id,courseId:'ai',moduleId:'concepts',lessonId:null,title:c.title,topic:c.title,difficulty,contentType:'concept',view:'knowledge',body:Object.fromEntries(['en','ar'].map(lang=>[lang,c[['foundation','application','advanced'][i]][lang]+' '+c.example[lang]+' '+c.misconception[lang]]))}))));
let index;
// Local latent semantic analysis: bilingual TF-IDF -> truncated SVD -> cosine vectors.
// Public course text only. No student record or message is embedded in the index.
function build(){
 const lists=documents.map(d=>tokens(Object.values(d.title).join(' ')+' '+Object.values(d.topic).join(' ')+' '+Object.values(d.body).join(' ')));
 const df=new Map();for(const list of lists)for(const word of new Set(list))df.set(word,(df.get(word)||0)+1);
 const vocab=[...df.keys()],positions=new Map(vocab.map((w,i)=>[w,i]));
 const idf=vocab.map(w=>Math.log((1+documents.length)/(1+df.get(w)))+1);
 const vector=text=>{const counts=new Map();for(const w of tokens(text))if(positions.has(w))counts.set(w,(counts.get(w)||0)+1);const v=Array(vocab.length).fill(0);for(const [w,n] of counts)v[positions.get(w)]=(1+Math.log(n))*idf[positions.get(w)];return v;};
 const rows=lists.map(list=>vector(list.join(' ')));
 const svd=new SingularValueDecomposition(new Matrix(rows).transpose(),{autoTranspose:true});
 const u=svd.leftSingularVectors,k=Math.min(24,svd.diagonal.filter(x=>x>1e-6).length);
 const embed=text=>{const v=vector(text),out=Array(k).fill(0);for(let i=0;i<v.length;i++)if(v[i])for(let j=0;j<k;j++)out[j]+=v[i]*u.get(i,j);const norm=Math.hypot(...out)||1;return out.map(x=>x/norm);};
 index={embed,vectors:lists.map(l=>embed(l.join(' ')))};return index;
}
export function embedCourse(text){return (index||build()).embed(text);}
export function allowedLesson(user,id){const hit=lessonById(id);return hit&&levelIndex(hit.module.level)<=levelIndex(user.level||'beginner')?hit:null;}
export function retrieve(question,user,{lessonId,lang='en',limit=3}={}){
 const idx=index||build(),q=idx.embed(question),terms=new Set(tokens(question));
 return documents.map((d,i)=>{const text=d.title[lang]+' '+d.body[lang],lexical=tokens(text).filter(x=>terms.has(x)).length;const semantic=idx.vectors[i].reduce((n,v,j)=>n+v*q[j],0);return {...d,score:Math.max(0,semantic)+Math.min(.25,lexical*.02)+(d.lessonId===lessonId?.toString()?1:0),lexical};})
 .filter(d=>levelIndex(d.difficulty)<=levelIndex(user.level||'beginner')&&(d.lessonId===lessonId||d.score>.22&&d.lexical>0)).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function source(d,lang){if(['lab','concept','open-source'].includes(d.contentType))return {title:d.title[lang],view:d.view,url:d.url,contentType:d.contentType};if(d.contentType==='reference')return {title:d.title[lang]+' · '+d.file+' · '+(lang==='ar'?'صفحة ':'page ')+d.pages.join(', '),view:d.view,contentType:d.contentType};return {lessonId:d.lessonId,moduleId:d.moduleId,courseId:d.courseId,title:d.title[lang],difficulty:d.difficulty,topic:d.topic[lang],contentType:d.contentType};}
