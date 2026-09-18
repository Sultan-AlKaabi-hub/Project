import Anthropic from '@anthropic-ai/sdk';
import {embedCourse} from './knowledge.js';
/** Provider boundary. All tools are dispatched by server code, never directly by a model. */
let client=null;
const getClient=()=>client||=new Anthropic({timeout:40000,maxRetries:1});
export class AIProvider {
 constructor(){this.model=process.env.RASID_AGENT_MODEL||process.env.RASID_MODEL||'claude-opus-5';this.enabled=process.env.RASID_AGENT_PROVIDER==='anthropic'&&Boolean(process.env.ANTHROPIC_API_KEY);}
 async embed(text){return embedCourse(text);}
 async toolCall(name,args,tools){if(!Object.hasOwn(tools,name))throw new Error('tool_not_allowed');return tools[name](args);}
 async generate(system,input,{signal,onText,task='tutor'}={}){
  if(!this.enabled)return null;
  // Prior exchanges become real conversation turns (better follow-ups than a JSON blob); the rest of the context stays a data payload.
  const {history=[],...payload}=input&&typeof input==='object'&&!Array.isArray(input)?input:{value:input};
  const turns=[];
  for(const h of Array.isArray(history)?history.slice(-6):[]){if(h?.question&&h?.answer){turns.push({role:'user',content:String(h.question).slice(0,1000)},{role:'assistant',content:String(h.answer).slice(0,2500)});}}
  turns.push({role:'user',content:JSON.stringify(payload)});
  const stream=getClient().messages.stream({
   model:this.model,
   max_tokens:task==='router'?120:task==='review'?1600:1000,
   // The system prompt repeats across requests, so let the API cache it.
   system:[{type:'text',text:system,cache_control:{type:'ephemeral'}}],
   output_config:{effort:task==='router'?'low':'medium'},
   messages:turns
  },{signal});
  if(onText)stream.on('text',text=>onText(text));
  const message=await stream.finalMessage();
  if(message.stop_reason==='refusal')return null;
  const text=message.content.filter(x=>x.type==='text').map(x=>x.text).join('').slice(0,9000);
  return {text,model:this.model,usage:{input:message.usage.input_tokens,output:message.usage.output_tokens,cached:message.usage.cache_read_input_tokens||0}};
 }
 async stream(system,input,options){return this.generate(system,input,options);}
}
export const provider=new AIProvider();
