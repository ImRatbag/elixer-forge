/* ---------- special-slot assignment ---------- */
let memo=new Map();
// A Champion fills the Hero slot at slightly under its card rating: its ability is single-use per deployment,
// but Champions sit in about four in ten top decks, so the discount is small.
const CHAMP_SLOT=0.92; // kept for callers that rate a Champion on its own
// A Champion's ability is what its slot adds. It is single-use per deployment, so it counts for a little less than a
// typical Evo or Hero gain; Champions sit in about four in ten top decks, which this is tuned to match.
const CHAMP_GAIN=1;
// Every filled special slot is worth a flat SLOT_K, plus the form's gain counted at the same weight as card strength.
const SLOT_K_1V1=8.6,SLOT_K_2V2=8.6;
const NOBAN=new Set();
function assignForms(ids,ctx){
  const key=(ctx.tag||'')+[...ids].sort().join(',');
  if(memo.has(key))return memo.get(key);
  const done=v=>(memo.set(key,v),v);
  const mand=[],opts=[];
  for(const id of ids){
    const c=C[id],f=ctx.forms[id]||'any',ban=(ctx.ban&&ctx.ban[id])||NOBAN;
    if(isChamp(c)){mand.push({id,form:'champ',v:pw(c,ctx)+CHAMP_GAIN});continue;}
    if(f==='evo'){if(!c.ev||ban.has('evo'))return done(null);mand.push({id,form:'evo',v:evP(c,ctx)});continue;}
    if(f==='hero'){if(!c.he||ban.has('hero'))return done(null);mand.push({id,form:'hero',v:heP(c,ctx)});continue;}
    if(f==='normal'){if(ban.has('normal'))return done(null);continue;}
    if(c.ev&&!ban.has('evo'))opts.push({id,form:'evo',v:evP(c,ctx)});
    if(c.he&&!ban.has('hero'))opts.push({id,form:'hero',v:heP(c,ctx)});
    if(ban.has('normal')&&!opts.some(o=>o.id===id))return done(null);
  }
  // Cards whose normal version is blocked may only appear in a special slot.
  const mustSpecial=ids.filter(id=>ctx.ban&&ctx.ban[id]&&ctx.ban[id].has('normal')&&!isChamp(C[id]));
  if(mand.filter(m=>m.form==='champ').length>ctx.maxChamps)return done(null);
  if(mand.length>3)return done(null);
  // Fill all 3 special slots whenever the player owns enough Evos/Heroes. Only a player who doesn't
  // (a new account) gets fewer, and every empty slot costs the deck heavily so full decks always win.
  let best=null;
  for(let total=3;total>=mand.length&&!best;total--){
    const need=total-mand.length;
    const test=sel=>{
      const all=mand.concat(sel);
      const e=all.filter(x=>x.form==='evo').length,h=all.length-e;
      if(e>2||h>2)return;
      if(total===3&&(e<1||h<1))return;
      if(mustSpecial.some(id=>!all.some(x=>x.id===id)))return;
      // Slots go to the forms that ADD the most over their normal card: a slotted card plays at its form's rating,
      // an unslotted one at its normal rating, so the best deck is the one with the largest total gain. (Filling by
      // the form's own rating put Hero Barbarian Barrel ahead of Evo Goblin Barrel.) `sum` is kept for display.
      const g=all.reduce((a,x)=>a+x.v-pw(C[x.id],ctx),0);
      if(!best||g>best.value+1e-9)best={specials:all,value:g,sum:all.reduce((a,x)=>a+x.v,0),empty:3-total};
    };
    const rec=(start,sel)=>{
      if(sel.length===need){test(sel);return;}
      for(let i=start;i<opts.length;i++){if(sel.some(s=>s.id===opts[i].id))continue;rec(i+1,sel.concat(opts[i]));}
    };
    rec(0,[]);
  }
  return done(best);
}

/* ---------- deck scoring ---------- */
const GROUND_SPELLS=new Set(['the-log','barbarian-barrel','earthquake']);
function counts(cards){
  const nonSpell=cards.filter(c=>c.type!=='s');
  return{
    wc:cards.filter(c=>has(c,'W')).length,
    air:nonSpell.filter(c=>has(c,'A')&&c.e>1).length, // 1-elixir spirits touch air but aren't air defence
    airSp:cards.filter(c=>c.type==='s'&&(has(c,'s')||has(c,'F'))&&!GROUND_SPELLS.has(c.id)).length,
    splash:nonSpell.filter(c=>has(c,'S')).length,
    small:cards.filter(c=>c.type==='s'&&has(c,'s')).length,
    big:cards.filter(c=>c.type==='s'&&has(c,'F')).length,
    spells:cards.filter(c=>c.type==='s'&&!has(c,'W')).length,
    kill:cards.filter(c=>has(c,'K')).length,
    bld:cards.filter(c=>c.type==='b').length,
    cheap:cards.filter(c=>c.e<=2).length,
    champs:cards.filter(isChamp).length,
    sum:cards.reduce((a,c)=>a+c.e,0)
  };
}
function fitsStyle(cards,style){return style==='any'||cards.some(c=>has(c,'W')&&(ARCH[c.id]||[]).includes(style));}


/* Synergy model. Based on deck-building guides: synergy is (1) direct combos where one card amplifies or covers
   for another, (2) support for the win condition, (3) the deck covering each other's weaknesses (complementary roles),
   minus (4) shared weaknesses, where one spell or counter answers several of your cards at once. */
