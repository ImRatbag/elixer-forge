/* ================= Elixir Forge app ================= */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const formLabel={evo:'Evo',hero:'Hero',champ:'Champion',normal:'Normal'};
const formsOf=c=>isChamp(c)?['champ']:[c.ev?'evo':null,c.he?'hero':null].filter(Boolean);
const TYPE_ICON={t:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3 2l7.5 7.5-1.4 1.4L1.6 3.4V2zm10.4 8.1l1 1-1.7 1.7 1.3 1.3-.9.9-1.3-1.3-1.7 1.7-1-1 1.7-1.7-1.3-1.3.9-.9 1.3 1.3z"/></svg>',s:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1l1.8 4.6L14.5 6l-3.6 3 1.1 4.8L8 11.2 4 13.8 5.1 9 1.5 6l4.7-.4z"/></svg>',b:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h2.5v2H6V2h4v2h1.5V2H14v5h-1.5v7h-9V7H2zm4.5 7v5h3V9z"/></svg>'};
const TYPE_NAME={t:'Troop',s:'Spell',b:'Building'};
const STYLE_OPTS=[['any','Any'],['cycle','Cycle'],['beatdown','Beatdown'],['bridge','Bridge spam'],['bait','Bait'],['hyperbait','Hyperbait'],['siege','Siege'],['control','Control'],['air','Air'],['counter','Meta counter']];
function displayName(id,form){const n=C[id].name;return form==='evo'?'Evo '+n:form==='hero'?'Hero '+n:n;}
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2200);}

/* ---------- profiles (a player's collection) ---------- */
const allEvo=()=>EVO_CARDS.slice(),allHero=()=>HERO_CARDS.slice();
function newProfile(name,extra){return Object.assign({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,tag:null,source:'unset',col:{base:null,evo:allEvo(),hero:allHero(),towers:TOWER_IDS.slice()},levels:null,updated:Date.now()},extra||{});}
let profiles=store.get('ef2-profiles',null);
if(!profiles||!profiles.length){
  profiles=PRESET_PLAYERS.length?PRESET_PLAYERS.map(p=>newProfile(p.name,{source:'manual',col:{base:null,evo:EVO_CARDS.filter(i=>!p.missingEvo.includes(i)),hero:HERO_CARDS.filter(i=>!p.missingHero.includes(i)),towers:TOWER_IDS.slice()}})):[newProfile('Player 1'),newProfile('Player 2')];
}
let slots=store.get('ef2-slots',null);
if(!slots||!profiles.find(p=>p.id===slots.A))slots={A:profiles[0].id,B:(profiles[1]||profiles[0]).id};
if(!profiles.find(p=>p.id===slots.B))slots.B=profiles.find(p=>p.id!==slots.A)?.id||slots.A;
function saveProfiles(){store.set('ef2-profiles',profiles);store.set('ef2-slots',slots);}
saveProfiles();
const prof=key=>profiles.find(p=>p.id===slots[key]);
const colSets=p=>({base:p.col.base?new Set(p.col.base):null,evo:new Set(p.col.evo),hero:new Set(p.col.hero),towers:new Set(p.col.towers&&p.col.towers.length?p.col.towers:['tower-princess'])});

/* tower troop IDs learned from earlier tag lookups */
Object.entries(store.get('ef2-towerids',{})).forEach(([k,v])=>{if(TOWER[k]&&v)TOWER[k].tid=v;});

/* ---------- colour themes ---------- */
const SKINS=[
  {id:'auto',name:'Match my device',mode:null,sw:['#0c1626','#f5c451']},
  {id:'royal',name:'Royal Night',mode:'dark',sw:['#111c2f','#f5c451']},
  {id:'obsidian',name:'Obsidian',mode:'dark',sw:['#131519','#e9c46a']},
  {id:'arena',name:'Arena Blue',mode:'dark',sw:['#1247a8','#ffd24d']},
  {id:'emerald',name:'Emerald',mode:'dark',sw:['#0e2a20','#e9c46a']},
  {id:'crimson',name:'Crimson',mode:'dark',sw:['#3a1219','#f0b955']},
  {id:'daylight',name:'Daylight',mode:'light',sw:['#ffffff','#1b6fd1']}
];
function applySkin(id){
  const k=SKINS.find(x=>x.id===id)||SKINS[0],root=document.documentElement;
  if(k.mode)root.dataset.theme=k.mode;else delete root.dataset.theme;
  if(k.id==='auto'||k.id==='royal'||k.id==='daylight')delete root.dataset.skin;else root.dataset.skin=k.id;
  store.set('ef2-skin',k.id);
  const box=$('skins');
  if(box)box.innerHTML=`<span class="skinlbl">Theme</span>`+SKINS.map(x=>`<button type="button" class="skin" data-skin-pick="${x.id}" aria-pressed="${x.id===k.id}" title="${esc(x.name)}" aria-label="${esc(x.name)}" style="--s1:${x.sw[0]};--s2:${x.sw[1]}">${x.id==='auto'?'<i>A</i>':''}</button>`).join('');
}
applySkin(store.get('ef2-skin','royal')); // Royal Night is the default for every visitor
document.addEventListener('click',e=>{const b=e.target.closest('[data-skin-pick]');if(b){applySkin(b.dataset.skinPick);toast((SKINS.find(x=>x.id===b.dataset.skinPick)||{}).name+' theme');}});

/* ---------- remembered settings ---------- */
function saveSearch(){store.set('ef2-search',{priority:$('priority').value,maxavg:$('maxavg').value,count:$('count').value,levelmatch:$('levelmatch').checked});}
(function(){const v=store.get('ef2-search',null);if(!v)return;
  for(const k of ['priority','maxavg','count']){const el=$(k);if(el&&v[k]!=null&&[...el.options].some(o=>o.value===String(v[k])))el.value=String(v[k]);}
  if(typeof v.levelmatch==='boolean')$('levelmatch').checked=v.levelmatch;})();
['priority','maxavg','count','levelmatch'].forEach(k=>$(k).addEventListener('change',saveSearch));
function saveRules(){store.set('ef2-rules',Object.fromEntries(['A','B'].map(k=>{const r=state.rules[k];return[k,{locks:r.locks,exclude:[...r.exclude],style:r.style,role:r.role,tower:r.tower}];})));}
function loadRules(){const v=store.get('ef2-rules',null);if(!v)return;
  for(const k of ['A','B']){const x=v[k];if(!x)continue;const r=state.rules[k];
    r.locks=(x.locks||[]).filter(l=>l&&C[l.id]).slice(0,8);r.exclude=new Map((x.exclude||[]).filter(e=>Array.isArray(e)&&C[e[0]]));
    if(STYLE_OPTS.some(o=>o[0]===x.style))r.style=x.style;if(['flex','attack','defend'].includes(x.role))r.role=x.role;if(x.tower==='auto'||TOWER[x.tower])r.tower=x.tower;}}

window.addEventListener('unhandledrejection',e=>{try{toast('Something went wrong. Try again, or reload the page.');}catch(_){}});

/* ---------- app state ---------- */
const blankRules=()=>({locks:[],exclude:new Map(),style:'any',role:'flex',tower:'auto'});
const state={mode:store.get('ef2-mode','duo'),view:'gen',rules:{A:blankRules(),B:blankRules()},vs:[],check:{ids:[],idsB:null,base:null,result:null,busy:false},creator:{tag:'',name:'',decks:null,busy:false,error:null},unlock:{result:null,busy:false,done:0,total:0},last:[],lastDuo:[],lastOpts:null,saved:store.get('ef2-saved',[]),api:null};
/* Cards from recent results, so the next Forge leans toward different ones. Halves each round. */
const recent={duo:{},'1v1':{}};
function noteShown(mode,idLists){const r=recent[mode];for(const k in r){r[k]*=0.5;if(r[k]<0.1)delete r[k];}for(const ids of idLists)for(const id of ids)r[id]=Math.min(1.6,(r[id]||0)+0.7);}
loadRules();
const names=()=>({A:prof('A').name||'Player 1',B:prof('B').name||'Player 2'});

/* ---------- card pictures (official images, linked from Supercell's API through api/cards) ---------- */
const ART={},TOWER_ART={};
const nkey=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
let NEW_FORMS=[];
function applyArt(j){
  if(!j||!Array.isArray(j.cards))return false;
  const byName={};CARDS.forEach(c=>byName[nkey(c.name)]=c.id);
  const ids={},forms=[],elixir={};
  for(const c of j.cards){
    const named=byName[nkey(c.name)],k=named||ID_TO_CARD[c.id];if(!k||!C[k])continue;
    if(c.icon)ART[k]={base:c.icon,evo:c.evo||c.icon,hero:c.hero||c.icon};
    if(named&&c.id)ids[k]=c.id; // the API is the authority on card IDs
    forms.push({id:k,evo:!!c.evo,hero:!!c.hero});
    if(Number.isFinite(c.elixir))elixir[k]=c.elixir;
  }
  const payload={ids,forms,elixir};
  const added=syncCards(payload);
  const w=getWorker();if(w){const id=++jobId;jobs[id]={res(){},rej(){}};w.postMessage({id,kind:'cards',args:payload});}
  if(added.length){
    NEW_FORMS=NEW_FORMS.concat(added);
    // A profile that hasn't been set up owns everything, including forms released since the card table was built.
    profiles.forEach(p=>{if(p.source==='unset')added.forEach(x=>{const list=x.form==='evo'?p.col.evo:p.col.hero;if(!list.includes(x.id))list.push(x.id);});});
    saveProfiles();
  }
  const tn={};TOWERS.forEach(t=>tn[nkey(t.name)]=t.id);
  for(const t of j.towers||[]){const k=tn[nkey(t.name)];if(!k)continue;if(t.id)TOWER[k].tid=t.id;if(t.icon)TOWER_ART[k]=t.icon;}
  return true;
}
function artImg(id,form,cls){
  const a=ART[id];if(!a)return '';
  const src=form==='evo'?a.evo:form==='hero'?a.hero:a.base;
  return `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`;
}
async function loadArt(){
  const cached=store.get('ef2-art',null);
  if(cached&&applyArt(cached.data)&&Date.now()-cached.at<7*864e5)return true;
  try{const r=await fetch('api/cards');if(!r.ok)return !!cached;const j=await r.json();
    if(applyArt(j)){store.set('ef2-art',{at:Date.now(),data:j});return true;}}catch(e){}
  return !!cached;
}

