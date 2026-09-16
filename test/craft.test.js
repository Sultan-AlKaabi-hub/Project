import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {answer} from '../server/faris.js';

test('Faris comparison prompts explain both traversals in the requested language',async()=>{
 const en=await answer('Explain BFS and DFS with an example',{lang:'en'});
 assert.match(en.text,/queue/);assert.match(en.text,/stack/);assert.match(en.text,/does not guarantee/);
 const ar=await answer('اشرح البحث بالعرض والعمق مع مثال',{lang:'ar'});
 assert.match(ar.text,/طابور/);assert.match(ar.text,/مكدس/);
});

function scene(reduced=false){
 const frames=new Map(),events=new Map(),draws=[];let id=0,resize;
 const classes=()=>({add(){},toggle(){}});
 const ctx=new Proxy({fillRect(...a){draws.push(a);}}, {get:(obj,key)=>key in obj?obj[key]:()=>{},set:(obj,key,value)=>(obj[key]=value,true)});
 const element=()=>({classList:classes(),dataset:{},children:[],setAttribute(k,v){this[k]=v;},append(...e){this.children.push(...e);},remove(){this.removed=true;},getContext(){return ctx;}});
 const parent=element(),container=element();container.parentElement=parent;container.clientWidth=390;container.clientHeight=844;
 const document={hidden:false,documentElement:{lang:'en'},createElement:element,addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k)};
 const motion={matches:reduced,addEventListener:(k,v)=>events.set('motion',v),removeEventListener:()=>events.delete('motion')};
 const scope={window:{},document,matchMedia:()=>motion,ResizeObserver:class{constructor(cb){resize=cb;}observe(){resize();}disconnect(){this.disconnected=true;}},requestAnimationFrame:cb=>{frames.set(++id,cb);return id;},cancelAnimationFrame:i=>frames.delete(i),performance:{now:()=>0},Math};
 vm.runInNewContext(fs.readFileSync(new URL('../public/js/intro.js',import.meta.url),'utf8'),scope);
 const handle=scope.window.Intro.mount(container);
 const tick=ts=>{const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(ts));};
 return {frames,events,document,container,parent,handle,tick,draws,motion};
}
test('Traveling workshop moves, pauses, stops while hidden and releases animation resources',()=>{
 const s=scene();s.tick(0);s.tick(40);const canvas=s.container.children[2],first=canvas.dataset.riderX;
 for(let t=80;t<1000;t+=40)s.tick(t);
 assert.notEqual(canvas.dataset.riderX,first);
 const button=s.parent.children[0];button.onclick();s.tick(1040);const paused=canvas.dataset.riderX;
 s.tick(5000);assert.equal(canvas.dataset.riderX,paused);assert.equal(s.frames.size,0);assert.equal(button['aria-pressed'],'true');
 button.onclick();s.tick(5040);assert.equal(s.frames.size,1);
 s.document.hidden=true;s.events.get('visibilitychange')();s.tick(5080);assert.equal(s.frames.size,0);
 s.document.hidden=false;s.events.get('visibilitychange')();s.tick(6000);assert.equal(s.frames.size,1);
 s.handle.unmount();assert.equal(s.frames.size,0);assert.equal(s.events.size,0);assert.equal(button.removed,true);
});
test('Reduced motion paints one still workshop and canvas work is limited to about 30 fps',()=>{
 const still=scene(true);still.tick(40);assert.equal(still.frames.size,0);assert.equal(still.parent.children[0].disabled,true);assert.ok(still.draws.length>70);still.handle.unmount();
 const s=scene();s.tick(40);const n=s.draws.length;s.tick(48);assert.equal(s.draws.length,n);s.tick(80);assert.ok(s.draws.length>n);s.handle.unmount();
});
test('Offline cache never returns HTML for missing script assets or intercepts personal APIs',async()=>{
 const listeners={},matches=[];
 const context={URL,Response,location:{origin:'https://example.test'},self:{addEventListener:(name,fn)=>listeners[name]=fn},fetch:async()=>{throw Error('offline');},caches:{match:async key=>{matches.push(key);return key==='index.html'?new Response('<html>offline</html>'):undefined;}}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 let response;const request=(path,mode)=>({request:{url:'https://example.test'+path,method:'GET',mode},respondWith:p=>response=p});
 listeners.fetch(request('/js/craft.js','cors'));assert.equal((await response).type,'error');assert.ok(!matches.includes('index.html'));
 listeners.fetch(request('/','navigate'));assert.equal(await (await response).text(),'<html>offline</html>');
 response=undefined;listeners.fetch(request('/api/lab','cors'));assert.equal(response,undefined);
});