const SMALL_VULN=new Set('suspicious-bush skeletons goblins spear-goblins goblin-gang skeleton-army princess dart-goblin wall-breakers bomber goblin-barrel skeleton-barrel bats minions minion-horde'.split(' '));
// Support troops a Fireball removes or leaves one hit from dead. Tougher ones (Executioner, Witch, Hunter, Mega Minion) are left out.
const FB_VULN=new Set('musketeer wizard electro-wizard ice-wizard magic-archer archers firecracker dart-goblin princess mother-witch flying-machine zappies three-musketeers rascals goblin-demolisher'.split(' '));
// Troops that fly (and Skeleton Barrel's balloon). An Air deck attacks with several of these, not just its win condition.
const FLYING=new Set('lava-hound balloon minion-giant bats minions minion-horde mega-minion baby-dragon inferno-dragon electro-dragon skeleton-dragons phoenix flying-machine skeleton-barrel'.split(' '));
const MINOR_WIN=new Set(['miner','wall-breakers','skeleton-barrel','suspicious-bush','boss-bandit']);
const DEF_BLD=new Set(['cannon','tesla','bomb-tower','inferno-tower','goblin-cage','tombstone']);
const BAIT_CORE=new Set(['goblin-barrel','goblin-drill','skeleton-barrel','suspicious-bush']);
function synergyOf(ids,k,pairs){
  const cards=ids.map(i=>C[i]);
  // Each card is scored by its single strongest link (3 = core combo). A card with no partner adds nothing,
  // so a deck only reaches 100% when every card has a real reason to be there.
  const bestLink={};ids.forEach(i=>bestLink[i]=0);
  for(const p of pairs){bestLink[p.a]=Math.max(bestLink[p.a],p.w);bestLink[p.b]=Math.max(bestLink[p.b],p.w);}
  let combo=ids.reduce((a,i)=>a+bestLink[i]/3,0)/8;
  const notes=[];
  const small=ids.filter(i=>SMALL_VULN.has(i)).length;
  const fb=ids.filter(i=>FB_VULN.has(i)).length;
  const bait=ids.some(i=>BAIT_CORE.has(i));
  if(bait&&small>=3){combo+=0.15;notes.push(small+' cards share the same spell answer, which overloads it (bait)');}
  const comboS=Math.min(1,combo);
  const loose=ids.filter(i=>bestLink[i]===0).map(i=>C[i].name);
  if(loose.length)notes.push('No direct combo partner: '+loose.join(', '));
  let best=0;
  for(const p of pairs)if(has(C[p.a],'W')||has(C[p.b],'W'))best=Math.max(best,p.w);
  const wcS=best>=3?1:best>=2?0.75:best>=1?0.45:best>0?0.3:0;
  if(!best)notes.push('No card directly supports the win condition');
  const roles=[k.air>=2,k.splash>=1,k.small>=1,k.big>=1,k.kill>=1,k.cheap>=2];
  const covS=roles.filter(Boolean).length/roles.length;
  let weak=1;
  if(!bait){if(small>=4){weak-=0.45;notes.push(small+' cards die to one small spell (Log, Zap or Arrows)');}else if(small===3){weak-=0.25;notes.push('3 cards die to one small spell (Log, Zap or Arrows)');}else if(small===2)weak-=0.1;}
  if(fb>=3){weak-=0.4;notes.push(fb+' cards are wiped out or left on a sliver of health by one Fireball');}else if(fb===2){weak-=0.2;notes.push('2 support cards go down to one Fireball');}
  if(k.air<2){weak-=0.3;}
  const tanks=cards.filter(c=>has(c,'T')).length;if(tanks>2){weak-=0.2;notes.push('Too many tanks fighting for elixir');}
  weak=Math.max(0,weak);
  const pct=Math.round(100*(0.5*comboS+0.2*wcS+0.15*covS+0.15*weak));
  return{pct,parts:{combo:Math.round(comboS*100),wc:Math.round(wcS*100),cov:Math.round(covS*100),weak:Math.round(weak*100)},notes};
}

/* Card strength per mode: Ranked (1v1) ratings, or 2v2 ratings in Duo mode. Both come from RoyaleAPI's
   7-day stats, with low-usage cards pulled toward average so a small sample can't dominate. */
const pw=(c,ctx)=>ctx.duo?c.p2:c.p;
const evP=(c,ctx)=>ctx&&ctx.duo?c.ev2:c.ev;
const heP=(c,ctx)=>ctx&&ctx.duo?c.he2:c.he;
function scoreDeck(ids,ctx){
  const cards=ids.map(i=>C[i]);
  const k=counts(cards);
  const forms=assignForms(ids,ctx);
  let s=cards.reduce((a,c)=>a+pw(c,ctx),0)/8*(ctx.wPow||6);
  let syn=0;const pairs=[];
  for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){const x=SYN[sk(ids[i],ids[j])];if(x){syn+=x.w;pairs.push({a:ids[i],b:ids[j],...x});}}
  const slotPts=forms?forms.value/8*(ctx.wPow||6)+(3-forms.empty)*(ctx.duo?SLOT_K_2V2:SLOT_K_1V1)-forms.empty*25:-60;
  s+=slotPts;
  // 1v1 decks must have a win condition. In 2v2 a pure support deck is allowed as long as the partner brings one
  // (teamScore checks the pair), so here it only costs a little: a win condition in both decks is still preferred.
  if(k.wc===0)s-=ctx.duo?5:40;else if(k.wc>2)s-=18*(k.wc-2);
  // A deck needs a card that can carry a game. Chip cards (Miner, Wall Breakers, Skeleton Barrel, Suspicious Bush,
  // Boss Bandit) count as win conditions, but one of them alone is not a plan; two together are a real chip deck.
  const mainW=cards.filter(c=>has(c,'W')&&!MINOR_WIN.has(c.id)).length;
  if(k.wc>0&&mainW===0&&ctx.style!=='hyperbait'&&!ctx.duo)s-=k.wc>=2?5:16;
  // Buildings: two defensive buildings do the same job twice (Cannon + Goblin Cage), and a spawner beside one is
  // nearly as clumsy. A siege or drill building with one defensive building is a normal deck and is left alone.
  const defB=cards.filter(c=>DEF_BLD.has(c.id)).length,otherB=cards.filter(c=>c.type==='b'&&!has(c,'W')&&!DEF_BLD.has(c.id)).length;
  if(defB>1)s-=14*(defB-1);
  if(otherB>1)s-=10*(otherB-1);
  if(defB>=1&&otherB>=1)s-=7;
  const wins=ids.filter(i=>has(C[i],'W'));
  const clash=wins.length>=2&&!((SYN[sk(wins[0],wins[1])]||{}).w>=2)&&!(ctx.style==='hyperbait'&&wins.length===2&&wins.every(i=>BAIT_CORE.has(i)||i==='wall-breakers'));
  const baitPair=wins.length===2&&wins.every(i=>BAIT_CORE.has(i)||i==='wall-breakers'||i==='miner');
  const clashHurts=clash&&!(ctx.style==='hyperbait'&&baitPair);
  if(clashHurts)s-=ctx.role==='attack'?5:10;
  // Air cover: troops and buildings that hit air, with damaging air spells standing in for up to one of them.
  const airEff=k.air+Math.min(1,k.airSp*0.5);
  if(airEff<2)s-=10*(2-airEff);else if(k.air>=3)s+=2;
  if(k.splash<1)s-=8;
  if(k.small<1)s-=8;
  if(k.big<1&&ctx.style!=='hyperbait')s-=4;
  if(k.spells>3)s-=6*(k.spells-3);
  if(k.kill<1)s-=6;
  if(k.bld>2)s-=6*(k.bld-2);
  if(k.cheap<2)s-=4;
  const avg=k.sum/8;
  if(avg>ctx.maxAvg)s-=6+(avg-ctx.maxAvg)*60; // the search steers hard under the cap; the picker then enforces it
  if(avg<2.5)s-=(2.5-avg)*30;
  // Siege wins by out-cycling: an X-Bow or Mortar deck weighed down with heavy support can't defend its own building.
  if(ids.includes('x-bow')&&avg>3.5)s-=(avg-3.5)*25;
  else if(ids.includes('mortar')&&avg>3.8)s-=(avg-3.8)*20;
  // Graveyard needs something in front to soak the tower's shots.
  if(ids.includes('graveyard')&&!cards.some(c=>has(c,'T')||has(c,'M')||(isChamp(c)&&c.type==='t'&&c.e>=4)))s-=6;
  const bigTanks=cards.filter(c=>has(c,'T')&&c.e>=6).length;
  if(bigTanks>1)s-=8*(bigTanks-1);
  if(!fitsStyle(cards,ctx.style))s-=40;
  else if(ctx.style!=='any'){const off=cards.filter(c=>has(c,'W')&&!(ARCH[c.id]||[]).includes(ctx.style)&&!['miner','wall-breakers'].includes(c.id)).length;s-=12*off;}
  // Air playstyle: the win condition flying isn't enough; the attack needs at least three flying cards in all.
  if(ctx.style==='air'){const fly=ids.filter(i=>FLYING.has(i)).length;if(fly<3)s-=12*(3-fly);else if(fly>=4)s+=3;}
  if(ctx.style==='hyperbait'){
    const sv=ids.filter(i=>SMALL_VULN.has(i)).length,bw=ids.filter(i=>BAIT_CORE.has(i)||i==='wall-breakers').length;
    s+=Math.min(5,Math.max(0,sv-3))*3+(bw>=2?6:-6);
    if(avg>3.0)s-=(avg-3.0)*30;
  }
  if(ctx.role==='defend'){
    if(k.air>=3)s+=4; if(k.kill>=2)s+=4; if(k.bld>=1)s+=3; if(k.splash>=2)s+=3;
    if(cards.some(c=>has(c,'W')&&has(c,'T')&&c.e>=5))s-=14;
    if(avg>3.7)s-=(avg-3.7)*20;
  }else if(ctx.role==='attack'){
    if(cards.some(c=>has(c,'T')))s+=4;
    if(cards.some(c=>has(c,'W')&&c.e>=4))s+=3;
    if(k.wc===2&&!clash)s+=5;
    if(k.big>=1)s+=2;
  }
  // Card levels: a card well below the player's usual level loses to same-cost cards in matchmaking.
  let lv=null;
  if(ctx.levels&&ctx.levelW){
    const under=[];let pen=0;
    for(const id of ids){const L=ctx.levels[id];if(L==null)continue;const d=ctx.levelRef-L;if(d>0.5){pen+=Math.min(d,4);if(d>=1.5)under.push({id,L});}}
    s-=pen*2.4*ctx.levelW;
    const known=ids.map(i=>ctx.levels[i]).filter(x=>x!=null);
    lv={avg:known.length?known.reduce((a,b)=>a+b,0)/known.length:null,under};
  }
  // Matchup: reward answers to the opponent's win conditions and avoid cards their spells wipe out.
  let vs=null;
  // Meta counter searches with a heavy matchup weight (vsW), but only a modest share of it (META_SHOW) counts toward the
  // score people see, so these decks stay comparable with every other playstyle. `adj` is the part taken off at the end.
  let adj=0;
  if(ctx.vs&&ctx.vs.length){vs=matchup(ids,ctx.vs);vs.meta=!!ctx.metaVs;const w=ctx.vsW||1;s+=vs.score*w;if(ctx.metaVs){adj=vs.score*(w-META_SHOW);vs.w=META_SHOW;}}
  const sy=synergyOf(ids,k,pairs);
  if(clashHurts){sy.pct=Math.max(0,sy.pct-10);sy.notes.push('Two win conditions ('+C[wins[0]].name+', '+C[wins[1]].name+') that don\'t support each other');}
  s+=sy.pct*(ctx.wSyn||0.32);
  return{s,forms,slotPts,pairs,k,avg,synPct:sy.pct,syn:sy,role:ctx.role||'flex',lv,vs,adj};
}

