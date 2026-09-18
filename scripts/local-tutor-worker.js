import {CreateMLCEngine} from '@mlc-ai/web-llm';
let engine;
self.onmessage=async({data})=>{try{
 if(data.type==='cancel'){engine?.interruptGenerate();return;}
 if(data.type==='load'){engine=await CreateMLCEngine('Qwen3-0.6B-q4f16_1-MLC',{initProgressCallback:p=>postMessage({type:'progress',text:p.text})});postMessage({type:'ready'});}
 if(data.type==='generate'){
 const ctx=data.context, raw=ctx.input||{}, input={question:String(raw.question||'').slice(0,1200),language:raw.language,skillLevel:raw.skillLevel,strategy:raw.teachingDecision?.strategy,currentLesson:raw.agentContext?.currentLesson?.title,history:(raw.history||[]).slice(-1).map(x=>({question:String(x.question).slice(0,200),answer:String(x.answer).slice(0,400)})),references:(raw.references||[]).slice(0,2).map(r=>({title:r.title,content:String(r.content||'').slice(0,700)})),exercise:raw.exercise?{guidance:String(raw.exercise.guidance||'').slice(0,900)}:undefined};
 const stream=await engine.chat.completions.create({messages:[{role:'system',content:ctx.system+' Be concise. /no_think'},{role:'user',content:JSON.stringify(input)+'\n/no_think'}],stream:true,extra_body:{enable_thinking:false},max_tokens:600,temperature:0.35});let text='',sent='';
 for await(const chunk of stream){text+=chunk.choices[0]?.delta?.content||'';const visible=text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g,'').trim();if(visible.startsWith(sent)){postMessage({type:'delta',text:visible.slice(sent.length)});sent=visible;}}
 postMessage({type:'result',text:text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g,'').trim()});
 }
}catch(error){postMessage({type:'error',phase:data.type,fatal:/device.*lost|out of memory|memory allocation/i.test(String(error?.message||'')),reason:String(error?.message||'model_error').replace(/https?:\/\/\S+/g,'[model resource]').slice(0,220)});}};