/* ---------- server detection (tag lookup only works on a deployed copy with the API function) ---------- */
async function detectApi(){
  try{const r=await fetch('api/health',{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();state.api=!!j.ok;}catch(e){state.api=false;}
  document.querySelectorAll('.api-only').forEach(x=>x.hidden=!state.api);
  renderPlayers();
  if(state.api&&await loadArt()){document.documentElement.classList.add('has-art');renderPlayers();if(setDataNote.last)setDataNote(...setDataNote.last);if(state.last.length||state.lastDuo.length)rerender();}
}
async function lookupTag(key,raw,opt){
  const quiet=opt&&opt.quiet,fail=m=>{if(!quiet)toast(m);setStatus('');return false;};
  const tag=String(raw||'').toUpperCase().replace(/^#/,'').replace(/O/g,'0').trim();
  if(!/^[0289PYLQGRJCUV]{3,14}$/.test(tag))return fail('That doesn\'t look like a player tag. Tags use only 0 2 8 9 P Y L Q G R J C U V.');
  if(!state.api)return fail('Player tag lookup needs the Elixir Forge server, which isn\'t running on this copy. Use Set up collection instead.');
  hideErr();if(!quiet)setStatus('Looking up #'+tag+'…');
  const btn=document.querySelector('.player[data-key="'+key+'"] [data-act="lookup"]');if(btn&&!quiet){btn.disabled=true;btn.textContent='Loading…';}
  try{
    const r=await fetch('api/player?tag='+encodeURIComponent(tag));const j=await r.json();
    if(!r.ok)throw new Error(j.message||('Lookup failed ('+r.status+')'));
    // A different player's tag opens as its own profile, so the collection that was here stays in the switcher.
    slotForTag(key,tag);
    const p=prof(key);
    const base=[],evo=[],hero=[],levels={};
    for(const c of j.cards){const k=ID_TO_CARD[c.id];if(!k||!C[k])continue;base.push(k);levels[k]=c.level;if(c.evo&&C[k].ev)evo.push(k);if(c.hero&&C[k].he)hero.push(k);}
    // The API reports real tower troop IDs; keep them for deck links.
    (j.towers||[]).forEach(t=>{const x=TOWERS.find(y=>y.name===t.name);if(x&&t.id)x.tid=t.id;});
    store.set('ef2-towerids',Object.fromEntries(TOWERS.map(t=>[t.id,t.tid])));
    const towers=(j.towers||[]).map(t=>TOWERS.find(x=>x.tid===t.id||x.name===t.name)).filter(Boolean).map(t=>t.id);
    p.col={base,evo,hero,towers:towers.length?towers:['tower-princess']};p.levels=levels;p.tag=tag;p.source='tag';p.updated=Date.now();p.trophies=j.trophies??null;p.current=(j.currentDeck||[]).map(i=>ID_TO_CARD[i]).filter(k=>k&&C[k]);
    if(/^Player \d$/.test(p.name)||!p.name)p.name=j.name||p.name;
    saveProfiles();renderPlayers();
    if(!quiet){toast('Loaded '+j.name+': '+evo.length+' Evos, '+hero.length+' Heroes');if(state.view==='gen')forge();else setStatus('');}
    return true;
  }catch(e){renderPlayers();return fail(e.message||'Lookup failed. Check the tag and try again.');}
}

/* ---------- small UI helpers ---------- */
function showErr(m){$('err').textContent=m;$('err').hidden=false;if(typeof openBuild==='function')openBuild();}
/* Phones: once a collection is loaded, the settings fold into one bar so the decks are the first thing on screen.
   Anything that needs the settings (an error, pinning a deck to tweak) opens them again. */
const buildUI={open:null};
function updateBuildBar(){
  const bar=$('buildbar');if(!bar)return;
  const keys=state.mode==='duo'?['A','B']:['A'],ready=keys.every(k=>prof(k).source!=='unset'),N=names();
  if(buildUI.open===null)buildUI.open=!ready;
  if(!ready)buildUI.open=true;
  bar.hidden=!ready;bar.setAttribute('aria-expanded',buildUI.open);
  bar.innerHTML=`<span class="bb-main"><b>${esc(keys.map(k=>N[k]).join(' + '))}</b><span>${buildUI.open?'Tap to hide settings':'Players, playstyle and search'}</span></span><span class="bb-act">${buildUI.open?'Hide':'Settings'}</span>`;
  document.querySelector('.build').classList.toggle('compact',ready&&!buildUI.open);
  if(window.updateFab)window.updateFab();
}
function openBuild(){if(buildUI.open)return;buildUI.open=true;updateBuildBar();}
document.addEventListener('click',e=>{if(e.target.closest('#buildbar')){buildUI.open=!buildUI.open;updateBuildBar();}});
function hideErr(){$('err').hidden=true;}
function setStatus(t){$('status').textContent=t;}
function relTime(t){const m=Math.round((Date.now()-t)/60000);if(m<2)return'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<48)return h+' h ago';return Math.round(h/24)+' days ago';}

/* ---------- player cards ---------- */
function meter(cls,label,have,total){const pct=total?Math.round(have/total*100):0;return `<div class="meter ${cls}"><span>${label}</span><span class="bar"><i style="width:${pct}%"></i></span><b>${have}/${total}</b></div>`;}
function sourceLine(p){
  if(p.source==='tag')return `<div class="source">Collection from player tag #${esc(p.tag)}${p.trophies!=null?', '+Number(p.trophies).toLocaleString()+' trophies':''}, updated ${relTime(p.updated)}.</div>`;
  if(p.source==='code')return `<div class="source">Collection from a share code, updated ${relTime(p.updated)}.</div>`;
  if(p.source==='manual')return `<div class="source">Collection set up by hand, updated ${relTime(p.updated)}.</div>`;
  return `<div class="source warn">Collection not set up yet, so decks assume this player owns every Evo and Hero.</div>`;
}
function playerHTML(key){
  const p=prof(key),r=state.rules[key],duo=state.mode==='duo';
  const cs=colSets(p);
  const baseHave=cs.base?cs.base.size:BASE_CARDS.length;
  const opts=profiles.map(x=>`<option value="${x.id}"${x.id===p.id?' selected':''}>${esc(x.name)}</option>`).join('');
  const towerOpts=['auto',...TOWER_IDS.filter(t=>cs.towers.has(t))].map(t=>`<option value="${t}"${r.tower===t?' selected':''}>${t==='auto'?'Recommended for each deck':TOWER[t].name}</option>`).join('');
  return `<div class="player ${key==='B'?'b':''}" data-key="${key}">
    <div class="phead"><span class="pbadge" aria-hidden="true">${key==='A'?1:2}</span>
      <input class="pname" id="pname-${key}" value="${esc(p.name)}" aria-label="Player name" maxlength="24">
      <select class="pswitch" id="pswitch-${key}" aria-label="Switch player">${opts}<option value="__new">New player</option><option value="__code">Add from share code</option>${profiles.length>2?`<option value="__del">Remove ${esc(p.name)}</option>`:''}</select></div>
    <div class="colsum">${meter('e','Evos',cs.evo.size,EVO_CARDS.length)}${meter('h','Heroes',cs.hero.size,HERO_CARDS.length)}${meter('','Cards',baseHave,BASE_CARDS.length)}</div>
    ${sourceLine(p)}
    <div class="field"><label class="lbl" for="tag-${key}">Player tag</label>
      <div class="tagrow"><input type="text" id="tag-${key}" placeholder="#2PP" value="${p.tag?'#'+esc(p.tag):''}" autocomplete="off" spellcheck="false"><button class="btn" type="button" data-act="lookup">Load</button></div>
      ${state.api===false?'<p class="hint">Tag lookup needs the Elixir Forge server, which isn\'t running on this copy. Set up the collection below instead.</p>':''}</div>
    <div class="btns"><button class="btn" type="button" data-act="edit">Set up collection</button><button class="btn" type="button" data-act="share">Share code</button></div>
    <details ${r.locks.length||r.exclude.size||r.style!=='any'||r.role!=='flex'?'open':''}><summary>Deck rules for ${esc(p.name)}${(()=>{const n=r.locks.length+r.exclude.size+(r.style!=='any'?1:0)+(r.role!=='flex'?1:0)+(r.tower!=='auto'?1:0);return n?` <span class="rcount" title="${n} rule${n>1?'s':''} set">${n}</span>`:'';})()}</summary>
      <div style="display:grid;gap:10px;margin-top:10px">
        ${r.locks.length||r.exclude.size||r.style!=='any'||r.role!=='flex'||r.tower!=='auto'?`<div><button class="btn sm" type="button" data-act="clearrules">Clear these rules</button></div>`:''}
        <div class="field picker"><label class="lbl" for="inc-${key}">Must include</label>
          <input id="inc-${key}" type="search" placeholder="Type a card, e.g. Hog Rider" autocomplete="off" data-picker="inc" data-key="${key}">
          <ul class="matches" id="inc-${key}-matches" hidden></ul><div class="chips" id="inc-${key}-chips"></div></div>
        <div class="field picker"><label class="lbl" for="exc-${key}">Never use</label>
          <input id="exc-${key}" type="search" placeholder="Cards to leave out" autocomplete="off" data-picker="exc" data-key="${key}">
          <ul class="matches" id="exc-${key}-matches" hidden></ul><div class="chips" id="exc-${key}-chips"></div>
          <p class="hint">Pick a version to block only the Evo, Hero or normal card.</p></div>
        <div class="row2">
          <div class="field"><label class="lbl" for="style-${key}">Playstyle</label><select id="style-${key}">${STYLE_OPTS.map(([v,t])=>`<option value="${v}"${r.style===v?' selected':''}>${t}</option>`).join('')}</select></div>
          <div class="field"><label class="lbl" for="tower-${key}">Tower troop</label><select id="tower-${key}">${towerOpts}</select></div>
        </div>
        ${duo?`<div class="field"><label class="lbl" for="role-${key}">Team role</label><select id="role-${key}"><option value="flex"${r.role==='flex'?' selected':''}>Flexible: attacks and defends</option><option value="attack"${r.role==='attack'?' selected':''}>Attacker: leads the pushes</option><option value="defend"${r.role==='defend'?' selected':''}>Defender: holds both lanes</option></select></div>`:''}
      </div>
    </details>
  </div>`;
}
function welcomeHTML(){
  const p=prof('A');
  if(p.source!=='unset'||store.get('ef2-welcomed',false))return '';
  return `<div class="welcome" id="welcome"><div><b>Build from the cards you own</b><span>${state.api?'Enter your player tag under Players and press Load. You\'ll find the tag under your name on your in-game profile.':'Press Set up collection under Players and tick the Evolutions and Heroes you\'ve unlocked.'} Until then, decks assume you own everything.</span></div><button class="btn sm" type="button" id="welcome-x">Got it</button></div>`;
}
document.addEventListener('click',e=>{if(e.target.id==='welcome-x'){store.set('ef2-welcomed',true);const w=$('welcome');if(w)w.remove();}});
function renderPlayers(){
  const ws=$('welcomeslot');if(ws)ws.innerHTML=welcomeHTML();
  const keys=state.mode==='duo'?['A','B']:['A'];
  $('players').innerHTML=keys.map(playerHTML).join('<div style="height:10px"></div>');
  keys.forEach(renderChips);updateBuildBar();
  const anyLevels=keys.some(k=>prof(k).levels);
  $('levelhint').textContent=anyLevels?'':'(needs a player tag)';
}
function chipFormsFor(key,c){const cs=colSets(prof(key));return formsOf(c).filter(f=>f==='champ'||(f==='evo'?cs.evo.has(c.id):cs.hero.has(c.id)));}
function renderChips(key){
  saveRules();
  const r=state.rules[key];
  const inc=$('inc-'+key+'-chips');if(!inc)return;
  inc.innerHTML=r.locks.map((l,i)=>{const c=C[l.id];const fs=chipFormsFor(key,c);
    if(l.form!=='any'&&l.form!=='normal'&&!fs.includes(l.form))l.form='any';
    let sel='';if(isChamp(c))sel='<span class="badge champ">Champion</span>';
    else if(fs.length)sel=`<select aria-label="Form for ${esc(c.name)}" data-lock="${i}"><option value="any"${l.form==='any'?' selected':''}>Any form</option>${fs.map(f=>`<option value="${f}"${l.form===f?' selected':''}>${formLabel[f]}</option>`).join('')}<option value="normal"${l.form==='normal'?' selected':''}>Normal</option></select>`;
    return `<span class="chip">${esc(c.name)} ${sel}<button type="button" aria-label="Remove ${esc(c.name)}" data-rm="${i}">✕</button></span>`;}).join('');
  $('exc-'+key+'-chips').innerHTML=[...r.exclude].map(([id,f])=>{const c=C[id];const fs=isChamp(c)?[]:formsOf(c);
    const sel=fs.length?`<select aria-label="Which version of ${esc(c.name)} to block" data-exf="${id}"><option value="all"${f==='all'?' selected':''}>All versions</option>${fs.map(x=>`<option value="${x}"${f===x?' selected':''}>${formLabel[x]} only</option>`).join('')}<option value="normal"${f==='normal'?' selected':''}>Normal only</option></select>`:'';
    return `<span class="chip">${esc(c.name)} ${sel}<button type="button" aria-label="Allow ${esc(c.name)} again" data-ex="${id}">✕</button></span>`;}).join('');
}

/* card search pickers (delegated so they survive re-renders) */
function pickerMatches(q,taken){q=q.trim().toLowerCase();if(!q)return[];return CARDS.filter(c=>!taken(c.id)&&c.name.toLowerCase().includes(q)).slice(0,9);}
function renderMatches(list,m){list.innerHTML=m.length?m.map(c=>`<li><button type="button" data-id="${c.id}">${artImg(c.id,null,'mart')}<b>${esc(c.name)}</b><span class="hint">${c.e} elixir</span><span class="forms">${formsOf(c).map(f=>`<span class="badge ${f}">${formLabel[f]}</span>`).join('')}</span></button></li>`).join(''):'<li class="hint" style="padding:7px 8px">No matching card</li>';list.hidden=false;}
function pickerTaken(inp){const t=inp.dataset.picker,k=inp.dataset.key;if(t==='vs')return id=>state.vs.includes(id);if(t==='chk')return id=>state.check.ids.includes(id);if(t==='chkb')return id=>(state.check.idsB||[]).includes(id);const r=state.rules[k];return t==='inc'?id=>r.locks.some(l=>l.id===id):id=>r.exclude.has(id);}
function pickerPick(inp,id){
  const t=inp.dataset.picker,k=inp.dataset.key;
  if(t==='vs'){if(state.vs.length>=8){toast('Their deck already has 8 cards');return;}state.vs.push(id);renderVs();return;}
  if(t==='chk'||t==='chkb'){const ck=state.check,list=t==='chk'?ck.ids:ck.idsB;if(list.length>=8){toast('That deck already has 8 cards');return;}list.push(id);ck.result=null;if(checkReady())runCheck();else{renderCheck();setTimeout(()=>{const i=$(t);if(i&&!i.disabled)i.focus();},0);}return;}
  const r=state.rules[k];
  if(t==='inc'){if(r.locks.length>=8){showErr('A deck holds 8 cards. Remove one before adding another.');return;}r.locks.push({id,form:'any'});if(r.exclude.get(id)==='all')r.exclude.delete(id);}
  else{r.exclude.set(id,'all');r.locks=r.locks.filter(l=>l.id!==id);}
  hideErr();renderChips(k);
}
document.addEventListener('input',e=>{const inp=e.target.closest('[data-picker]');if(!inp)return;const list=$(inp.id+'-matches');const m=pickerMatches(inp.value,pickerTaken(inp));if(!inp.value.trim()){list.hidden=true;return;}renderMatches(list,m);});
document.addEventListener('keydown',e=>{const inp=e.target.closest('[data-picker]');if(!inp)return;const list=$(inp.id+'-matches');if(e.key==='Enter'){const b=list.querySelector('button');if(b){e.preventDefault();b.click();}}if(e.key==='Escape')list.hidden=true;});
document.addEventListener('focusout',e=>{const inp=e.target.closest('[data-picker]');if(!inp)return;setTimeout(()=>{const l=$(inp.id+'-matches');if(l)l.hidden=true;},150);});
document.addEventListener('mousedown',e=>{if(e.target.closest('.matches'))e.preventDefault();});
document.addEventListener('click',e=>{const b=e.target.closest('.matches button[data-id]');if(!b)return;const list=b.closest('.matches');const inp=$(list.id.replace(/-matches$/,''));pickerPick(inp,b.dataset.id);inp.value='';list.hidden=true;inp.focus();});

function renderVs(){$('vs-chips').innerHTML=state.vs.map((id,i)=>`<span class="chip">${esc(C[id].name)}<button type="button" aria-label="Remove ${esc(C[id].name)}" data-vsrm="${i}">✕</button></span>`).join('');}
$('vs').dataset.picker='vs';
/* Opponent scouting: fill "their cards" with the deck a player used most recently. */
async function loadVsTag(){
  const tag=String($('vstag').value||'').toUpperCase().replace(/^#/,'').replace(/O/g,'0').trim();
  if(!/^[0289PYLQGRJCUV]{3,14}$/.test(tag)){toast('That doesn\'t look like a player tag');return;}
  const b=$('vstag-go');b.disabled=true;
  try{
    const r=await fetch('api/battles?tag='+encodeURIComponent(tag));const j=await r.json();
    if(!r.ok)throw new Error(j.message||'Lookup failed');
    const d=(j.decks||[]).find(x=>!(x.modes||[]).every(m=>/draft/i.test(m)));
    const ids=d?d.cards.map(x=>ID_TO_CARD[+String(x).split(':')[0]]).filter(k=>k&&C[k]):[];
    if(ids.length<6)throw new Error('No recent deck found for that player');
    state.vs=ids.slice(0,8);renderVs();toast('Loaded '+(j.name||'their')+(j.name?'\'s':'')+' latest deck');
  }catch(e){toast(e.message||'Lookup failed');}
  b.disabled=false;
}
$('vstag-go').addEventListener('click',loadVsTag);
$('vstag').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadVsTag();}});
$('vs-chips').addEventListener('click',e=>{const b=e.target.closest('[data-vsrm]');if(b){state.vs.splice(+b.dataset.vsrm,1);renderVs();}});

/* player panel events */
$('players').addEventListener('keydown',e=>{if(e.key==='Enter'&&/^tag-[AB]$/.test(e.target.id)){e.preventDefault();lookupTag(e.target.id.slice(4),e.target.value);}});
$('players').addEventListener('click',e=>{
  const card=e.target.closest('.player');if(!card)return;const key=card.dataset.key,r=state.rules[key];
  const act=e.target.closest('[data-act]');
  if(act){const a=act.dataset.act;
    if(a==='lookup')lookupTag(key,$('tag-'+key).value);
    if(a==='edit')openEditor(key);
    if(a==='share')openShare(key);
    if(a==='clearrules'){state.rules[key]=blankRules();saveRules();renderPlayers();toast('Rules cleared');}
    return;}
  const rm=e.target.closest('[data-rm]');if(rm){r.locks.splice(+rm.dataset.rm,1);renderChips(key);return;}
  const ex=e.target.closest('[data-ex]');if(ex){r.exclude.delete(ex.dataset.ex);renderChips(key);}
});
$('players').addEventListener('change',()=>setTimeout(saveRules,0));
$('players').addEventListener('change',e=>{
  const card=e.target.closest('.player');if(!card)return;const key=card.dataset.key,r=state.rules[key],t=e.target;
  if(t.dataset.lock!=null){r.locks[+t.dataset.lock].form=t.value;return;}
  if(t.dataset.exf){r.exclude.set(t.dataset.exf,t.value);if(t.value==='all')r.locks=r.locks.filter(l=>l.id!==t.dataset.exf);renderChips(key);return;}
  if(t.id==='style-'+key)r.style=t.value;
  if(t.id==='role-'+key)r.role=t.value;
  if(t.id==='tower-'+key)r.tower=t.value;
  if(t.id==='pname-'+key){prof(key).name=t.value.trim()||('Player '+(key==='A'?1:2));saveProfiles();renderPlayers();}
  if(t.id==='pswitch-'+key){
    if(t.value==='__new'){const p=newProfile('Player '+(profiles.length+1));profiles.push(p);slots[key]=p.id;saveProfiles();renderPlayers();openEditor(key);return;}
    if(t.value==='__code'){openShare(key,true);renderPlayers();return;}
    if(t.value==='__del'){const other=slots[key==='A'?'B':'A'],gone=slots[key];const next=profiles.find(x=>x.id!==gone&&x.id!==other);if(next){profiles=profiles.filter(x=>x.id!==gone);slots[key]=next.id;saveProfiles();toast('Player removed');}renderPlayers();return;}
    slots[key]=t.value;saveProfiles();renderPlayers();
  }
});
$('players').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id&&e.target.id.startsWith('tag-')){e.preventDefault();lookupTag(e.target.id.slice(4),e.target.value);}});

