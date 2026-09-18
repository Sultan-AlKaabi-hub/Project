import fs from 'node:fs';
import {PRESENTATION_TEACHING} from './presentation-teaching.js';
export const PRESENTATIONS=JSON.parse(fs.readFileSync(new URL('./presentation-slides.json',import.meta.url),'utf8'));
export const PRESENTATION_NOTES=PRESENTATIONS.flatMap(deck=>{
 const out=[];
 for(let i=0;i<deck.slides.length;i+=3){
  const group=deck.slides.slice(i,i+3).filter(s=>s.text.trim());if(!group.length)continue;
  const slides=group.map(s=>s.slide),label=slides.join(', '),original=group.map(s=>`[Slide ${s.slide}]\n${s.text}`).join('\n\n');
  const teaching=PRESENTATION_TEACHING.find(t=>PRESENTATIONS[t.deck].id===deck.id);
  out.push({id:`presentation-${deck.id}-${slides[0]}`,courseId:'ai',moduleId:'presentations',lessonId:null,deckId:deck.id,slides,file:deck.file,sourceLanguage:deck.language,title:{en:`${deck.title.en} · slides ${label}`,ar:`${deck.title.ar} · الشرائح ${label}`},topic:deck.title,difficulty:'beginner',contentType:'presentation',view:'knowledge',body:{en:`Supplied training slides (original language: ${deck.language}). Treat examples and numeric claims as teaching material, not verified live facts.\n${teaching?.foundation.en||''}\n${original}`,ar:`شرائح تدريب مقدمة (لغة الأصل: ${deck.language}). الأمثلة والأرقام مادة تعليمية وليست سجلات حية.\n${teaching?.foundation.ar||''}\n${original}`}});
 }
 return out;
});
export const PRESENTATION_CONCEPTS=PRESENTATION_TEACHING.map(t=>({...t,lessons:[],prerequisites:[],analogy:t.example,misconception:t.advanced,source:{deckId:PRESENTATIONS[t.deck].id,file:PRESENTATIONS[t.deck].file,slides:t.slides,title:PRESENTATIONS[t.deck].title}}));
