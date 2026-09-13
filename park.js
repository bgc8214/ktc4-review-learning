const TILE_W=68,TILE_H=34;
const C={grass:'#6f9b4e',grassAlt:'#78a356',edge:'#5d8643',road:'#d7c7a0',roadEdge:'#9b8d6c',ink:'#28352e',paper:'#fff1bd',accent:'#f0bf4b',danger:'#b44f3b',safe:'#477749',water:'#6da4a2',steel:'#8795a2',wall:'#d6d5c4',dark:'#4b5651',purple:'#72618d',blue:'#5c859c'};
const iso=(x,y)=>({x:(x-y)*TILE_W/2,y:(x+y)*TILE_H/2});
const shade=(hex,amount)=>{const n=parseInt(hex.slice(1),16),v=i=>Math.max(0,Math.min(255,i+amount));return `rgb(${v(n>>16)} ${v((n>>8)&255)} ${v(n&255)})`};
function poly(c,points,fill,stroke=C.ink,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function diamond(c,x,y,w,h,fill,stroke=C.edge){poly(c,[[x,y-h/2],[x+w/2,y],[x,y+h/2],[x-w/2,y]],fill,stroke)}
function box(c,x,y,w,d,h,color){poly(c,[[x-w/2,y-h],[x,y-h+d/2],[x,y+d/2],[x-w/2,y]],shade(color,-28));poly(c,[[x+w/2,y-h],[x,y-h+d/2],[x,y+d/2],[x+w/2,y]],shade(color,-12));poly(c,[[x,y-h-d/2],[x+w/2,y-h],[x,y-h+d/2],[x-w/2,y-h]],color)}
function label(c,value,x,y,size=9,color=C.ink){c.font=`800 ${size}px ui-monospace,Menlo,monospace`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y)}
function tree(c,x,y,variant=0){c.fillStyle='#60462f';c.fillRect(x-2,y-11,4,12);diamond(c,x,y-18,16,13,variant%2?'#3e7142':'#4f8549','#315c36');diamond(c,x,y-27,12,11,variant%2?'#609251':'#68a05b','#315c36')}
function lamp(c,x,y,t){c.strokeStyle=C.dark;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-18);c.stroke();c.fillStyle=t%32<18?'#ffe98a':'#d1c17c';c.fillRect(x-3,y-22,7,5)}
function smoke(c,x,y,t){for(let i=0;i<3;i++){const p=(t/80+i*.3)%1;c.globalAlpha=.42*(1-p);c.fillStyle='#eee9d7';c.beginPath();c.arc(x+Math.sin(p*7+i)*4,y-p*35,4+p*5,0,Math.PI*2);c.fill()}c.globalAlpha=1}
function sign(c,x,y,number,title,active,seen){const width=Math.min(132,Math.max(68,title.length*9+34));c.fillStyle=C.dark;c.fillRect(x-2,y-31,4,32);c.fillStyle=active?C.accent:C.paper;c.strokeStyle=C.ink;c.lineWidth=2;c.fillRect(x-width/2,y-48,width,20);c.strokeRect(x-width/2,y-48,width,20);c.fillStyle=seen?C.safe:C.dark;c.fillRect(x-width/2+3,y-45,19,14);label(c,String(number),x-width/2+12,y-38,8,'#fff');label(c,title.slice(0,13),x+10,y-38,8,C.ink)}