/* ---------- collection editor ---------- */
let editor=null;
function openEditor(key){editor={key,tab:'evo',q:''};renderEditor();$('sheet').hidden=false;if(matchMedia('(hover:hover) and (pointer:fine)').matches)setTimeout(()=>{const s=$('ed-search');if(s)s.focus();},30);}
function closeSheet(){$('sheet').hidden=true;$('sheet').innerHTML='';editor=null;renderPlayers();}
function editorItems(){
  const p=prof(editor.key),cs=colSets(p);const q=editor.q.toLowerCase();
  let list;
  if(editor.tab==='evo')list=EVO_CARDS.map(id=>({id,on:cs.evo.has(id)}));
  else if(editor.tab==='hero')list=HERO_CARDS.map(id=>({id,on:cs.hero.has(id)}));
  else if(editor.tab==='base')list=BASE_CARDS.map(id=>({id,on:!cs.base||cs.base.has(id)}));
  else return TOWERS.map(t=>({id:t.id,tower:true,on:cs.towers.has(t.id)}));
  return list.filter(x=>!q||C[x.id].name.toLowerCase().includes(q)).sort((a,b)=>C[a.id].name.localeCompare(C[b.id].name));
}
function renderEditor(){
  const p=prof(editor.key),cs=colSets(p);
  const tabs=[['evo','Evolutions',cs.evo.size+'/'+EVO_CARDS.length],['hero','Heroes',cs.hero.size+'/'+HERO_CARDS.length],['base','Cards',(cs.base?cs.base.size:BASE_CARDS.length)+'/'+BASE_CARDS.length],['tower','Tower troops',cs.towers.size+'/'+TOWERS.length]];
  const help={evo:'Tap every Evolution '+p.name+' has unlocked.',hero:'Tap every Hero '+p.name+' has unlocked.',base:'Most players own nearly every card. Untap any '+p.name+' hasn\'t unlocked yet.',tower:'Tap the tower troops '+p.name+' has.'}[editor.tab];
  const items=editorItems();
  $('sheet').innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ed-h">
    <header><h2 id="ed-h">${esc(p.name)}'s collection</h2><button class="btn" type="button" data-ed="close">Done</button></header>
    <div class="tools"><div class="tabs" role="tablist">${tabs.map(([k,t,n])=>`<button role="tab" aria-selected="${editor.tab===k}" data-edtab="${k}">${t} <span class="hint">${n}</span></button>`).join('')}</div></div>
    <div class="body"><p class="hint" style="margin:0 0 10px">${help}</p>
      <div class="tools" style="padding:0 0 10px"><input type="search" id="ed-search" placeholder="Search" value="${esc(editor.q)}" aria-label="Search cards"><button class="btn sm" type="button" data-ed="all">Own all</button><button class="btn sm" type="button" data-ed="none">Own none</button></div>
      <div class="ogrid">${items.map(x=>{const name=x.tower?TOWER[x.id].name:C[x.id].name;const rc=x.tower?'champion':(editor.tab==='base'?rarityOf(C[x.id]):editor.tab==='evo'?'epic':'rare');const m=x.tower?name.split(' ').map(w=>w[0]).join(''):MONO[x.id];
        return `<button type="button" class="own" aria-pressed="${x.on}" data-own="${x.id}" style="--rc:var(--r-${rc})"><span class="tick" aria-hidden="true">${x.on?'✓':''}</span>${(x.tower?(TOWER_ART[x.id]?`<img class="oart" src="${esc(TOWER_ART[x.id])}" alt="" loading="lazy" onerror="this.remove()">`:''):artImg(x.id,editor.tab==='base'?null:editor.tab,'oart'))||`<span class="m" aria-hidden="true">${esc(m)}</span>`}<span class="n">${editor.tab==='evo'?'Evo ':editor.tab==='hero'?'Hero ':''}${esc(name)}</span></button>`;}).join('')||'<p class="hint">No matching card</p>'}</div></div>
    <footer><span class="hint" style="margin-right:auto">Changes save as you tap.</span><button class="btn" type="button" data-ed="code">Paste a share code</button><button class="btn primary" type="button" data-ed="close">Done</button></footer></div>`;
}
$('sheet').addEventListener('click',e=>{
  if(e.target===$('sheet')){closeSheet();return;}
  if(!editor){const s=e.target.closest('[data-share]');if(s)shareAction(s.dataset.share);return;}
  const p=prof(editor.key);
  const tab=e.target.closest('[data-edtab]');if(tab){editor.tab=tab.dataset.edtab;editor.q='';renderEditor();return;}
  const ed=e.target.closest('[data-ed]');
  if(ed){const a=ed.dataset.ed;
    if(a==='close'){closeSheet();return;}
    if(a==='code'){const k=editor.key;closeSheet();openShare(k,true);return;}
    const vis=editorItems().map(x=>x.id);const on=a==='all';
    toggleMany(p,vis,on);renderEditor();return;}
  const own=e.target.closest('[data-own]');
  if(own){toggleMany(p,[own.dataset.own],own.getAttribute('aria-pressed')!=='true');renderEditor();const b=document.querySelector(`[data-own="${own.dataset.own}"]`);if(b)b.focus();}
});
$('sheet').addEventListener('input',e=>{if(e.target.id==='ed-search'&&editor){editor.q=e.target.value;const pos=e.target.selectionStart;renderEditor();const s=$('ed-search');s.focus();s.setSelectionRange(pos,pos);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sheet').hidden)closeSheet();});
function toggleMany(p,ids,on){
  const t=editor.tab;
  if(t==='base'){let base=p.col.base?new Set(p.col.base):new Set(BASE_CARDS);ids.forEach(id=>on?base.add(id):base.delete(id));p.col.base=base.size===BASE_CARDS.length?null:[...base];}
  else{const f=t==='evo'?'evo':t==='hero'?'hero':'towers';const s=new Set(p.col[f]);ids.forEach(id=>on?s.add(id):s.delete(id));if(f==='towers'&&!s.size)s.add('tower-princess');p.col[f]=[...s];}
  if(p.source==='unset')p.source='manual';
  p.updated=Date.now();saveProfiles();
}

/* ---------- share codes ---------- */
let shareKey=null;
function openShare(key,importMode){
  shareKey=key;const p=prof(key);const code=encodeCollection(colSets(p));
  $('sheet').innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-h" style="width:min(520px,100%)">
    <header><h2 id="sh-h">Share code</h2><button class="btn" type="button" data-share="close">Done</button></header>
    <div class="body" style="display:grid;gap:14px">
      ${importMode?'':`<div><p class="hint" style="margin:0 0 6px">Send this to a teammate. Pasting it into their Elixir Forge gives them ${esc(p.name)}'s exact collection.</p><div class="codebox" id="sh-code">${code}</div><div class="btns" style="margin-top:8px"><button class="btn primary" type="button" data-share="copy">Copy code</button></div></div>`}
      <div class="field"><label class="lbl" for="sh-in">Paste a code ${importMode?'from a teammate':'to replace '+esc(p.name)+'\'s collection'}</label><input type="text" id="sh-in" placeholder="ef1-…" autocomplete="off" spellcheck="false">
        <div class="btns" style="margin-top:8px"><button class="btn" type="button" data-share="load">${importMode?'Add as a new player':'Use this code'}</button></div><p class="err" id="sh-err" hidden></p></div>
    </div></div>`;
  $('sheet').dataset.import=importMode?'1':'';
  $('sheet').hidden=false;
}
function shareAction(a){
  if(a==='close'){$('sheet').hidden=true;$('sheet').innerHTML='';renderPlayers();return;}
  if(a==='copy'){copyText($('sh-code').textContent,document.querySelector('[data-share="copy"]'));return;}
  if(a==='load'){
    const col=decodeCollection($('sh-in').value);
    if(!col){const er=$('sh-err');er.textContent='That code isn\'t valid. Codes start with ef1- and come from the Share code button.';er.hidden=false;return;}
    const data={base:col.base?[...col.base]:null,evo:[...col.evo],hero:[...col.hero],towers:[...col.towers]};
    if($('sheet').dataset.import){const p=newProfile('Teammate',{source:'code',col:data});profiles.push(p);slots[shareKey]=p.id;}
    else{const p=prof(shareKey);p.col=data;p.source='code';p.levels=null;p.updated=Date.now();}
    saveProfiles();$('sheet').hidden=true;$('sheet').innerHTML='';renderPlayers();toast('Collection loaded');
  }
}
function copyText(text,btn){
  const done=()=>{if(!btn)return;const o=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=o,1400);};
  const fallback=()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){toast('Select the text and copy it');}ta.remove();};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,fallback);else fallback();
}

/* ---------- building generator inputs ---------- */
function sideOpts(key){
  const p=prof(key),r=state.rules[key],rules=collectionToRules(colSets(p));
  const exclude=new Set(rules.exclude),ban={};
  for(const [id,s] of Object.entries(rules.ban))ban[id]=new Set(s);
  for(const [id,f] of r.exclude){if(f==='all')exclude.add(id);else (ban[id]=ban[id]||new Set()).add(f);}
  r.locks.forEach(l=>exclude.delete(l.id));
  const useLv=$('levelmatch').checked&&p.levels;
  return{locked:r.locks.map(l=>l.id),forms:Object.fromEntries(r.locks.map(l=>[l.id,l.form])),exclude,ban,style:r.style,role:r.role,
    levels:useLv?p.levels:null,levelRef:useLv?levelRef(p.levels):0};
}
function validate(key){
  const p=prof(key),r=state.rules[key],cs=colSets(p),who=state.mode==='duo'?p.name+': ':'';
  for(const l of r.locks){
    if(cs.base&&!cs.base.has(l.id))return who+p.name+' doesn\'t own '+C[l.id].name+'. Add it in Set up collection or remove the pin.';
    if(l.form==='evo'&&!cs.evo.has(l.id))return who+p.name+' doesn\'t have Evo '+C[l.id].name+'.';
    if(l.form==='hero'&&!cs.hero.has(l.id))return who+p.name+' doesn\'t have Hero '+C[l.id].name+'.';
    const b=r.exclude.get(l.id);if(b&&b!=='all'&&b===l.form)return who+C[l.id].name+' is pinned as '+formLabel[b]+' but that version is blocked.';
  }
  const champs=r.locks.filter(l=>isChamp(C[l.id])).length,evo=r.locks.filter(l=>l.form==='evo').length,hero=r.locks.filter(l=>l.form==='hero').length;
  if(champs>1)return who+'A deck holds only one Champion.';
  if(evo>2)return who+'A deck holds at most 2 Evos.';
  if(hero+champs>2)return who+'Heroes and Champions share 2 slots at most.';
  if(evo+hero+champs>3)return who+'Only 3 special slots exist.';
  return null;
}

/* ---------- background worker: keeps the page responsive during the search ---------- */
let worker=null,jobId=0;const jobs={};
function getWorker(){
  if(worker)return worker;
  try{
    const src=$('engine').textContent+`
self.onmessage=e=>{const{id,kind,args}=e.data;try{
  if(kind==='meta'){applyMeta(args);self.postMessage({id,res:true});return;}
  if(kind==='cards'){syncCards(args);self.postMessage({id,res:true});return;}
  memo=new Map();scCache=new Map();
  const res=kind==='duo'?generateDuo(args):generate(args);self.postMessage({id,res});
}catch(err){self.postMessage({id,error:String(err&&err.message||err)});}};`;
    worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
    worker.onmessage=e=>{const j=jobs[e.data.id];if(!j)return;delete jobs[e.data.id];e.data.error?j.rej(new Error(e.data.error)):j.res(e.data.res);};
    worker.onerror=()=>{worker=null;};
  }catch(e){worker=null;}
  return worker;
}
function runJob(kind,args){
  const w=getWorker();
  if(!w)return new Promise((res,rej)=>setTimeout(()=>{try{memo=new Map();scCache=new Map();res(kind==='duo'?generateDuo(args):generate(args));}catch(e){rej(e);}},30));
  return new Promise((res,rej)=>{const id=++jobId;jobs[id]={res,rej};w.postMessage({id,kind,args});});
}

/* ---------- forge ---------- */
async function forge(){
  hideErr();saveRules();
  const duo=state.mode==='duo';
  const v=validate('A')||(duo&&validate('B'));
  if(v){showErr(v);return;}
  if(duo){const a=state.rules.A.locks.map(l=>l.id);const sh=state.rules.B.locks.filter(l=>a.includes(l.id)).length;if(sh>2){showErr('The two decks can share at most 2 cards, but '+sh+' of the same cards are pinned.');return;}}
  const btn=$('go');btn.disabled=true;btn.textContent=duo?'Forging your team…':'Forging decks…';
  setView('gen',true);setStatus(duo?'Searching thousands of team pairs…':'Searching thousands of decks…');
  if(!(duo?state.lastDuo:state.last).length)$('out').innerHTML='<div class="skel" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
  else $('out').classList.add('stale');
  const t=performance.now();
  const count=+$('count').value,maxAvg=+$('maxavg').value,vs=state.vs.length?state.vs.slice():null;
  try{
    if(duo){
      const o={A:sideOpts('A'),B:sideOpts('B'),maxAvg,count,priority:$('priority').value,names:names(),vs,levelW:$('levelmatch').checked?1:0,avoid:{...recent.duo}};
      const pairs=await runJob('duo',o);
      state.lastDuo=pairs;state.lastOpts=o;noteShown('duo',pairs.flatMap(q=>[q.A,q.B]));
      if(!pairs.length){$('out').innerHTML='';setStatus('');showErr('No legal pair fits these rules. Remove a pin or a blocked card and try again.');}
      else{setStatus(pairs.length+' team pair'+(pairs.length>1?'s':'')+' in '+((performance.now()-t)/1000).toFixed(1)+' s. Forge again for fresh options.');renderDuo(pairs);}
    }else{
      const sa=sideOpts('A');
      const opts={...sa,maxAvg,count,maxChamps:1,vs,levelW:$('levelmatch').checked?1:0,avoid:{...recent['1v1']}};
      const decks=await runJob('gen',opts);
      state.last=decks;state.lastOpts=opts;noteShown('1v1',decks.map(d=>d.ids));
      if(!decks.length){$('out').innerHTML='';setStatus('');showErr('No legal deck fits these rules. Remove a pin or a blocked card and try again.');}
      else{setStatus(decks.length+' deck'+(decks.length>1?'s':'')+' in '+((performance.now()-t)/1000).toFixed(1)+' s. Forge again for fresh options.');renderDecks(decks);}
    }
  }catch(e){showErr('The search hit an error: '+e.message);}
  $('out').classList.remove('stale');
  btn.disabled=false;btn.textContent=duo?'Forge team':'Forge decks';
}
/* Phones: a floating Forge button whenever the main one has scrolled out of view. */
(function(){const fab=$('go-fab'),go=$('go');if(!fab||!('IntersectionObserver' in window))return;
  let vis=true;const upd=window.updateFab=()=>{fab.hidden=vis||state.view!=='gen'||!matchMedia('(max-width:900px)').matches||!$('sheet').hidden;fab.textContent=go.textContent;fab.disabled=go.disabled;};
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;upd();}).observe(go);
  new MutationObserver(upd).observe(go,{childList:true,characterData:true,subtree:true,attributes:true});
  new MutationObserver(upd).observe($('sheet'),{attributes:true});
  fab.addEventListener('click',()=>go.click());})();
// On phones the results sit below the settings, so bring them into view once the button is pressed.
$('go').addEventListener('click',()=>{const r=forge();if(matchMedia('(max-width:900px)').matches)Promise.resolve(r).then(()=>document.querySelector('.tabs').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}));});

/* ---------- analysis text ---------- */
function prosCons(d){
  const pros=[],cons=[];
  [...d.pairs].filter(p=>!p.meta).sort((a,b)=>b.w-a.w).slice(0,3).forEach(p=>pros.push({t:C[p.a].name+' + '+C[p.b].name,d:p.why}));
  const cycle=cycleCost(d.ids);
  if(cycle<=8)pros.push({t:'Fast cycle',d:'Only '+cycle+' elixir to get back to your win condition'});
  if(d.k.air>=3)pros.push({t:'Strong air defense',d:d.k.air+' cards hit air'});
  if(d.forms&&d.forms.value>=24)pros.push({t:'Strong special slots',d:d.forms.specials.map(x=>displayName(x.id,x.form==='champ'?null:x.form)).join(', ')+' are strong this week'});
  if(d.syn.parts.cov===100)pros.push({t:'Covers every role',d:'Air defense, splash, both spell sizes, a tank killer and cheap cycle'});
  d.syn.notes.forEach(n=>cons.push({t:'Shared weakness',d:n}));
  const k=d.k;
  if(k.air<2)cons.push({t:'Weak to air',d:'Only '+k.air+' card'+(k.air===1?'':'s')+' hit air, so Balloon and Lava Hound are a problem'});
  if(k.splash<1)cons.push({t:'No splash',d:'Swarms like Skeleton Army and Goblin Gang are hard to clear'});
  if(k.small<1)cons.push({t:'No small spell',d:'Goblin Barrel and bait decks will chip you down'});
  if(k.big<1)cons.push({t:'No big spell',d:'Hard to finish towers or punish clumped support'});
  if(k.kill<1)cons.push({t:'No tank killer',d:'Golem, Giant and Mega Knight take a lot to stop'});
  if(d.avg>=4)cons.push({t:'Heavy deck',d:'Average '+d.avg.toFixed(1)+' elixir; fast cycle decks can out-rotate you'});
  else if(cycle>=12)cons.push({t:'Slow to cycle',d:cycle+' elixir to get back to the same card'});
  if(d.forms&&d.forms.empty)cons.push({t:'Empty special slot',d:'This player doesn\'t own enough Evos or Heroes to fill all 3 slots'});
  if(d.lv&&d.lv.under.length)cons.push({t:'Under-levelled cards',d:d.lv.under.map(u=>C[u.id].name+' (level '+u.L+')').join(', ')+' sit below this player\'s usual level'});
  d.ids.filter(id=>has(C[id],'W')&&WIN_COUNTER[id]).slice(0,2).forEach(id=>cons.push({t:'Counter to watch',d:WIN_COUNTER[id]}));
  return{pros,cons};
}
function vsHTML(vs){
  if(!vs)return'';
  const rows=vs.oppWins.map(w=>{const a=vs.answers[w]||[];return `<li><b>${vs.meta?'':'Their '}${esc(C[w].name)}</b><span>${a.length?'Answered by '+a.map(i=>esc(C[i].name)).join(', '):'No clean answer in this deck'}</span></li>`;}).join('');
  return `<div><h3 class="${vs.notes.length?'bad':'good'}" style="font-size:14px;font-weight:900;margin:0 0 6px">${vs.meta?'Against the current meta':'Against their deck'}</h3><ul style="margin:0;padding:0;list-style:none;display:grid;gap:7px;font-size:14px">${rows}${vs.notes.map(n=>`<li><b>Watch out</b><span>${esc(n)}</span></li>`).join('')}</ul></div>`;
}
const cycleCost=ids=>ids.map(id=>C[id].e).sort((a,b)=>a-b).slice(0,4).reduce((a,b)=>a+b,0);
function archLabel(ids){
  const wins=ids.filter(id=>has(C[id],'W')).sort((a,b)=>C[b].e-C[a].e);
  const st=(ARCH[wins[0]]||[])[0];
  return (wins.map(id=>C[id].name).join(' + ')||'Support')+(st?' '+STYLE_NAME[st]:'');
}

const isDefBld=i=>C[i].type==='b'&&!has(C[i],'W')&&i!=='elixir-collector';
/* ---------- Score breakdown: how a score adds up, how the deck handles each kind of threat, and its answers to popular win conditions ---------- */
const POPULAR_WINS=['hog-rider','balloon','minion-giant','royal-giant','golem','giant','electro-giant','lava-hound','goblin-barrel','graveyard','x-bow','miner','battle-ram'];
const INFERNO=new Set(['inferno-tower','inferno-dragon']);
const clamp100=v=>Math.max(0,Math.min(100,Math.round(v)));
const nameList=(ids,max)=>{const n=ids.map(i=>C[i].name);return n.length>(max||4)?n.slice(0,max||4).join(', ')+' and '+(n.length-(max||4))+' more':n.join(', ');};
function deckRatings(ids){
  const cs=ids.map(i=>C[i]),non=ids.filter(i=>C[i].type!=='s');
  const air=non.filter(i=>has(C[i],'A')&&C[i].e>1),airSp=ids.filter(i=>C[i].type==='s'&&(has(C[i],'s')||has(C[i],'F'))&&!['the-log','barbarian-barrel','earthquake','royal-delivery'].includes(i));
  const splash=non.filter(i=>has(C[i],'S')),small=ids.filter(i=>C[i].type==='s'&&has(C[i],'s'));
  const kill=ids.filter(i=>has(C[i],'K')),bld=ids.filter(i=>isDefBld(i));
  const big=ids.filter(i=>C[i].type==='s'&&has(C[i],'F')),tanks=ids.filter(i=>has(C[i],'T')),eq=ids.includes('earthquake');
  const sv=ids.filter(i=>SMALL_VULN.has(i)),fv=ids.filter(i=>FB_VULN.has(i));
  const sum=cs.reduce((a,c)=>a+c.e,0),avg=sum/8;
  return[
    {label:'Against air',val:clamp100([8,38,64,84,100][Math.min(4,air.length)]+Math.min(10,airSp.length*5)),why:air.length?nameList(air)+' hit air'+(airSp.length?', plus '+nameList(airSp,2):''):'No troop or building in this deck hits air'},
    {label:'Against swarms',val:clamp100(splash.length*28+small.length*26+(big.length?8:0)),why:splash.length||small.length?nameList([...splash,...small])+(splash.length+small.length===1?' clears':' clear')+' groups of small troops':'No splash damage and no small spell'},
    {label:'Against tanks',val:clamp100(kill.length*38+bld.length*22+(ids.some(i=>INFERNO.has(i))?12:0)),why:kill.length||bld.length?nameList([...kill,...bld])+(kill.length?' melt':' distract')+(kill.length+bld.length===1?'s':'')+' heavy troops':'No tank killer and no defensive building'},
    {label:'Against buildings',val:clamp100(big.length*34+(eq?22:0)+tanks.length*22+(ids.includes('miner')?14:0)),why:big.length||tanks.length||eq?nameList([...big,...(eq?['earthquake']:[]),...tanks])+(big.length+(eq?1:0)+tanks.length===1?' gets':' get')+' through defensive buildings and siege':'No big spell or tank to push through a building'},
    {label:'Holding up to spells',val:clamp100(100-Math.max(0,sv.length-1)*17-Math.max(0,fv.length-1)*17),why:(sv.length>1?sv.length+' cards die to a small spell ('+nameList(sv,3)+'). ':'')+(fv.length>1?fv.length+' cards die to Fireball ('+nameList(fv,3)+').':'')||'One spell can\'t take out much of this deck'},
    {label:'Cycle speed',val:clamp100((4.7-avg)/(4.7-2.6)*100),why:'Average elixir '+avg.toFixed(1)+'; four cheapest cards cost '+cycleCost(ids)}
  ];
}
const verdict=v=>v>=75?['Strong','good']:v>=45?['Fair','mid']:['Weak','bad'];
function barsHTML(rows){
  return `<ul class="bars">${rows.map(r=>{const [w,c]=verdict(r.val);return `<li><span class="blabel">${esc(r.label)}</span><span class="btrack"><i class="${c}" style="width:${Math.max(4,r.val)}%"></i></span><span class="bval ${c}">${w} ${Math.round(r.val/10)}/10</span><span class="bwhy">${esc(r.why)}</span></li>`;}).join('')}</ul>`;
}
/* Answers to a win condition: listed hard counters count fully; cards that help by role (a tank killer against
   a tank, an air hitter against Balloon, a small spell against Goblin Barrel) count as half an answer. */
function softAnswers(w,ids){
  const c=C[w],non=ids.filter(i=>C[i].type!=='s');
  if(w==='balloon')return non.filter(i=>(has(C[i],'A')&&C[i].e>1)||isDefBld(i)); // any defensive building also pulls a Balloon off the tower
  if(['lava-hound','minion-giant'].includes(w))return non.filter(i=>has(C[i],'A')&&C[i].e>1);
  if(has(c,'T'))return ids.filter(i=>has(C[i],'K')||(isDefBld(i))||(has(C[i],'X')&&C[i].type!=='s'));
  if(['hog-rider','battle-ram','ram-rider','royal-hogs','wall-breakers'].includes(w))return ids.filter(i=>(isDefBld(i))||(has(C[i],'X')&&C[i].type!=='s')||has(C[i],'K'));
  if(['goblin-barrel','graveyard','skeleton-barrel','goblin-drill'].includes(w))return ids.filter(i=>(C[i].type==='s'&&has(C[i],'s'))||(C[i].type!=='s'&&has(C[i],'S')));
  if(['x-bow','mortar'].includes(w))return ids.filter(i=>has(C[i],'T')||(C[i].type==='s'&&has(C[i],'F')));
  if(w==='miner')return ids.filter(i=>has(C[i],'M')||(has(C[i],'X')&&C[i].type!=='s'));
  return [];
}
function winAnswersHTML(decks){ // decks: [{ids}] — answers come from every deck given (both decks in 2v2)
  const all=[...new Set(decks.flatMap(d=>d.ids))];
  return `<ul class="wins">${POPULAR_WINS.filter(w=>C[w]&&COUNTERS[w]).map(w=>{
    const hard=COUNTERS[w].filter(i=>all.includes(i)),soft=softAnswers(w,all).filter(i=>!hard.includes(i)&&i!==w);
    const v=hard.length+soft.length*0.5,[word,c]=v>=2?['Strong','good']:v>=1?['Fair','mid']:['Weak','bad'];
    const txt=hard.length||soft.length?[hard.length?nameList(hard,3):'',soft.length?(hard.length?'also helped by ':'Helped by ')+nameList(soft,3):''].filter(Boolean).join('; '):'No answer in '+(decks.length>1?'either deck':'this deck');
    return `<li>${miniCard(w)}<span class="swtxt"><b>${esc(C[w].name)}</b><span>${esc(txt)}</span></span><span class="bval ${c}">${word}</span></li>`;}).join('')}</ul>`;
}
function scoreSumHTML(d,shown,duo){ // 1v1 only: the real parts of the Forge score, scaled to the number shown
  const F=0.82,cards=d.ids.map(i=>C[i]);
  const strength=cards.reduce((a,c)=>a+(duo?c.p2:c.p),0)/8*6,slots=d.forms?d.forms.value*1.3-d.forms.empty*25:-60,syn=d.synPct*0.32,vs=d.vs?d.vs.score:0;
  const parts=[['Card strength',strength,'How strong these 8 cards are in the current meta'],['Evo, Hero and Wild slots',slots,d.forms&&d.forms.empty?d.forms.empty+' of 3 special slots empty':'All 3 special slots filled with forms this player owns'],['Synergy',syn,d.synPct+'% of the possible combo, support and coverage credit']];
  if(d.vs)parts.push(d.vs.meta?['Against the current meta',vs*(d.vs.w||1),'Answers to the strongest win conditions and spells being played now']:['Against their deck',vs,'Answers to the opponent\'s win conditions and spells']);
  const rows=parts.map(([t,v,why])=>({t,v:Math.round(v*F),why}));
  const k=d.k,gaps=[];
  if(k.wc===0)gaps.push('no win condition');if(k.wc>2)gaps.push('too many win conditions');
  if(k.air+Math.min(1,(k.airSp||0)*0.5)<2)gaps.push('too little air defence');if(k.splash<1)gaps.push('no splash damage');if(k.small<1)gaps.push('no small spell');
  if(k.big<1)gaps.push('no big spell');if(k.kill<1)gaps.push('no tank killer');if(k.cheap<2)gaps.push('too few cheap cards');
  if(k.spells>3)gaps.push('too many spells');if(k.bld>2)gaps.push('too many buildings');if(d.avg<2.5)gaps.push('very low elixir cost');
  if(d.lv&&d.lv.under&&d.lv.under.length)gaps.push(d.lv.under.length+' under-levelled card'+(d.lv.under.length>1?'s':''));
  rows.push({t:'Balance',v:shown-rows.reduce((a,r)=>a+r.v,0),why:gaps.length?'Points lost for: '+gaps.join(', '):'Nothing important missing'});
  return `<table class="sum"><tbody>${rows.map(r=>`<tr><th scope="row">${esc(r.t)}<span>${esc(r.why)}</span></th><td class="${r.v<0?'neg':''}">${r.v>0?'+':''}${r.v}</td></tr>`).join('')}<tr class="total"><th scope="row">Forge score</th><td>${shown}</td></tr></tbody></table>`;
}
function reportHTML(d,shown,duo){
  return `<div class="report" hidden>
    <div class="rcol"><h3>How the score adds up</h3>${scoreSumHTML(d,shown,duo)}<h3>How it handles each threat</h3>${barsHTML(deckRatings(d.ids))}</div>
    <div class="rcol"><h3>Answers to popular win conditions</h3>${winAnswersHTML([{ids:d.ids}])}</div></div>`;
}
function duoReportHTML(p,N){
  const tp=p.t.parts;
  const team=[['Combos across both decks',tp.combo],['Win condition support',tp.wc],['Team coverage',tp.cov],['Role split',tp.comp],['No shared weakness',tp.weak]].map(([label,val])=>({label,val,why:''}));
  return `<div class="report" hidden>
    <div class="rcol"><h3>What makes up team synergy (${p.t.pct}%)</h3>${barsHTML(team)}
      <h3>${esc(N.A)}'s deck</h3>${barsHTML(deckRatings(p.A))}<h3>${esc(N.B)}'s deck</h3>${barsHTML(deckRatings(p.B))}</div>
    <div class="rcol"><h3>Team answers to popular win conditions</h3>${winAnswersHTML([{ids:p.A},{ids:p.B}])}</div></div>`;
}
const scoreBtn=(num,label)=>`<button class="score scorebtn" type="button" data-report="1" aria-expanded="false" title="Show the breakdown" style="--v:${num}"><span class="ring"><span class="num">${num}</span></span><small>${label}</small><small class="more">Breakdown</small></button>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-report]');if(!b)return;const r=b.closest('.deck').querySelector('.report');if(!r)return;r.hidden=!r.hidden;b.setAttribute('aria-expanded',String(!r.hidden));});