function addHeur(c,deck,ctx){
  const cards=deck.map(i=>C[i]);const k=counts(cards);
  let v=pw(c,ctx);
  for(const d of deck){const x=SYN[sk(c.id,d)];if(x)v+=x.w*2.2;}
  if(ctx.levels&&ctx.levelW&&ctx.levels[c.id]!=null){const d=ctx.levelRef-ctx.levels[c.id];if(d>0.5)v-=Math.min(d,4)*2*ctx.levelW;}
  if(ctx.vs&&ctx.vs.length){for(const w of ctx.vs){const cs=COUNTERS[w];if(cs&&cs.includes(c.id))v+=3;}}
  if(ctx.role==='defend'){if(c.type!=='s'&&(has(c,'A')||has(c,'K')||has(c,'S'))||c.type==='b')v+=2;if(has(c,'W')&&has(c,'T')&&c.e>=5)v-=8;}
  else if(ctx.role==='attack'){if(has(c,'W')||has(c,'T'))v+=2;}
  if(ctx.style==='hyperbait'&&(SMALL_VULN.has(c.id)||BAIT_CORE.has(c.id)))v+=2;
  if(ctx.style==='air'&&FLYING.has(c.id))v+=4;
  if(ctx.partner){
    const shared=deck.filter(d=>ctx.partner.includes(d)).length;
    for(const d of ctx.partner){if(d===c.id)v-=shared>=2?40:2;const x=SYN[sk(c.id,d)];if(x&&!x.meta)v+=x.w*1.8;}
    const pc=ctx.partner.map(i=>C[i]);
    if(has(c,'W')&&pc.some(p=>p.id===c.id))v-=6;
    if(has(c,'T')&&c.e>=6&&pc.some(p=>has(p,'T')&&p.e>=6))v-=8;
  }
  // A card that brings a usable Evo or Hero is worth more: by what that form adds, and only if the player owns it.
  const fb=(ctx.ban&&ctx.ban[c.id])||NOBAN;
  const formGain=isChamp(c)?CHAMP_GAIN:Math.max(0,(c.ev&&!fb.has('evo')?evP(c,ctx):0)-pw(c,ctx),(c.he&&!fb.has('hero')?heP(c,ctx):0)-pw(c,ctx));
  v+=formGain*0.9;
  if(has(c,'W')){if(k.wc===0)v+=6;else if(k.wc>=2)v-=10;else v-=3;
    if(ctx.style!=='any'&&!(ARCH[c.id]||[]).includes(ctx.style)&&!['miner','wall-breakers'].includes(c.id))v-=8;}
  if(c.type!=='s'&&has(c,'A')&&c.e>1&&k.air<2)v+=3;
  if(c.type!=='s'&&has(c,'S')&&k.splash<1)v+=3;
  if(c.type==='s'&&has(c,'s')&&k.small<1)v+=3;
  if(c.type==='s'&&has(c,'F')&&k.big<1)v+=2;
  if(c.type==='s'&&!has(c,'W')&&k.spells>=3)v-=6;
  if(has(c,'K')&&k.kill<1)v+=3;
  if(c.type==='b'&&k.bld>=2)v-=6;
  if(isChamp(c)&&k.champs>=ctx.maxChamps)v-=25;
  const left=8-deck.length-1;
  const proj=(k.sum+c.e+left*3.1)/8;
  if(proj>ctx.maxAvg)v-=(proj-ctx.maxAvg)*15;
  return v;
}

