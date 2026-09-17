// NewsAPI key is server-only. The free Developer plan is never enabled in production.
const cache=new Map();let calls=0,day='',lastError=null;
const DOMAINS='technologyreview.com,theverge.com,venturebeat.com,techcrunch.com,bbc.co.uk,reuters.com';
export function newsApiStatus(){return {configured:Boolean(process.env.NEWSAPI_KEY),enabled:Boolean(process.env.NEWSAPI_KEY)&&(process.env.NODE_ENV!=='production'||process.env.NEWSAPI_PRODUCTION_ALLOWED==='true'),productionAllowed:process.env.NEWSAPI_PRODUCTION_ALLOWED==='true',lastError};}
export async function newsApiArticles(category='civilian'){
 if(!newsApiStatus().enabled||category!=='civilian')return [];
 const current=new Date().toISOString().slice(0,10);if(day!==current){day=current;calls=0;}
 const prior=cache.get(category);if(prior&&Date.now()-prior.at<3600000)return prior.items;
 if(calls>=80)return prior?.items||[];
 calls++;
 try{
  const url=new URL('https://newsapi.org/v2/everything');
  url.search=new URLSearchParams({q:'"artificial intelligence" OR "machine learning" OR "large language model"',domains:DOMAINS,language:'en',sortBy:'publishedAt',pageSize:'20'}).toString();
  const r=await fetch(url,{headers:{'X-Api-Key':process.env.NEWSAPI_KEY},signal:AbortSignal.timeout(12000)});
  const data=await r.json();if(!r.ok||data.status!=='ok')throw new Error(['apiKeyInvalid','apiKeyExhausted','rateLimited','apiKeyDisabled'].includes(data.code)?data.code:'provider_unavailable');
  const items=(data.articles||[]).filter(a=>{try{return new URL(a.url).protocol==='https:'&&a.title&&a.title!=='[Removed]'&&Number.isFinite(Date.parse(a.publishedAt));}catch{return false;}}).slice(0,20).map(a=>({category:'civilian',title:String(a.title).slice(0,300),source:String(a.source?.name||'NewsAPI').slice(0,100),url:a.url,published:a.publishedAt,snippet:String(a.description||a.content||'').replace(/<[^>]*>/g,'').slice(0,600),via:'NewsAPI'}));
  lastError=null;cache.set(category,{at:Date.now(),items});return items;
 }catch(e){lastError=['apiKeyInvalid','apiKeyExhausted','rateLimited','apiKeyDisabled'].includes(e.message)?e.message:'provider_unavailable';cache.set(category,{at:Date.now()-3000000,items:prior?.items||[]});return prior?.items||[];}
}