/* ---------- tiles ---------- */
function tile(o,levels,ref){
  const c=C[o.id],f=o.form,rar=rarityOf(c);
  const L=levels&&levels[o.id];const low=L!=null&&ref&&ref-L>=1.5;
  const a=ART[o.id];
  if(a){ // picture tile: the official card image carries the name, rarity and Evo/Hero look by itself
    const src=f==='evo'?a.evo:f==='hero'?a.hero:a.base;
    const label=(f==='evo'?'Evo ':f==='hero'?'Hero ':'')+c.name;
    return `<div class="tile pic" title="${esc(label)}">
      <div class="picbox"><img class="art" src="${esc(src)}" alt="${esc(label)}, ${c.e} elixir" loading="lazy" decoding="async" onerror="this.closest('.tile').classList.add('noart');this.remove()">
        <span class="fallname" aria-hidden="true">${esc(label)}</span>
        <div class="drop" aria-hidden="true"><span>${c.e}</span></div></div>
      <div class="cap">${o.slot?`<span class="capslot ${f||''}">${o.slot}</span>`:''}${low?`<span class="caplvl low" title="Lower level than the rest of this deck">Lv ${L}</span>`:''}</div>
    </div>`;
  }
  return `<div class="tile ${f||''}" style="--rc:var(--r-${rar})"><div class="inner">
    <div class="drop" aria-label="${c.e} elixir"><span>${c.e}</span></div>
    ${o.slot?`<span class="slot">${o.slot}</span>`:''}${L!=null?`<span class="lvl ${low?'low':''}">Lv ${L}</span>`:''}
    <span class="mono" aria-hidden="true">${esc(MONO[o.id])}</span>
    ${f?`<span class="badge ${f}">${formLabel[f]}</span>`:''}
    <span class="tname">${esc(c.name)}</span>
    <span class="tsub" title="${RNAME[rar]} ${TYPE_NAME[c.type]}">${TYPE_ICON[c.type]}${RNAME[rar]}</span>
  </div></div>`;
}
function tilesHTML(ids,forms,levels){
  const order=orderDeck(ids,forms);const ref=levels?levelRef(levels):0;
  return `<div class="grid8${ART[order[0].id]?' pics':''}">${order.map(o=>tile(o,levels,ref)).join('')}</div>`;
}
function towerFor(key,sc,ids,duo){
  const r=state.rules[key],cs=colSets(prof(key));
  const rec=pickTower({ids,k:sc.k,avg:sc.avg},[...cs.towers],duo);
  const id=r.tower==='auto'?rec.id:r.tower;
  return{id,rec,chosen:r.tower!=='auto'};
}
function towerHTML(t){
  const tw=TOWER[t.id];
  const alt=!t.chosen&&t.rec.alts.length?' '+t.rec.alts.map(a=>TOWER[a].name).join(' or ')+' could also suit this deck.':'';
  return `<div class="tower">${TOWER_ART[tw.id]?`<img class="tart" src="${esc(TOWER_ART[tw.id])}" alt="" loading="lazy" onerror="this.remove()">`:''}<span>Tower troop: <b>${tw.name}</b></span><span class="hint">${esc(tw.note)}${alt}</span></div>`;
}
function linkBtn(ids,forms,towerId){
  const od=orderDeck(ids,forms),href=deckLink(od,towerId);
  if(!href)return '';
  return `<a class="btn primary" href="${esc(href)}" target="_blank" rel="noopener">Open in Clash Royale</a><button class="btn" type="button" data-copylink="${esc(href)}">Copy link</button>`;
}
// Copy link: for pasting into Safari/Chrome when an in-app browser won't hand the link to the game.
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-copylink]');
  if(c){const t=c.dataset.copylink,done=()=>{const o=c.textContent;c.textContent='Link copied';setTimeout(()=>c.textContent=o,1600);};
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(done).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(_){c.textContent='Could not copy';}ta.remove();});
    return;}
});
function deckText(ids,forms,towerId){return orderDeck(ids,forms).map(o=>displayName(o.id,o.form)+(o.form==='champ'?' (Champion)':'')).join(', ')+(towerId?' | Tower: '+TOWER[towerId].name:'');}