/* Starting win condition: a weighted draw, so stronger ones lead more searches but every one gets a turn.
   (Taking the top of rating + noise never once started a search from Hog Rider or Goblin Barrel.) */
function drawWin(list){
  const w=list.map(x=>Math.pow(Math.max(1,x.v-2),1.6));let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<list.length;i++){r-=w[i];if(r<=0)return list[i].id;}
  return list[list.length-1].id;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}

/* "Meta counter" playstyle: the cards a deck most needs answers for right now. The six strongest win conditions and
   the two strongest damage spells by current rating stand in for the opponent, so decks are scored on how well they
   answer what is actually being played. Recomputed each search because ratings refresh. */
const META_SHOW=0.3;
function metaThreats(duo){
  const pwr=c=>duo?c.p2:c.p;
  const wins=CARDS.filter(c=>has(c,'W')&&COUNTERS[c.id]).sort((a,b)=>pwr(b)-pwr(a)).slice(0,6).map(c=>c.id);
  const spells=CARDS.filter(c=>SPELL_VULN[c.id]).sort((a,b)=>pwr(b)-pwr(a)).slice(0,2).map(c=>c.id);
  return wins.concat(spells);
}
function generate(opts){
  memo=new Map();
  const counter=opts.style==='counter'&&!(opts.vs&&opts.vs.length);
  if(opts.style==='counter')opts={...opts,style:'any',vs:counter?metaThreats(!!opts.duo):opts.vs};
  const ctx={metaVs:counter,vsW:counter?1.4:1,forms:opts.forms,ban:opts.ban||{},maxChamps:opts.maxChamps,style:opts.style,maxAvg:opts.maxAvg,levels:opts.levels||null,levelRef:opts.levelRef||0,levelW:opts.levelW||0,vs:opts.vs||null,duo:!!opts.duo,tag:opts.duo?'d|':''};
  const locked=opts.locked;
  const pool=CARDS.filter(c=>!opts.exclude.has(c.id)).map(c=>c.id);
  const found=new Map();
  const RESTARTS=opts.restarts||(locked.length>=7?20:140);
  // Variety at the source: once a card is in over a third of the decks found so far, most attempts in the second half of the search
  // must build without it (the first half always searches at full strength, so the best deck is never lost). Otherwise every attempt settles on the same few top-rated cards and the picker has nothing else to offer.
  const usedN={};
  for(let r=0;r<RESTARTS;r++){
    const hot=opts.variety!==false&&r>=RESTARTS*0.45&&found.size>=8?Object.keys(usedN).filter(id=>usedN[id]>found.size*0.34&&!locked.includes(id)&&Math.random()<0.65):[];
    const rpool=hot.length?pool.filter(id=>!hot.includes(id)):pool;
    let deck=[...locked];
    const lc=deck.map(i=>C[i]);
    let fixedN=locked.length;
    if(deck.length<8&&(!lc.some(c=>has(c,'W'))||!fitsStyle(lc,ctx.style))){
      const wins=rpool.filter(id=>!deck.includes(id)&&has(C[id],'W')&&(ctx.style==='any'||(ARCH[id]||[]).includes(ctx.style)));
      if(wins.length){
        deck.push(drawWin(wins.map(id=>({id,v:pw(C[id],ctx)}))));fixedN=deck.length;
      }
    }
    while(deck.length<8){
      const cands=rpool.filter(id=>!deck.includes(id)).map(id=>({id,v:addHeur(C[id],deck,ctx)+Math.random()*4}));
      cands.sort((a,b)=>b.v-a.v);
      if(!cands.length)break;
      deck.push(cands[Math.random()*Math.min(3,cands.length)|0].id);
    }
    if(deck.length<8)continue;
    let cur=scoreDeck(deck,ctx);
    for(let pass=0;pass<2;pass++){
      let improved=false;
      for(let i=fixedN;i<8;i++){
        const sample=shuffle(rpool.filter(id=>!deck.includes(id))).slice(0,45);
        for(const id of sample){
          const trial=deck.slice();trial[i]=id;
          const sc=scoreDeck(trial,ctx);
          if(sc.s>cur.s+0.01){deck=trial;cur=sc;improved=true;}
        }
      }
      if(!improved)break;
    }
    if(!cur.forms||cur.k.wc<1)continue;
    const key=[...deck].sort().join(',');
    if(!found.has(key)){found.set(key,{ids:deck,...cur});deck.forEach(id=>usedN[id]=(usedN[id]||0)+1);}
  }
  let all=[...found.values()].sort((a,b)=>b.s-a.s);
  // The elixir limit is a limit: over-cap decks are dropped unless pinned cards leave nothing under it.
  {const under=all.filter(d=>d.avg<=opts.maxAvg+1e-9);if(under.length)all=under;}
  // Pick decks one at a time. A deck loses points for every free card already used in a picked deck,
  // and for repeating a win condition, so one strong card can't flood every result.
  // opts.avoid: cards shown in the previous results, so pressing Forge again brings different options.
  const picked=[],uses={...(opts.avoid||{})},seenWin=new Set();
  const shown={},cap=Math.max(1,Math.ceil(opts.count/3));
  const mainWin=d=>d.ids.filter(id=>has(C[id],'W')&&!locked.includes(id)).sort().join('+');
  // Variety never buys a weak deck: nothing more than FLOOR points (about 6 on the displayed score) below the strongest
  // deck found may be shown, unless there aren't enough decks that good.
  const FLOOR=7.5,okN=all.filter(d=>d.s>=all[0].s-FLOOR).length;
  while(picked.length<opts.count&&picked.length<all.length){
    let best=null,bestV=-1e9;
    for(const d of all){
      if(picked.includes(d))continue;
      if(opts.variety!==false&&okN>=opts.count&&d.s<all[0].s-FLOOR)continue;
      let v=d.s;
      // A repeated card costs more each time, and a card already in a third of one set of results is strongly discouraged.
      for(const id of d.ids)if(!locked.includes(id)){const u=uses[id]||0;v-=5*u+1.5*u*u;if((shown[id]||0)>=cap)v-=18;}
      const w=mainWin(d);if(w&&seenWin.has(w))v-=10;
      if(v>bestV){bestV=v;best=d;}
    }
    picked.push(best);seenWin.add(mainWin(best));
    best.ids.forEach(id=>{uses[id]=(uses[id]||0)+1;shown[id]=(shown[id]||0)+1;});
  }
  return picked.map(d=>d.adj?{...d,s:d.s-d.adj}:d);
}

