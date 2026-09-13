// Six different visual models; shared primitives are drawing tools, not a shared map.
const C={ink:'#29382f',paper:'#f4ecd5',line:'#70816a',green:'#4b7351',red:'#b4513f',gold:'#ddac43',goldDark:'#9c7332',blue:'#648986',shade:'#d5cfb5',floor:'#e4e5cd'};
export function createScene(canvas,onAction){
 const ctx=canvas.getContext('2d');let hits=[],scale=1,offsetX=0,offsetY=0,small=false;
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 function text(t,x,y,size=15,color=C.ink,align='center'){ctx.font=`${size>=18?'700':'500'} ${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(t),Math.round(x),Math.round(y));}
 function line(x,y,a,b,c=C.line,w=3){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();}
 function poly(p,c){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=c;ctx.fill();}
 function slab(x,y,w,h,c=C.paper){rect(x+6,y+7,w,h,'#b3bba2');rect(x,y,w,h,C.ink);rect(x+2,y+2,w-4,h-4,c);}
 function machine(x,y,w,h,title,c=C.paper){poly([[x,y],[x+12,y-12],[x+w+12,y-12],[x+w,y]],'#d9d4b9');poly([[x+w,y],[x+w+12,y-12],[x+w+12,y+h-12],[x+w,y+h]],'#899780');slab(x,y,w,h,c);text(title,x+w/2,y+26,16);line(x+8,y+38,x+w-8,y+38,'#b6baa3',1);}
 function token(x,y,label='T',c=C.gold){rect(x-16,y-12,32,24,C.ink);rect(x-14,y-14,28,28,C.ink);rect(x-12,y-11,24,22,c);rect(x-8,y-8,5,3,'#ffe6a4');text(label,x,y+5,13);}
 function coin(x,y){rect(x-9,y-5,18,10,C.goldDark);rect(x-7,y-8,14,13,C.gold);rect(x-4,y-6,3,6,'#f8d885');}
 function coins(x,y,count){for(let i=0;i<count;i++)coin(x+(i%5)*21,y-Math.floor(i/5)*19);}
 function person(x,y,name,c=C.blue){rect(x-9,y-32,18,14,'#d5aa7c');rect(x-11,y-36,22,6,C.ink);rect(x-13,y-17,26,28,c);rect(x-10,y+11,7,15,C.ink);rect(x+3,y+11,7,15,C.ink);text(name,x,y+48,15);}
 function arrow(x,y,a,b,c=C.green,dashed=false){ctx.setLineDash(dashed?[6,6]:[]);line(x,y,a,b,c,3);ctx.setLineDash([]);const angle=Math.atan2(b-y,a-x);poly([[a,b],[a-10*Math.cos(angle-.5),b-10*Math.sin(angle-.5)],[a-10*Math.cos(angle+.5),b-10*Math.sin(angle+.5)]],c);}
 function tag(t,x,y,c=C.ink){ctx.font='600 13px system-ui';const w=ctx.measureText(t).width+18;rect(x-w/2,y-17,w,25,C.paper);text(t,x,y,13,c);}
 function check(x,y,good){if(good){line(x-8,y,x-2,y+7,C.green,4);line(x-2,y+7,x+10,y-9,C.green,4);}else{line(x-8,y-8,x+8,y+8,C.red,4);line(x+8,y-8,x-8,y+8,C.red,4);}}
 function hit(x,y,w,h,action,label){hits.push({x,y,w,h,action,label});}
 const lerp=(a,b,t)=>a+(b-a)*t;
 function movingToken(a,b,t,label='T',color){token(lerp(a[0],b[0],t),lerp(a[1],b[1],t)-Math.sin(t*Math.PI)*25,label,color);}
 function floor(w,h){rect(0,0,w,h,C.floor);for(let x=0;x<w;x+=24)for(let y=0;y<h;y+=24)rect(x,y,1,1,'#cad3ba');}

 function atomic(s,prev,t,w,h){
  const cx=w/2,cy=small?280:240,ay=small?125:220,ax=small?85:130,bx=small?w-85:w-130,by=small?470:220;
  text(s.atomic?'하나의 명령 안에서 읽고 삭제':'두 명령 사이에 끼어드는 요청',cx,42,small?19:23);
  person(ax,ay,'요청 A',C.blue);person(bx,by,'요청 B',C.red);
  machine(cx-80,cy-65,160,130,'Redis',s.atomic?'#d5e1c7':C.paper);
  text(s.token?'원본이 남아 있음':'원본 없음',cx,cy+46,13,s.token?C.ink:C.red);
  if(s.token)token(cx,cy+2);else{ctx.setLineDash([3,4]);ctx.strokeStyle=C.line;ctx.strokeRect(cx-15,cy-12,30,28);ctx.setLineDash([]);text('∅',cx,cy+9,22);}
  arrow(cx-86,cy,ax+32,ay-8,C.blue,true);arrow(cx+86,cy,bx-30,by-8,C.red,true);
  for(const [who,x,y,c] of [['A',ax,ay,C.blue],['B',bx,by,C.red]]){
   const r=s[who],recent=s.last===`read${who}`&&t<1;
   if(r.copy&&!recent)token(x,y-65,'T',c);if(recent&&r.copy)movingToken([cx,cy],[x,y-65],t,'T',c);
   if(r.read&&!r.copy)tag('null · 빈손',x,y-58,C.red);
   tag(r.done?(r.copy?'새 토큰 발급':'발급 거절'):r.read?(r.copy?'복사본 보유':'토큰 없음'):'클릭하여 읽기',x,y+73,r.done?C.green:C.ink);
   hit(x-50,y-100,100,145,`read${who}`,`${who} 읽기`);
  }
  const yy=small?590:425;slab(cx-135,yy-27,270,80);text('새로 발급한 토큰',cx,yy-4,14);for(let i=0;i<s.issued;i++)token(cx-22+i*44,yy+25,'NEW');if(!s.issued)text('아직 없음',cx,yy+28,14,C.line);
  text(s.atomic?'반환 + 삭제 = GETDEL 1회':'GET은 원본을 옮기지 않고 값을 복사한다',cx,small?370:355,14);
 }
 function transaction(s,prev,t,w,h){
  const y=small?210:225,ax=small?94:210,bx=small?w-100:w-210;
  text('작업 중인 장부',w/2,42,23);tag(s.together?'BEGIN ── 두 계좌를 함께 묶음':'각 계좌를 따로 커밋',w/2,79,s.together?C.green:C.red);
  if(s.together){ctx.setLineDash([7,6]);ctx.strokeStyle=C.green;ctx.lineWidth=2;ctx.strokeRect(25,103,w-50,small?234:235);ctx.setLineDash([]);}
  for(const [name,x,n] of [['A',ax,s.A],['B',bx,s.B]]){machine(x-65,y-70,130,155,`계좌 ${name}`);const shown=name==='A'&&s.phase==='rolledback'&&t<1?prev.A:name==='B'&&s.last==='deposit'&&s.phase==='deposited'&&t<1?prev.B:n;coins(x-43,y+39,Math.floor(shown/10));text(n,x,y-6,26);}
  arrow(ax+78,y-10,bx-77,y-10,C.goldDark);tag('이체 30',w/2,y-31);
  if(s.phase==='failed'||s.phase==='partial'||s.phase==='rolledback'){check(bx,y+114,false);text('입금 실패',bx,y+143,14,C.red);}
  if(t<1&&s.last==='withdraw')for(let i=0;i<3;i++)coin(lerp(ax+i*15,w/2-15+i*15,t),lerp(y+35,y+85,t));
  if(['withdrawn','failed'].includes(s.phase)&&!(s.last==='withdraw'&&t<1)){for(let i=0;i<3;i++)coin(w/2-20+i*20,y+85);tag('입금 예정 30',w/2,y+113);}
  if(t<1&&s.last==='deposit'&&s.phase==='deposited')for(let i=0;i<3;i++)coin(lerp(w/2-20+i*20,bx+i*15,t),lerp(y+85,y+35,t));
  if(t<1&&s.last==='settle'&&s.phase==='rolledback'){for(let i=0;i<3;i++)coin(lerp(w/2-15+i*15,ax+i*15,t),lerp(y+85,y+35,t));}
  if(s.phase==='rolledback')tag('ROLLBACK · 출금 취소',ax,y+117,C.green);
  const ly=small?445:423;slab(32,ly-32,w-64,132,'#faf4e1');text('다른 요청이 보는 확정 장부',w/2,ly-5,17);text(`A  ${s.committedA}`,w*.28,ly+32,23);text(`B  ${s.committedB}`,w*.72,ly+32,23);text(`합계  ${s.committedA+s.committedB}`,w/2,ly+75,19,s.committedA+s.committedB===200?C.green:C.red);
  text('동전 1개 = 10 · 이동은 DB 변경의 비유',w/2,h-25,13,C.line);hit(ax-65,y-70,130,155,'withdraw','30 출금');hit(bx-65,y-70,130,155,'deposit','입금 시도');
 }
 function auth(s,prev,t,w,h){
  text('주소를 안다 ≠ 열 권한이 있다',w/2,42,small?20:23);
  const py=small?150:235,px=small?70:110;person(px,py,'사용자 A');
  if(s.user){slab(px-38,py-102,76,37,'#d6e0c9');text('쿠키 s7',px,py-78,13);}else tag('로그인 전',px,py-66,C.red);
  const sx=small?160:235,sy=small?100:130;machine(sx,sy,small?190:240,110,'서버 세션');text(s.sid?'s7 → 사용자 A':'세션 없음',sx+(small?95:120),sy+77,18);
  if(s.last==='login'&&t<1)movingToken([sx+50,sy+70],[px,py-85],t,'s7',C.blue);
  const gy=small?292:330;line(35,gy,w-35,gy,s.check?C.red:'#9ba890',7);rect(w/2-50,gy-18,100,34,C.paper);text(s.check?'소유권 검사':'검사 생략',w/2,gy+5,15,s.check?C.red:C.line);
  const ly=small?370:405,lw=small?120:180;for(const [who,x] of [['A',small?45:175],['B',small?225:w-345]]){
   const opened=s.opened===who;machine(x,ly,lw,135,`${who}의 보관함`,opened?'#d6e0c9':C.paper);rect(x+20,ly+48,lw-40,65,opened?'#f6e8ac':'#7d8b78');if(opened){text(`${who}의 카드`,x+lw/2,ly+84,15);check(x+lw/2,ly+109,true);if(t<1&&s.last==='open')rect(x+20,ly+48,(lw-40)*(1-t),65,'#7d8b78');}else{rect(x+lw/2-9,ly+70,18,20,C.gold);ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.strokeRect(x+lw/2-6,ly+61,12,15);}
   text(s.uuid?(who==='A'?'주소: 8f2…':'주소: b91…'):`주소: ${who==='A'?1:2}`,x+lw/2,ly+158,13);
   if(s.target===who){arrow(x+lw/2,ly-41,x+lw/2,ly-12,C.goldDark);tag('선택',x+lw/2,ly-53);}
   hit(x,ly,lw,135,`target${who}`,`${who} 보관함 선택`);
  }
  if(s.last==='open'){if(s.denied){check(w/2,gy-57,false);tag(s.user?'A ≠ B · 거절':'401 · 인증 필요',w/2,gy-26,C.red);}else if(s.opened)tag(s.opened==='A'?'내 카드 열림':'남의 카드 유출',w/2,gy-30,s.opened==='A'?C.green:C.red);}
  hit(px-45,py-50,90,100,'login','로그인');
 }
 function polling(s,prev,t,w,h){
  text('서로 다른 두 생명주기',w/2,42,23);
  const bw=small?w-72:310,bx=small?30:42,by=small?90:130,sx=small?30:w-350,sy=small?365:130;
  machine(bx,by,bw,small?210:250,'브라우저',C.paper);rect(bx+15,by+51,bw-30,small?145:160,'#d8dfcc');
  text(`JS 메모리: ${s.memory?'jobId = 42':'비어 있음'}`,bx+bw/2,by+78,15);text(s.screen,bx+bw/2,by+116,18,s.screen==='초기화'?C.red:C.ink);
  if(s.screen==='완료'){slab(bx+bw/2-42,by+131,84,55,'#f5df9d');text('분석 결과',bx+bw/2,by+165,14);}
  if(s.last==='refresh'&&t<1){rect(bx+15,by+51,(bw-30)*(1-t),small?145:160,'#f3f1e3');}
  machine(sx,sy,bw,small?180:250,'서버 작업 / Job 42','#d6e0c9');text(s.server,sx+bw/2,sy+77,19);rect(sx+20,sy+96,bw-40,28,'#aeba9d');rect(sx+20,sy+96,(bw-40)*s.progress/100,28,C.green);text(`${s.progress}%`,sx+bw/2,sy+116,14,'#fff');text(s.job?'저장된 작업: 42':'작업 없음',sx+bw/2,sy+151,15);
  if(small){arrow(w/2,by+225,w/2,sy-15,C.blue,true);tag(s.memory?'GET /jobs/42':'jobId 없음 · 연결 끊김',w/2,sy-38,s.memory?C.green:C.red);}else{arrow(bx+bw+10,by+125,sx-15,sy+125,C.blue,true);tag(s.memory?'상태 조회':'ID 없음',w/2,by+108,s.memory?C.green:C.red);}
  if(s.last==='poll'&&s.memory&&t<1)movingToken([sx+bw/2,sy+80],[bx+bw/2,by+115],t,'상태',C.blue);
  text('새로고침은 서버 작업을 되감지 않는다',w/2,small?602:445,16,C.green);
  text(`브라우저가 받은 상태 응답 ${s.queries}회`,w/2,small?631:481,14);
  hit(bx,by,bw,small?210:250,'refresh','브라우저 새로고침');hit(sx,sy,bw,small?180:250,'tick','서버 진행');
 }
 function ports(s,prev,t,w,h){
  text('내부는 외부 기술을 모른다',w/2,42,23);
  const x=small?35:60,y=small?90:150,ww=small?w-70:260;machine(x,y,ww,150,'카드 업무 · 내부',C.paper);text('read(repo)',x+ww/2,y+80,21);text('업무 코드 변경: 0',x+ww/2,y+119,14,C.green);
  const px=small?70:390,py=small?285:155,pw=small?w-140:100;slab(px,py,pw,80,'#d2dbc3');text('포트',px+pw/2,py+28,18);text('CommitReader',px+pw/2,py+55,small?16:11);
  if(small)arrow(w/2,y+155,w/2,py-10);else arrow(x+ww+5,y+72,px-10,py+40);
  const ax=small?30:565,ay=small?405:100,aw=small?150:210,ah=110;
  for(const [type,xx,yy,name] of [['github',ax,ay,'GitHub 어댑터'],['fake',small?w-180:ax,small?ay:ay+190,'테스트 어댑터']]){
   const selected=s.adapter===type;machine(xx,yy,aw,ah,name,selected?'#d8e3c8':'#dedccb');text(type==='github'?'HTTP → Commit[]':'고정값 → Commit[]',xx+aw/2,yy+74,small?12:15);if(selected){rect(xx-12,yy+38,12,35,C.gold);tag('연결됨',xx+aw/2,yy-23,C.green);}
   const dest=[xx,yy+56],start=[px+pw,py+40];if(small){start[0]=px+pw/2;start[1]=py+80;dest[0]=xx+aw/2;dest[1]=yy-13;}
   if(selected){const f=s.last===type?t:1;line(start[0],start[1],lerp(start[0],dest[0],f),lerp(start[1],dest[1],f),C.goldDark,5);}
   hit(xx,yy,aw,ah,type,name);
  }
  const ry=small?576:460;tag(s.result?'반환: Commit[] · a1b2c3':'장치를 연결하고 커밋을 요청하세요',w/2,ry,C.green);text(`모의 HTTP 호출 ${s.network}회`,w/2,ry+34,15);
  text('소스 의존: 어댑터 → 내부 포트',w/2,h-22,13,C.line);
  if(s.last==='read'&&t<1)movingToken([small?w/2:650,small?480:250],[x+ww/2,y+80],t,'자료',C.blue);
 }
 function evidence(s,prev,t,w,h){
  text('주장과 기록을 맞대어 보기',w/2,42,23);
  const dx=small?26:56,dy=small?96:130,dw=small?164:280,rx=small?214:w-336;
  slab(dx,dy,dw,small?250:265,'#f6eac8');slab(rx,dy,dw,small?250:265,'#dce4cf');
  text('LLM 초안',dx+dw/2,dy+28,18);text('실제 커밋 기록',rx+dw/2,dy+28,small?16:18);
  if(s.draft){text(s.draft.sha,dx+dw/2,dy+82,20);text(s.draft.claim,dx+dw/2,dy+122,small?12:17);tag(s.checks?(s.checks.context?'근거 확인됨':'근거 불충분'):'아직 주장일 뿐',dx+dw/2,dy+181,s.checks?.context?C.green:C.red);}else{text(s.phase==='empty'?'자료 없음':s.phase==='collected'?'수집한 기록':'규칙으로 압축한 후보',dx+dw/2,dy+100,13);text('초안을 만들어보세요',dx+dw/2,dy+133,12);}
  if(s.phase!=='empty'){text('a1b2c3',rx+dw/2,dy+82,20);text('로그인 오류 수정',rx+dw/2,dy+122,small?12:17);text('같은 저장소 · 작성자',rx+dw/2,dy+157,small?11:14);text('실제 diff 확인',rx+dw/2,dy+191,13,C.green);}else text('먼저 수집',rx+dw/2,dy+108,16);
  if(s.checks){check(dx+dw-20,dy+77,s.checks.exists);check(dx+dw-20,dy+149,s.checks.context);}
  if(s.last==='verify'&&t<1){rect(dx,dy+50+180*t,rx+dw-dx,3,C.green);}
  const gy=small?409:442;rect(35,gy,w-70,9,s.checks?.exists&&s.checks?.context?C.green:C.red);tag(s.checks?(s.checks.exists&&s.checks.context?'근거 검문: 통과':'근거 검문: 차단'):'근거 검문: 아직 미검증',w/2,gy-20,s.checks?.context?C.green:C.red);
  if(s.shipped){slab(w/2-60,gy+28,120,69,'#f1dc99');text('확정 카드',w/2,gy+69,19);}else{rect(w/2-62,gy+31,124,63,'#c8ccb8');text('출고 대기',w/2,gy+70,18,C.line);}
  text(`LLM ${s.llm}회 · 검증은 원본 기록으로`,w/2,h-28,14);hit(dx,dy,dw,250,'generate','초안 생성');hit(rx,dy,dw,250,'verify','근거 검증');
 }
 const scenes={atomic,transaction,auth,polling,ports,evidence};
 function draw(state,previous,progress=1){
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  small=width<620;const w=small?404:850,h=small?({atomic:680,transaction:600,auth:600,polling:660,ports:650,evidence:600}[state.id]):570;scale=Math.min(width/w,height/h);offsetX=(width-w*scale)/2;offsetY=(height-h*scale)/2;
  ctx.setTransform(dpr,0,0,dpr,0,0);rect(0,0,width,height,C.floor);ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;hits=[];floor(w,h);scenes[state.id](state,previous,progress,w,h);
 }
 canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-offsetX)/scale,y=(e.clientY-r.top-offsetY)/scale;const h=hits.find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);if(h)onAction(h.action);});
 canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-offsetX)/scale,y=(e.clientY-r.top-offsetY)/scale;canvas.style.cursor=hits.some(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)?'pointer':'default';});
 return {draw};
}
