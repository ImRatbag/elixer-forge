const WIN_COUNTER={'hog-rider':'Buildings and Tornado stop Hog cold','royal-giant':'Inferno Tower and swarms like Skeleton Army shut down Royal Giant','golem':'Inferno Tower and P.E.K.K.A punish a slow Golem push','giant':'Inferno Tower and Mini P.E.K.K.A melt Giant','electro-giant':'Ranged troops and buildings out-range E-Giant','goblin-giant':'Inferno Tower and Mini P.E.K.K.A handle Goblin Giant','lava-hound':'Splash air defense (Wizard, Executioner) shreds Lava Pups','balloon':'Musketeer, Hunter and buildings catch Balloon early','minion-giant':'Strong air defense and buildings stall Minion Giant','mortar':'Heavy tanks and big spells get through Mortar','x-bow':'Heavy tanks and big spells get through X-Bow','goblin-barrel':'A well-timed Log or Zap wipes the Barrel','goblin-drill':'Cheap swarms and Log answer the Drill','skeleton-barrel':'Small spells and air troops answer Skeleton Barrel','graveyard':'Poison and splash troops clear Graveyard','miner':'Cheap troops at the tower stop Miner chip','battle-ram':'Swarms and a building stop Battle Ram before it connects','ram-rider':'Swarms and buildings stop Ram Rider','royal-hogs':'Splash troops and Earthquake punish split Hogs','wall-breakers':'Log and cheap troops pop Wall Breakers','goblinstein':'Inferno Tower and kiting distract Goblinstein','boss-bandit':'Ronin, swarms and stuns stop Boss Bandit','goblin-machine':'Buildings and swarms handle Goblin Machine','elixir-golem':'Gives elixir back when defended badly','suspicious-bush':'Any small spell clears Suspicious Bush'};
function prosCons(d){
  const pros=[],cons=[];
  const pairs=[...d.pairs].sort((a,b)=>(b.meta?0:b.w)-(a.meta?0:a.w)||b.w-a.w).filter(p=>!p.meta).slice(0,3);
  pairs.forEach(p=>pros.push({t:C[p.a].name+' + '+C[p.b].name,d:p.why}));
  const cycle=d.ids.map(id=>C[id].e).sort((a,b)=>a-b).slice(0,4).reduce((a,b)=>a+b,0);
  if(cycle<=8)pros.push({t:'Fast cycle',d:'Only '+cycle+' elixir to get back to your win condition'});
  if(d.k.air>=3)pros.push({t:'Strong air defense',d:d.k.air+' cards that hit air units'});
  if(d.forms&&d.forms.value>=24)pros.push({t:'Strong special slots',d:d.forms.specials.map(x=>displayName(x.id,x.form==='champ'?null:x.form)).join(', ')+' are among the best forms right now'});
  if(d.syn.parts.cov===100)pros.push({t:'Covers every role',d:'Air defense, splash, both spell sizes, a tank killer and cheap cycle'});
  d.syn.notes.forEach(n=>cons.push({t:'Shared weakness',d:n}));
  const k=d.k;
  if(k.air<2)cons.push({t:'Weak to air',d:'Only '+k.air+' card'+(k.air===1?'':'s')+' hit air, so Balloon and Lava Hound decks are a problem'});
  if(k.splash<1)cons.push({t:'No splash',d:'Swarms like Skeleton Army and Goblin Gang are hard to clear'});
  if(k.small<1)cons.push({t:'No small spell',d:'Log bait and Goblin Barrel decks will chip you down'});
  if(k.big<1)cons.push({t:'No big spell',d:'Hard to finish towers or punish clumped support troops'});
  if(k.kill<1)cons.push({t:'No dedicated tank killer',d:'Golem, Giant and Mega Knight take a lot of elixir to stop'});
  if(d.avg>=4)cons.push({t:'Heavy deck',d:'Average '+d.avg.toFixed(1)+' elixir; fast cycle decks can out-rotate you'});
  else if(cycle>=12)cons.push({t:'Slow to cycle',d:cycle+' elixir to get back to the same card'});
  d.ids.filter(id=>has(C[id],'W')&&WIN_COUNTER[id]).slice(0,2).forEach(id=>cons.push({t:'Counter to watch',d:WIN_COUNTER[id]}));
  return{pros,cons};
}
function analysisHTML(d){
  const pc=prosCons(d);const sy=d.syn.parts;
  const li=x=>`<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`;
  return `<p class="synbreak">Synergy ${d.synPct}%: combos ${sy.combo}% · win-con support ${sy.wc}% · role coverage ${sy.cov}% · shared-weakness check ${sy.weak}%</p>
  <div class="pc"><div><h3 class="pch good">Strengths</h3><ul>${pc.pros.map(li).join('')||'<li><span>No standout strengths</span></li>'}</ul></div>
  <div><h3 class="pch bad">Weaknesses</h3><ul>${pc.cons.map(li).join('')}</ul></div></div>`;
}