/* ---------- 2v2 Duo engine ---------- */
const PRIORITY={balanced:{wPow:6,wSyn:0.32,wTeam:0.6},synergy:{wPow:3.5,wSyn:0.45,wTeam:0.95},meta:{wPow:7,wSyn:0.25,wTeam:0.4}};
let scCache=new Map();
function scoreCached(ids,ctx){const key=ctx.tag+[...ids].sort().join(',');let v=scCache.get(key);if(!v){v=scoreDeck(ids,ctx);scCache.set(key,v);}return v;}
const isBeatdown=(ids,avg)=>ids.some(i=>has(C[i],'T')&&has(C[i],'W')&&C[i].e>=5)||avg>=3.95;
function teamAnalysis(A,B,sa,sb,names){
  const NAMES=names||{A:'Player 1',B:'Player 2'};
  const all=A.concat(B);
  const cross=[];
  for(const a of A)for(const b of B){if(a===b||B.includes(a)||A.includes(b))continue;const x=SYN[sk(a,b)];if(x)cross.push({a,b,...x});}
  const best={};A.forEach(i=>best['A'+i]=0);B.forEach(i=>best['B'+i]=0);
  for(const p of sa.pairs){best['A'+p.a]=Math.max(best['A'+p.a],p.w);best['A'+p.b]=Math.max(best['A'+p.b],p.w);}
  for(const p of sb.pairs){best['B'+p.a]=Math.max(best['B'+p.a],p.w);best['B'+p.b]=Math.max(best['B'+p.b],p.w);}
  for(const p of cross){best['A'+p.a]=Math.max(best['A'+p.a],p.w);best['B'+p.b]=Math.max(best['B'+p.b],p.w);}
  const combo=Object.values(best).reduce((a,w)=>a+w/3,0)/16;
  const wcOf=(ids,own,side)=>{let m=0;const wins=ids.filter(i=>has(C[i],'W'));
    for(const p of own)if(wins.includes(p.a)||wins.includes(p.b))m=Math.max(m,p.w);
    for(const p of cross)if(wins.includes(side==='A'?p.a:p.b))m=Math.max(m,p.w);
    return m>=3?1:m>=2?0.75:m>=1?0.45:m>0?0.3:0;};
  const wc=(wcOf(A,sa.pairs,'A')+wcOf(B,sb.pairs,'B'))/2;
  const ka=sa.k,kb=sb.k;
  const air=ka.air+kb.air,splash=ka.splash+kb.splash,kill=ka.kill+kb.kill,big=ka.big+kb.big;
  const tanky=all.filter(i=>has(C[i],'T')||has(C[i],'M')).length;
  const cov=[air>=5,splash>=3,kill>=2,big>=2,ka.small>=1&&kb.small>=1,tanky>=2];
  const covS=cov.filter(Boolean).length/cov.length;
  const notes=[];let comp=1;
  const bdA=isBeatdown(A,sa.avg),bdB=isBeatdown(B,sb.avg);
  if(bdA&&bdB){comp-=0.4;notes.push('Both decks are beatdown, so early pressure can overrun the team while both players build pushes');}
  const winsA=A.filter(i=>has(C[i],'W')),winsB=B.filter(i=>has(C[i],'W'));
  const sameWin=winsA.filter(i=>winsB.includes(i));
  if(sameWin.length){comp-=0.3;notes.push('Same win condition in both decks ('+sameWin.map(i=>C[i].name).join(', ')+'): one set of counters stops both players');}
  const dup=A.filter(i=>B.includes(i));
  if(dup.length>2){comp-=0.6;notes.push('Both decks run '+dup.map(i=>C[i].name).join(', ')+'; only 2 shared cards are allowed');}
  else comp-=dup.length*0.05;
  // Each deck must hold its own when the partner is out of cycle: air defense plus a tank answer.
  const selfDef=k=>k.air>=2&&(k.kill>=1||k.bld>=1);
  // An Attacker deck is allowed to lean on its Defender partner.
  if(!selfDef(ka)&&sa.role!=='attack'){comp-=0.25;notes.push(NAMES.A+' can\'t defend alone (needs 2+ air defenders and a tank answer), so it struggles whenever '+NAMES.B+' is out of cycle');}
  if(!selfDef(kb)&&sb.role!=='attack'){comp-=0.25;notes.push(NAMES.B+' can\'t defend alone (needs 2+ air defenders and a tank answer), so it struggles whenever '+NAMES.A+' is out of cycle');}
  if(sa.role==='defend'&&sb.role==='defend'){comp-=0.3;notes.push('Both decks are set to Defender, so the team has little pressure');}
  if(sa.role==='attack'&&sb.role==='attack'&&!selfDef(ka)&&!selfDef(kb)){comp-=0.4;notes.push('Both decks are set to Attacker and neither defends well alone');}
  comp=Math.max(0,comp);
  let weak=1;
  const fb=all.filter(i=>FB_VULN.has(i)).length;
  const bait=all.some(i=>BAIT_CORE.has(i));
  const small=all.filter(i=>SMALL_VULN.has(i)).length;
  if(fb>=5){weak-=0.4;notes.push(fb+' of the team\'s 16 cards are Fireball targets; clumped together, one spell wipes the shared defense');}else if(fb===4)weak-=0.2;
  if(!bait&&small>=6){weak-=0.3;notes.push(small+' team cards die to a small spell (Log, Zap or Arrows)');}
  if(air<5){weak-=0.3;notes.push('Only '+air+' cards across both decks hit air, so double air pushes are a problem');}
  weak=Math.max(0,weak);
  const pct=Math.round(100*(0.4*Math.min(1,combo)+0.15*wc+0.15*covS+0.15*comp+0.15*weak));
  const selfA=selfDef(ka),selfB=selfDef(kb);
  return{selfA,selfB,pct,parts:{combo:Math.round(Math.min(1,combo)*100),wc:Math.round(wc*100),cov:Math.round(covS*100),comp:Math.round(comp*100),weak:Math.round(weak*100)},notes,cross,bdA,bdB,dup,sameWin};
}
function teamScore(A,B,ctxA,ctxB,w){
  const sa=scoreCached(A,ctxA),sb=scoreCached(B,ctxB);
  const t=teamAnalysis(A,B,sa,sb,w.names);
  const extra=Math.max(0,t.dup.length-2);
  const noWin=(sa.k.wc===0&&sb.k.wc===0)?45:0; // the team still needs a way to take a tower
  return{s:(sa.s+sb.s)/2-noWin+t.pct*w.wTeam-1.5*Math.min(2,t.dup.length)-30*extra-8*t.sameWin.length-(t.bdA&&t.bdB&&!(sa.role==='attack'||sb.role==='attack')?10:0),sa,sb,t};
}
function buildDeck(side,ctx,pool,objective,partner){
  let deck=[...side.locked];let fixedN=deck.length;
  const lc=deck.map(i=>C[i]);
  // Some second decks start without a forced win condition, so a pure support deck can win on merit.
  const free=partner&&ctx.style==='any'&&partner.some(i=>has(C[i],'W'))&&Math.random()<0.3;
  if(!free&&deck.length<8&&(!lc.some(c=>has(c,'W'))||!fitsStyle(lc,ctx.style))){
    const wins=pool.filter(id=>!deck.includes(id)&&has(C[id],'W')&&(ctx.style==='any'||(ARCH[id]||[]).includes(ctx.style))&&!(partner&&partner.includes(id)));
    if(wins.length){deck.push(drawWin(wins.map(id=>{let v=pw(C[id],ctx);if(partner)for(const p of partner){const x=SYN[sk(id,p)];if(x&&!x.meta)v+=x.w*1.5;}return{id,v};})));fixedN=deck.length;}
  }
  const hctx={...ctx,partner};
  while(deck.length<8){
    const cands=pool.filter(id=>!deck.includes(id)).map(id=>({id,v:addHeur(C[id],deck,hctx)+Math.random()*4})).sort((a,b)=>b.v-a.v);
    if(!cands.length)return null;
    deck.push(cands[Math.random()*Math.min(3,cands.length)|0].id);
  }
  return improve(deck,fixedN,pool,objective,2);
}
function improve(deck,fixedN,pool,objective,passes){
  let cur=objective(deck);
  for(let pass=0;pass<passes;pass++){
    let improved=false;
    for(let i=fixedN;i<8;i++){
      const sample=shuffle(pool.filter(id=>!deck.includes(id))).slice(0,35);
      for(const id of sample){const trial=deck.slice();trial[i]=id;const v=objective(trial);if(v>cur+0.01){deck=trial;cur=v;improved=true;}}
    }
    if(!improved)break;
  }
  return deck;
}
function generateDuo(o){
  memo=new Map();scCache=new Map();
  const w={...(PRIORITY[o.priority]||PRIORITY.balanced),names:o.names};
  const mk=(tag,sd)=>{const counter=sd.style==='counter'&&!(o.vs&&o.vs.length);const x=mk0(tag,sd.style==='counter'?{...sd,style:'any'}:sd);if(counter){x.vs=metaThreats(true);x.metaVs=true;x.vsW=1.4;}return x;};
  const mk0=(tag,sd)=>({tag,duo:true,role:sd.role||'flex',forms:sd.forms,ban:sd.ban||{},levels:sd.levels||null,levelRef:sd.levelRef||0,levelW:o.levelW||0,vs:o.vs||null,maxChamps:1,style:sd.style,maxAvg:o.maxAvg,wPow:w.wPow,wSyn:w.wSyn});
  const ctxA=mk('A',o.A),ctxB=mk('B',o.B);
  const poolA=CARDS.filter(c=>!o.A.exclude.has(c.id)).map(c=>c.id);
  const poolB=CARDS.filter(c=>!o.B.exclude.has(c.id)).map(c=>c.id);
  // Lead with whichever side is more pinned down, then build the partner around it.
  const flip=o.B.locked.length>o.A.locked.length;
  const L=flip?{sd:o.B,ctx:ctxB,pool:poolB}:{sd:o.A,ctx:ctxA,pool:poolA};
  const F=flip?{sd:o.A,ctx:ctxA,pool:poolA}:{sd:o.B,ctx:ctxB,pool:poolB};
  const valid=(d,ctx)=>!!scoreCached(d,ctx).forms;
  const seeds=new Map();
  const nSeeds=L.sd.locked.length>=8?1:18;
  // Variety, as in 1v1: once a card is in over a third of the decks built so far, most later builds go without it.
  // The first builds on each side always search at full strength, and the picker's floor keeps weak pairs out.
  const vary=o.variety!==false;
  const thin=(pool,used,n,locked)=>{if(!vary||n<6)return pool;const hot=Object.keys(used).filter(id=>used[id]>n*0.34&&!locked.includes(id)&&Math.random()<0.65);return hot.length?pool.filter(id=>!hot.includes(id)):pool;};
  const usedL={},usedF={};
  for(let r=0;r<nSeeds;r++){
    const d=buildDeck(L.sd,L.ctx,thin(L.pool,usedL,seeds.size,L.sd.locked),x=>scoreCached(x,L.ctx).s,null);
    if(d&&valid(d,L.ctx)){const k=[...d].sort().join(',');if(!seeds.has(k)){seeds.set(k,d);d.forEach(id=>usedL[id]=(usedL[id]||0)+1);}}
  }
  const seedList=[...seeds.values()].sort((a,b)=>scoreCached(b,L.ctx).s-scoreCached(a,L.ctx).s);
  const pickedSeeds=[];const seenW=new Set();
  for(const d of seedList){const wk=d.filter(i=>has(C[i],'W')).sort().join('+');if(seenW.has(wk))continue;seenW.add(wk);pickedSeeds.push(d);if(pickedSeeds.length>=8)break;}
  for(const d of seedList){if(pickedSeeds.length>=8)break;if(!pickedSeeds.includes(d))pickedSeeds.push(d);}
  const ts=(l,f)=>flip?teamScore(f,l,ctxA,ctxB,w):teamScore(l,f,ctxA,ctxB,w);
  const found=new Map();
  const perSeed=pickedSeeds.length<=2?10:3;
  for(const seed of pickedSeeds){
    for(let r=0;r<perSeed;r++){
      let lead=seed.slice();
      const fp=thin(F.pool,usedF,found.size,F.sd.locked);
      let fol=buildDeck(F.sd,F.ctx,fp,x=>ts(lead,x).s,lead);
      if(!fol)continue;
      lead=improve(lead,L.sd.locked.length,thin(L.pool,usedL,seeds.size,L.sd.locked),x=>ts(x,fol).s,1);
      fol=improve(fol,F.sd.locked.length,fp,x=>ts(lead,x).s,1);
      if(!valid(lead,L.ctx)||!valid(fol,F.ctx))continue;
      if(lead.filter(i=>fol.includes(i)).length>2)continue;
      if(!lead.concat(fol).some(i=>has(C[i],'W')))continue;
      const A=flip?fol:lead,B=flip?lead:fol;
      const key=[...A].sort().join(',')+'/'+[...B].sort().join(',');
      if(!found.has(key)){found.set(key,{A,B,...teamScore(A,B,ctxA,ctxB,w)});fol.forEach(id=>usedF[id]=(usedF[id]||0)+1);}
    }
  }
  let all=[...found.values()].sort((a,b)=>b.s-a.s);
  {const under=all.filter(p=>p.sa.avg<=o.maxAvg+1e-9&&p.sb.avg<=o.maxAvg+1e-9);if(under.length)all=under;}
  const picked=[],uses={...(o.avoid||{})},seenPair=new Set();
  // Nothing more than DFLOOR points (about 4 on the displayed team score) below the best pair is shown for variety's sake.
  const DFLOOR=6.5,okN=all.length?all.filter(p=>p.s>=all[0].s-DFLOOR).length:0,shownN={},cap=Math.max(1,Math.ceil(o.count/3))*2;
  const winKey=p=>p.A.filter(i=>has(C[i],'W')).sort().join('+')+'/'+p.B.filter(i=>has(C[i],'W')).sort().join('+');
  while(picked.length<o.count&&picked.length<all.length){
    let best=null,bv=-1e9;
    for(const p of all){if(picked.includes(p))continue;let v=p.s;
      if(vary&&okN>=o.count&&p.s<all[0].s-DFLOOR)continue;
      const pen=id=>{const u=uses[id]||0;return (3*u+u*u)*(has(C[id],'W')?2:1)+((shownN[id]||0)>=cap?10:0);};
      for(const id of p.A)if(!o.A.locked.includes(id))v-=pen(id);
      for(const id of p.B)if(!o.B.locked.includes(id))v-=pen(id);
      if(seenPair.has(winKey(p)))v-=12;
      if(v>bv){bv=v;best=p;}}
    picked.push(best);seenPair.add(winKey(best));
    best.A.concat(best.B).forEach(i=>{uses[i]=(uses[i]||0)+1;shownN[i]=(shownN[i]||0)+1;});
  }
  return picked.map(p=>{if(!p.sa.adj&&!p.sb.adj)return p;const sa={...p.sa,s:p.sa.s-p.sa.adj},sb={...p.sb,s:p.sb.s-p.sb.adj};return{...p,sa,sb,s:p.s-(p.sa.adj+p.sb.adj)/2};});
}


