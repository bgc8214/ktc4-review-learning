// Pure learning models. No network, credentials, Redis or DB is used here.
export const experiments = {
 atomic: {title:'하나의 토큰, 두 요청',subtitle:'읽기와 삭제 사이에 다른 요청이 끼어들면?',actions:[['readA','A 읽기'],['readB','B 읽기'],['finishA','A 삭제·발급'],['finishB','B 삭제·발급']],setting:'읽기+삭제를 GETDEL 한 명령으로',hint:'A 읽기 → B 읽기 → A 삭제·발급 → B 삭제·발급을 눌러보세요.',demo:['readA','readB','finishA','finishB'],lesson:'atomic'},
 transaction:{title:'동전 30개는 어디로 갔을까?',subtitle:'출금과 입금이 함께 성공해야 하는 이유',actions:[['withdraw','30 출금'],['deposit','B 입금 시도'],['settle','커밋 / 롤백']],setting:'두 변경을 하나의 트랜잭션으로',hint:'출금 후 입금을 실패시켜보세요. 임시 장부와 확정 장부를 비교하세요.',demo:['withdraw','deposit','settle'],lesson:'transaction'},
 auth:{title:'신분증과 보관함 열쇠는 다르다',subtitle:'로그인한 A가 B의 주소를 알아도 되는가?',actions:[['login','A로 로그인'],['targetA','A 보관함 선택'],['targetB','B 보관함 선택'],['open','선택한 보관함 열기']],setting:'자원 소유권 검사',hint:'A로 로그인하고 B의 보관함을 열어보세요. 주소를 UUID로 바꿔도 자물쇠는 필요합니다.',demo:['login','targetB','open'],lesson:'auth'},
 polling:{title:'화면은 꺼져도 작업은 계속된다',subtitle:'브라우저 메모리와 서버 작업을 분리해서 보기',actions:[['start','분석 시작'],['tick','서버 1초 진행'],['poll','상태 조회'],['refresh','브라우저 새로고침'],['recover','내 작업 다시 찾기']],setting:'서버의 내 작업 목록으로 ID 복원',hint:'작업 중 새로고침 → 서버 진행 → 작업 복구. 서버와 화면의 상태가 같지 않을 수 있습니다.',demo:['start','tick','poll','refresh','tick','tick','tick','recover','poll'],lesson:'polling'},
 ports:{title:'업무는 그대로, 장치만 교체',subtitle:'같은 약속을 구현하는 두 어댑터',actions:[['github','GitHub 장치 연결'],['fake','테스트 장치 연결'],['read','커밋 요청']],setting:null,hint:'두 장치를 바꿔 연결하고 요청해보세요. 같은 내부 자료형과 달라지는 네트워크 호출을 보세요.',demo:['read','fake','read'],lesson:'ports'},
 evidence:{title:'그럴듯한 초안의 근거 검사',subtitle:'생성한 주장과 실제 기록을 한 줄씩 대조',actions:[['collect','커밋 수집'],['compress','규칙으로 후보 압축'],['generate','LLM 초안 생성'],['verify','실제 기록으로 검증'],['ship','카드 확정 시도']],setting:null,hint:'없는 SHA뿐 아니라 “SHA는 있지만 주장이 틀림”도 실험하세요.',demo:['collect','compress','generate','verify','ship'],lesson:'evidence'}
};
export function initial(id,options={}){
 const common={id,message:experiments[id].hint,last:'',revision:0};
 if(id==='atomic')return {...common,atomic:options.enabled??false,token:true,A:{read:false,copy:false,done:false},B:{read:false,copy:false,done:false},issued:0};
 if(id==='transaction')return {...common,together:options.enabled??true,fail:options.fail??true,A:100,B:100,committedA:100,committedB:100,phase:'ready'};
 if(id==='auth')return {...common,check:options.enabled??true,uuid:options.uuid??true,user:null,sid:null,target:'B',opened:null,denied:false};
 if(id==='polling')return {...common,restore:options.enabled??true,progress:0,server:'미접수',job:null,memory:null,screen:'대기',queries:0,reloaded:false};
 if(id==='ports')return {...common,adapter:'github',network:0,requests:0,result:null,contract:'read(repo): Commit[]'};
 if(id==='evidence')return {...common,kind:options.kind??'missing',phase:'empty',llm:0,draft:null,checks:null,shipped:false};
 throw new Error('Unknown experiment');
}
export function available(s,action){
 if(s.id==='atomic'){const who=action.endsWith('A')?'A':'B';return action.startsWith('read')?!s[who].read:s[who].read&&!s[who].done;}
 if(s.id==='transaction')return action==='withdraw'?s.phase==='ready':action==='deposit'?s.phase==='withdrawn':['failed','deposited'].includes(s.phase);
 if(s.id==='auth')return action==='login'?!s.user:true;
 if(s.id==='polling')return action==='start'?!s.job:action==='tick'?s.job&&s.progress<100:action==='recover'?s.job&&s.reloaded:Boolean(s.job);
 if(s.id==='ports')return action==='read'||(action==='github'?s.adapter!=='github':s.adapter!=='fake');
 if(s.id==='evidence')return {collect:s.phase==='empty',compress:s.phase==='collected',generate:s.phase==='compressed',verify:!!s.draft&&!s.checks,ship:!!s.draft&&!s.shipped}[action]??false;
 return false;
}
export function act(state,action){
 const s=structuredClone(state);if(!experiments[s.id].actions.some(([id])=>id===action)||!available(s,action))return s;
 s.last=action;s.revision++;
 if(s.id==='atomic'){
  const who=action.endsWith('A')?'A':'B',r=s[who];
  if(action.startsWith('read')){r.read=true;r.copy=s.token;if(s.atomic&&r.copy)s.token=false;s.message=r.copy?(s.atomic?`${who}만 토큰을 얻었습니다. 반환과 삭제가 한 명령 안에서 끝납니다.`:`${who}가 값의 복사본을 얻었습니다. 원본은 아직 Redis에 남아 있습니다.`):`${who}의 결과는 null. 먼저 실행된 요청이 이미 소비했습니다.`;}
  else {r.done=true;if(r.copy){s.token=false;s.issued++;s.message=`${who} 재발급 완료. 현재 새 토큰 ${s.issued}개.${s.issued===2?' 같은 기존 토큰을 두 번 사용했습니다.':''}`;}else s.message=`${who}는 토큰을 얻지 못해 재발급하지 않습니다.`;}
 }
 if(s.id==='transaction'){
  if(action==='withdraw'){s.A-=30;if(!s.together)s.committedA=s.A;s.phase='withdrawn';s.message=s.together?'작업 장부에서만 A=70. 확정 장부는 아직 A=100입니다.':'A=70을 먼저 커밋했습니다. 출금이 이미 확정됐습니다.';}
  if(action==='deposit'){if(s.fail){s.phase='failed';s.message='입금 오류! B에는 아직 30이 더해지지 않았습니다. 이제 변경을 마무리해보세요.';}else{s.B+=30;if(!s.together)s.committedB=s.B;s.phase='deposited';s.message='B의 작업 잔액이 130입니다. 성공한 변경을 커밋해보세요.';}}
  if(action==='settle'){if(s.phase==='failed'){if(s.together){s.A=s.committedA;s.B=s.committedB;s.phase='rolledback';s.message='ROLLBACK: 미확정 출금을 취소했습니다. 확정 합계는 계속 200입니다.';}else{s.phase='partial';s.message='이미 커밋한 출금은 자동 취소되지 않습니다. 확정 합계 170. 별도 보상이 필요합니다.';}}else{s.committedA=s.A;s.committedB=s.B;s.phase='committed';s.message='COMMIT: A=70, B=130을 확정했습니다. 합계 200입니다.';}}
 }
 if(s.id==='auth'){
  if(action==='login'){s.user='A';s.sid='s7';s.message='서버는 세션 s7 → 사용자 A를 저장합니다. 브라우저는 쿠키로 s7을 보냅니다.';}
  if(action.startsWith('target')){s.target=action.at(-1);s.opened=null;s.denied=false;s.message=`${s.target} 소유 보관함을 선택했습니다. 주소를 안다는 것과 권한이 있다는 것은 다릅니다.`;}
  if(action==='open'){s.opened=null;s.denied=false;if(!s.user){s.denied=true;s.message='401: 먼저 로그인해야 합니다. 누구의 요청인지 확인되지 않았습니다.';}else if(s.check&&s.target!==s.user){s.denied=true;s.message='404: 사용자 A ≠ 소유자 B. 이 예시는 존재 여부를 숨기기 위해 거절합니다.';}else{s.opened=s.target;s.message=s.target===s.user?'A의 카드가 열렸습니다. 인증과 소유권 검사를 모두 통과했습니다.':'B의 카드가 A에게 노출됐습니다. UUID여도 주소를 알면 접근할 수 있습니다.';}}
 }
 if(s.id==='polling'){
  if(action==='start'){s.job=42;s.memory=42;s.server='QUEUED';s.screen='접수 · 202';s.message='202와 jobId=42를 받았습니다. 아직 분석 완료가 아닙니다.';}
  if(action==='tick'){s.progress=Math.min(100,s.progress+25);s.server=s.progress===100?'SUCCEEDED':'RUNNING';s.message=`서버 작업 ${s.progress}%. 화면은 상태를 조회해야 이 변경을 알 수 있습니다.`;}
  if(action==='poll'){if(!s.memory){s.message='브라우저 메모리에 jobId가 없습니다. 조회할 작업을 먼저 찾아야 합니다.';}else{s.queries++;s.screen=s.server==='SUCCEEDED'?'완료':`${s.server} · ${s.progress}%`;s.message=s.server==='SUCCEEDED'?'완료 결과를 받아 화면에 표시했습니다. 이제 반복 조회를 멈춥니다.':'GET /jobs/42: 이 시점의 서버 상태를 화면에 반영했습니다.';}}
  if(action==='refresh'){s.memory=null;s.screen='초기화';s.reloaded=true;s.message='브라우저 메모리만 사라졌습니다. 서버의 job 42와 진행률은 그대로입니다.';}
  if(action==='recover'){if(s.restore){s.memory=s.job;s.reloaded=false;s.message='인증된 내 작업 목록에서 job 42를 찾았습니다. 이제 상태를 재조회할 수 있습니다.';}else s.message='복원 경로가 없습니다. 서버가 완료해도 화면은 어떤 작업인지 모릅니다.';}
 }
 if(s.id==='ports'){
  if(action==='github'||action==='fake'){s.adapter=action;s.result=null;s.message=`${action==='fake'?'테스트':'GitHub'} 어댑터를 연결했습니다. 업무의 read(repo) 호출과 Commit[] 약속은 그대로입니다.`;}
  if(action==='read'){s.requests++;if(s.adapter==='github')s.network++;s.result={sha:'a1b2c3',title:'로그인 오류 수정'};s.message=s.adapter==='github'?'GitHub HTTP 응답을 내부 Commit[]로 변환했습니다. (이 화면에서는 모의 호출)':'테스트 대역이 Commit[]를 반환했습니다. 외부 네트워크는 호출하지 않았습니다.';}
 }
 if(s.id==='evidence'){
  if(action==='collect'){s.phase='collected';s.message='실제 기록을 수집했습니다. 수집은 GitHub API의 역할이지 LLM의 역할이 아닙니다.';}
  if(action==='compress'){s.phase='compressed';s.message='이 학습 예시는 규칙으로 관련 커밋을 묶습니다. 후보 압축에 LLM을 쓰지 않습니다.';}
  if(action==='generate'){s.phase='generated';s.llm++;s.draft={sha:s.kind==='missing'?'ffff00':'a1b2c3',claim:s.kind==='mismatch'?'결제 기능 구현':'로그인 오류 수정'};s.message='모델의 초안입니다. 문장이 자연스러워도 근거 검증 전에는 확정할 수 없습니다.';}
  if(action==='verify'){s.checks={exists:s.kind!=='missing',context:s.kind==='valid'};s.phase='verified';s.message=s.kind==='missing'?'이 저장소에 해당 SHA가 없습니다. 출고를 차단합니다.':s.kind==='mismatch'?'SHA는 있지만 실제 변경은 로그인 수정입니다. 결제 구현 주장은 뒷받침되지 않습니다.':'SHA와 실제 변경 내용이 이 예시의 주장에 부합합니다. 확정을 허용합니다.';}
  if(action==='ship'){s.shipped=Boolean(s.checks?.exists&&s.checks?.context);s.message=s.shipped?'검증된 카드를 확정했습니다.':'확정 거절. LLM 재질문이 아니라 실제 근거 확인과 보완이 필요합니다.';}
 }
 return s;
}
export function metrics(s){
 if(s.id==='atomic')return {'Redis 원본':s.token?1:0,'값을 얻은 요청':Number(s.A.copy)+Number(s.B.copy),'새 토큰 발급':s.issued};
 if(s.id==='transaction')return {'작업 A / B':`${s.A} / ${s.B}`,'확정 A / B':`${s.committedA} / ${s.committedB}`,'확정 합계':s.committedA+s.committedB};
 if(s.id==='auth')return {'인증 사용자':s.user??'없음','선택한 소유자':s.target,'열린 카드':s.opened??'없음'};
 if(s.id==='polling')return {'서버':`${s.server} ${s.progress}%`,'화면':s.screen,'메모리 jobId':s.memory??'없음'};
 if(s.id==='ports')return {'업무 호출':s.requests,'모의 HTTP':s.network,'반환 자료형':s.result?'Commit[]':'아직 없음'};
 return {'LLM 호출':s.llm,'SHA 존재':s.checks?(s.checks.exists?'확인':'없음'):'미검증','카드 확정':s.shipped?1:0};
}
