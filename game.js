import {conceptMaps,conceptMap,sceneStop} from './concept-maps.js';
import {worlds} from './worlds.mjs';
import {createConceptPark} from './park.js';

const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const params=new URLSearchParams(location.search);
let map=conceptMap(params.get('experiment'))||conceptMaps[0];
let scenario=map.scenarios.some(s=>s.id===params.get('scenario'))?params.get('scenario'):map.scenarios[0].id;
let index=Math.max(0,Math.min(map.stops.length-1,Number(params.get('stop'))||0));
let playing=false,autoTimer=0;
const seen=new Map(conceptMaps.map(item=>[item.id,new Set()]));
seen.get(map.id).add(index);

const park=createConceptPark($('park'),{onStop:goTo});
park.setMap(map,scenario,index,false);

function sourceLinks(){
 const source=worlds.find(item=>item.id===map.id);
 if(!source)return '';
 return `<a href="./?source=${encodeURIComponent(source.source)}&line=${source.line}#${source.lesson}">학생 질문과 멘토 답변 원문 열기</a><a href="./#${source.lesson}">기초부터 읽는 학습 노트</a><a href="${source.official[1]}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.official[0])}</a><a href="${source.blog[1]}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.blog[0])}</a>`;
}

function renderSelectors(){
 $('conceptSelect').innerHTML=conceptMaps.map(item=>`<option value="${item.id}" ${item.id===map.id?'selected':''}>${escapeHtml(item.title)}</option>`).join('');
 $('scenarioSelect').innerHTML=map.scenarios.map(item=>`<option value="${item.id}" ${item.id===scenario?'selected':''}>${escapeHtml(item.label)}</option>`).join('');
}

function render(){
 const current=sceneStop(map,scenario,index);
 const currentScenario=map.scenarios.find(item=>item.id===scenario);
 renderSelectors();
 $('seenCount').textContent=`${seen.get(map.id).size} / ${map.stops.length}`;
 $('layerName').textContent=currentScenario.label;
 $('cargo').textContent=current.cargo;
 $('mapSubtitle').textContent=map.subtitle;
 $('conceptName').textContent=map.title;
 $('stopNo').textContent=`STOP ${index+1} OF ${map.stops.length}`;
 $('title').textContent=current.title;
 $('summary').textContent=current.summary;
 $('observe').textContent=current.observe;
 $('progressBar').style.transform=`scaleX(${(index+1)/map.stops.length})`;
 $('detail').innerHTML=current.detail.map((paragraph,i)=>`<p><span>${i+1}</span>${escapeHtml(paragraph)}</p>`).join('');
 $('code').textContent=current.code;
 $('pitfall').textContent=current.pitfall;
 $('state').innerHTML=Object.entries(current.state).map(([key,value])=>`<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
 $('sources').innerHTML=sourceLinks();
 $('stops').innerHTML=map.stops.map((raw,i)=>{
  const stop=sceneStop(map,scenario,i);
  return `<button data-stop="${i}" class="${seen.get(map.id).has(i)?'seen':''}" ${i===index?'aria-current="step"':''}><b>${i+1}</b><span>${escapeHtml(stop.title)}</span></button>`;
 }).join('');
 $('previous').disabled=index===0;
 $('next').textContent=index===map.stops.length-1?'처음부터 보기 ↺':'다음 정류장 →';
 $('play').textContent=playing?'❙❙':'▶';
 $('play').setAttribute('aria-label',playing?'자동 재생 일시정지':'자동 재생');
 history.replaceState({},'',`./game.html?experiment=${map.id}&scenario=${scenario}&stop=${index}`);
 document.querySelectorAll('[data-stop]').forEach(button=>button.onclick=()=>goTo(Number(button.dataset.stop)));
}

function goTo(next,animate=true){
 if(!Number.isInteger(next)||next<0||next>=map.stops.length)return;
 const previous=index;index=next;seen.get(map.id).add(index);
 park.setScene(scenario,index,previous,animate);
 if($('follow').checked)park.focus(index,true);
 autoTimer=0;render();
}
function changeMap(id){
 map=conceptMap(id)||conceptMaps[0];scenario=map.scenarios[0].id;index=0;playing=false;seen.get(map.id).add(0);
 park.setMap(map,scenario,index,true);render();
}
function changeScenario(id){
 scenario=id;index=0;playing=false;seen.set(map.id,new Set([0]));park.setMap(map,scenario,index,true);render();
}
function next(){goTo(index===map.stops.length-1?0:index+1)}
function previous(){if(index>0)goTo(index-1)}

$('conceptSelect').onchange=e=>changeMap(e.target.value);
$('scenarioSelect').onchange=e=>changeScenario(e.target.value);
$('next').onclick=next;
$('previous').onclick=previous;
$('restart').onclick=()=>goTo(0);
$('play').onclick=()=>{playing=!playing;autoTimer=0;park.setPaused(!playing);render()};
$('speed').oninput=()=>{$('speedOut').textContent=`${$('speed').value}×`};
$('follow').onchange=()=>{if($('follow').checked)park.focus(index,true)};
$('signs').onchange=()=>park.setSigns($('signs').checked);
$('zoomIn').onclick=()=>park.zoomBy(1.15);
$('zoomOut').onclick=()=>park.zoomBy(.87);
$('zoomFit').onclick=()=>park.fit();
function toggleGuide(){const hidden=$('guide').classList.toggle('hidden');$('guideToggle').textContent=hidden?'가이드 보기':'가이드 숨기기'}
$('guideToggle').onclick=toggleGuide;
$('guideClose').onclick=()=>{if(innerWidth>680)toggleGuide();else $('park').scrollIntoView({behavior:'smooth'})};
addEventListener('keydown',event=>{
 if(['INPUT','SELECT'].includes(document.activeElement.tagName))return;
 if(event.code==='Space'){event.preventDefault();$('play').click()}
 if(event.key==='ArrowRight')next();
 if(event.key==='ArrowLeft')previous();
});

let last=performance.now();
function tick(now){
 if(playing){autoTimer+=(now-last)*Number($('speed').value);if(autoTimer>6000){next();autoTimer=0}}
 last=now;requestAnimationFrame(tick);
}
render();requestAnimationFrame(tick);