/* ---------- Matchup against a known opponent deck ---------- */
function matchup(mine,opp){
  const notes=[];let score=0;const answers={};
  const oppWins=opp.filter(i=>C[i]&&has(C[i],'W'));
  for(const w of oppWins){
    const cs=(COUNTERS[w]||[]).filter(i=>mine.includes(i));
    answers[w]=cs;
    score+=Math.min(cs.length,2)*4;
    if(!cs.length){score-=6;notes.push('Nothing in this deck is a clean answer to '+C[w].name);}
  }
  const oppAir=opp.filter(i=>FLYING.has(i)&&i!=='skeleton-barrel').length;
  const myAir=mine.filter(i=>C[i].type!=='s'&&has(C[i],'A')&&C[i].e>1).length;
  if(oppAir>=3&&myAir<3){score-=8;notes.push('Their deck has '+oppAir+' air cards; you have only '+myAir+' that hit air');}
  const spells=opp.filter(i=>SPELL_VULN[i]);
  for(const sp of spells){
    const kind=SPELL_VULN[sp];let hit=[];
    if(kind==='fb')hit=mine.filter(i=>FB_VULN.has(i));
    else if(kind==='small')hit=mine.filter(i=>SMALL_VULN.has(i));
    else if(kind==='swarm')hit=mine.filter(i=>SMALL_VULN.has(i)||has(C[i],'X'));
    else if(kind==='bld')hit=mine.filter(i=>C[i].type==='b');
    if(hit.length>=3){score-=(hit.length-2)*2.5;notes.push(hit.length+' of your cards die to their '+C[sp].name+': '+hit.map(i=>C[i].name).join(', '));}
  }
  return{score,answers,notes,oppWins};
}

