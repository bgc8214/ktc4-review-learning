import {experiments,initial,act,available,metrics} from './experiments.mjs';
import {worlds} from './worlds.mjs';
import {createPark} from './park.js';

const $=id=>document.getElementById(id);
const order=['auth','atomic','transaction','polling','ports','evidence'];
const copy={
 auth:{act:'투어 1 · 인증과 안전',problem:'A로 로그인한 사람이 B의 카드 주소를 알아냈습니다. UUID 주소만 복잡하게 만들면 남의 카드를 막을 수 있을까요?',observe:'노란 요청 차량이 ID 센터를 지나 보관함으로 갑니다. “소유권 검사”를 끄고 B 보관함을 열면 검문봉이 열리는지 보세요.',cargo:'A의 요청'},
 atomic:{act:'투어 2 · 동시성과 원자성',problem:'요청 A와 B가 거의 동시에 같은 재발급 토큰을 읽습니다. 둘 모두 새 토큰을 받는 순간이 생길까요?',observe:'항구의 TOKEN 탱크와 A·B 표시를 보세요. GETDEL을 켜면 한 차량이 가져간 순간 탱크가 비고, 다른 차량은 빈손이 됩니다.',cargo:'재발급 토큰'},
 transaction:{act:'투어 3 · 함께 성공하거나 취소',problem:'A 계좌에서 30을 뺀 뒤 B 계좌 입금이 실패했습니다. 돈 30이 사라지지 않게 무엇을 묶어야 할까요?',observe:'두 은행 건물의 확정 잔액과 가운데 동전을 보세요. 트랜잭션을 끄면 A=70만 확정되어 총액이 170이 됩니다.',cargo:'이체 30'},
 polling:{act:'투어 4 · 화면 밖에서도 일하는 Job',problem:'오래 걸리는 분석 중 사용자가 다른 화면으로 가거나 새로고침했습니다. 서버의 작업도 같이 사라질까요?',observe:'공장 굴뚝은 서버 작업이 계속됨을 뜻합니다. 화면 전광판은 폴링할 때만 바뀌고, 새로고침 뒤에는 jobId를 다시 찾아야 합니다.',cargo:'job #42'},
 ports:{act:'투어 5 · 장치 교체와 포트',problem:'GitHub 연동 없이도 업무 로직을 테스트하고 싶습니다. 업무 코드를 고치지 않고 외부 장치만 바꿀 수 있을까요?',observe:'공방 앞 선로 분기기가 GIT 창고와 FAKE 창고 사이에서 움직입니다. 어느 길이어도 업무가 받는 결과는 Commit[]입니다.',cargo:'커밋 요청'},
 evidence:{act:'투어 6 · AI 초안과 결정적 검증',problem:'LLM이 자연스러운 설명에 존재하지 않는 SHA를 붙였습니다. 다시 LLM에게 묻는 것만으로 사실이 될까요?',observe:'LLM 초안소 뒤에 별도의 SHA 검문소가 있습니다. 실제 GitHub 기록과 맞지 않으면 카드 차량은 출고장에 도착하지 못합니다.',cargo:'카드 초안'}
};
const optionDefaults={auth:{enabled:true,uuid:true},atomic:{enabled:false},transaction:{enabled:true,fail:true},polling:{enabled:true},ports:{},evidence:{kind:'missing'}};
const states=new Map(order.map(id=>[id,initial(id,optionDefaults[id])]));
const visited=new Set();
const completed=new Set();
let selected=order.includes(new URLSearchParams(location.search).get('experiment'))?new URLSearchParams(location.search).get('experiment'):'auth';
let playing=false,runs=0,autoTimer=0,autoIndex=0,lastTime=performance.now();
let trip=null;

