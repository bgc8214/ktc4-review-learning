const TILE_W=76,TILE_H=38;
const stations={
 auth:{x:4,y:4,label:'인증 검문소',icon:'ID'},
 atomic:{x:11,y:3,label:'동시성 항구',icon:'A·B'},
 transaction:{x:18,y:5,label:'트랜잭션 은행',icon:'₩'},
 polling:{x:20,y:12,label:'비동기 작업장',icon:'JOB'},
 ports:{x:13,y:16,label:'어댑터 공방',icon:'PORT'},
 evidence:{x:5,y:13,label:'AI 근거 공장',icon:'SHA'}
};
const order=Object.keys(stations);
const roads=new Set();
function roadLine(ax,ay,bx,by){let x=ax,y=ay;while(x!==bx){roads.add(`${x},${y}`);x+=Math.sign(bx-x)}while(y!==by){roads.add(`${x},${y}`);y+=Math.sign(by-y)}roads.add(`${x},${y}`)}
roadLine(4,4,11,3);roadLine(11,3,18,5);roadLine(18,5,20,12);roadLine(20,12,13,16);roadLine(13,16,5,13);roadLine(5,13,4,4);
const trees=[ [1,3],[2,7],[1,12],[3,16],[7,2],[8,7],[9,11],[9,17],[15,1],[16,8],[17,14],[22,4],[23,9],[22,16],[14,10],[6,9] ];
function roadPath(from,to){
 const start=stations[from],goal=stations[to],startKey=`${start.x},${start.y}`,goalKey=`${goal.x},${goal.y}`,queue=[startKey],previous=new Map([[startKey,null]]);
 while(queue.length){const key=queue.shift();if(key===goalKey)break;const [x,y]=key.split(',').map(Number);for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const next=`${nx},${ny}`;if(roads.has(next)&&!previous.has(next)){previous.set(next,key);queue.push(next)}}}
 const result=[];let key=goalKey;while(key){const [x,y]=key.split(',').map(Number);result.unshift({x,y});key=previous.get(key)}return result.length>1?result:[start,goal];
}
const tourPath=order.flatMap((id,i)=>roadPath(id,order[(i+1)%order.length]).slice(i?1:0));