/* ---------- render 1v1 ---------- */
function renderDecks(decks){
  const p=prof('A');const lv=$('levelmatch').checked?p.levels:null;
  $('out').innerHTML=decks.map((d,i)=>{
    const t=towerFor('A',d,d.ids,false);d._tower=t.id;
    const pc=prosCons(d);const li=x=>`<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`;const sy=d.syn.parts;
    return `<article class="deck">
      <div class="dhead"><div><h2 class="dtitle">${esc(archLabel(d.ids))}</h2>
        <div class="dmeta"><span>Average elixir <b>${d.avg.toFixed(1)}</b></span><span>Cycle cost <b>${cycleCost(d.ids)}</b></span><span>Synergy <b>${d.synPct}%</b></span>${d.lv&&d.lv.avg?`<span>Average level <b>${d.lv.avg.toFixed(1)}</b></span>`:''}</div></div>
        ${scoreBtn(showScore(d.s),'Forge score')}</div>
      ${reportHTML(d,showScore(d.s))}
      ${tilesHTML(d.ids,d.forms,lv)}
      ${towerHTML(t)}
      <div class="actions">${linkBtn(d.ids,d.forms,t.id)}<button class="btn" type="button" data-copy="${i}">Copy list</button><button class="btn" type="button" data-save="${i}">Save</button><button class="btn" type="button" data-edit="${i}">Edit</button><button class="btn" type="button" data-pin="${i}">Pin to tweak</button></div>
      <details class="why"><summary>Why this deck</summary>
        <p class="synbreak">Synergy ${d.synPct}%: combos ${sy.combo}%, win condition support ${sy.wc}%, role coverage ${sy.cov}%, shared-weakness check ${sy.weak}%.</p>
        <div class="pc"><div><h3 class="good">Strengths</h3><ul>${pc.pros.map(li).join('')||'<li><span>No standout strengths</span></li>'}</ul></div><div><h3 class="bad">Weaknesses</h3><ul>${pc.cons.map(li).join('')||'<li><span>No major gaps</span></li>'}</ul></div></div>
        ${d.vs?`<div style="margin-top:12px">${vsHTML(d.vs)}</div>`:''}
      </details>
    </article>`;}).join('');
}

/* ---------- render 2v2 ---------- */
const GAP_TEXT={air:'air defense',splash:'splash damage',small:'a small spell',big:'a big spell',kill:'a tank killer'};
function providers(ids,role){return ids.map(i=>C[i]).filter(c=>role==='air'?c.type!=='s'&&has(c,'A'):role==='splash'?c.type!=='s'&&has(c,'S'):role==='small'?c.type==='s'&&has(c,'s'):role==='big'?c.type==='s'&&has(c,'F'):has(c,'K')).map(c=>c.name);}
function teamProsCons(p,N){
  const pros=[],cons=[];
  p.t.cross.filter(x=>!x.meta).sort((a,b)=>b.w-a.w).slice(0,4).forEach(x=>pros.push({t:N.A+'\'s '+C[x.a].name+' + '+N.B+'\'s '+C[x.b].name,d:x.why}));
  const gaps=k=>({air:k.air<2,splash:k.splash<1,small:k.small<1,big:k.big<1,kill:k.kill<1});
  for(const [mine,theirs,who,other] of [[gaps(p.sa.k),p.B,N.A,N.B],[gaps(p.sb.k),p.A,N.B,N.A]])
    for(const role of Object.keys(mine)){if(!mine[role])continue;const by=providers(theirs,role);
      if(by.length)pros.push({t:'Covered by '+other,d:who+' lacks '+GAP_TEXT[role]+'; '+by.slice(0,3).join(', ')+' fill'+(by.length===1?'s':'')+' that gap'});
      else cons.push({t:'Gap neither deck covers',d:'Neither deck has '+GAP_TEXT[role]});}
  const wa=p.A.filter(i=>has(C[i],'W')),wb=p.B.filter(i=>has(C[i],'W'));
  if(p.t.selfA&&p.t.selfB)pros.push({t:'Both decks stand on their own',d:'Each has its own air defense and tank answer, so neither player is helpless when the other is out of cycle'});
  if(p.t.dup.length&&p.t.dup.length<=2)pros.push({t:'Shared cards: '+p.t.dup.map(i=>C[i].name).join(', '),d:'Both decks run '+(p.t.dup.length===1?'this card':'these cards')+' because '+(p.t.dup.length===1?'it is':'they are')+' strong right now'});
  if(wa.length&&wb.length&&!p.t.sameWin.length)pros.push({t:'Two different threats',d:wa.map(i=>C[i].name).join(' + ')+' and '+wb.map(i=>C[i].name).join(' + ')+' need different counters'});
  p.t.notes.forEach(n=>cons.push({t:'Team weakness',d:n}));
  for(const [sc,who] of [[p.sa,N.A],[p.sb,N.B]]){if(sc.forms&&sc.forms.empty)cons.push({t:'Empty special slot',d:who+' doesn\'t own enough Evos or Heroes to fill all 3 slots'});if(sc.lv&&sc.lv.under.length)cons.push({t:'Under-levelled cards',d:who+': '+sc.lv.under.map(u=>C[u.id].name+' (level '+u.L+')').join(', ')});}
  wa.concat(wb).filter((v,i,a)=>a.indexOf(v)===i&&WIN_COUNTER[v]).slice(0,2).forEach(id=>cons.push({t:'Counter to watch',d:WIN_COUNTER[id]}));
  return{pros,cons};
}
function gamePlan(p,N){
  const ra=p.sa.role,rb=p.sb.role;
  if(ra!=='flex'||rb!=='flex'){
    const atk=ra==='attack'?N.A:rb==='attack'?N.B:null,def=ra==='defend'?N.A:rb==='defend'?N.B:null;const parts=[];
    if(atk)parts.push(atk+' is the attacker: build pressure and lead the pushes.');
    if(def)parts.push(def+' is the defender: hold both lanes, then counter-push into the attacker\'s lane.');
    const selfAtk=atk?(atk===N.A?p.t.selfA:p.t.selfB):true;
    parts.push(selfAtk?'Roles are a plan, not a cage: the attacker can still defend when the defender is out of cycle.':'The attacker leans on the defender, so call for help early when you are out of cycle.');
    return parts.join(' ');
  }
  const both=p.t.selfA&&p.t.selfB;
  if(p.t.bdA!==p.t.bdB){const heavy=p.t.bdA?N.A:N.B,light=p.t.bdA?N.B:N.A;
    return heavy+' usually builds the big push and '+light+' pressures the other lane.'+(both?' Both decks defend on their own, so swap roles whenever one of you is out of cycle.':'')+' When the heavy push crosses the bridge, '+light+' can add support behind it.';}
  return 'Neither deck is locked into attack or defense. Whoever has the better hand defends while the other counter-pushes, then push one lane together to overload a tower.';
}
function duoArticle(p,i,plain){
  const N=names();const lvA=$('levelmatch').checked?prof('A').levels:null,lvB=$('levelmatch').checked?prof('B').levels:null;
  
    const ta=towerFor('A',p.sa,p.A,true),tb=towerFor('B',p.sb,p.B,true);p._towers=[ta.id,tb.id];
    const pc=teamProsCons(p,N),tp=p.t.parts;const li=x=>`<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`;
    const half=(ids,sc,key,lv,t)=>`<div class="duodeck ${key==='B'?'b':''}">
      <p class="who"><span class="tag">${esc(N[key])}</span>${sc.role!=='flex'?`<span class="role">${sc.role==='attack'?'Attacker':'Defender'}</span>`:''}<span class="dn">${esc(archLabel(ids))}</span><span>Average elixir <b>${sc.avg.toFixed(1)}</b></span><span>Cycle cost <b>${cycleCost(ids)}</b></span></p>
      ${tilesHTML(ids,sc.forms,lv)}${towerHTML(t)}
      <div class="actions">${linkBtn(ids,sc.forms,t.id)}${plain?'':`<button class="btn sm" type="button" data-dcopy="${i}" data-side="${key}">Copy list</button>`}</div></div>`;
    return `<article class="deck">
      <div class="dhead"><div><h2 class="dtitle">${esc(archLabel(p.A))} with ${esc(archLabel(p.B))}</h2>
        <div class="dmeta"><span>Team synergy <b>${p.t.pct}%</b></span><span>Combos between decks <b>${p.t.cross.filter(x=>!x.meta).length}</b></span></div></div>
        ${scoreBtn(Math.max(1,Math.min(99,Math.round(p.s*0.62))),'Team score')}</div>
      ${duoReportHTML(p,N)}
      <div class="pair">${half(p.A,p.sa,'A',lvA,ta)}${half(p.B,p.sb,'B',lvB,tb)}</div>
      <p class="plan"><b>Game plan</b>${esc(gamePlan(p,N))}</p>
      ${plain?'':`<div class="actions"><button class="btn primary" type="button" data-dshare="${i}">Send to teammate</button><button class="btn" type="button" data-dedit="${i}">Edit decks</button><button class="btn" type="button" data-dsave="${i}">Save pair</button><button class="btn" type="button" data-dpin="${i}">Pin both to tweak</button></div>`}
      <details class="why"><summary>Why these decks work together</summary>
        <p class="synbreak">Team synergy ${p.t.pct}%: combos across all 16 cards ${tp.combo}%, win condition support ${tp.wc}%, team coverage ${tp.cov}%, role split ${tp.comp}%, shared-weakness check ${tp.weak}%.</p>
        <div class="pc"><div><h3 class="good">Team strengths</h3><ul>${pc.pros.map(li).join('')||'<li><span>No standout strengths</span></li>'}</ul></div><div><h3 class="bad">Team weaknesses</h3><ul>${pc.cons.map(li).join('')||'<li><span>No major gaps</span></li>'}</ul></div></div>
        ${p.sa.vs?`<div class="pc" style="margin-top:12px"><div>${vsHTML(p.sa.vs).replace('Against their deck',esc(N.A)+' against their deck').replace('Against the current meta',esc(N.A)+' against the current meta')}</div><div>${vsHTML(p.sb.vs).replace('Against their deck',esc(N.B)+' against their deck').replace('Against the current meta',esc(N.B)+' against the current meta')}</div></div>`:''}
      </details>
    </article>`;}
