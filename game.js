const app=document.querySelector('#app');
const R={wolf:{n:'늑대인간',i:'🐺',d:'다른 늑대인간을 확인합니다. 혼자라면 가운데 카드 한 장을 볼 수 있습니다.'},minion:{n:'하수인',i:'🕯️',d:'늑대인간들이 누구인지 확인합니다. 늑대인간에게 정체를 알리지는 않습니다.'},seer:{n:'예언자',i:'🔮',d:'다른 플레이어 한 명의 카드 또는 가운데 카드 두 장을 봅니다.'},robber:{n:'강도',i:'🗡️',d:'다른 플레이어와 카드를 바꾸고, 새 카드를 확인합니다.'},trouble:{n:'말썽꾸러기',i:'🎭',d:'다른 두 플레이어의 카드를 바꿉니다. 바뀐 카드는 보지 않습니다.'},insomniac:{n:'불면증 환자',i:'🌙',d:'마지막에 자신의 현재 카드를 확인합니다.'},villager:{n:'주민',i:'🏠',d:'특별한 야간 행동은 없지만, 마을의 눈과 귀가 됩니다.'}};
const order=['wolf','minion','seer','robber','trouble','insomniac'];
let g={names:['플레이어 1','플레이어 2','플레이어 3'],chosen:GameSetup.recommendedDeck(3),initial:[],cards:[],center:[],phase:0,nightLog:[],action:null,votes:{},timer:null,active:false};
const nameCache=[...g.names];
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const btn=(text,fn,cls='button')=>`<button class="${cls}" data-act="${fn}">${text}</button>`;
function render(html){app.innerHTML=html;bind()}
function bind(){app.querySelectorAll('[data-act]').forEach(e=>e.onclick=()=>actions[e.dataset.act]?.(e));}
function setup(){
  const status=GameSetup.validateDeck(g.names.length,g.chosen);
  const counts=Object.fromEntries(Object.keys(R).map(role=>[role,g.chosen.filter(x=>x===role).length]));
  const message=status.valid?'준비 완료! 역할을 무작위로 배정할 수 있습니다.':status.remaining>0?`역할 카드를 ${status.remaining}장 더 선택해 주세요.`:`역할 카드를 ${Math.abs(status.remaining)}장 줄여 주세요.`;
  render(`<div class="setup">
    <div class="phase-tag">GAME SETUP · 게임 준비</div>
    <h2>인원과 역할을 선택하세요</h2>
    <p class="sub setup-intro">함께할 사람을 정하고, 오늘 밤 등장할 캐릭터를 골라 보세요.</p>
    <section class="setup-section" aria-labelledby="playersTitle">
      <div class="section-heading"><h3 id="playersTitle"><span>01</span> 플레이어 수</h3><strong>${g.names.length}명</strong></div>
      <div class="player-counts" role="group" aria-label="플레이어 수 선택">${Array.from({length:6},(_,i)=>i+3).map(n=>`<button type="button" data-count="${n}" aria-pressed="${n===g.names.length}" class="count-option ${n===g.names.length?'selected':''}">${n}<small>명</small></button>`).join('')}</div>
      <p class="muted">인원수를 바꾸면 그 인원에 맞는 추천 역할 조합을 적용합니다.</p>
      <div id="nameFields" class="names">${g.names.map((n,i)=>`<label class="name-row"><span>${String(i+1).padStart(2,'0')}</span><input data-name="${i}" value="${escapeHtml(n)}" maxlength="20" aria-label="플레이어 ${i+1} 이름" placeholder="플레이어 ${i+1}" autocomplete="off"></label>`).join('')}</div>
    </section>
    <section class="setup-section" aria-labelledby="rolesTitle">
      <div class="section-heading"><h3 id="rolesTitle"><span>02</span> 캐릭터 · 역할 카드</h3><button type="button" class="text-button" data-act="recommend">추천 조합 적용</button></div>
      <p class="setup-help">카드는 <strong>플레이어 ${g.names.length}장 + 가운데 3장</strong>이 필요합니다. 각 캐릭터의 + / − 버튼으로 수량을 조절하세요.</p>
      <div class="roles">${Object.entries(R).map(([key,role])=>`<article class="role-picker ${counts[key]?'on':''}" aria-label="${role.n}"><div class="role-picker-heading"><span class="picker-icon" aria-hidden="true">${role.i}</span><div><h4>${role.n}</h4><span class="role-team">${key==='wolf'||key==='minion'?'늑대인간팀':'마을팀'}</span></div><span class="role-limit">최대 ${GameSetup.limits[key]}장</span></div><p>${role.d}</p><div class="quantity" role="group" aria-label="${role.n} 수량"><button type="button" data-role="${key}" data-delta="-1" aria-label="${role.n} 줄이기" ${counts[key]===0?'disabled':''}>−</button><output aria-label="${role.n} 선택 수량">${counts[key]}<small>장</small></output><button type="button" data-role="${key}" data-delta="1" aria-label="${role.n} 늘리기" ${counts[key]===GameSetup.limits[key]?'disabled':''}>+</button></div></article>`).join('')}</div>
      <p class="muted">역할은 무작위 배정됩니다. 8인 플레이도 가능하도록 주민은 최대 8장까지 선택할 수 있습니다.</p>
    </section>
    <div class="setup-summary ${status.valid?'ready':'incomplete'}" role="status" aria-live="polite"><div><span class="summary-label">선택한 역할 카드</span><strong>${status.selected}<small> / ${status.required}장</small></strong></div><p>${message}</p></div>
    <button type="button" class="button start-game" data-act="start" ${status.valid?'':'disabled'}>이 조합으로 게임 시작 <span aria-hidden="true">→</span></button>
    <p class="privacy setup-privacy">기기 한 대로 돌아가며 플레이합니다. 시작하면 각자 비밀 역할을 확인합니다.</p>
  </div>`);
  app.querySelectorAll('[data-count]').forEach(button=>button.onclick=()=>{
    const count=Number(button.dataset.count);
    g.names.forEach((name,i)=>nameCache[i]=name);
    g.names=Array.from({length:count},(_,i)=>nameCache[i]??`플레이어 ${i+1}`);
    g.chosen=GameSetup.recommendedDeck(count);
    setup();
    app.querySelector(`[data-count="${count}"]`).focus();
  });
  app.querySelectorAll('[data-name]').forEach(input=>input.oninput=()=>{
    const index=Number(input.dataset.name);
    g.names[index]=input.value;
    nameCache[index]=input.value;
  });
  app.querySelectorAll('[data-role]').forEach(button=>button.onclick=()=>{
    const role=button.dataset.role,delta=Number(button.dataset.delta);
    if(delta>0&&counts[role]<GameSetup.limits[role])g.chosen.push(role);
    else if(delta<0&&counts[role]>0)g.chosen.splice(g.chosen.indexOf(role),1);
    setup();
    const same=app.querySelector(`[data-role="${role}"][data-delta="${delta}"]`);
    (same.disabled?app.querySelector(`[data-role="${role}"][data-delta="${-delta}"]`):same).focus();
  });
  actions.recommend=()=>{g.chosen=GameSetup.recommendedDeck(g.names.length);setup();app.querySelector('[data-act="recommend"]').focus()};
}
function clearRound(){if(g.timer)clearInterval(g.timer);g.timer=null;g.active=false;g.initial=[];g.cards=[];g.center=[];g.phase=0;g.nightLog=[];g.votes={};g.action=null;}
function start(){if(!GameSetup.validateDeck(g.names.length,g.chosen).valid)return;clearRound();g.active=true;g.names=g.names.map((name,i)=>name.trim()||`플레이어 ${i+1}`);let deck=shuffle([...g.chosen]);g.initial=deck.slice(0,g.names.length);g.cards=[...g.initial];g.center=deck.slice(g.names.length);revealTurn(0)}
function revealTurn(i){if(i>=g.names.length){night();return}render(`<div class="phase"><div class="phase-tag">역할 확인 · ${i+1} / ${g.names.length}</div><h2 class="turn-name">${g.names[i]}님 차례</h2><p class="privacy">다른 사람은 화면을 보지 않게 해 주세요.</p><div class="card"><div class="role-icon">?</div><h3 class="role-name">카드를 뒤집어 보세요</h3><p class="role-desc">확인한 뒤에는 다음 사람에게 기기를 건네세요.</p></div>${btn('내 역할 보기','showRole')}${i?btn('이전으로','prevReveal','button secondary'):''}</div>`);actions.showRole=()=>showRole(i);actions.prevReveal=()=>revealTurn(i-1)}
function showRole(i){let r=R[g.initial[i]];render(`<div class="phase"><div class="phase-tag">비밀 역할</div><h2 class="turn-name">${g.names[i]}님</h2><div class="card"><div class="role-icon">${r.i}</div><h3 class="role-name">${r.n}</h3><p class="role-desc">${r.d}</p></div><p class="privacy">기억했나요? 화면을 가리고 다음 사람에게 넘기세요.</p>${btn(i===g.names.length-1?'야간 시작':'다음 사람','nextReveal')}</div>`);actions.nextReveal=()=>revealTurn(i+1)}
function night(){g.phase=0;nextNight()}
function nextNight(){while(g.phase<order.length&&!g.initial.includes(order[g.phase]))g.phase++;if(g.phase>=order.length){discussion();return}let role=order[g.phase],r=R[role];render(`<div class="phase"><div class="phase-tag">야간 · ${g.phase+1} / ${order.length}</div><div class="role-icon">${r.i}</div><h2>${r.n}의 시간</h2><p class="sub">${r.d}</p>${btn('눈을 뜨고 행동하기','doNight')}</div>`);actions.doNight=()=>doAction(role)}
function doAction(role){let owners=g.initial.map((x,i)=>x===role?i:-1).filter(i=>i>=0);let own=owners.map(i=>g.names[i]).join(', ');if(role==='wolf'){let wolves=g.initial.map((x,i)=>x==='wolf'?i:-1).filter(i=>i>=0);if(wolves.length>1){finishAction(`${own}: 다른 늑대인간을 확인했습니다.`,role);return}choose(`혼자 남은 늑대인간입니다. 가운데 카드 하나를 확인하세요.`,g.center.map((_,i)=>({id:'c'+i,label:`가운데 ${i+1}번`})),x=>{let i=+x.slice(1);finishAction(`늑대인간: 가운데 ${i+1}번은 ${R[g.center[i]].n}였습니다.`,role)})}
else if(role==='minion'){let wolves=g.initial.map((x,i)=>x==='wolf'?g.names[i]:null).filter(Boolean);finishAction(`${own}: 늑대인간은 ${wolves.length?wolves.join(', '):'아무도 없습니다'}였습니다.`,role)}
else if(role==='seer'){let opts=[...g.names.map((n,i)=>({id:'p'+i,label:n})),{id:'centers',label:'가운데 카드 2장 보기'}];choose('누구의 카드를 볼까요? 또는 가운데 카드 두 장을 볼 수 있습니다.',opts,x=>{if(x==='centers')finishAction(`예언자: 가운데 카드들은 ${R[g.center[0]].n}, ${R[g.center[1]].n}입니다.`,role);else{let i=+x.slice(1);finishAction(`예언자: ${g.names[i]}의 카드는 ${R[g.cards[i]].n}입니다.`,role)}})}
else if(role==='robber'){let me=owners[0];choose('카드를 바꿀 상대를 고르세요.',g.names.map((n,i)=>({id:'p'+i,label:n})).filter((_,i)=>i!==me),x=>{let i=+x.slice(1);[g.cards[me],g.cards[i]]=[g.cards[i],g.cards[me]];finishAction(`강도: ${g.names[i]}와 카드를 바꾸었습니다. 새 카드는 ${R[g.cards[me]].n}입니다.`,role)})}
else if(role==='trouble'){let me=owners[0];chooseTwo('서로 바꿀 두 사람을 고르세요.',g.names.map((n,i)=>({id:'p'+i,label:n})).filter((_,i)=>i!==me),xs=>{let a=+xs[0].slice(1),b=+xs[1].slice(1);[g.cards[a],g.cards[b]]=[g.cards[b],g.cards[a]];finishAction('말썽꾸러기: 두 사람의 카드를 바꾸었습니다.',role)})}
else if(role==='insomniac'){let me=owners[0];finishAction(`불면증 환자: 현재 당신의 카드는 ${R[g.cards[me]].n}입니다.`,role)} }
function choose(prompt,opts,done){render(`<div class="phase"><div class="phase-tag">야간 행동</div><h2>${prompt}</h2><div class="choices">${opts.map(o=>`<button class="choice" data-choice="${o.id}">${o.label}</button>`).join('')}</div>${btn('선택 완료','confirm','button secondary')}</div>`);let pick=null;app.querySelectorAll('[data-choice]').forEach(x=>x.onclick=()=>{pick=x.dataset.choice;app.querySelectorAll('[data-choice]').forEach(y=>y.classList.toggle('selected',y===x));document.querySelector('[data-act=confirm]').className='button'});actions.confirm=()=>pick&&done(pick)}
function chooseTwo(prompt,opts,done){let picks=[];render(`<div class="phase"><div class="phase-tag">야간 행동</div><h2>${prompt}</h2><div class="choices">${opts.map(o=>`<button class="choice" data-choice="${o.id}">${o.label}</button>`).join('')}</div>${btn('두 명 선택 완료','confirm','button secondary')}</div>`);app.querySelectorAll('[data-choice]').forEach(x=>x.onclick=()=>{let id=x.dataset.choice;if(picks.includes(id))picks=picks.filter(v=>v!==id);else if(picks.length<2)picks.push(id);app.querySelectorAll('[data-choice]').forEach(y=>y.classList.toggle('selected',picks.includes(y.dataset.choice)));if(picks.length===2)document.querySelector('[data-act=confirm]').className='button'});actions.confirm=()=>picks.length===2&&done(picks)}
function finishAction(line,role){g.nightLog.push(line);g.phase++;render(`<div class="phase"><div class="phase-tag">야간 행동 완료</div><h2>${R[role].n}의 행동이 끝났습니다</h2><div class="log">${line}</div><p class="privacy">정보를 기억한 뒤, 다음 역할에게 기기를 넘기세요.</p>${btn('다음 야간 행동','nextNight')}</div>`);actions.nextNight=nextNight}
function discussion(){let seconds=180;render(`<div class="phase"><div class="phase-tag">낮 · 토론</div><h2>모두 눈을 뜹니다</h2><p class="sub">이제부터 자유롭게 이야기하세요. 누가 늑대인간일까요? 원한다면 3분 타이머를 사용하세요.</p><div class="discussion"><div class="timer" id="timer">03:00</div>${btn('타이머 시작','timer','button secondary')}</div>${btn('토론을 마치고 투표','vote')}</div>`);actions.timer=()=>{if(g.timer)return;g.timer=setInterval(()=>{seconds--;let el=document.querySelector('#timer');if(el)el.textContent=`${String(Math.max(0,seconds)/60|0).padStart(2,'0')}:${String(Math.max(0,seconds)%60).padStart(2,'0')}`;if(seconds<=0){clearInterval(g.timer);g.timer=null}},1000)};actions.vote=voting}
function voting(){let i=Object.keys(g.votes).length;if(i>=g.names.length){result();return}render(`<div class="phase"><div class="phase-tag">투표 · ${i+1} / ${g.names.length}</div><h2 class="turn-name">${g.names[i]}님, 투표하세요</h2><p class="sub">늑대인간이라고 생각하는 한 사람을 선택합니다.</p><div class="vote-list">${g.names.map((n,j)=>`<button class="choice vote" data-vote="${j}"><span>${n}</span><span>투표하기 →</span></button>`).join('')}</div></div>`);app.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{g.votes[i]=+b.dataset.vote;voting()})}
function result(){let counts=g.names.map((_,i)=>Object.values(g.votes).filter(v=>v===i).length),max=Math.max(...counts),killed=counts.map((c,i)=>c===max?i:null).filter(x=>x!==null),wolves=g.cards.map((x,i)=>x==='wolf'?i:null).filter(x=>x!==null),wolfKilled=killed.some(i=>wolves.includes(i)),winner=wolves.length?(wolfKilled?'마을팀 승리!':'늑대인간팀 승리!'):(killed.length===0?'마을팀 승리!':'늑대인간이 없었는데 누군가 처형되었습니다. 늑대인간팀 승리!');render(`<div class="result phase"><div class="phase-tag">결과</div><h2>${winner}</h2><p class="sub">처형 후보: <b>${killed.map(i=>g.names[i]).join(', ')}</b> (${max}표)</p><div class="result-grid">${g.names.map((n,i)=>`<div class="mini"><b>${n}</b>${R[g.cards[i]].i} 최종 ${R[g.cards[i]].n}<br><span class="muted">처음: ${R[g.initial[i]].n} · ${counts[i]}표</span></div>`).join('')}<div class="mini"><b>가운데 카드</b>${g.center.map(x=>`${R[x].i} ${R[x].n}`).join('<br>')}</div></div><p class="muted">야간에 공개된 정보는 게임 밖에서만 공유하세요. 다음 판은 새 배정으로 시작됩니다.</p>${btn('새 게임','restart')}</div>`);actions.restart=()=>{if(g.timer)clearInterval(g.timer);setup()}}
const actions={start};const shuffle=a=>a.sort(()=>Math.random()-.5);
document.querySelector('#rulesBtn').onclick=()=>document.querySelector('#modal').classList.remove('hidden');document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').classList.add('hidden');
const settingsDialog=document.querySelector('#settingsDialog');
document.querySelector('#settingsBtn').onclick=()=>{if(g.active)settingsDialog.showModal();else setup()};
document.querySelector('#cancelSettings').onclick=()=>settingsDialog.close();
document.querySelector('#confirmSettings').onclick=()=>{settingsDialog.close();clearRound();setup();app.querySelector('[data-count][aria-pressed="true"]').focus()};
setup();