function shade(hex,amount){const n=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+amount)),g=Math.max(0,Math.min(255,((n>>8)&255)+amount)),b=Math.max(0,Math.min(255,(n&255)+amount));return `rgb(${r} ${g} ${b})`}
function poly(c,pts,fill,stroke='#344132',width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function diamond(c,x,y,w,h,fill,stroke='#5e7d45'){poly(c,[[x,y-h/2],[x+w/2,y],[x,y+h/2],[x-w/2,y]],fill,stroke)}
function box(c,x,y,w,d,h,color){const top=[[x,y-h-d/2],[x+w/2,y-h],[x,y-h+d/2],[x-w/2,y-h]];const left=[[x-w/2,y-h],[x,y-h+d/2],[x,y+d/2],[x-w/2,y]];const right=[[x+w/2,y-h],[x,y-h+d/2],[x,y+d/2],[x+w/2,y]];poly(c,left,shade(color,-28));poly(c,right,shade(color,-12));poly(c,top,color);return {top:y-h-d/2,bottom:y+d/2}}
function text(c,value,x,y,size=10,color='#253226',align='center'){c.font=`800 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y)}
function iso(x,y){return {x:(x-y)*TILE_W/2,y:(x+y)*TILE_H/2}}
function routePoint(id){return stations[id]}

function tree(c,x,y,t){c.fillStyle='#5a4530';c.fillRect(x-2,y-12,4,13);diamond(c,x,y-18,18,15,t%2?'#3e7142':'#4c8148','#315c36');diamond(c,x,y-28,14,13,t%2?'#5d8d4f':'#68a05b','#315c36')}
function lamp(c,x,y,t){c.strokeStyle='#3a4741';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-20);c.stroke();c.fillStyle=t%30<16?'#ffe98a':'#d7c572';c.fillRect(x-4,y-24,8,6)}
function sign(c,x,y,label,selected){c.fillStyle='#4a3929';c.fillRect(x-3,y-28,6,30);c.fillStyle=selected?'#f0bf4b':'#f4e6bd';c.strokeStyle='#41382c';c.lineWidth=2;c.fillRect(x-43,y-43,86,20);c.strokeRect(x-43,y-43,86,20);text(c,label,x,y-33,9,'#2e382f')}
function smoke(c,x,y,t){for(let i=0;i<3;i++){const p=(t/70+i*.31)%1;c.globalAlpha=.45*(1-p);c.fillStyle='#e8e2d0';c.beginPath();c.arc(x+Math.sin(p*8+i)*4,y-p*36,5+p*5,0,Math.PI*2);c.fill()}c.globalAlpha=1}

function facility(c,id,x,y,state,t,selected,signs,pulse=false,done=false){
 c.save();c.translate(x,y);
 if(selected){c.globalAlpha=pulse?.42:.28;diamond(c,0,2,pulse?144:128,pulse?66:58,'#fff0a6',null);c.globalAlpha=1}
 if(id==='auth'){
  box(c,-20,2,48,34,42,'#d5d7ca');box(c,28,7,40,30,31,'#a9b8be');
  c.fillStyle='#324139';c.fillRect(-27,-41,14,23);text(c,'ID',-20,-29,8,'#f7e9aa');
  const denied=state?.denied; c.strokeStyle=denied?'#b44f3b':'#477749';c.lineWidth=6;c.beginPath();c.moveTo(5,-2);c.lineTo(denied?5:25,denied?-20:-4);c.stroke();
  text(c,state?.check===false?'권한검사 OFF':'소유권 검사',2,12,7,'#f7edcf');
 } else if(id==='atomic'){
  box(c,0,7,76,42,28,'#63829a');box(c,0,-10,42,30,31,'#d6d5c4');
  c.fillStyle=state?.token===false?'#6a756d':'#f0bf4b';c.beginPath();c.ellipse(0,-49,16,7,0,0,Math.PI*2);c.fill();text(c,'TOKEN',0,-49,7,'#29342d');
  const a=state?.A?.read,b=state?.B?.read;text(c,a?'A✓':'A',-27,-9,10,a?'#fff0a6':'#fff');text(c,b?'B✓':'B',27,4,10,b?'#fff0a6':'#fff');
 } else if(id==='transaction'){
  box(c,-24,7,48,40,50,'#d4c286');box(c,25,12,48,40,50,'#d4c286');
  for(const dx of [-35,-25,-15,14,24,34]){c.fillStyle='#776e58';c.fillRect(dx,-27,6,25)}
  text(c,`A ${state?.committedA??100}`,-24,-42,8,'#28352e');text(c,`B ${state?.committedB??100}`,25,-37,8,'#28352e');
  c.fillStyle=state?.phase==='failed'||state?.phase==='partial'?'#b44f3b':'#f0bf4b';c.beginPath();c.arc(1,-7,11,0,Math.PI*2);c.fill();text(c,'30',1,-7,7,'#28352e');
 } else if(id==='polling'){
  box(c,0,9,82,48,47,'#9fa9a6');c.fillStyle='#475a55';c.fillRect(-25,-52,49,28);c.fillStyle='#8fd09d';c.fillRect(-21,-48,41,20);text(c,`${state?.progress??0}%`,0,-38,9,'#17311f');
  c.fillStyle='#8b4c3c';c.fillRect(25,-67,12,30);smoke(c,31,-69,t);
  c.fillStyle=t%32<16?'#f0bf4b':'#477749';c.fillRect(-34,-17,6,6);c.fillRect(-24,-17,6,6);
 } else if(id==='ports'){
  box(c,0,8,72,42,30,'#bc8b59');
  c.strokeStyle='#4b544d';c.lineWidth=4;c.beginPath();c.moveTo(-45,13);c.lineTo(0,-8);c.lineTo(42,-27);c.moveTo(0,-8);c.lineTo(42,12);c.stroke();
  c.fillStyle=state?.adapter==='github'?'#f0bf4b':'#828b82';c.fillRect(27,-42,29,17);text(c,'GIT',41,-34,7,'#273128');c.fillStyle=state?.adapter==='fake'?'#f0bf4b':'#828b82';c.fillRect(27,4,29,17);text(c,'FAKE',41,13,7,'#273128');
 } else {
  box(c,-19,8,50,38,38,'#9b6d64');box(c,27,11,44,35,29,'#d1c7a4');
  c.fillStyle='#4c5d57';c.fillRect(-31,-42,24,23);text(c,'LLM',-19,-30,7,'#fff0a6');
  const ok=state?.checks?.exists&&state?.checks?.context;c.fillStyle=state?.checks?(ok?'#477749':'#b44f3b'):'#7d877d';c.fillRect(7,-20,9,32);text(c,state?.checks?(ok?'PASS':'STOP'):'검증',31,-8,7,'#28352e');
 }
 if(signs)sign(c,0,30,stations[id].label,selected);
 if(done){c.fillStyle='#355f39';c.fillRect(39,-75,3,35);poly(c,[[42,-74],[65,-68],[42,-58]],'#f0bf4b','#355f39');text(c,'✓',52,-67,9,'#28352e')}
 c.restore();
}

function cart(c,x,y,label,t,color='#f0bf4b'){
 c.save();c.translate(x,y-13);const bounce=Math.sin(t/85)*1.5;c.translate(0,bounce);box(c,0,0,31,20,14,color);c.fillStyle='#2d3732';for(const dx of [-10,10]){c.beginPath();c.arc(dx,6,5,0,Math.PI*2);c.fill()}text(c,label,0,-13,7,'#273128');c.restore();
}

export function createPark(canvas,{onStation}={}){
 const c=canvas.getContext('2d');let w=0,h=0,dpr=1;let camera={x:0,y:0,scale:.75};let targetCamera=null;let dragging=false,last=null,dragStart=null;let signs=true;let paused=false;let active='auth';let activeState=null;let completed=new Set();let activeRevision=0,flashUntil=0;let trip=null,tripPath=[];let simTime=0,lastFrame=performance.now();
 function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);if(!camera.ready)fit()}
 function worldToScreen(p){const q=iso(p.x,p.y);return {x:w/2+(q.x+camera.x)*camera.scale,y:70+(q.y+camera.y)*camera.scale}}
 function screenToWorld(sx,sy){const ix=(sx-w/2)/camera.scale-camera.x,iy=(sy-70)/camera.scale-camera.y;return {x:iy/TILE_H+ix/TILE_W,y:iy/TILE_H-ix/TILE_W}}
 function fit(){camera={x:0,y:-180,scale:Math.max(.46,Math.min(1.05,Math.min(w/1080,h/650))),ready:true};targetCamera=null}
 function focus(id,soft=false){const p=iso(stations[id].x,stations[id].y);if(w<700)camera.scale=Math.max(camera.scale,.78);targetCamera={x:-p.x,y:-p.y+Math.min(240,h*.28)/camera.scale};if(!soft){camera.x=targetCamera.x;camera.y=targetCamera.y;targetCamera=null}}
 function pointOnPath(path,progress){const scaled=Math.max(0,Math.min(1,progress))*(path.length-1),i=Math.min(path.length-2,Math.floor(scaled)),k=scaled-i,a=path[i],b=path[i+1];return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}}
 function getCart(){return trip?pointOnPath(tripPath,trip.progress):stations[active]}
 function draw(now){const dt=Math.min(50,now-lastFrame);lastFrame=now;if(!paused)simTime+=dt;
  if(targetCamera){camera.x+=(targetCamera.x-camera.x)*.08;camera.y+=(targetCamera.y-camera.y)*.08;if(Math.abs(camera.x-targetCamera.x)<.5)targetCamera=null}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.fillStyle='#6f9b4e';c.fillRect(0,0,w,h);c.save();c.translate(w/2+camera.x*camera.scale,70+camera.y*camera.scale);c.scale(camera.scale,camera.scale);
  const activeRoad=new Set(tripPath.map(p=>`${p.x},${p.y}`));
  for(let sum=0;sum<=42;sum++)for(let x=0;x<24;x++){const y=sum-x;if(y<0||y>=19)continue;const p=iso(x,y),key=`${x},${y}`,isRoad=roads.has(key),highlight=trip&&activeRoad.has(key);diamond(c,p.x,p.y,TILE_W,TILE_H,highlight?'#e4d18e':isRoad?'#d7c7a0':(x+y)%2?'#719c4f':'#78a356',isRoad?'#a69b7d':'#628b48')}
  const pond=iso(2,9);diamond(c,pond.x,pond.y,178,90,'#6da4a2','#4e7778');for(let i=0;i<4;i++){c.strokeStyle='#a5d0c7';c.lineWidth=2;c.beginPath();c.arc(pond.x-45+i*29,pond.y+Math.sin(simTime/500+i)*5,10,0,Math.PI);c.stroke()}
  trees.forEach(([x,y],i)=>{const p=iso(x,y);tree(c,p.x,p.y,i)});
  [...roads].filter((_,i)=>i%7===0).forEach((key,i)=>{const [x,y]=key.split(',').map(Number),p=iso(x,y);lamp(c,p.x+25,p.y,Math.floor(simTime/100)+i)});
  order.map(id=>({id,...stations[id],z:stations[id].x+stations[id].y})).sort((a,b)=>a.z-b.z).forEach(s=>{const p=iso(s.x,s.y);facility(c,s.id,p.x,p.y,active===s.id?activeState:null,simTime,active===s.id,signs,active===s.id&&now<flashUntil,completed.has(s.id))});
  const cp=getCart(),cartp=iso(cp.x,cp.y);cart(c,cartp.x,cartp.y,stations[trip?.to||active].icon,simTime);
  for(let i=0;i<9;i++){const walker=pointOnPath(tourPath,(simTime/12000+i/9)%1),p=iso(walker.x,walker.y);c.fillStyle=i%2?'#654d39':'#38584c';c.beginPath();c.arc(p.x,p.y-7,3,0,Math.PI*2);c.fill();c.strokeStyle='#303d35';c.beginPath();c.moveTo(p.x,p.y-4);c.lineTo(p.x,p.y+2);c.stroke()}
  for(let i=0;i<2;i++){const p=pointOnPath(tourPath,(simTime/17000+i*.5)%1),q=iso(p.x,p.y);cart(c,q.x,q.y,i?'OPS':'API',simTime+i*80,i?'#bf7158':'#6b91a0')}
  c.restore();requestAnimationFrame(draw)}
 function hit(sx,sy){const p=screenToWorld(sx,sy);let best=null,d=1.5;for(const id of order){const q=stations[id],v=Math.hypot(q.x-p.x,q.y-p.y);if(v<d){d=v;best=id}}return best}
 canvas.addEventListener('pointerdown',e=>{dragging=true;last={x:e.clientX,y:e.clientY};dragStart={...last};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;camera.x+=(e.clientX-last.x)/camera.scale;camera.y+=(e.clientY-last.y)/camera.scale;last={x:e.clientX,y:e.clientY}});
 canvas.addEventListener('pointerup',e=>{const moved=Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y);dragging=false;if(moved<5){const r=canvas.getBoundingClientRect(),id=hit(e.clientX-r.left,e.clientY-r.top);if(id)onStation?.(id)}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();camera.scale=Math.max(.4,Math.min(1.7,camera.scale*(e.deltaY>0?.9:1.1)))},{passive:false});
 new ResizeObserver(resize).observe(canvas);requestAnimationFrame(draw);
 return {stations,fit,focus,zoomBy(v){camera.scale=Math.max(.4,Math.min(1.7,camera.scale*v))},setSigns(v){signs=v},setPaused(v){paused=v},setCompleted(values){completed=new Set(values)},setState(id,state){active=id;activeState=state;if(state.revision!==activeRevision){activeRevision=state.revision;flashUntil=performance.now()+420}},setTrip(value){trip=value;tripPath=value?roadPath(value.from,value.to):[]},getCart};
}