function renderDuo(pairs){$('out').innerHTML=pairs.map((p,i)=>duoArticle(p,i)).join('');}

/* ---------- top decks tab ---------- */
function renderMeta(){
  const duo=state.mode==='duo';const list=duo?META2:META;
  setStatus(duo?(metaLive.duo?'2v2 decks with the best results in top players\' recent games. Samples are small, so treat win rates as a guide.':'Top 2v2 decks by RoyaleAPI rating. These are single decks with small samples, so win rates run high.'):(metaLive.ranked?'Ranked decks with the best results in top players\' recent games. Samples are small, so treat win rates as a guide.':'Top Ranked (Path of Legends) decks by RoyaleAPI rating.'));
  const keys=duo?['A','B']:['A'];
  $('out').innerHTML=list.map((d,i)=>{
    const ids=d.cards.map(x=>x.split(':')[0]);
    const forms=Object.fromEntries(d.cards.map(x=>{const[a,b]=x.split(':');return[a,b||'normal'];}));
    memo=new Map();
    const sc=scoreDeck(ids,{forms,maxChamps:1,style:'any',maxAvg:5,duo,tag:'meta'});
    const notes=keys.map(k=>{const p=prof(k),cs=colSets(p);const miss=d.cards.map(x=>x.split(':')).filter(([a,f])=>(f==='evo'&&!cs.evo.has(a))||(f==='hero'&&!cs.hero.has(a))||(cs.base&&!cs.base.has(a))).map(([a,f])=>f&&f!=='base'?formLabel[f]+' '+C[a].name:C[a].name);
      return miss.length?`<p class="miss">${esc(p.name)} doesn't have: ${esc(miss.join(', '))}</p>`:`<p class="hint" style="color:var(--good);font-weight:800">${esc(p.name)} owns everything in this deck</p>`;}).join('');
    return `<article class="deck">
      <div class="dhead"><div><h2 class="dtitle">${esc(d.n)}</h2><div class="dmeta"><span>Average elixir <b>${sc.avg.toFixed(1)}</b></span><span>Cycle cost <b>${cycleCost(ids)}</b></span><span>Synergy <b>${sc.synPct}%</b></span></div></div>
        <div class="score"><span class="num" style="color:var(--good)">${d.wr==null?'n/a':d.wr+'%'}</span><small>Win rate${d.games?', '+d.games+' games':''}</small></div></div>
      ${reportHTML({...sc,ids},showScore(sc.s),duo)}
      ${tilesHTML(ids,sc.forms,null)}${notes}
      <div class="actions">${linkBtn(ids,sc.forms,'tower-princess')}<button class="btn" type="button" data-report="1" aria-expanded="false">Forge score ${showScore(sc.s)}</button><button class="btn" type="button" data-medit="${i}">Check with my cards</button><button class="btn" type="button" data-mcopy="${i}">Copy list</button>${keys.map(k=>`<button class="btn" type="button" data-mpin="${i}" data-side="${k}">Pin for ${esc(prof(k).name)}</button>`).join('')}</div>
    </article>`;}).join('');
}

/* ---------- saved decks + results tracking ---------- */
function saveEntry(entry){state.saved.unshift(entry);state.saved=state.saved.slice(0,60);store.set('ef2-saved',state.saved);toast('Saved');}
/* Backup: everything this browser holds (players, collections, saved decks) as one code, to move to another device. */
function backupHTML(){return `<details class="panel backup"><summary>Move to another device</summary>
  <p class="hint">Copy a backup code here, then paste it on your other device. It carries your players, their collections and your saved decks.</p>
  <div class="btns"><button class="btn" type="button" data-bkcopy="1">Copy backup code</button></div>
  <div class="field"><label class="lbl" for="bkin">Paste a backup code</label>
    <div class="tagrow"><input type="text" id="bkin" placeholder="efb1…" autocomplete="off" spellcheck="false"><button class="btn" type="button" data-bkuse="1">Restore</button></div>
    <p class="hint">Restoring replaces the players and saved decks on this device.</p></div></details>`;}
function makeBackup(){return 'efb1.'+btoa(unescape(encodeURIComponent(JSON.stringify({profiles,slots,saved:state.saved}))));}
function useBackup(code){
  try{const m=String(code||'').trim().match(/^efb1\.([A-Za-z0-9+/=]+)$/);if(!m)throw 0;
    const d=JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if(!Array.isArray(d.profiles)||!d.profiles.length||!d.profiles.every(x=>x&&x.id&&x.col&&Array.isArray(x.col.evo)&&Array.isArray(x.col.hero)))throw 0;
    profiles=d.profiles;slots=d.slots&&profiles.find(x=>x.id===d.slots.A)?d.slots:{A:profiles[0].id,B:(profiles[1]||profiles[0]).id};
    state.saved=Array.isArray(d.saved)?d.saved.filter(x=>x&&Array.isArray(x.decks)&&x.decks.every(k=>Array.isArray(k.ids)&&k.ids.every(i=>C[i]))):[];
    saveProfiles();store.set('ef2-saved',state.saved);renderPlayers();renderSaved();toast('Backup restored');
  }catch(e){toast('That backup code isn\'t valid');}
}
$('out').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.bkcopy)copyText(makeBackup(),b);if(b.dataset.bkuse)useBackup($('bkin').value);});
function renderSaved(){
  if(!state.saved.length){setStatus('');$('out').innerHTML='<div class="empty-state"><b>No saved decks yet</b>Press Save on any deck or team pair and it lands here, with a win and loss tracker.</div>'+backupHTML();return;}
  setStatus('Saved on this browser. Track wins and losses to see which decks really work for you.');
  $('out').innerHTML=state.saved.map((s,i)=>{
    const total=s.w+s.l;
    return `<article class="deck"><div class="dhead"><div><h2 class="dtitle">${esc(s.title)}</h2><div class="dmeta"><span>${s.mode==='duo'?'2v2 pair':'1v1'}</span><span>Saved ${new Date(s.at).toLocaleDateString()}</span></div></div>
      <div class="score"><span class="num">${total?Math.round(s.w/total*100)+'%':'–'}</span><small>${total?s.w+' W, '+s.l+' L':'No games logged'}</small></div></div>
      <div class="${s.mode==='duo'?'pair':'solo'}">${s.decks.map(dk=>`<div class="${s.mode==='duo'?'duodeck':'solodeck'} ${dk.key==='B'?'b':''}">${s.mode==='duo'?`<p class="who"><span class="tag">${esc(dk.who)}</span></p>`:''}${tilesHTML(dk.ids,{specials:dk.specials,empty:dk.empty||0},null)}<div class="actions">${linkBtn(dk.ids,{specials:dk.specials},dk.tower)}<button class="btn sm" type="button" data-scopy="${i}" data-d="${s.decks.indexOf(dk)}">Copy list</button></div></div>`).join('')}</div>
      <div class="actions wl"><button class="btn" type="button" data-win="${i}">Log a win</button><button class="btn" type="button" data-loss="${i}">Log a loss</button><button class="btn" type="button" data-sedit="${i}">Edit</button><button class="btn" type="button" data-del="${i}">Delete</button></div>
    </article>`;}).join('')+backupHTML();
}