const park=createPark($('park'),{onStation:travelTo});
visited.add(selected);park.setState(selected,states.get(selected));park.fit();

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function currentWorld(){return worlds.find(w=>w.id===selected)}
function missionFor(id,s){
 if(id==='auth')return [['A로 로그인하기',Boolean(s.user)],['B의 카드 선택하기',s.target==='B'&&s.revision>=2],['소유권 검사 결과 확인하기',Boolean(s.opened||s.denied)]];
 if(id==='atomic')return [['A와 B가 같은 토큰 읽기',s.A.read&&s.B.read],['두 요청의 발급 마무리',s.A.done&&s.B.done],['중복 발급 수 확인하기',s.A.done&&s.B.done]];
 if(id==='transaction')return [['A에서 30 출금하기',s.phase!=='ready'],['B 입금 결과 만들기',!['ready','withdrawn'].includes(s.phase)],['커밋 또는 롤백 확인하기',['rolledback','partial','committed'].includes(s.phase)]];
 if(id==='polling')return [['분석 Job 접수하기',Boolean(s.job)],['서버 작업을 100%까지 진행하기',s.progress===100],['폴링으로 완료 화면 받기',s.screen==='완료']];
 if(id==='ports')return [['GitHub 어댑터로 읽기',s.network>0],['Fake 어댑터로 바꾸기',s.adapter==='fake'||s.requests>1],['같은 Commit[] 결과 확인하기',s.requests>=2]];
 return [['원본 수집 후 후보 압축하기',['compressed','generated','verified'].includes(s.phase)],['LLM 초안을 실제 기록과 검증하기',Boolean(s.checks)],['출고 허용 또는 차단 확인하기',s.last==='ship']];
}
function isComplete(id,s){return missionFor(id,s).every(([,done])=>done)}
function resetState(){states.set(selected,initial(selected,optionDefaults[selected]));completed.delete(selected);autoIndex=0;park.setState(selected,states.get(selected));render()}
function settingHtml(){const s=states.get(selected);
 if(selected==='auth')return `<label><input id="settingMain" type="checkbox" ${s.check?'checked':''}> 로그인 사용자와 카드 소유자 비교</label><label><input id="settingUuid" type="checkbox" ${s.uuid?'checked':''}> URL에는 UUID 사용</label>`;
 if(selected==='atomic')return `<label><input id="settingMain" type="checkbox" ${s.atomic?'checked':''}> GET + DEL 대신 GETDEL 사용</label>`;
 if(selected==='transaction')return `<label><input id="settingMain" type="checkbox" ${s.together?'checked':''}> 출금과 입금을 한 트랜잭션으로</label><label><input id="settingFail" type="checkbox" ${s.fail?'checked':''}> B 입금에서 오류 발생</label>`;
 if(selected==='polling')return `<label><input id="settingMain" type="checkbox" ${s.restore?'checked':''}> 내 작업 목록에서 jobId 복원 가능</label>`;
 if(selected==='evidence')return `<label>LLM이 붙인 근거<select id="settingKind"><option value="missing" ${s.kind==='missing'?'selected':''}>존재하지 않는 SHA</option><option value="mismatch" ${s.kind==='mismatch'?'selected':''}>SHA는 있지만 설명이 틀림</option><option value="valid" ${s.kind==='valid'?'selected':''}>SHA와 설명 모두 일치</option></select></label>`;
 return '<p>GIT / FAKE 버튼이 어댑터 교체 스위치입니다.</p>';
}
function render(){const w=currentWorld(),e=experiments[selected],s=states.get(selected),index=order.indexOf(selected);
 if(isComplete(selected,s))completed.add(selected);
 $('stopNo').textContent=`시설 ${index+1} / ${order.length}`;$('title').textContent=e.title;$('problem').textContent=copy[selected].problem;$('observe').textContent=copy[selected].observe;$('actName').textContent=copy[selected].act;
 $('cargo').textContent=copy[selected].cargo;$('completed').textContent=`${completed.size} / ${order.length}`;$('visited').textContent=`${visited.size} / ${order.length}`;$('runs').textContent=String(runs);$('progressBar').style.transform=`scaleX(${Math.max(.05,(index+1)/order.length)})`;
 $('mission').innerHTML=missionFor(selected,s).map(([label,done])=>`<li class="${done?'done':''}"><span>${done?'✓':'·'}</span>${escapeHtml(label)}</li>`).join('');$('completeStamp').hidden=!completed.has(selected);
 $('settings').innerHTML=settingHtml();
 $('actions').innerHTML=e.actions.map(([id,label])=>`<button data-action="${id}" ${available(s,id)?'':'disabled'}>${escapeHtml(label)}</button>`).join('');
 $('message').textContent=s.message;$('metrics').innerHTML=Object.entries(metrics(s)).map(([k,v])=>`<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
 $('foundation').textContent=w.foundation;$('limit').textContent=`이 화면의 한계: ${w.limit}`;
 $('sources').innerHTML=`<a href="./?source=${encodeURIComponent(w.source)}&line=${w.line}#${w.lesson}">학생 질문·멘토 답변 원문 열기</a><a href="./#${w.lesson}">기초부터 읽는 학습 노트</a><a href="${w.official[1]}" target="_blank" rel="noopener noreferrer">${escapeHtml(w.official[0])}</a><a href="${w.blog[1]}" target="_blank" rel="noopener noreferrer">${escapeHtml(w.blog[0])}</a>`;
 $('stops').innerHTML=order.map((id,i)=>`<button data-stop="${id}" class="${visited.has(id)?'seen':''}" ${id===selected?'aria-current="step"':''}>${i+1}. ${escapeHtml(experiments[id].title)}</button>`).join('');
 $('play').textContent=playing?'❙❙':'▶';$('play').setAttribute('aria-label',playing?'자동 투어 일시정지':'자동 투어 재생');
 bind();park.setState(selected,s);park.setCompleted(completed);
 history.replaceState({},'',`./game.html?experiment=${selected}`);
}
function bind(){document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>perform(button.dataset.action));document.querySelectorAll('[data-stop]').forEach(button=>button.onclick=()=>travelTo(button.dataset.stop));
 const main=$('settingMain');if(main)main.onchange=()=>{optionDefaults[selected].enabled=main.checked;resetState()};
 const uuid=$('settingUuid');if(uuid)uuid.onchange=()=>{optionDefaults.auth.uuid=uuid.checked;resetState()};
 const fail=$('settingFail');if(fail)fail.onchange=()=>{optionDefaults.transaction.fail=fail.checked;resetState()};
 const kind=$('settingKind');if(kind)kind.onchange=()=>{optionDefaults.evidence.kind=kind.value;resetState()};
}
function perform(action){const s=states.get(selected);if(!available(s,action))return;states.set(selected,act(s,action));runs++;park.setState(selected,states.get(selected));render()}
function travelTo(id){if(!order.includes(id)||trip)return;if(id===selected){park.focus(id,true);return}const from=selected;trip={from,to:id,progress:0};park.setTrip(trip);playing=false;render()}
function arrive(){selected=trip.to;trip=null;park.setTrip(null);visited.add(selected);if(!completed.has(selected))states.set(selected,initial(selected,optionDefaults[selected]));autoIndex=0;park.setState(selected,states.get(selected));if($('follow').checked)park.focus(selected,true);render()}
function nextStop(){const id=order[(order.indexOf(selected)+1)%order.length];travelTo(id)}
function frame(now){const dt=now-lastTime;lastTime=now;const speed=Number($('speed').value);
 if(trip){trip.progress=Math.min(1,trip.progress+dt/2600*speed);park.setTrip(trip);if(trip.progress>=1)arrive()}
 else if(playing){autoTimer+=dt*speed;if(autoTimer>1450){autoTimer=0;const demo=experiments[selected].demo;while(autoIndex<demo.length&&!available(states.get(selected),demo[autoIndex]))autoIndex++;if(autoIndex<demo.length)perform(demo[autoIndex++]);else{autoIndex=0;playing=false;park.setPaused(false);nextStop()}}}
 requestAnimationFrame(frame)}

$('play').onclick=()=>{playing=!playing;park.setPaused(!playing);autoTimer=0;render()};
$('next').onclick=()=>nextStop();
$('restart').onclick=()=>{selected='auth';trip=null;park.setTrip(null);visited.clear();completed.clear();visited.add(selected);runs=0;order.forEach(id=>states.set(id,initial(id,optionDefaults[id])));park.setState(selected,states.get(selected));park.fit();playing=false;render()};
$('speed').oninput=()=>{$('speedOut').textContent=`${$('speed').value}×`};
$('follow').onchange=()=>{if($('follow').checked)park.focus(selected,true)};
$('signs').onchange=()=>park.setSigns($('signs').checked);
$('zoomIn').onclick=()=>park.zoomBy(1.15);$('zoomOut').onclick=()=>park.zoomBy(.87);$('zoomFit').onclick=()=>park.fit();
function toggleGuide(){const hidden=$('guide').classList.toggle('hidden');$('guideToggle').textContent=hidden?'가이드 보기':'가이드 숨기기'}
$('guideToggle').onclick=toggleGuide;$('guideClose').onclick=()=>{if(innerWidth>650)toggleGuide();else $('park').scrollIntoView({behavior:'smooth'})};
addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();$('play').click()}if(e.key.toLowerCase()==='s')nextStop();if(e.key.toLowerCase()==='r')$('restart').click()});

park.focus(selected,true);render();requestAnimationFrame(frame);