function drawNode(c,node,x,y,t,active,scenario){
 c.save();c.translate(x,y);
 if(active){c.globalAlpha=.34+.12*Math.sin(t/180);diamond(c,0,2,104,50,C.accent,null);c.globalAlpha=1}
 const k=node.kind;
 if(['browser','screen'].includes(k)){box(c,0,4,62,34,37,C.steel);c.fillStyle='#29413c';c.fillRect(-23,-39,46,25);c.fillStyle='#8fd09d';c.fillRect(-19,-35,38,17);label(c,k==='browser'?'WEB':'200 / 404',0,-27,8,C.ink)}
 else if(k==='login'){box(c,0,5,62,38,45,'#d5d7ca');c.fillStyle=C.dark;c.fillRect(-14,-46,28,25);label(c,'ID',0,-34,11,C.paper)}
 else if(k==='parcel'||k==='request'||k==='requestA'||k==='requestB'){box(c,0,1,39,27,18,k==='requestB'?'#bd715d':C.accent);label(c,k==='requestA'?'A':k==='requestB'?'B':'REQ',0,-15,8,C.ink)}
 else if(k==='store'){box(c,0,6,74,44,42,'#aeb7ae');for(let i=-25;i<30;i+=17){c.fillStyle=C.dark;c.fillRect(i,-30,12,18);label(c,'s',i+6,-21,7,C.paper)}}
 else if(k==='gate'||k==='validator'){box(c,0,5,65,35,14,C.steel);c.strokeStyle=active&&scenario==='uuidOnly'?C.danger:C.safe;c.lineWidth=6;c.beginPath();c.moveTo(-23,-10);c.lineTo(26,active&&scenario==='uuidOnly'?-29:-12);c.stroke();label(c,k==='validator'?'CHECK':'A = OWNER?',0,9,7,C.paper)}
 else if(k==='vault'){box(c,0,8,66,45,48,'#c8b785');c.fillStyle=C.dark;c.beginPath();c.arc(0,-26,14,0,Math.PI*2);c.fill();label(c,'CARD',0,-26,7,C.paper)}
 else if(k==='deny'){box(c,0,5,52,34,28,'#ba6b59');label(c,'STOP',0,-22,9,C.paper)}
 else if(k==='person'){c.fillStyle='#365a50';c.beginPath();c.arc(0,-29,8,0,Math.PI*2);c.fill();c.fillRect(-6,-21,12,25);c.strokeStyle=C.ink;c.lineWidth=4;c.beginPath();c.moveTo(-5,-4);c.lineTo(-12,9);c.moveTo(5,-4);c.lineTo(12,9);c.stroke()}
 else if(k==='redis'){c.fillStyle=C.steel;c.strokeStyle=C.dark;c.lineWidth=2;c.fillRect(-28,-37,56,36);c.beginPath();c.ellipse(0,-37,28,11,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.ellipse(0,-1,28,11,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=scenario==='atomic'&&active?'#6f7972':C.accent;c.beginPath();c.ellipse(0,-20,15,6,0,0,Math.PI*2);c.fill();label(c,'TOKEN',0,-20,7,C.ink)}
 else if(k==='factory'||k==='machine'){box(c,0,7,75,45,40,'#a16656');c.fillStyle=C.dark;c.fillRect(18,-60,12,32);smoke(c,24,-62,t);label(c,k==='machine'?'RULE':'ISSUE',-8,-25,8,C.paper)}
 else if(k==='dock'){box(c,0,4,75,38,18,C.blue);c.fillStyle=C.accent;c.fillRect(-24,-24,21,13);c.fillStyle='#61b4ad';c.fillRect(5,-24,21,13)}
 else if(k==='desk'){box(c,0,3,62,36,18,'#a8784f');c.fillStyle=C.paper;c.fillRect(-18,-30,36,19);label(c,'₩ 30',0,-20,9,C.ink)}
 else if(k==='ledger'){box(c,0,2,58,40,13,C.purple);c.fillStyle=C.paper;c.fillRect(-21,-28,42,26);c.strokeStyle=C.ink;c.beginPath();c.moveTo(0,-28);c.lineTo(0,-2);c.stroke();label(c,'100│100',0,-15,7,C.ink)}
 else if(k==='loop'){c.strokeStyle=C.accent;c.lineWidth=7;c.beginPath();c.arc(0,-13,25,.3,5.4);c.stroke();poly(c,[[21,-32],[33,-29],[24,-20]],C.accent,null);label(c,'ROLLBACK',0,-13,7,C.ink)}
 else if(k==='refresh'){c.strokeStyle=C.water;c.lineWidth=6;c.beginPath();c.arc(0,-18,23,.4,5.7);c.stroke();poly(c,[[20,-36],[32,-33],[24,-24]],C.water,null);label(c,'RELOAD',0,-18,7,C.ink)}
 else if(k==='queue'){for(let i=0;i<3;i++){box(c,-18+i*18,3-i*2,26,22,15,i?C.steel:C.accent)}label(c,'QUEUE',0,-25,7,C.ink)}
 else if(k==='api'||k==='service'){box(c,0,6,70,42,40,k==='api'?C.blue:'#a77d63');label(c,k.toUpperCase(),0,-26,9,C.paper)}
 else if(k==='port'){c.fillStyle=C.paper;c.strokeStyle=C.dark;c.lineWidth=5;c.beginPath();c.arc(0,-19,25,0,Math.PI*2);c.fill();c.stroke();for(const dx of [-8,8]){c.fillStyle=C.dark;c.beginPath();c.arc(dx,-20,4,0,Math.PI*2);c.fill()}label(c,'PORT',0,4,7,C.ink)}
 else if(k==='switch'){c.strokeStyle=C.dark;c.lineWidth=5;c.beginPath();c.moveTo(-35,5);c.lineTo(0,-10);c.lineTo(34,-30);c.moveTo(0,-10);c.lineTo(34,8);c.stroke();c.fillStyle=C.accent;c.beginPath();c.arc(0,-10,8,0,Math.PI*2);c.fill()}
 else if(k==='github'||k==='fake'){box(c,0,6,66,40,38,k==='github'?C.dark:C.purple);label(c,k==='github'?'GITHUB':'FAKE',0,-25,8,C.paper)}
 else if(k==='cloud'){c.fillStyle='#dbe4df';for(const [dx,dy,r] of [[-18,-15,14],[0,-27,19],[20,-14,15],[2,-8,23]]){c.beginPath();c.arc(dx,dy,r,0,Math.PI*2);c.fill()}label(c,'API',0,-16,8,C.ink)}
 else if(k==='mapper'||k==='collector'){box(c,0,5,67,39,29,k==='mapper'?C.water:'#b59163');label(c,k==='mapper'?'MAP → Commit[]':'COMMITS',0,-20,7,C.ink)}
 else if(k==='llm'){box(c,0,6,70,42,42,C.purple);c.fillStyle=C.dark;c.fillRect(-23,-42,46,23);label(c,'LLM',0,-30,10,C.paper)}
 else {box(c,0,5,64,38,34,C.wall);label(c,node.label.slice(0,9),0,-23,7,C.ink)}
 c.restore();
}

function cargoCart(c,x,y,value,t){c.save();c.translate(x,y-11+Math.sin(t/95)*1.3);box(c,0,0,34,22,14,C.accent);c.fillStyle=C.dark;for(const dx of [-11,11]){c.beginPath();c.arc(dx,7,5,0,Math.PI*2);c.fill()}const short=value.length>12?`${value.slice(0,11)}…`:value;label(c,short,0,-15,7,C.ink);c.restore()}

export function createConceptPark(canvas,{onStop}={}){
 const c=canvas.getContext('2d');let map=null,scenario='',step=0,signs=true,paused=false,w=0,h=0,dpr=1;let camera={x:0,y:-220,scale:.72,ready:false},target=null,dragging=false,lastPointer=null,dragStart=null;let simTime=0,lastFrame=performance.now();let journey=null;
 const nodeById=id=>map.nodes.find(node=>node.id===id);
 function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);if(!camera.ready)fit()}
 function fit(){
  if(!map){camera={x:0,y:0,scale:.7,ready:true};return}
  const points=map.nodes.map(node=>iso(node.x,node.y)),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const bounds={left:Math.min(...xs)-100,right:Math.max(...xs)+100,top:Math.min(...ys)-115,bottom:Math.max(...ys)+90};
  const scale=Math.max(.4,Math.min(1.12,Math.min(w/(bounds.right-bounds.left),Math.max(320,h-30)/(bounds.bottom-bounds.top))));
  camera={x:-(bounds.left+bounds.right)/2,y:(h/2-68)/scale-(bounds.top+bounds.bottom)/2,scale,ready:true};target=null;
 }
 function focus(index,soft=false){if(!map)return;const node=nodeById(map.stops[index].focus),p=iso(node.x,node.y);target={x:-p.x,y:-p.y+Math.min(260,h*.3)/camera.scale};if(!soft){camera.x=target.x;camera.y=target.y;target=null}}
 function screen(node){const p=iso(node.x,node.y);return{x:w/2+(p.x+camera.x)*camera.scale,y:68+(p.y+camera.y)*camera.scale}}
 function pathBetween(fromId,toId){
  if(fromId===toId)return[nodeById(fromId),nodeById(toId)];const graph=new Map(map.nodes.map(n=>[n.id,new Set()]));
  for(const road of map.roads)for(let i=1;i<road.length;i++){graph.get(road[i-1])?.add(road[i]);graph.get(road[i])?.add(road[i-1])}
  const q=[fromId],prev=new Map([[fromId,null]]);while(q.length){const id=q.shift();if(id===toId)break;for(const n of graph.get(id)||[])if(!prev.has(n)){prev.set(n,id);q.push(n)}}
  if(!prev.has(toId))return[nodeById(fromId),nodeById(toId)];const ids=[];for(let at=toId;at;at=prev.get(at))ids.unshift(at);return ids.map(nodeById);
 }
 function pointAlong(path,p){if(path.length<2)return path[0];const lengths=[];let total=0;for(let i=1;i<path.length;i++){const n=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);lengths.push(n);total+=n}let left=p*total;for(let i=0;i<lengths.length;i++){if(left<=lengths[i]){const k=left/lengths[i];return{x:path[i].x+(path[i+1].x-path[i].x)*k,y:path[i].y+(path[i+1].y-path[i].y)*k}}left-=lengths[i]}return path.at(-1)}
 function setMap(nextMap,nextScenario,nextStep=0,animate=false){map=nextMap;scenario=nextScenario;step=nextStep;journey=null;camera.ready=false;if(w&&h)fit();if(animate&&w&&h)focus(step,true)}
 function setScene(nextScenario,nextStep,previous=step,animate=true){scenario=nextScenario;const from=map.stops[previous]?.focus,to=map.stops[nextStep].focus;step=nextStep;journey=animate?{started:performance.now(),path:pathBetween(from,to),duration:1100}:null}
 function drawGround(){
  for(let sum=0;sum<38;sum++)for(let x=0;x<27;x++){const y=sum-x;if(y<0||y>15)continue;const p=iso(x,y);diamond(c,p.x,p.y,TILE_W,TILE_H,(x+y)%2?C.grass:C.grassAlt,C.edge)}
  if(map.shape==='split'){const a=iso(2,2),b=iso(23,6);diamond(c,(a.x+b.x)/2,(a.y+b.y)/2+5,760,130,'#88a45e','#536f45');const d=iso(2,9),e=iso(23,13);diamond(c,(d.x+e.x)/2,(d.y+e.y)/2+5,760,150,'#7f9290','#526560');label(c,'브라우저의 시간',-195,135,13,C.paper);label(c,'서버의 시간',110,315,13,C.paper)}
  if(map.shape==='race'){const p=iso(10,7);diamond(c,p.x,p.y,280,118,C.water,'#4e7778')}
  if(map.shape==='loop'){const p=iso(13,8);diamond(c,p.x,p.y,420,190,'#8ca35d','#5b7548')}
  if(map.shape==='factory'){const p=iso(14,7);diamond(c,p.x,p.y,650,135,'#87918c','#59645f')}
 }
 function drawRoads(){for(const road of map.roads){const points=road.map(id=>iso(nodeById(id).x,nodeById(id).y));c.strokeStyle=C.roadEdge;c.lineWidth=28;c.lineJoin='round';c.lineCap='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.strokeStyle=C.road;c.lineWidth=21;c.stroke();if(map.shape==='branch'||map.shape==='race'){c.setLineDash([9,8]);c.strokeStyle='#6b6350';c.lineWidth=2;c.stroke();c.setLineDash([])}}}
 function drawDecor(){for(let i=0;i<18;i++){const x=1+(i*7)%25,y=1+(i*5)%14;if(map.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<2.1))continue;const p=iso(x,y);tree(c,p.x,p.y,i)}map.roads.forEach((road,r)=>road.slice(1,-1).forEach((id,i)=>{if(i%2)return;const n=nodeById(id),p=iso(n.x+.4,n.y-.5);lamp(c,p.x,p.y,Math.floor(simTime/90)+r+i)}))}
 function draw(now){const dt=Math.min(50,now-lastFrame);lastFrame=now;if(!paused)simTime+=dt;if(target){camera.x+=(target.x-camera.x)*.09;camera.y+=(target.y-camera.y)*.09;if(Math.abs(camera.x-target.x)<.5)target=null}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.fillStyle=C.grass;c.fillRect(0,0,w,h);if(!map){requestAnimationFrame(draw);return}
  c.save();c.translate(w/2+camera.x*camera.scale,68+camera.y*camera.scale);c.scale(camera.scale,camera.scale);drawGround();drawRoads();drawDecor();
  const stopsByFocus=new Map();map.stops.forEach((s,i)=>{if(!stopsByFocus.has(s.focus))stopsByFocus.set(s.focus,[]);stopsByFocus.get(s.focus).push(i)});
  [...map.nodes].sort((a,b)=>a.x+a.y-(b.x+b.y)).forEach(node=>{const p=iso(node.x,node.y);drawNode(c,node,p.x,p.y,simTime,map.stops[step].focus===node.id,scenario);if(signs&&stopsByFocus.has(node.id)){const choices=stopsByFocus.get(node.id),number=choices.includes(step)?step+1:choices[0]+1,stopData=map.stops[number-1];sign(c,p.x,p.y+25,number,node.label,choices.includes(step),choices.some(i=>i<=step))}});
  let cartPoint=nodeById(map.stops[step].focus);if(journey){const progress=Math.min(1,(now-journey.started)/journey.duration);cartPoint=pointAlong(journey.path,progress);if(progress>=1)journey=null}const cp=iso(cartPoint.x,cartPoint.y);cargoCart(c,cp.x,cp.y,map.stops[step].cargo,simTime);
  c.restore();requestAnimationFrame(draw)}
 function hit(sx,sy){let best=null,d=56;map.stops.forEach((stop,i)=>{const p=screen(nodeById(stop.focus)),v=Math.hypot(p.x-sx,p.y-sy);if(v<d){d=v;best=i}});return best}
 canvas.addEventListener('pointerdown',event=>{dragging=true;lastPointer={x:event.clientX,y:event.clientY};dragStart={...lastPointer};canvas.setPointerCapture(event.pointerId)});
 canvas.addEventListener('pointermove',event=>{if(!dragging)return;camera.x+=(event.clientX-lastPointer.x)/camera.scale;camera.y+=(event.clientY-lastPointer.y)/camera.scale;lastPointer={x:event.clientX,y:event.clientY}});
 canvas.addEventListener('pointerup',event=>{const moved=Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y);dragging=false;if(moved<5){const r=canvas.getBoundingClientRect(),found=hit(event.clientX-r.left,event.clientY-r.top);if(found!==null)onStop?.(found)}});
 canvas.addEventListener('wheel',event=>{event.preventDefault();camera.scale=Math.max(.4,Math.min(1.8,camera.scale*(event.deltaY>0?.9:1.1)))},{passive:false});
 new ResizeObserver(resize).observe(canvas);requestAnimationFrame(draw);
 return{setMap,setScene,fit,focus,zoomBy(value){camera.scale=Math.max(.4,Math.min(1.8,camera.scale*value))},setSigns(value){signs=value},setPaused(value){paused=value}};
}
