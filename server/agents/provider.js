import Anthropic from '@anthropic-ai/sdk';
import {embedCourse} from './knowledge.js';
/** Provider boundary. All tools are dispatched by server code, never directly by a model. */
export class AIProvider {
 constructor(){this.model=process.env.RASID_AGENT_MODEL||process.env.RASID_MODEL||'claude-opus-5';this.enabled=process.env.RASID_AGENT_PROVIDER==='anthropic'&&Boolean(process.env.ANTHROPIC_API_KEY);}
 async embed(text){return embedCourse(text);}
 async toolCall(name,args,tools){if(!Object.hasOwn(tools,name))throw new Error('tool_not_allowed');return tools[name](args);}
 async generate(system,input,{signal,onText}={}){
  if(!this.enabled)return null;
  const client=new Anthropic({timeout:40000,maxRetries:0});
  const stream=client.messages.stream({model:this.model,max_tokens:1000,system,messages:[{role:'user',content:JSON.stringify(input)}]},{signal});
  if(onText)stream.on('text',text=>onText(text));
  const message=await stream.finalMessage();
  if(message.stop_reason==='refusal')return null;
  const text=message.content.filter(x=>x.type==='text').map(x=>x.text).join('').slice(0,9000);
  return {text,model:this.model,usage:{input:message.usage.input_tokens,output:message.usage.output_tokens}};
 }
 async stream(system,input,options){return this.generate(system,input,options);}
}
export const provider=new AIProvider();
