import { lessons, readingFor } from './lessons.js';
import { guides } from './study-guides.js';

const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let docs = [], archiveError = '', step = 0, scenario = 0, timer = null;
let sourceFromLink = new URLSearchParams(location.search).get('source');
let sourceLineFromLink = Number(new URLSearchParams(location.search).get('line') || 1);
let completed;
try { completed = new Set(JSON.parse(localStorage.getItem('review-study-completed') || '[]')); } catch { completed = new Set(); }
const current = () => lessons.find(l => l.id === location.hash.slice(1)) || lessons[0];
const docLabel = name => name.replace('kyungpook','경북').replace('kangwon','강원').replace('pusan','부산').replace('chonnam','전남').replace('chungnam','충남').replace(/-(\d+)-pr-(\d+)\.md$/, ' $1팀 PR #$2');
function stop() { clearInterval(timer); timer = null; const b = $('play'); if(b) b.textContent = '자동으로 보기'; }
function navigation() {
  const query = $('search').value.trim().toLowerCase();
  const filtered = lessons.filter(l => [l.title,l.intro,...l.terms].join(' ').toLowerCase().includes(query));
  $('topics').innerHTML = [...new Set(filtered.map(l=>l.group))].map(group => `<section><h2>${esc(group)}</h2>${filtered.filter(l=>l.group===group).map(l=>`<a href="#${l.id}" ${current().id===l.id?'aria-current="page"':''}>${completed.has(l.id)?'✓ ':''}${esc(l.title)}</a>`).join('')}</section>`).join('') || '<p>일치하는 개념이 없습니다.</p>';
}
function sourceSections(doc) {
  const lines = doc.text.split('\n');
  const result = [];
  let start=0, role='PR 정보';
  for(let i=0;i<=lines.length;i++) {
    if(i===lines.length || /^#{2,4} /.test(lines[i])) {
      if(i>start) result.push({doc, start, text:lines.slice(start,i).join('\n'),role});
      start=i;
      if(i<lines.length) {
        if(lines[i]==='### 학생 요청 원문') role='학생 PR 본문';
        if(lines[i]==='### Conversation 댓글 원문') role='Conversation';
        if(lines[i].startsWith('#### Conversation 댓글')) role=lines[i].slice(5);
        if(lines[i].startsWith('#### 제출 리뷰')) role=lines[i].slice(5);
        if(lines[i].startsWith('#### 인라인 댓글')) role=lines[i].slice(5);
      }
    }
  }
  return result;
}
function related(lesson) {
  const candidates = docs.flatMap(sourceSections).map(s => ({...s,score:lesson.terms.reduce((v,t)=>v+(s.text.toLowerCase().includes(t.toLowerCase())?1:0),0)})).filter(s=>s.score>0 && s.text.length>80 && !s.text.startsWith('### 분류'));
  candidates.sort((a,b)=> (b.doc.name===lesson.source)-(a.doc.name===lesson.source) || b.score-a.score);
  // Keep both questions and responses discoverable when available.
  const picks=[];
  for(const predicate of [s=>s.role==='학생 PR 본문',s=>s.role.startsWith('제출 리뷰'),s=>s.role.startsWith('Conversation')]) {
    const hit=candidates.find(predicate); if(hit && !picks.includes(hit)) picks.push(hit);
  }
  for(const c of candidates) {if(picks.length>=6) break; if(!picks.includes(c)) picks.push(c);}
  return picks;
}
function render() {
  stop();step=0;scenario=0;navigation();
  const l=current(), index=lessons.indexOf(l), sources=related(l);
  const g=guides[l.id];
  document.title=`${l.title} · 리뷰로 배우는 개발 노트`;
  $('lesson').innerHTML=`<p class="category">${esc(l.group)} · ${index+1} / ${lessons.length}</p>
    <h1>${esc(l.title)}</h1><p class="intro">${esc(l.intro)}</p>
    <nav class="lesson-route" aria-label="이 문서 읽는 순서"><a href="#review-problem">1. 문제</a><a href="#walkthrough">2. 흐름</a><a href="#code-example">3. 코드</a><a href="#real-review">4. 원문</a></nav>
    <section id="review-problem" class="problem"><h2>이 리뷰는 무엇이 문제였을까요?</h2><p>${esc(g.problem)}</p><div class="core"><strong>먼저 이것만 기억하세요</strong><p>${esc(g.core)}</p></div></section>
    <section class="terms"><h2>헷갈리는 말을 먼저 풀어볼게요</h2><dl>${g.terms.map(([term,meaning])=>`<div><dt>${esc(term)}</dt><dd>${esc(meaning)}</dd></div>`).join('')}</dl></section>
    <section class="explanation"><h2>쉽게 비유하면</h2><div class="analogy"><p>${esc(l.analogy)}</p></div><h3>코드에서는 이런 뜻입니다</h3><p>${esc(l.explain)}</p><p class="confusion"><strong>자주 헷갈리는 지점</strong><br>${esc(g.confusion)}</p></section>
    <section id="walkthrough" class="experiment" aria-label="단계별 시뮬레이션"><h2>두 상황을 비교하며 따라가 보기</h2><p class="meta">같은 문제에서 설계 선택만 바꿉니다. 먼저 상황을 고르고 1단계부터 읽어보세요.</p>
    <label for="scenario">비교할 상황</label><select id="scenario">${l.scenarios.map((s,i)=>`<option value="${i}">${esc(s.name)}</option>`).join('')}</select>
    <div id="diagram" class="diagram"></div><div id="step-note" class="step-note" aria-live="polite"></div>
    <div class="controls"><button id="prev">← 이전 단계</button><button id="next" class="primary">다음 단계 →</button><button id="play">자동으로 보기</button><button id="reset">처음부터</button></div></section>
    ${g.game?`<a class="try-game" href="./game.html?experiment=${esc(g.game)}"><strong>이 개념을 그림으로 직접 조작해보기</strong><span>설명만 읽지 않고 문제 상황을 만들어 볼 수 있어요 →</span></a>`:''}
    <section id="code-example"><h2>짧은 코드로 연결하기</h2><p class="meta">아래 코드는 원리를 드러내기 위한 최소 예시입니다. 학생 저장소의 실제 구현은 원문에서 따로 확인하세요.</p><pre><code>${esc(l.code)}</code></pre></section>
    <p class="caution">${esc(l.caution)}</p>
    <section class="review-check"><h2>멘토라면 무엇을 확인할까요?</h2><p>구조 이름보다 아래 질문에 코드로 답할 수 있는지 확인해보세요.</p><ul>${g.checks.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></section>
    <section class="quiz"><h2>이해했는지 한 번 확인하기</h2><p>${esc(l.question)}</p>${l.options.map((o,i)=>`<button data-answer="${i}">${esc(o)}</button>`).join('')}<p class="feedback" id="feedback" aria-live="polite"></p></section>
    <section id="real-review"><h2>실제 리뷰에서는 이렇게 물었어요</h2><p class="meta">먼저 학생 질문을 보고 스스로 답해본 뒤, 멘토 답변과 전체 원문을 확인하세요. 키워드 연결이라 정확한 일대일 대응은 아닐 수 있습니다.</p>
    ${archiveError?`<p class="error">${esc(archiveError)}</p><button id="retry">원문 다시 불러오기</button>`:sources.map((s,i)=>`<details ${i===0?'open':''}><summary><span>${s.role==='학생 PR 본문'?'학생 질문':s.role.startsWith('제출 리뷰')?'멘토 답변':'추가 대화'}</span>${esc(s.doc.name.replace('-pr-',' #').replace('.md',''))} · ${esc(s.role)}</summary><div class="excerpt">${esc(s.text)}</div><button data-source="${esc(s.doc.name)}" data-line="${s.start+1}">전체 원문에서 이 부분 보기</button></details>`).join('') || '<p>연결된 발췌가 없습니다. 전체 원문에서 검색할 수 있습니다.</p>'}</section>
    <h2>한국어로 더 읽기</h2><ul class="reading">${readingFor(l).map(([title,url,why])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a><p>${esc(why)}</p></li>`).join('')}</ul>
    <p class="meta">외부 글은 새 탭에서 열립니다. 개인 블로그는 참고 관점으로 읽고, 실제 적용 시 사용하는 기술의 공식 문서도 확인하세요.</p>
    <button id="complete" class="complete">${completed.has(l.id)?'✓ 공부한 개념 · 표시 해제':'이 개념 공부 완료로 표시'}</button>
    <div class="end-nav">${index?`<a href="#${lessons[index-1].id}">← ${esc(lessons[index-1].title)}</a>`:'<span></span>'}${index<lessons.length-1?`<a href="#${lessons[index+1].id}">${esc(lessons[index+1].title)} →</a>`:''}</div>`;
  $('scenario').onchange=()=>{stop();scenario=Number($('scenario').value);step=0;draw();};
  $('prev').onclick=()=>{stop();step=Math.max(0,step-1);draw();};
  $('next').onclick=()=>{stop();step=Math.min(3,step+1);draw();};
  $('reset').onclick=()=>{stop();step=0;draw();};
  $('play').onclick=()=>{if(timer){stop();return;} if(step===3)step=0; draw();$('play').textContent='일시정지';timer=setInterval(()=>{step++;draw();if(step===3)stop();},2200);};
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{$('feedback').textContent=(Number(b.dataset.answer)===l.answer?'맞아요. ':'다시 생각해보세요. ')+l.feedback;});
  document.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>openReader(b.dataset.source,Number(b.dataset.line)));
  $('complete').onclick=()=>{completed.has(l.id)?completed.delete(l.id):completed.add(l.id);try{localStorage.setItem('review-study-completed',JSON.stringify([...completed]));}catch{}navigation();$('complete').textContent=completed.has(l.id)?'✓ 공부한 개념 · 표시 해제':'이 개념 공부 완료로 표시';};
  if($('retry'))$('retry').onclick=load;
  draw();
}
function draw() {
  const l=current();
  $('diagram').innerHTML=l.nodes.map((node,i)=>`<div class="node ${i===step?'active':i<step?'done':''}" ${i===step?'aria-current="step"':''}><span>${i+1}단계${i===step?' · 지금 여기':''}</span><strong>${esc(node)}</strong></div>`).join('');
  $('step-note').innerHTML=`<span class="step-count">${step+1} / 4 · ${esc(l.scenarios[scenario].name)}</span><div>${esc(l.scenarios[scenario].steps[step])}</div>`;
  $('prev').disabled=step===0;$('next').disabled=step===3;
}
function openReader(name=docs[0]?.name,line=1) {
  stop();
  if(!docs.length){alert(archiveError || '원문을 불러오는 중입니다.');return;}
  $('doc-select').innerHTML=docs.map(d=>`<option value="${esc(d.name)}">${esc(docLabel(d.name))}</option>`).join('');
  $('doc-select').value=name;$('source-search').value='';
  if(!$('reader').open)$('reader').showModal();
  showDoc(line);
}
function showDoc(line=1) {
  const doc=docs.find(d=>d.name===$('doc-select').value); if(!doc)return;
  $('reader-title').textContent=docLabel(doc.name);
  const githubUrl=doc.text.match(/https:\/\/github\.com\/kakaotechcampus-4\/[a-z0-9-]+\/pull\/\d+/)?.[0];
  let external=$('source-github');
  if(!external){external=document.createElement('a');external.id='source-github';external.target='_blank';external.rel='noopener noreferrer';$('reader-title').after(external);}
  external.textContent=githubUrl?'GitHub에서 열기 ↗':'';if(githubUrl)external.href=githubUrl;else external.removeAttribute('href');
  $('source-status').textContent='';
  $('source-body').innerHTML=doc.text.split('\n').map((s,i)=>`<div id="source-L${i+1}" class="source-line ${line===i+1?'hit':''}"><span class="line-num">${i+1}</span><span class="source-text">${esc(s)}</span></div>`).join('');
  requestAnimationFrame(()=>$(`source-L${line}`)?.scrollIntoView({block:'center'}));
}
$('doc-select').onchange=()=>{$('source-search').value='';showDoc();};
$('source-search').onkeydown=e=>{
  if(e.key!=='Enter')return;
  const query=e.target.value.trim().toLowerCase();
  const rows=[...document.querySelectorAll('.source-line')];
  rows.forEach(r=>r.classList.remove('hit'));
  if(!query){$('source-status').textContent='';return;}
  const hits=rows.filter(r=>r.querySelector('.source-text').textContent.toLowerCase().includes(query));
  hits.forEach(r=>r.classList.add('hit'));$('source-status').textContent=`${hits.length}줄에서 찾았습니다.`;
  hits[0]?.scrollIntoView({block:'center'});
};
$('close-reader').onclick=()=>$('reader').close();
$('archive-button').onclick=()=>openReader();
$('search').oninput=navigation;
$('skip').onclick=()=>$('lesson').focus();
window.addEventListener('hashchange',()=>{render();$('lesson').focus({preventScroll:true});window.scrollTo(0,0);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
async function load(){
  try{
    const r=await fetch('./archive.json');if(!r.ok)throw new Error();docs=await r.json();archiveError='';
  }catch{archiveError='원문 자료를 읽지 못했습니다. 학습 설명은 계속 볼 수 있습니다.';}
  render();
  if(sourceFromLink && docs.some(d=>d.name===sourceFromLink)){
    openReader(sourceFromLink,sourceLineFromLink);
    sourceFromLink=null;
    history.replaceState({},'',location.pathname + location.hash);
  }
}
render();load();
