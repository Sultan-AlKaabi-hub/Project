import {CreateMLCEngine} from '@mlc-ai/web-llm';
let engine;
self.onmessage=async({data})=>{try{
 if(data.type==='load'){engine=await CreateMLCEngine('Qwen3-0.6B-q4f16_1-MLC',{initProgressCallback:p=>postMessage({type:'progress',text:p.text})});postMessage({type:'ready'});}
 if(data.type==='generate'){
 const ctx=data.context, input={...ctx.input,history:(ctx.input.history||[]).slice(-2),references:ctx.input.references.slice(0,1).map(r=>({...r,content:r.content.slice(0,2000)}))};
 const stream=await engine.chat.completions.create({messages:[{role:'system',content:ctx.system+' Be concise. /no_think'},{role:'user',content:JSON.stringify(input)+'\n/no_think'}],stream:true,extra_body:{enable_thinking:false},max_tokens:600,temperature:0.35});let text='',sent='';
 for await(const chunk of stream){text+=chunk.choices[0]?.delta?.content||'';const visible=text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g,'').trim();if(visible.startsWith(sent)){postMessage({type:'delta',text:visible.slice(sent.length)});sent=visible;}}
 postMessage({type:'result',text:text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g,'').trim()});
 }
}catch{postMessage({type:'error'});}};
