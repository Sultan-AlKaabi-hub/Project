import {hasAI} from './subjects.js';
import {REFERENCE_NOTES,REFERENCE_STATUS,REFERENCE_QUESTIONS} from '../data/knowledge/reference-notes.js';
import '../public/js/experiment-model.js';
export function createBookLookup(fetcher=fetch){
 const cache=new Map();let next=0;
 return async function lookup(query){
  const key=query.trim().normalize('NFKC');if(key.length<2||key.length>160)throw Error('invalid_query');
  const hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.books;
  if(Date.now()<next)throw Error('catalogue_busy');next=Date.now()+1100;
  const code=globalThis.ExperimentModel.isbn(key);if(/^[\dXx\s-]+$/.test(key)&&!code)throw Error('invalid_isbn');
  const url=new URL('https://openlibrary.org/search.json');url.searchParams.set(code?'isbn':'title',code||key);url.searchParams.set('limit','5');url.searchParams.set('fields','key,title,author_name,first_publish_year,isbn');
  const response=await fetcher(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'RasidAI/0.2 (https://rasid-904v.onrender.com; educational book lookup)'}});if(!response.ok)throw Error('catalogue_unavailable');
  const data=await response.json();const books=(Array.isArray(data.docs)?data.docs:[]).slice(0,5).filter(d=>/^\/works\/OL\d+W$/.test(d.key)).map(d=>({title:String(d.title||'').slice(0,300),authors:(Array.isArray(d.author_name)?d.author_name:[]).slice(0,4).map(a=>String(a).slice(0,100)),year:Number.isInteger(d.first_publish_year)?d.first_publish_year:null,url:'https://openlibrary.org'+d.key,isbn:code||(Array.isArray(d.isbn)?d.isbn:[]).find(s=>globalThis.ExperimentModel.isbn(s))||null}));
  if(cache.size>=200)cache.delete(cache.keys().next().value);cache.set(key,{until:Date.now()+3600000,books});return books;
 };
}
export function installExperiments(app,{save,requireUser,lookup=createBookLookup()}){
 const permit=(req,res,next)=>hasAI(req.user)?next():res.status(403).json({error:'subject_restricted'});
 const limits=new Map();
 app.get('/api/lab/references',requireUser,permit,(req,res)=>{const lang=req.query.lang==='ar'?'ar':'en';res.json({notes:REFERENCE_NOTES.map(n=>({id:n.id,title:n.title[lang],summary:n.body[lang],citation:n.file+' · '+(lang==='ar'?'صفحة ':'page ')+n.pages.join(', ')})),status:REFERENCE_STATUS,questions:REFERENCE_QUESTIONS.map(q=>({id:q.id,question:q.question[lang]}))});});
 app.post('/api/lab/references/answer',requireUser,permit,(req,res)=>{const {id,answer,lang}=req.body,q=REFERENCE_QUESTIONS.find(q=>q.id===id);if(!q||typeof answer!=='string'||answer.length>300)return res.status(400).json({error:'invalid_answer'});const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/[.!؟،。]/g,'').replace(/[\u064b-\u065f]/g,'');const correct=q.answers.includes(normalize(answer));req.user.referencePractice||=[];req.user.referencePractice.push({id,correct,at:new Date().toISOString()});req.user.referencePractice=req.user.referencePractice.slice(-30);save();res.json({correct,explanation:q.explanation[lang==='ar'?'ar':'en']});});
 app.get('/api/lab/books',requireUser,permit,async(req,res)=>{const now=Date.now(),key=req.user.email;let bucket=limits.get(key);if(!bucket||bucket.until<now){bucket={count:0,until:now+60000};limits.set(key,bucket);}if(limits.size>1000)for(const [k,b]of limits)if(b.until<now)limits.delete(k);if(++bucket.count>12)return res.status(429).json({error:'rate_limited'});if(typeof req.query.q!=='string')return res.status(400).json({error:'invalid_query'});try{res.json({books:await lookup(req.query.q),source:'Open Library'});}catch(e){const error=['invalid_query','invalid_isbn','catalogue_busy'].includes(e.message)?e.message:'catalogue_unavailable';res.status(error==='catalogue_busy'?429:error.startsWith('invalid')?400:503).json({error});}});
 app.get('/api/lab/experiments',requireUser,permit,(req,res)=>res.json({workspace:req.user.experiments||null}));
 app.post('/api/lab/experiments',requireUser,permit,(req,res)=>{const {cells,algorithm,commands,reflection}=req.body;if(!Array.isArray(cells)||cells.length!==96||cells.some(x=>![0,1,4].includes(x))||cells[0]!==1||cells[95]!==1||!['bfs','dijkstra','astar'].includes(algorithm)||typeof commands!=='string'||commands.length>300||typeof reflection!=='string'||reflection.length>1500)return res.status(400).json({error:'invalid_workspace'});req.user.experiments={cells,algorithm,commands,reflection,updatedAt:new Date().toISOString()};save();res.json({ok:true});});
}