/* ---------- Tower troop recommendation ---------- */
function pickTower(sc,owned,duo){
  const own=(owned&&owned.length?owned:['tower-princess']).filter(x=>TOWER[x]);
  const ids=sc.ids||[];
  const nTroops=ids.filter(i=>C[i].type==='t').length;
  const beat=ids.some(i=>has(C[i],'T')&&has(C[i],'W'))||sc.avg>=3.9;
  const rate=t=>{const r=duo?t.r2:t.r;return 50+(r-50)*t.use/(t.use+3);};
  let best=null;const alts=[];
  for(const id of own){const t=TOWER[id];let v=rate(t);
    if(id==='royal-chef'&&nTroops>=6&&beat){v+=1;alts.push(id);}
    if(id==='dagger-duchess'&&sc.avg<=3.1){v+=1;alts.push(id);}
    if(!best||v>best.v)best={id,v};}
  return{id:best?best.id:'tower-princess',alts:alts.filter(a=>a!==(best&&best.id))};
}

/* ---------- Clash Royale deck link (opens the game's Copy Deck screen) ---------- */
function deckLink(order,towerId,raw){
  const ids=order.map(o=>CARD_IDS[o.id]).filter(Boolean);
  if(ids.length!==8)return null;
  const tt=(TOWER[towerId]||TOWER['tower-princess']).tid;
  // slots: 1 marks a card played as its Evolution (the same format the game's own Share button writes).
  const slots=order.map(o=>o.form==='evo'?1:0).join(';');
  const deep='clashroyale://copyDeck?deck='+ids.join(';')+'&l=Royals&slots='+slots+'&tt='+tt;
  return raw?deep:'https://link.clashroyale.com/en/?'+deep;
}
function orderDeck(ids,forms){
  const sp=forms?forms.specials:[];
  const evos=sp.filter(s=>s.form==='evo'),hcs=sp.filter(s=>s.form!=='evo');
  const slots=[];
  if(evos[0])slots.push({...evos[0],slot:'Evo slot'});
  if(hcs[0])slots.push({...hcs[0],slot:'Hero slot'});
  const wild=evos[1]||hcs[1];
  if(wild)slots.push({...wild,slot:'Wild slot'});
  const rest=ids.filter(id=>!sp.some(s=>s.id===id)).sort((a,b)=>C[a].e-C[b].e).map(id=>({id,form:isChamp(C[id])?'champ':null,slot:''}));
  return slots.concat(rest);
}

/* ---------- Collection share codes ----------
   A collection is {base:Set|null (null = owns every card), evo:Set, hero:Set, towers:Set}.
   The code is version + three bitfields in base-36, using the card list order, so it stays short. */