/* ---------- Check a deck: score any 8 cards against this player's collection and suggest the best single swaps ---------- */
const showScore=s=>Math.max(1,Math.min(99,Math.round(s*0.82)));
function miniCard(id,form){const a=ART[id];return a?`<img class="mini" src="${esc(form==='evo'?a.evo:form==='hero'?a.hero:a.base)}" alt="" loading="lazy" onerror="this.remove()">`:'';}
const teamShown=p=>Math.max(1,Math.min(99,Math.round(p.s*0.62)));
function checkReady(){const ck=state.check;return ck.ids.length===8&&(!ck.idsB||ck.idsB.length===8);}
function renderCheck(){
  const p=prof('A'),ck=state.check,N=names(),team=!!ck.idsB,cur=(p.current||[]).filter(i=>C[i]);
  const chipRow=(list,side)=>list.map((id,i)=>`<span class="chip">${miniCard(id)}${esc(C[id].name)}<button type="button" aria-label="Remove ${esc(C[id].name)}" data-chkrm="${i}" data-side="${side}">✕</button></span>`).join('');
  const field=(list,side,label)=>`<div class="field picker"><label class="lbl" for="chk${side}">${esc(label)} (${list.length} of 8)</label>
        <input id="chk${side}" type="search" placeholder="${list.length>=8?'Remove a card to swap it':'Type a card name to add it'}" autocomplete="off" data-picker="chk${side}" ${list.length>=8?'disabled':''}>
        <ul class="matches" id="chk${side}-matches" hidden></ul><div class="chips">${chipRow(list,side)}</div></div>`;
  let res='';
  const delta=now=>ck.base==null||now===ck.base?'':`<p class="delta ${now>ck.base?'up':'down'}">${team?'Team score':'Forge score'} was <b>${ck.base}</b>, now <b>${now}</b> (${now>ck.base?'+':''}${now-ck.base})</p>`;
  if(ck.busy)res=`<p class="status">${team?'Scoring the team…':'Checking the deck and trying swaps…'}</p>`;
  else if(ck.result&&ck.result.error)res=`<p class="err">${esc(ck.result.error)}</p>`;
  else if(ck.result&&ck.result.pair){res=delta(teamShown(ck.result.pair))+duoArticle(ck.result.pair,0,true);}
  else if(ck.result){
    const d=ck.result.deck,t=towerFor('A',d,d.ids,false),pc=prosCons(d),sy=d.syn.parts,li=x=>`<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`;
    const lv=$('levelmatch').checked?p.levels:null;
    const swaps=ck.result.swaps;
    res=delta(showScore(d.s))+`<article class="deck">
      <div class="dhead"><div><h2 class="dtitle">${esc(archLabel(d.ids))}</h2>
        <div class="dmeta"><span>Average elixir <b>${d.avg.toFixed(1)}</b></span><span>Cycle cost <b>${cycleCost(d.ids)}</b></span><span>Synergy <b>${d.synPct}%</b></span></div></div>
        ${scoreBtn(showScore(d.s),'Forge score')}</div>
      ${reportHTML(d,showScore(d.s))}
      ${tilesHTML(d.ids,d.forms,lv)}${towerHTML(t)}
      ${d.forms.empty?`<p class="source warn">${d.forms.empty} of the 3 special slots ${d.forms.empty>1?'are':'is'} empty: this deck doesn't have enough Evo, Hero or Champion cards that ${esc(p.name)} owns. That is the biggest thing holding the score down.</p>`:''}
      <div class="swaps"><h3>Best single swaps</h3>
        ${swaps.length?`<ul>${swaps.map((x,i)=>`<li>${miniCard(x.out)}<span class="arrow" aria-hidden="true">›</span>${miniCard(x.in,x.inForm)}<span class="swtxt"><b>Swap ${esc(C[x.out].name)} for ${esc(displayName(x.in,x.inForm))}</b><span>Forge score ${showScore(d.s)} to ${showScore(x.s)}</span></span><button class="btn sm" type="button" data-chkswap="${i}">Apply</button></li>`).join('')}</ul>`:'<p class="hint">No single swap from this collection scores higher. This deck is already well tuned for the cards owned.</p>'}
      </div>
      <div class="actions">${linkBtn(d.ids,d.forms,t.id)}<button class="btn" type="button" data-chksave="1">Save</button></div>
      <details class="why"><summary>Why it scores this way</summary>
        <p class="synbreak">Synergy ${d.synPct}%: combos ${sy.combo}%, win condition support ${sy.wc}%, role coverage ${sy.cov}%, shared-weakness check ${sy.weak}%.</p>
        <div class="pc"><div><h3 class="good">Strengths</h3><ul>${pc.pros.map(li).join('')||'<li><span>No standout strengths</span></li>'}</ul></div><div><h3 class="bad">Weaknesses</h3><ul>${pc.cons.map(li).join('')||'<li><span>No major gaps</span></li>'}</ul></div></div>
      </details></article>`;
  }
  $('out').innerHTML=`<section class="panel checkbox">
      <h2>${team?'Edit a team':'Check or edit a deck'}</h2>
      <p class="hint">${team?'Remove a card with ✕ and type another to replace it. The team score updates as soon as both decks have 8 cards.':`Add any 8 cards, or press Edit on a forged deck. Remove a card with ✕ and add another to see how the score changes with ${esc(p.name)}'s collection.`}</p>
      ${!team&&cur.length===8?`<div><button class="btn" type="button" data-chkcur="1">Use ${esc(p.name)}'s current deck</button></div>`:''}
      ${field(ck.ids,'',team?N.A+'\'s deck':'Cards')}
      ${team?field(ck.idsB,'b',N.B+'\'s deck'):''}
      <div class="btns"><button class="btn primary" type="button" data-chkgo="1" ${checkReady()&&!ck.busy?'':'disabled'}>${team?'Score team':'Check deck'}</button>
        ${team?'<button class="btn" type="button" data-chksolo="1">Check one deck instead</button>':'<button class="btn" type="button" data-chkteam="1">Add a teammate\'s deck</button>'}
        ${ck.ids.length||(ck.idsB&&ck.idsB.length)?'<button class="btn" type="button" data-chkclear="1">Clear</button>':''}</div>
    </section>${res}`;
  setStatus('');
}
async function runCheck(){
  const ck=state.check,ids=ck.ids.slice(),idsB=ck.idsB?ck.idsB.slice():null;if(!checkReady()||ck.busy)return;
  const fail=m=>{ck.result={error:m};renderCheck();};
  for(const l of [ids,idsB])if(l&&l.filter(i=>isChamp(C[i])).length>1)return fail('A deck can hold only one Champion. Remove one and check again.');
  if(idsB&&ids.filter(x=>idsB.includes(x)).length>2)return fail('The two decks can share at most 2 cards.');
  ck.busy=true;ck.result=null;renderCheck();
  const vs=state.vs.length?state.vs.slice():null,levelW=$('levelmatch').checked?1:0;
  try{
    if(idsB){
      const fix=(key,l)=>{const so=sideOpts(key);return{...so,locked:l,forms:{},style:'any',role:'flex',exclude:new Set([...so.exclude].filter(x=>!l.includes(x)))};};
      const pairs=await runJob('duo',{A:fix('A',ids),B:fix('B',idsB),maxAvg:9,count:1,priority:$('priority').value,names:names(),vs,levelW});
      const same=(x,y)=>[...x].sort().join()===[...y].sort().join();
      const pr=pairs.find(q=>same(q.A,ids)&&same(q.B,idsB));
      ck.result=pr?{pair:pr}:{error:'That team can\'t be scored. Each deck needs at least one win condition.'};
    }else{
      const so=sideOpts('A');
      const base={...so,locked:ids,forms:{},style:'any',exclude:new Set([...so.exclude].filter(x=>!ids.includes(x))),maxAvg:9,count:1,maxChamps:1,vs,levelW};
      const cur=(await runJob('gen',base))[0];
      if(!cur){ck.result={error:'That combination can\'t be scored. Check that it has 8 different cards.'};}
      else{
        const swaps=[];
        for(let i=0;i<8;i++){
          const r=(await runJob('gen',{...base,locked:ids.filter((_,j)=>j!==i),exclude:new Set([...so.exclude,ids[i]].filter(x=>x===ids[i]||!ids.includes(x))),maxAvg:Math.max(cur.avg+0.4,4.3)}))[0];
          if(!r)continue;const inn=r.ids.find(x=>!ids.includes(x));
          if(inn&&showScore(r.s)>showScore(cur.s)){const sp=r.forms.specials.find(x=>x.id===inn);swaps.push({out:ids[i],in:inn,inForm:sp?sp.form:null,s:r.s,ids:r.ids});}
        }
        swaps.sort((a,b)=>b.s-a.s);
        const seen=new Set();
        ck.result={deck:cur,swaps:swaps.filter(x=>!seen.has(x.in)&&seen.add(x.in)).slice(0,3)};
      }
    }
  }catch(e){ck.result={error:'The check hit an error: '+e.message};}
  ck.busy=false;if(state.view==='check')renderCheck();
}
function startEdit(ids,idsB,base){state.check={ids:[...ids],idsB:idsB?[...idsB]:null,base,result:null,busy:false};setView('check');runCheck();window.scrollTo({top:$('out').getBoundingClientRect().top+scrollY-70,behavior:'auto'});}
$('out').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset,ck=state.check;
  if(d.edit!=null){const x=state.last[+d.edit];startEdit(x.ids,null,showScore(x.s));return;}
  if(d.dedit!=null){const p=state.lastDuo[+d.dedit];startEdit(p.A,p.B,teamShown(p));return;}
  if(d.chkrm!=null){(d.side==='b'?ck.idsB:ck.ids).splice(+d.chkrm,1);ck.result=null;renderCheck();const i=$('chk'+(d.side||''));if(i&&matchMedia('(hover:hover) and (pointer:fine)').matches)i.focus();}
  if(d.chkclear){ck.ids=[];if(ck.idsB)ck.idsB=[];ck.base=null;ck.result=null;renderCheck();}
  if(d.chkteam){ck.idsB=[];ck.base=null;ck.result=null;renderCheck();}
  if(d.chksolo){ck.idsB=null;ck.base=null;ck.result=null;if(checkReady())runCheck();else renderCheck();}
  if(d.chkcur){ck.ids=(prof('A').current||[]).filter(i=>C[i]).slice(0,8);ck.base=null;ck.result=null;runCheck();}
  if(d.chkgo)runCheck();
  if(d.chkswap!=null&&ck.result&&ck.result.swaps){const x=ck.result.swaps[+d.chkswap];ck.ids=ck.ids.map(i=>i===x.out?x.in:i);runCheck();}
  if(d.chksave&&ck.result&&ck.result.deck){const x=ck.result.deck;const t=towerFor('A',x,x.ids,false);saveEntry({at:Date.now(),mode:'1v1',title:archLabel(x.ids),w:0,l:0,decks:[{key:'A',who:prof('A').name,ids:x.ids,specials:x.forms.specials,empty:x.forms.empty,tower:t.id}]});}
});

/* ---------- Player decks: the decks a featured player (or any tag) used in their most recent battles ---------- */
const FEATURED=CREATORS.filter(c=>c.tag);
if(FEATURED.length)$('tab-creator').textContent=FEATURED.length===1?FEATURED[0].name+' decks':'Creator decks';
function renderCreator(){
  const cr=state.creator,p=prof('A'),cs=colSets(p);
  if(!cr.decks&&!cr.busy&&!cr.error&&state.api){const t=FEATURED[0]?FEATURED[0].tag:store.get('ef2-creator','');if(t){loadCreator(t);return;}}
  let body='';
  if(state.api===false)body='<p class="hint">Recent decks need the Elixir Forge server, which isn\'t running on this copy.</p>';
  else if(cr.busy)body='<p class="status">Loading recent battles…</p>';
  else if(cr.error)body=`<p class="err">${esc(cr.error)}</p>`;
  const list=(cr.decks||[]).map((d,i)=>{
    const ids=d.cards.map(x=>x.split(':')[0]);
    const forms=Object.fromEntries(d.cards.map(x=>{const[a,b]=x.split(':');return[a,b||'normal'];}));
    memo=new Map();
    const sc=scoreDeck(ids,{forms,maxChamps:1,style:'any',maxAvg:5,duo:d.modes.includes('2v2'),tag:'cr'});
    const miss=d.cards.map(x=>x.split(':')).filter(([a,f])=>(f==='evo'&&!cs.evo.has(a))||(f==='hero'&&!cs.hero.has(a))||(cs.base&&!cs.base.has(a))).map(([a,f])=>f?formLabel[f]+' '+C[a].name:C[a].name);
    const tw=TOWERS.find(t=>t.tid===d.tower);
    return `<article class="deck">
      <div class="dhead"><div><h2 class="dtitle">${esc(archLabel(ids))}</h2><div class="dmeta"><span>${esc(d.modes.join(', '))}</span><span>Average elixir <b>${sc.avg.toFixed(1)}</b></span><span>Cycle cost <b>${cycleCost(ids)}</b></span></div></div>
        <div class="score"><span class="num">${d.wins}–${d.losses}</span><small>${d.games} recent game${d.games>1?'s':''}</small></div></div>
      ${reportHTML({...sc,ids},showScore(sc.s),d.modes.includes('2v2'))}
      ${tilesHTML(ids,sc.forms,null)}
      ${miss.length?`<p class="miss">${esc(p.name)} doesn't have: ${esc(miss.join(', '))}</p>`:`<p class="hint" style="color:var(--good);font-weight:800">${esc(p.name)} owns everything in this deck</p>`}
      <div class="actions">${linkBtn(ids,sc.forms,tw?tw.id:'tower-princess')}<button class="btn" type="button" data-report="1" aria-expanded="false">Forge score ${showScore(sc.s)}</button><button class="btn" type="button" data-credit="${i}">Check with my cards</button></div>
    </article>`;}).join('');
  if(cr.decks&&!cr.decks.length&&!cr.busy)body='<p class="hint">No recent battles with a full deck were found for this player.</p>';
  $('out').innerHTML=`<section class="panel">
      <h2>${cr.name?esc(cr.name)+'\'s recent decks':'Player decks'}</h2>
      <p class="hint">Decks from a player's most recent battles, straight from their public battle log (about the last 25 games). ${FEATURED.length?'':'Enter any player tag: a friend, a top player or a creator.'}</p>
      ${(()=>{const seen=new Set(),quick=[...FEATURED.map(c=>({name:c.name,tag:c.tag})),...profiles.filter(x=>x.tag).map(x=>({name:x.name,tag:x.tag}))].filter(x=>!seen.has(x.tag)&&seen.add(x.tag));return quick.length>1?`<div class="btns">${quick.map(c=>`<button class="btn sm${cr.tag===c.tag?' primary':''}" type="button" data-crtag="${esc(c.tag)}">${esc(c.name)}</button>`).join('')}</div>`:'';})()}
      <div class="field"><label class="lbl" for="crtag">Player tag</label>
        <div class="tagrow"><input type="text" id="crtag" placeholder="#2PP" value="${cr.tag?'#'+esc(cr.tag):''}" autocomplete="off" spellcheck="false"><button class="btn" type="button" data-crgo="1">Show decks</button></div></div>
      ${body}
      ${cr.decks&&cr.decks.length?'<p class="hint">Not affiliated with or endorsed by this player. Evo and Hero forms are read from deck slot order, so an unusual slot setup can be shown as the normal card.</p>':''}
    </section>${list}`;
  setStatus('');
}
async function loadCreator(raw){
  const cr=state.creator,tag=String(raw||'').toUpperCase().replace(/^#/,'').replace(/O/g,'0').trim();
  if(!/^[0289PYLQGRJCUV]{3,14}$/.test(tag)){cr.error='That doesn\'t look like a player tag. Tags use only 0 2 8 9 P Y L Q G R J C U V.';cr.decks=null;renderCreator();return;}
  cr.tag=tag;cr.busy=true;cr.error=null;cr.decks=null;cr.name=(FEATURED.find(c=>c.tag===tag)||{}).name||'';renderCreator();
  try{
    const r=await fetch('api/battles?tag='+encodeURIComponent(tag));const j=await r.json();
    if(!r.ok)throw new Error(j.message||('Lookup failed ('+r.status+')'));
    const nice=m=>/2v2|teamvsteam/i.test(m)?'2v2':/^ranked|pathoflegend/i.test(m)?'Ranked':/ladder|^pvp$/i.test(m)?'Trophy Road':String(m).replace(/_/g,' ').replace(/([a-z])([A-Z0-9])/g,'$1 $2');
    cr.decks=(j.decks||[]).filter(d=>!(d.modes||[]).every(m=>/draft/i.test(m))).map(d=>({...d,modes:[...new Set((d.modes||[]).map(nice))]})).map(d=>{const cards=d.cards.map(x=>{const[i,f]=String(x).split(':');const k=ID_TO_CARD[+i];return k?(f?k+':'+f:k):null;});return cards.every(Boolean)?{...d,cards}:null;}).filter(Boolean);
    cr.name=cr.name||j.name||'';if(!FEATURED.length)store.set('ef2-creator',tag);
  }catch(e){cr.error=e.message||'Lookup failed.';}
  cr.busy=false;if(state.view==='creator')renderCreator();
}
$('out').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.crgo)loadCreator($('crtag').value);
  if(d.crtag)loadCreator(d.crtag);
  if(d.credit!=null){const x=state.creator.decks[+d.credit];startEdit(x.cards.map(c=>c.split(':')[0]),null,null);}
});
$('out').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='crtag'){e.preventDefault();loadCreator(e.target.value);}});

/* ---------- Unlock next: which Evo or Hero this player doesn't own would lift their best deck the most ---------- */
function unlockCandidates(){
  const p=prof('A'),cs=colSets(p),duo=state.mode==='duo';
  const own=id=>!cs.base||cs.base.has(id);
  const evo=EVO_CARDS.filter(id=>!cs.evo.has(id)&&own(id)).map(id=>({id,form:'evo',pw:duo?C[id].ev2:C[id].ev}));
  const hero=HERO_CARDS.filter(id=>!cs.hero.has(id)&&own(id)).map(id=>({id,form:'hero',pw:duo?C[id].he2:C[id].he}));
  const top=(a,n)=>a.sort((x,y)=>y.pw-x.pw).slice(0,n);
  return{missing:evo.length+hero.length,list:[...top(evo,7),...top(hero,5)]};
}
function renderUnlock(){
  const p=prof('A'),u=state.unlock,cand=unlockCandidates(),duo=state.mode==='duo';
  let body='';
  if(p.source==='unset')body=`<p class="source warn">${esc(p.name)}'s collection isn't set up yet, so there is nothing to compare. ${state.api?'Load a player tag':'Use Set up collection'} under Players first.</p>`;
  else if(!cand.missing)body=`<p class="hint">${esc(p.name)} already owns every Evo and Hero for the cards in this collection.</p>`;
  else{
    body=`<div class="btns"><button class="btn primary" type="button" data-unlockgo="1" ${u.busy?'disabled':''}>${u.busy?'Testing '+u.done+' of '+u.total+'…':(u.result?'Run again':'Find my best unlocks')}</button></div>`;
    if(u.result&&u.result.error)body+=`<p class="err">${esc(u.result.error)}</p>`;
    else if(u.result){
      const r=u.result,b0=showScore(r.base);
      body+=`<p class="hint">${esc(r.name)}'s best ${r.duo?'2v2':'1v1'} deck scores <b style="color:var(--fg)">${b0}</b> today. Each row shows the best deck that becomes possible with one more unlock.</p>
      <ol class="unlocks">${r.rows.map(x=>{const g=showScore(x.s)-b0;return `<li>
        ${miniCard(x.id,x.form)||`<span class="badge ${x.form}">${formLabel[x.form]}</span>`}
        <div class="swtxt"><b>${esc(displayName(x.id,x.form))}</b><span>Best deck with it scores ${showScore(x.s)}${g>0?', up '+g:g<0?', down '+(-g):', no change'}</span>
          <div class="strip" aria-label="Deck: ${esc(orderDeck(x.ids,x.forms).map(o=>displayName(o.id,o.form)).join(', '))}">${orderDeck(x.ids,x.forms).map(o=>miniCard(o.id,o.form)||`<span class="chip" style="padding:1px 8px;font-size:12px">${esc(C[o.id].name)}</span>`).join('')}</div></div>
        <span class="gain ${g>0?'up':''}">${g>0?'+'+g:g}</span></li>`;}).join('')}</ol>
      <p class="hint">Tested the ${r.rows.length} strongest of ${r.missing} missing Evos and Heroes. Scores come from a quick search, so a difference of a point or two is noise.</p>`;
    }
  }
  if(p.source!=='unset'&&cand.missing&&!u.result&&!u.busy&&u.auto!==p.id+state.mode){u.auto=p.id+state.mode;setTimeout(runUnlock,0);}
  $('out').innerHTML=`<section class="panel"><h2>What to unlock next</h2>
    <p class="hint">Finds the Evos and Heroes ${esc(p.name)} doesn't own yet that would improve their best ${duo?'2v2':'1v1'} deck the most.</p>${body}</section>`;
  setStatus('');
}
async function runUnlock(){
  const u=state.unlock;if(u.busy)return;
  const p=prof('A'),duo=state.mode==='duo',cand=unlockCandidates(),so=sideOpts('A');
  u.busy=true;u.result=null;u.done=0;u.total=cand.list.length;renderUnlock();
  try{
    const base={...so,locked:[],forms:{},style:'any',role:'flex',maxAvg:+$('maxavg').value,count:1,maxChamps:1,vs:null,levels:null,levelRef:0,levelW:0,duo,restarts:60};
    const b1=(await runJob('gen',base))[0],b2=(await runJob('gen',base))[0];
    const s0=Math.max(b1?b1.s:0,b2?b2.s:0);
    const rows=[];
    for(const c of cand.list){
      const ban=Object.fromEntries(Object.entries(so.ban).map(([k,v])=>[k,new Set(v)]));
      if(ban[c.id])ban[c.id].delete(c.form);
      const r=(await runJob('gen',{...base,ban,locked:[c.id],forms:{[c.id]:c.form},restarts:40}))[0];
      if(r)rows.push({id:c.id,form:c.form,s:r.s,ids:r.ids,forms:r.forms});
      u.done++;if(state.view==='unlock')renderUnlock();
    }
    rows.sort((a,b)=>b.s-a.s);
    u.result={rows:rows.slice(0,6),base:s0,missing:cand.missing,name:p.name,duo};
  }catch(e){u.result={error:'The test hit an error: '+e.message};}
  u.busy=false;if(state.view==='unlock')renderUnlock();
}
$('out').addEventListener('click',e=>{if(e.target.closest('[data-unlockgo]'))runUnlock();});

/* ---------- result actions ---------- */
function lockList(ids,forms){return orderDeck(ids,forms).map(o=>({id:o.id,form:o.form==='evo'?'evo':o.form==='hero'?'hero':isChamp(C[o.id])?'any':'normal'}));}
$('out').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.copy!=null){const x=state.last[+d.copy];copyText(deckText(x.ids,x.forms,x._tower),b);}
  if(d.save!=null){const x=state.last[+d.save];saveEntry({at:Date.now(),mode:'1v1',title:archLabel(x.ids),w:0,l:0,decks:[{key:'A',who:prof('A').name,ids:x.ids,specials:x.forms.specials,empty:x.forms.empty,tower:x._tower}]});}
  if(d.pin!=null){const x=state.last[+d.pin];state.rules.A.locks=lockList(x.ids,x.forms);renderPlayers();openBuild();window.scrollTo({top:0,behavior:'smooth'});toast('All 8 cards pinned. Remove the ones to swap, then Forge.');}
  if(d.dcopy!=null){const p=state.lastDuo[+d.dcopy];const k=d.side;copyText(deckText(k==='A'?p.A:p.B,(k==='A'?p.sa:p.sb).forms,p._towers[k==='A'?0:1]),b);}
  if(d.dshare!=null){ // one message with both decks and both game links, for the teammate
    const p=state.lastDuo[+d.dshare],N=names();
    const side=(k,ids,sc,tw)=>N[k]+': '+deckText(ids,sc.forms,tw)+'\n'+(deckLink(orderDeck(ids,sc.forms),tw)||'');
    const text='2v2 team from Elixir Forge: '+archLabel(p.A)+' with '+archLabel(p.B)+'\n\n'+side('A',p.A,p.sa,p._towers[0])+'\n\n'+side('B',p.B,p.sb,p._towers[1])+(/^https?:/.test(location.protocol)?'\n\nBuild your own: '+location.origin+location.pathname+(prof('A').tag&&prof('B').tag?'?a='+prof('A').tag+'&b='+prof('B').tag:''):'');
    if(navigator.share)navigator.share({title:'Elixir Forge 2v2 team',text}).catch(err=>{if(err&&err.name!=='AbortError')copyText(text,b);});
    else copyText(text,b);
  }
  if(d.dsave!=null){const p=state.lastDuo[+d.dsave];const N=names();saveEntry({at:Date.now(),mode:'duo',title:archLabel(p.A)+' with '+archLabel(p.B),w:0,l:0,decks:[{key:'A',who:N.A,ids:p.A,specials:p.sa.forms.specials,empty:p.sa.forms.empty,tower:p._towers[0]},{key:'B',who:N.B,ids:p.B,specials:p.sb.forms.specials,empty:p.sb.forms.empty,tower:p._towers[1]}]});}
  if(d.dpin!=null){const p=state.lastDuo[+d.dpin];state.rules.A.locks=lockList(p.A,p.sa.forms);state.rules.B.locks=lockList(p.B,p.sb.forms);renderPlayers();openBuild();window.scrollTo({top:0,behavior:'smooth'});toast('Both decks pinned');}
  if(d.medit!=null){const x=(state.mode==='duo'?META2:META)[+d.medit];startEdit(x.cards.map(c=>c.split(':')[0]),null,null);return;}
  if(d.mcopy!=null||d.mpin!=null){
    const list=state.mode==='duo'?META2:META;const x=list[+(d.mcopy??d.mpin)];
    const order=x.cards.map(c=>{const[a,f]=c.split(':');return{id:a,form:f||(isChamp(C[a])?'champ':null)};});
    if(d.mcopy!=null)copyText(order.map(o=>displayName(o.id,o.form)).join(', '),b);
    else{state.rules[d.side].locks=order.map(o=>({id:o.id,form:o.form==='evo'||o.form==='hero'?o.form:isChamp(C[o.id])?'any':'normal'}));renderPlayers();openBuild();window.scrollTo({top:0,behavior:'smooth'});toast('Pinned for '+prof(d.side).name);}
  }
  if(d.scopy!=null){const s=state.saved[+d.scopy],dk=s.decks[+d.d];copyText(deckText(dk.ids,{specials:dk.specials},dk.tower),b);}
  if(d.win!=null||d.loss!=null){const s=state.saved[+(d.win??d.loss)];d.win!=null?s.w++:s.l++;store.set('ef2-saved',state.saved);renderSaved();}
  if(d.sedit!=null){const x=state.saved[+d.sedit];startEdit(x.decks[0].ids,x.decks[1]?x.decks[1].ids:null,null);return;}
  if(d.del!=null){const gone=state.saved.splice(+d.del,1)[0],at=+d.del;store.set('ef2-saved',state.saved);renderSaved();
    const t=$('toast');t.innerHTML='Deleted <button type="button" class="undo">Undo</button>';t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,6000);
    t.querySelector('.undo').onclick=()=>{state.saved.splice(Math.min(at,state.saved.length),0,gone);store.set('ef2-saved',state.saved);t.hidden=true;if(state.view==='saved')renderSaved();};}
});