/* ---------- 2v2 rendering ---------- */
const GAP_TEXT={air:['hits air','air defense'],splash:['splash','splash damage'],small:['small spell','a small spell'],big:['big spell','a big spell'],kill:['tank killer','a tank killer']};
function providers(ids,role){return ids.map(i=>C[i]).filter(c=>role==='air'?c.type!=='s'&&has(c,'A'):role==='splash'?c.type!=='s'&&has(c,'S'):role==='small'?c.type==='s'&&has(c,'s'):role==='big'?c.type==='s'&&has(c,'F'):has(c,'K')).map(c=>c.name);}
function teamProsCons(p){
  const pros=[],cons=[];
  const crossP=p.t.cross.filter(x=>!x.meta).sort((a,b)=>b.w-a.w).slice(0,4);
  crossP.forEach(x=>pros.push({t:'Alex\'s '+C[x.a].name+' + Jack\'s '+C[x.b].name,d:x.why}));
  // Each deck's gaps, checked against what the partner brings.
  const gaps=(k)=>({air:k.air<2,splash:k.splash<1,small:k.small<1,big:k.big<1,kill:k.kill<1});
  const ga=gaps(p.sa.k),gb=gaps(p.sb.k);
  for(const [mine,theirs,who,other] of [[ga,p.B,'Alex','Jack'],[gb,p.A,'Jack','Alex']]){
    for(const role of Object.keys(mine)){if(!mine[role])continue;
      const by=providers(theirs,role);
      if(by.length)pros.push({t:'Covered by '+other,d:who+' lacks '+GAP_TEXT[role][1]+'; '+by.slice(0,3).join(', ')+' fill'+(by.length===1?'s':'')+' that gap'});
      else cons.push({t:'Gap neither deck covers',d:'Neither deck has '+GAP_TEXT[role][1]});
    }
  }
  const winsA=p.A.filter(i=>has(C[i],'W')),winsB=p.B.filter(i=>has(C[i],'W'));
  const archOf=w=>(ARCH[w]||[])[0];
  if(p.t.selfA&&p.t.selfB)pros.push({t:'Both decks stand on their own',d:'Each deck has its own air defense and tank answer, so neither player is helpless when the other is out of cycle'});
  if(p.t.dup.length&&p.t.dup.length<=2)pros.push({t:'Shared cards: '+p.t.dup.map(i=>C[i].name).join(', '),d:'Both decks run '+(p.t.dup.length===1?'this card':'these cards')+' because '+(p.t.dup.length===1?'it is':'they are')+' strong in the current meta; the team still has '+(16-p.t.dup.length)+' different cards'});
  if(winsA.length&&winsB.length&&!p.t.sameWin.length)pros.push({t:'Two different threats',d:winsA.map(i=>C[i].name).join(' + ')+' and '+winsB.map(i=>C[i].name).join(' + ')+' need different counters, so opponents can\'t cover both'});
  p.t.notes.forEach(n=>cons.push({t:'Team weakness',d:n}));
  winsA.concat(winsB).filter((v,i,a)=>a.indexOf(v)===i&&WIN_COUNTER[v]).slice(0,2).forEach(id=>cons.push({t:'Counter to watch',d:WIN_COUNTER[id]}));
  return{pros,cons};
}
function gamePlan(p){
  const ra=p.sa.role,rb=p.sb.role;
  if(ra!=='flex'||rb!=='flex'){
    const atk=ra==='attack'?'Alex':rb==='attack'?'Jack':null,def=ra==='defend'?'Alex':rb==='defend'?'Jack':null;
    const parts=[];
    if(atk)parts.push(`${atk} is the Attacker: build pressure and lead the pushes.`);
    if(def)parts.push(`${def} is the Defender: hold both lanes, then send counter-pushes into the Attacker's lane.`);
    if(atk&&!def)parts.push(`${atk==='Alex'?'Jack':'Alex'} stays flexible and covers whichever lane needs it.`);
    if(def&&!atk)parts.push(`${def==='Alex'?'Jack':'Alex'} stays flexible and takes the open chances to push.`);
    const selfAtk=atk?(atk==='Alex'?p.t.selfA:p.t.selfB):true;
    parts.push(selfAtk?'Roles are a plan, not a cage: the Attacker\'s deck can still defend if the Defender is out of cycle.':'The Attacker\'s deck leans on the Defender, so call for help early when you are out of cycle.');
    return parts.join(' ');
  }
  const both=p.t.selfA&&p.t.selfB;
  const swap=both?' Both decks can also defend on their own, so swap roles whenever one of you is out of cycle or low on elixir.':'';
  if(p.t.bdA!==p.t.bdB){
    const heavy=p.t.bdA?'Alex':'Jack',light=p.t.bdA?'Jack':'Alex';
    return `${heavy} usually builds the big push and ${light} pressures the other lane, but this is a default, not a rule.${swap} When the heavy push crosses the bridge, ${light} can add support behind it in the same lane.`;
  }
  return `Neither deck is locked into attack or defense. Whoever has the better cards in hand defends, and the other counter-pushes; then push the same lane together to overload one tower.${both?' Both decks can defend on their own if one of you is out of cycle.':''}`;
}
function duoDeckHTML(ids,sc,who,locked){
  const order=orderDeck(ids,sc.forms);
  const cycle=ids.map(id=>C[id].e).sort((a,b)=>a-b).slice(0,4).reduce((a,b)=>a+b,0);
  const roleTag=sc.role==='attack'?'<span class="role">Attacker</span>':sc.role==='defend'?'<span class="role">Defender</span>':'';
  return `<div class="duodeck ${who==='Alex'?'you':'friend'}">
    <p class="who"><b class="tag">${who}</b>${roleTag}<span class="dn">${esc(archLabel(ids,sc.avg))}</span><span>Avg elixir <b>${sc.avg.toFixed(1)}</b></span><span>Cycle cost <b>${cycle}</b></span><span>Deck synergy <b>${sc.synPct}%</b></span></p>
    <div class="grid8">${tiles(order,locked)}</div>
  </div>`;