// Collection codes store Evos and Heroes as bit positions, so forms released after launch go at the END of these
// lists (in release order) however early their card sits in the table. Otherwise every older code would shift.
const LATE_EVO=['electro-giant'],LATE_HERO=['electro-wizard'];
const lateLast=(ids,late)=>ids.filter(i=>!late.includes(i)).concat(late.filter(i=>ids.includes(i)));
const EVO_CARDS=lateLast(CARDS.filter(c=>c.ev).map(c=>c.id),LATE_EVO),HERO_CARDS=lateLast(CARDS.filter(c=>c.he).map(c=>c.id),LATE_HERO),BASE_CARDS=CARDS.map(c=>c.id),TOWER_IDS=TOWERS.map(t=>t.id);
function bitsToStr(list,set){let b=0n;list.forEach((id,i)=>{if(set.has(id))b|=1n<<BigInt(i);});return b.toString(36);}
function strToBits(list,str){const set=new Set();let b;try{b=[...str].reduce((a,ch)=>a*36n+BigInt(parseInt(ch,36)),0n);}catch(e){return null;}list.forEach((id,i)=>{if(b&(1n<<BigInt(i)))set.add(id);});return set;}
function encodeCollection(col){
  const base=col.base?bitsToStr(BASE_CARDS,col.base):'a';
  return ['ef1',bitsToStr(EVO_CARDS,col.evo),bitsToStr(HERO_CARDS,col.hero),base,bitsToStr(TOWER_IDS,col.towers||new Set(['tower-princess']))].join('-');
}
function decodeCollection(code){
  const m=String(code).trim().toLowerCase().match(/^ef1-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)$/);
  if(!m)return null;
  const evo=strToBits(EVO_CARDS,m[1]),hero=strToBits(HERO_CARDS,m[2]),base=m[3]==='a'?null:strToBits(BASE_CARDS,m[3]),towers=strToBits(TOWER_IDS,m[4]);
  if(!evo||!hero||(m[3]!=='a'&&!base)||!towers)return null;
  return{evo,hero,base,towers};
}
/* Turn a player's collection into generator inputs: cards they lack are excluded, forms they lack are banned. */
function collectionToRules(col){
  const exclude=new Set(),ban={};
  if(col.base)BASE_CARDS.forEach(id=>{if(!col.base.has(id))exclude.add(id);});
  const add=(id,f)=>{(ban[id]=ban[id]||new Set()).add(f);};
  EVO_CARDS.forEach(id=>{if(!col.evo.has(id))add(id,'evo');});
  HERO_CARDS.forEach(id=>{if(!col.hero.has(id))add(id,'hero');});
  return{exclude,ban};
}
/* Level reference: the average of the player's 12 highest card levels. */
function levelRef(levels){const v=Object.values(levels||{}).sort((a,b)=>b-a).slice(0,12);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;}

/* ---------- Live data: apply a meta.json produced by scripts/refresh-meta.mjs ----------
   Card stats are keyed by official card id: {base:{rating,usage}|{games,wins,usage}, evo:{...}, hero:{...}}.
   rating follows RoyaleAPI's scale (50 = average). Decks: {cards:["26000036:evo",...], games, wins}. */
function ratingToPower(r,u){const rr=50+(r-50)*u/(u+3);return Math.max(1,Math.min(10,Math.round((rr-36)/2.2)));}
function statPower(st){
  if(!st)return null;
  if(st.rating!=null)return ratingToPower(st.rating,st.usage==null?3:st.usage);
  if(!st.games)return null;
  // From raw battle counts among top players. Win rate is smoothed toward 50% (as if 50 extra even games), because
  // small samples swing wildly, and capped, because top players mostly face each other so every popular card sits
  // near 50%. How widely a card is played carries the rest: the meta's staples earn their rating through use.
  const wr=(st.wins+25)/(st.games+50)*100;
  const fromWins=Math.max(-2.5,Math.min(2.5,0.25*(wr-50)));
  return Math.max(1,Math.min(10,Math.round(5+fromWins+1.9*Math.log10(1+(st.usage||0)))));
}
function deckFromMeta(d){
  const cards=d.cards.map(x=>{const[i,f]=String(x).split(':');const k=ID_TO_CARD[+i]||i;return f&&f!=='base'?k+':'+f:k;});
  if(cards.length!==8||cards.some(x=>!C[x.split(':')[0]]))return null;
  const wins=cards.map(x=>x.split(':')[0]).filter(i=>has(C[i],'W')).map(i=>C[i].name);
  return{n:d.name||(wins.join(' + ')||'Control')+' deck',wr:d.games?Math.round(d.wins/d.games*1000)/10:(d.wr??null),games:d.games||null,cards};
}
/* Keeps the card table in step with the game. payload = {ids:{cardKey:officialId}, forms:[{id,evo,hero}]}.
   A form the game has but our table doesn't (a newly released Evo or Hero) is switched on with an estimated
   rating one step above the base card; the weekly refresh replaces the estimate with measured numbers. */
function syncCards(payload){
  const added=[];
  for(const [k,id] of Object.entries((payload&&payload.ids)||{})){
    if(!C[k]||!id||CARD_IDS[k]===id)continue;
    CARD_IDS[k]=id;
  }
  for(const k of Object.keys(ID_TO_CARD))delete ID_TO_CARD[k];
  for(const [k,id] of Object.entries(CARD_IDS))ID_TO_CARD[id]=k; // rebuilt whole, so two cards swapping IDs can't orphan one
  // Elixir costs follow the game too (balance changes move them).
  let moved=false;
  for(const [k,e] of Object.entries((payload&&payload.elixir)||{})){if(C[k]&&Number.isFinite(e)&&e>0&&C[k].e!==e){C[k].e=e;moved=true;}}
  if(moved){memo=new Map();scCache=new Map();}
  for(const f of (payload&&payload.forms)||[]){
    const c=C[f.id];if(!c||isChamp(c))continue;
    const est=v=>Math.max(5,Math.min(8,v+1));
    if(f.evo&&!c.ev&&!c.ev2){c.ev=est(c.p);c.ev2=est(c.p2);EVO_CARDS.push(c.id);added.push({id:c.id,form:'evo'});}
    if(f.hero&&!c.he&&!c.he2){c.he=est(c.p);c.he2=est(c.p2);HERO_CARDS.push(c.id);added.push({id:c.id,form:'hero'});}
  }
  normForms();
  if(added.length){memo=new Map();scCache=new Map();}
  return added;
}
function applyMeta(meta){
  if(!meta||meta.version!==1)return false;
  for(const [mode,fp,fe,fh] of [['ranked','p','ev','he'],['duo','p2','ev2','he2']]){
    const m=meta[mode];if(!m||!m.cards)continue;
    if(m.sides!=null&&m.sides<1500)continue; // too few battles in this mode to trust: keep the built-in ratings
    for(const [cid,st] of Object.entries(m.cards)){
      const c=C[ID_TO_CARD[+cid]||cid];if(!c)continue;
      const b=statPower(st.base);if(b!=null)c[fp]=b;
      const e=statPower(st.evo);if(e!=null&&c.ev)c[fe]=e;
      const h=statPower(st.hero);if(h!=null&&c.he)c[fh]=h;
    }
    if(Array.isArray(m.decks)){
      const list=m.decks.map(deckFromMeta).filter(Boolean).slice(0,12);
      if(list.length>=5){const target=mode==='ranked'?META:META2;target.length=0;list.forEach(x=>target.push(x));}
    }
  }
  linkMetaPairs();
  normForms();memo=new Map();scCache=new Map();
  return true;
}