/* ---------- tabs and mode ---------- */
function setView(v,quiet){
  state.view=v;['gen','meta','creator','check','unlock','saved'].forEach(x=>$('tab-'+x).setAttribute('aria-selected',x===v));
  if(window.updateFab)window.updateFab();
  if(quiet)return;
  if(v==='meta')renderMeta();
  else if(v==='check')renderCheck();
  else if(v==='creator')renderCreator();
  else if(v==='unlock')renderUnlock();
  else if(v==='saved')renderSaved();
  else if(state.mode==='duo'&&state.lastDuo.length){renderDuo(state.lastDuo);setStatus(state.lastDuo.length+' team pairs');}
  else if(state.mode==='1v1'&&state.last.length){renderDecks(state.last);setStatus(state.last.length+' decks');}
  else{$('out').innerHTML='<div class="empty-state"><b>Ready when you are</b>Set up each player\'s collection, then press '+(state.mode==='duo'?'Forge team':'Forge decks')+'.</div>';setStatus('');}
}
function rerender(){setView(state.view);}
['gen','meta','creator','check','unlock','saved'].forEach(x=>$('tab-'+x).addEventListener('click',()=>{setView(x);const t=document.querySelector('main .tabs');if(t&&t.getBoundingClientRect().top<0)t.scrollIntoView({block:'start'});$('tab-'+x).scrollIntoView({block:'nearest',inline:'center'});}));
function setMode(m){
  state.mode=m;store.set('ef2-mode',m);
  if(typeof setDataNote==='function'&&setDataNote.last)setDataNote(...setDataNote.last);
  $('mode-1v1').setAttribute('aria-pressed',m==='1v1');$('mode-duo').setAttribute('aria-pressed',m==='duo');
  document.querySelectorAll('.duo-only').forEach(el=>el.hidden=m!=='duo');
  $('count-lbl').textContent=m==='duo'?'Team pairs':'Number of decks';
  $('go').textContent=m==='duo'?'Forge team':'Forge decks';
  $('tab-meta').textContent=m==='duo'?'Top 2v2 decks':'Top Ranked decks';
  hideErr();renderPlayers();setView(state.view==='saved'?'saved':state.view==='meta'?'meta':'gen');
}
$('mode-1v1').addEventListener('click',()=>setMode('1v1'));
$('mode-duo').addEventListener('click',()=>setMode('duo'));

/* ---------- data freshness ---------- */
const metaLive={ranked:false,duo:false};
function setDataNote(date,live){
  setDataNote.last=[date,live];
  $('datachip').textContent='Meta data: '+(state.mode==='duo'?(metaLive.duo?date:DATA_DATE):(metaLive.ranked?date:DATA_DATE));
  const api='Supercell\'s official battle data (top players\' recent games) as of '+date,ra='RoyaleAPI\'s stats from late September, adjusted by hand for the Season 88 balance changes ('+DATA_DATE+')';
  $('datanote').textContent=(metaLive.ranked===metaLive.duo?'Card strength comes from '+(metaLive.ranked?api:ra)+': Ranked numbers drive 1v1, 2v2 numbers drive team mode.':'1v1 card strength comes from '+(metaLive.ranked?api:ra)+'. 2v2 card strength comes from '+(metaLive.duo?api:ra)+', because top players\' logs hold too few 2v2 games to measure.')+' Rarely played cards are pulled toward average so a small sample can\'t dominate.';
  if(NEW_FORMS.length)$('datanote').textContent+=' '+NEW_FORMS.length+' newer Evo or Hero form'+(NEW_FORMS.length>1?'s were':' was')+' picked up from the game ('+NEW_FORMS.slice(0,6).map(x=>displayName(x.id,x.form)).join(', ')+(NEW_FORMS.length>6?' and more':'')+'); their strength is estimated until it is measured.';
}
function useMeta(m){
  if(!m||!applyMeta(m))return false;
  const w=getWorker();if(w){const id=++jobId;jobs[id]={res(){},rej(){}};w.postMessage({id,kind:'meta',args:m});}
  const ok=x=>!!(x&&x.cards&&(x.sides==null||x.sides>=1500));
  metaLive.ranked=m.source==='official-api'&&ok(m.ranked);metaLive.duo=m.source==='official-api'&&ok(m.duo);
  setDataNote(new Date(m.generated).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}),true);
  if(state.view==='meta')renderMeta();
  return true;
}
/* Fresh ratings: a weekly file (data/meta.json) if the site has one, otherwise the server's on-demand numbers
   (api/meta, cached a day). The last good copy is kept in this browser so later visits start with it at once. */
async function loadMeta(){
  setDataNote(DATA_DATE,false);
  const cached=store.get('ef2-meta',null);
  if(cached&&cached.m)useMeta(cached.m);
  if(cached&&Date.now()-cached.at<12*36e5)return;
  const fresh=(async()=>{
    for(const url of ['data/meta.json','api/meta']){
      try{const r=await fetch(url,url.startsWith('data')?{cache:'no-store'}:{});if(!r.ok)continue;const m=await r.json();
        if(useMeta(m)){store.set('ef2-meta',{at:Date.now(),m});return true;}}catch(e){}
    }
    return false;
  })();
  // Don't hold the first search for long: if fresh numbers are slow, start with what's here and apply them when they land.
  await Promise.race([fresh,new Promise(r=>setTimeout(r,cached?0:3000))]);
}

/* ---------- start ---------- */
setMode(state.mode);
/* Links like ?a=TAG&b=TAG open the site with those players loaded (b is the 2v2 teammate). */
function slotForTag(key,tag){
  const cur=prof(key);if(cur.tag===tag||cur.source==='unset')return;
  let p=profiles.find(x=>x.tag===tag&&x.id!==slots[key==='A'?'B':'A']);
  if(!p){p=newProfile('Player '+(key==='A'?1:2));profiles.push(p);}
  slots[key]=p.id;saveProfiles();
}
async function loadLinkedTags(){
  if(!state.api)return;
  const q=new URLSearchParams(location.search),norm=v=>String(v||'').toUpperCase().replace(/^#/,'').replace(/O/g,'0').trim();
  const a=norm(q.get('a')||q.get('tag')),b=norm(q.get('b'));
  const ok=t=>/^[0289PYLQGRJCUV]{3,14}$/.test(t);
  if(!ok(a)&&!ok(b))return;
  if(ok(b))setMode('duo');
  if(ok(a)){slotForTag('A',a);await lookupTag('A',a,{quiet:true});}
  if(ok(b)&&b!==a){slotForTag('B',b);await lookupTag('B',b,{quiet:true});}
  store.set('ef2-welcomed',true);buildUI.open=false;renderPlayers();
}
/* A collection loaded from a tag more than 12 hours ago is refreshed quietly, so new unlocks and levels show up. */
async function refreshStale(){
  if(!state.api)return;
  for(const key of state.mode==='duo'?['A','B']:['A']){const p=prof(key);if(p&&p.source==='tag'&&p.tag&&Date.now()-p.updated>12*36e5)await lookupTag(key,p.tag,{quiet:true});}
}
Promise.all([detectApi().then(loadLinkedTags).then(refreshStale),loadMeta()]).then(()=>forge());
/* Phones: the theme picker is a set-once control, so it lives in the footer and leaves the top of the screen to the decks. */
(function(){const sk=$('skins'),ft=document.querySelector('.foot'),top=document.querySelector('.top');if(!sk||!ft||!top)return;
  const mq=matchMedia('(max-width:640px)'),place=()=>{if(mq.matches){if(sk.parentNode!==ft)ft.insertBefore(sk,ft.firstChild);}else if(sk.parentNode!==top)top.appendChild(sk);};
  place();mq.addEventListener&&mq.addEventListener('change',place);})();
