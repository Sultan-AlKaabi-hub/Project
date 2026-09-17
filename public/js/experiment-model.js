(function(root){
 const neighbors=(n,w,h)=>[n-w,n+1,n+w,n-1].filter(v=>v>=0&&v<w*h&&Math.abs(v%w-n%w)+Math.abs(Math.floor(v/w)-Math.floor(n/w))===1);
 function route(cells,w,start,goal,algorithm='astar'){
  if(!Array.isArray(cells)||!Number.isInteger(w)||w<1||cells.length%w||cells.length>900||cells.some(x=>![0,1,4].includes(x))||![start,goal].every(n=>Number.isInteger(n)&&n>=0&&n<cells.length)||!['bfs','dijkstra','astar'].includes(algorithm))throw Error('Invalid grid');
  if(!cells[start]||!cells[goal])return {path:[],visited:[],cost:null};
  const h=cells.length/w,front=[start],dist=new Map([[start,0]]),parent=new Map(),closed=new Set(),visited=[];
  const heuristic=n=>algorithm==='astar'?Math.abs(n%w-goal%w)+Math.abs(Math.floor(n/w)-Math.floor(goal/w)):0;
  while(front.length){if(algorithm!=='bfs')front.sort((a,b)=>dist.get(a)+heuristic(a)-dist.get(b)-heuristic(b));const n=front.shift();if(closed.has(n))continue;closed.add(n);visited.push(n);if(n===goal)break;
   for(const v of neighbors(n,w,h)){if(!cells[v]||closed.has(v))continue;const cost=dist.get(n)+(algorithm==='bfs'?1:cells[v]);if(cost<(dist.get(v)??Infinity)){dist.set(v,cost);parent.set(v,n);front.push(v);}}
  }
  if(!closed.has(goal))return {path:[],visited,cost:null};const path=[goal];while(path[0]!==start)path.unshift(parent.get(path[0]));return {path,visited,cost:path.slice(1).reduce((s,n)=>s+cells[n],0)};
 }
 function commands(cells,w,start,text){const list=String(text).trim().toUpperCase().split(/[\s,]+/).filter(Boolean);if(list.length>120||list.some(x=>!['U','D','L','R'].includes(x)))throw Error('Use up to 120 U D L R commands');let n=start;const path=[n];for(const step of list){const next=n+({U:-w,D:w,L:-1,R:1}[step]);if(!neighbors(n,w,cells.length/w).includes(next)||!cells[next])return {path,collision:true,step:path.length};n=next;path.push(n);}return {path,collision:false};}
 function isbn(value){const s=String(value).replace(/[\s-]/g,'').toUpperCase();if(/^\d{13}$/.test(s)&&/^(978|979)/.test(s))return [...s].reduce((a,c,i)=>a+Number(c)*(i%2?3:1),0)%10===0?s:null;if(/^\d{9}[\dX]$/.test(s))return [...s].reduce((a,c,i)=>a+(c==='X'?10:Number(c))*(10-i),0)%11===0?s:null;return null;}
 const sigmoid=x=>1/(1+Math.exp(-Math.max(-40,Math.min(40,x))));
 function network(seed=42){let x=seed>>>0;const rand=()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296*2-1;};return {w:Array.from({length:4},()=>[rand(),rand()]),b:Array.from({length:4},rand),v:Array.from({length:4},rand),c:rand(),epochs:0};}
 function predict(net,input){const hidden=net.w.map((w,j)=>sigmoid(w[0]*input[0]+w[1]*input[1]+net.b[j]));return {hidden,output:sigmoid(hidden.reduce((s,h,j)=>s+h*net.v[j],net.c))};}
 const xor=[[0,0,0],[0,1,1],[1,0,1],[1,1,0]];
 function train(net,rate=.5,epochs=100){if(!Number.isFinite(rate)||rate<=0||rate>2||!Number.isInteger(epochs)||epochs<1||epochs>1000)throw Error('Invalid training settings');for(let e=0;e<epochs;e++){for(const [a,b,target] of xor){const {hidden,output}=predict(net,[a,b]),delta=output-target;const dh=hidden.map((h,j)=>delta*net.v[j]*h*(1-h));for(let j=0;j<4;j++){net.v[j]-=rate*delta*hidden[j];net.b[j]-=rate*dh[j];net.w[j][0]-=rate*dh[j]*a;net.w[j][1]-=rate*dh[j]*b;}net.c-=rate*delta;}net.epochs++;}return loss(net);}
 function loss(net){return -xor.reduce((s,[a,b,y])=>{const p=Math.max(1e-9,Math.min(1-1e-9,predict(net,[a,b]).output));return s+y*Math.log(p)+(1-y)*Math.log(1-p);},0)/4;}
 root.ExperimentModel={route,commands,isbn,network,predict,train,loss,xor};
})(globalThis);
