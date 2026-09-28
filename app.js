const ALL=window.CARDS;const S={};const app=document.querySelector('#app');
// v1.37 — DEV STATS & BALANCE. Kept isolated from gameplay so it can be hidden/removed later.
const STATS_KEY='oddball_dev_stats_v137';
function loadStats(){try{let x=JSON.parse(localStorage.getItem(STATS_KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function saveStats(x){try{localStorage.setItem(STATS_KEY,JSON.stringify(x))}catch(e){}}
function beginMatchStats(mode='draft'){
 S.matchStats={mode,startedAt:new Date().toISOString(),initialH:S.h.map(c=>c.id),initialA:S.a.map(c=>c.id),playedH:[],playedA:[],faceoffs:0,recorded:false};
}
function markPlayed(o,c){if(!c||!S.matchStats)return;let a=o==='h'?S.matchStats.playedH:S.matchStats.playedA;if(!a.includes(c.id))a.push(c.id)}
function recordMatch(){
 let m=S.matchStats;if(!m||m.recorded)return;m.recorded=true;
 let steps=S.finalFlow?.applied||[], egH=steps.filter(x=>x.owner==='h'&&x.type==='endgame').reduce((n,x)=>n+x.points,0),egA=steps.filter(x=>x.owner==='a'&&x.type==='endgame').reduce((n,x)=>n+x.points,0);
 let rec={version:'1.37',mode:m.mode,startedAt:m.startedAt,endedAt:new Date().toISOString(),winner:S.hs>S.as?'human':S.as>S.hs?'ai':'draw',score:{human:S.hs,ai:S.as},finalBall:S.ball,faceoffs:m.faceoffs||0,initial:{human:m.initialH,ai:m.initialA},played:{human:m.playedH,ai:m.playedA},finalZones:{human:{win:S.hw.map(c=>c.id),lose:S.hl.map(c=>c.id)},ai:{win:S.aw.map(c=>c.id),lose:S.al.map(c=>c.id)}},endGamePoints:{human:egH,ai:egA}};
 let all=loadStats();all.push(rec);saveStats(all);
}
async function resetDevStats(){if(!await gameDecision('STATISTIQUES DEV','Effacer toutes les statistiques DEV enregistrées sur ce navigateur ?','EFFACER','ANNULER'))return;saveStats([]);renderStats()}
function exportDevStats(){let data={schema:'oddball-dev-stats-v1',exportedAt:new Date().toISOString(),games:loadStats()};let b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='oddball_stats_v1.37.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500)}
function cardStatRows(games){
 let map=new Map(ALL.map(c=>[c.id,{c,g:0,w:0,p:0,win:0,lose:0}]));
 for(let g of games)for(let side of ['human','ai']){let won=g.winner===side;for(let id of (g.initial?.[side]||[])){let z=map.get(id);if(z){z.g++;if(won)z.w++}}for(let id of (g.played?.[side]||[])){let z=map.get(id);if(z)z.p++}for(let id of (g.finalZones?.[side]?.win||[])){let z=map.get(id);if(z)z.win++}for(let id of (g.finalZones?.[side]?.lose||[])){let z=map.get(id);if(z)z.lose++}}
 return [...map.values()].filter(x=>x.g||x.p).sort((a,b)=>b.g-a.g||b.p-a.p||a.c.name.localeCompare(b.c.name));
}
function openStats(){S.phase='stats';render()}
function renderStats(){
 let games=loadStats(),h=games.filter(g=>g.winner==='human').length,a=games.filter(g=>g.winner==='ai').length,d=games.filter(g=>g.winner==='draw').length,avg=games.length?(games.reduce((n,g)=>n+(g.faceoffs||0),0)/games.length).toFixed(1):'0.0',rows=cardStatRows(games);
 app.innerHTML=`<div class=statsPage><div class=statsSticky><div class=labHeader><div class=logo>ODDBALL</div><h1>STATS & BALANCE <span class=devBadge>DEV</span></h1><div class=spacer></div><button class=btn id=statsBack>Retour au menu</button></div><div class=statsActions><button class=btn id=statsExport ${games.length?'':'disabled'}>Exporter JSON</button><button class="btn dangerBtn" id=statsReset ${games.length?'':'disabled'}>Reset stats</button></div></div><div class=statsBody><div class=statsCards><div><small>PARTIES</small><b>${games.length}</b></div><div><small>VICTOIRES TOI</small><b>${h}</b></div><div><small>VICTOIRES IA</small><b>${a}</b></div><div><small>ÉGALITÉS</small><b>${d}</b></div><div><small>FACE-OFFS / PARTIE</small><b>${avg}</b></div></div><p class=statsNote>Données de développement enregistrées uniquement dans ce navigateur. Le taux de victoire ci-dessous signifie « victoire lorsque la carte était dans la main de départ » : ce n’est pas, à lui seul, une mesure de puissance.</p>${games.length?`<div class=statsTableWrap><table class=statsTable><thead><tr><th>Carte</th><th>Départs</th><th>Win rate</th><th>Jouée</th><th>Winzone</th><th>Losezone</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.c.name}</b><small>${x.c.color} · ${x.c.stars}★</small></td><td>${x.g}</td><td>${x.g?Math.round(100*x.w/x.g):0}%</td><td>${x.p}</td><td>${x.win}</td><td>${x.lose}</td></tr>`).join('')}</tbody></table></div>`:'<div class=statsEmpty>Aucune partie terminée pour le moment.<br>Les données apparaîtront ici après le premier décompte final.</div>'}</div></div>`;
 document.querySelector('#statsBack').onclick=goMenu;let ex=document.querySelector('#statsExport'),rs=document.querySelector('#statsReset');if(games.length){ex.onclick=exportDevStats;rs.onclick=resetDevStats}
}
const PACE={aiResponse:1400,showDefense:1300,afterResult:1900};
let visualBusy=false;
function queueVisual(kind,title,text,card=null,hidden=false){S.visualQueue=S.visualQueue||[];S.visualQueue.push({kind,title,text,card,hidden});setTimeout(playVisualQueue,40)}
function playVisualQueue(){if(visualBusy||!S.visualQueue?.length)return;let host=document.querySelector('#visualFx');if(!host)return;visualBusy=true;let e=S.visualQueue.shift();host.innerHTML=`<div class=fxPanel><div class=fxKicker>${e.title}</div>${e.card?(e.hidden?'<div class=fxCardBack>?</div>':card(e.card)) : ''}<div class=fxText>${e.text}</div></div>`;host.classList.add('show');setTimeout(()=>{host.classList.remove('show');setTimeout(()=>{visualBusy=false;playVisualQueue()},220)},1250)}
let toastTimer=null;
// v1.31 — lightweight on-board feedback. Effects are queued by card uid and
// flushed after render so feedback also works when an effect fires before its card is painted.
function cardFx(c,text,type='effect'){
 if(!c)return;
 S.cardFx=S.cardFx||[];S.cardFx.push({uid:c.uid,text,type});
 setTimeout(flushCardFx,35);
}
function flushCardFx(){
 if(!S.cardFx?.length)return;
 let keep=[];
 for(let fx of S.cardFx){
  let els=[...document.querySelectorAll(`.tabletop .card[data-u="${fx.uid}"],.m2Match .card[data-u="${fx.uid}"]`)];
  if(!els.length){keep.push(fx);continue}
  for(let el of els){let n=document.createElement('div');n.className=`cardActionFx ${fx.type}`;n.textContent=fx.text;el.appendChild(n);setTimeout(()=>n.remove(),1150)}
 }
 S.cardFx=keep;
}
function boardFx(text,type='effect'){
 let lane=document.querySelector('.faceoffLane,.m2Face');if(!lane)return;
 let n=document.createElement('div');n.className=`boardActionFx ${type}`;n.textContent=text;lane.appendChild(n);setTimeout(()=>n.remove(),1250);
}
function showEvent(title,text){
 let el=document.querySelector('#eventToast');
 if(!el)return;
 el.innerHTML=`<b>${title}</b><span>${text}</span>`;
 el.classList.add('show');
 clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}
// v1.32 — Living Ball: the possession marker breathes while idle and visibly travels on a change of possession.
let ballAnimTimer=null;
function animatePossession(from,to){
 clearTimeout(ballAnimTimer);
 const mobile=document.querySelector('.m2Match');
 const fromDock=mobile?document.querySelector('.m2Score'):document.querySelector(from==='h'?'.humanMat .ballDock':'.opponentMat .ballDock');
 const toDock=mobile?document.querySelector('.m2Score'):document.querySelector(to==='h'?'.humanMat .ballDock':'.opponentMat .ballDock');
 if(!toDock)return;
 const landed=toDock.querySelector('.gameBall');
 if(from===to){
  if(landed){landed.classList.remove('ballKeep');void landed.offsetWidth;landed.classList.add('ballKeep');ballAnimTimer=setTimeout(()=>landed.classList.remove('ballKeep'),700)}
  boardFx('POSSESSION CONSERVÉE','possession');
  return;
 }
 if(!fromDock)return;
 const a=fromDock.getBoundingClientRect(),b=toDock.getBoundingClientRect();
 const size=Math.max(44,Math.min(72,b.width*.82));
 const fly=document.createElement('div');fly.className='gameBall flyingBall';fly.innerHTML='<i></i>';
 Object.assign(fly.style,{width:size+'px',height:size+'px',left:(a.left+a.width/2-size/2)+'px',top:(a.top+a.height/2-size/2)+'px'});
 document.body.appendChild(fly);if(landed)landed.classList.add('ballLandingWait');
 requestAnimationFrame(()=>requestAnimationFrame(()=>{fly.style.left=(b.left+b.width/2-size/2)+'px';fly.style.top=(b.top+b.height/2-size/2)+'px';fly.classList.add('inFlight')}));
 ballAnimTimer=setTimeout(()=>{fly.remove();if(landed){landed.classList.remove('ballLandingWait');landed.classList.add('ballLand');setTimeout(()=>landed.classList.remove('ballLand'),650)}boardFx(`POSSESSION · ${to==='h'?'TOI':'RIVAL'}`,'possession')},720);
}
// v1.35 — RULES AUDIT: engine hardening after a full 53-card implementation review.
// v1.34 — MATCH PRESENTATION: Face-Off entries, impact, result and travel to Bench.
function animateFaceoffEntry(side,role='attack'){
 requestAnimationFrame(()=>{let el=document.querySelector(document.querySelector('.m2Match')?`${side==='h'?'.m2DuelCard:last-child':'.m2DuelCard:first-child'} .card`:`${side==='h'?'.humanSlot':'.rivalSlot'} .card`);if(!el)return;el.classList.remove('faceoffEnterHuman','faceoffEnterRival','faceoffDefense');void el.offsetWidth;el.classList.add(side==='h'?'faceoffEnterHuman':'faceoffEnterRival');if(role==='defense')el.classList.add('faceoffDefense');setTimeout(()=>el.classList.remove('faceoffEnterHuman','faceoffEnterRival','faceoffDefense'),700)});
}
function duelImpact(){let lane=document.querySelector('.faceoffLane');if(!lane)return;lane.classList.remove('duelImpact');void lane.offsetWidth;lane.classList.add('duelImpact');setTimeout(()=>lane.classList.remove('duelImpact'),650)}
function captureDuelCards(){let out={};for(let [side,sel] of [['h','.humanSlot .card'],['a','.rivalSlot .card']]){let el=document.querySelector(sel);if(el){let r=el.getBoundingClientRect();out[side]={node:el.cloneNode(true),rect:r,uid:el.dataset.u}}}return out}
function flyDuelCards(snap,win){
 if(!snap)return;
 for(let side of ['h','a']){let x=snap[side];if(!x)continue;let target=document.querySelector(`.benchCards .card[data-u="${x.uid}"]`);if(!target)continue;let tr=target.getBoundingClientRect(),n=x.node;n.classList.add('matchTravelCard',side===win?'travelWin':'travelLose');n.querySelectorAll('.cardtip,.cardActionFx').forEach(e=>e.remove());Object.assign(n.style,{left:x.rect.left+'px',top:x.rect.top+'px',width:x.rect.width+'px',height:x.rect.height+'px'});document.body.appendChild(n);target.classList.add('benchArrivalWait');requestAnimationFrame(()=>requestAnimationFrame(()=>{n.style.left=tr.left+'px';n.style.top=tr.top+'px';n.style.width=tr.width+'px';n.style.height=tr.height+'px';n.classList.add('travelling')}));setTimeout(()=>{n.remove();target.classList.remove('benchArrivalWait');target.classList.add(side===win?'benchWinArrival':'benchLoseArrival');setTimeout(()=>target.classList.remove('benchWinArrival','benchLoseArrival'),650)},720)}
}
function showFaceoffResult(win){let lane=document.querySelector('.faceoffLane');if(!lane)return;for(let side of ['h','a']){let el=document.querySelector(`${side==='h'?'.humanSlot':'.rivalSlot'} .card`);if(!el)continue;let n=document.createElement('div');n.className=`duelResultStamp ${side===win?'win':'lose'}`;n.textContent=side===win?'WIN':'LOSE';el.appendChild(n)}duelImpact()}

const cp=c=>({...c,uid:c.id+'_'+Math.random().toString(36).slice(2),down:false,tempPow:0,tempSpd:0,tempWild:false,tempSwap:false,chosenColor:null});
function sh(a){for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const ownerName=o=>o==='h'?'toi':'IA', hand=o=>o==='h'?S.h:S.a, winz=o=>o==='h'?S.hw:S.aw, losez=o=>o==='h'?S.hl:S.al;
function explain(c){
 const timing={
  PLAY:"Se déclenche immédiatement quand cette carte est jouée.",
  ATTACK:"Se déclenche lorsque cette carte est jouée comme attaquante.",
  DEFENSE:"Se déclenche lorsque cette carte est jouée en défense.",
  WIN:"Se déclenche si cette carte gagne le Faceoff.",
  LOSE:"Se déclenche si cette carte perd le Faceoff.",
  AFTER:"Se résout après la comparaison de Speed.",
  ONGOING:"Effet permanent tant que cette carte est face visible dans la zone requise du Bench.",
  END_GAME:"Se vérifie à la fin de la partie si cette carte est face visible.",
  'END GAME':"Se vérifie à la fin de la partie si cette carte est face visible."
 }[c.timing]||"";
 let effect=c.text
  .replace(/\bScore\b/g,"gagne")
  .replace(/\bDraw\b/g,"pioche")
  .replace(/\bFlip\b/g,"retourne")
  .replace(/\bWinzone\b/g,"zone gagnée")
  .replace(/\bLosezone\b/g,"zone perdue")
  .replace(/\bBench\b/g,"Bench")
  .replace(/\bPOW\b/g,"Power")
  .replace(/\bSPD\b/g,"Speed")
  .replace(/\bWild\b/g,"Joker");
 return `${timing} Concrètement : ${effect}.`;
}

const bench=o=>[...winz(o),...losez(o)], opp=o=>o==='h'?'a':'h', score=(o,n)=>{o==='h'?S.hs+=n:S.as+=n;lg(`${ownerName(o)} : +${n} point${n>1?'s':''}.`);queueVisual('score','SCORE',`${o==='h'?'TOI':'RIVAL'} +${n}`);setTimeout(()=>boardFx(`+${n} PT${n>1?'S':''} · ${o==='h'?'TOI':'RIVAL'}`,'score'),45)};
function isInstant(c){return ['PLAY','ATTACK','DEFENSE','WIN','LOSE','AFTER'].includes(c.timing)}
function isEndGame(c){return !!c&&(c.timing==='END_GAME'||c.timing==='END GAME')}

const CARD_DISPLAY_TEXT={
0:"Katsuki gagne +20 POW pendant ce Faceoff.",
1:"À la fin de la partie, gagne +1 point pour chaque carte avec un effet Permanent sur ton Bench.",
2:"Quand tu joues une carte Rouge, tu peux Flip King. La carte jouée gagne +100 POW et tu pioches 2 cartes.",
3:"Candy devient Wild et gagne +50 POW pendant ce Faceoff.",
4:"Tu peux échanger 1 carte de ta main avec 1 carte de ta Winzone.",
5:"Winzone : tes cartes avec 50 POW ou plus sont Wild.",
6:"Score 1. Si tu as moins de cartes face cachée sur ton Bench que ton rival, répète cet effet.",
7:"Pioche 1 carte. Tu peux jouer la carte piochée et défausser Asta.",
8:"Avant de jouer une carte, tu peux échanger la position de 2 cartes sur ton Bench.",
9:"Pioche 1 carte pour chaque carte avec un effet Instant sur ton Bench.",
10:"À la fin de la partie, gagne +1 point pour chaque carte de ton Bench avec 50 POW ou plus.",
11:"Pioche 1 carte pour chaque couleur différente présente sur ton Bench.",
12:"Annonce une couleur. Ton rival compte les cartes de cette couleur dans sa main : score ce nombre.",
13:"Pioche 1 carte.",
14:"Winzone ou Losezone : tes cartes avec un effet Instant gagnent +20 POW.",
15:"Annonce une couleur. Ton rival défausse 1 carte de cette couleur.",
16:"Le joueur qui possède la balle score 1 point.",
17:"À la fin de la partie, gagne +1 point pour chaque carte de ton Bench dont le nom commence par A ou M.",
18:"Flip la dernière carte de n’importe quelle zone de Bench, OU Devin devient Wild.",
19:"Winzone ou Losezone : si ta Losezone contient au moins 4 étoiles au total, tes cartes sont Wild.",
20:"Pioche 1 carte OU Flip 1 de tes cartes.",
21:"Tu peux Flip 1 de tes cartes pour scorer 2 points.",
22:"Winzone ou Losezone : tes cartes avec un effet Instant gagnent +30 SPD.",
23:"Tu peux Flip 1 de tes cartes pour donner +50 POW à Nino pendant ce Faceoff.",
24:"À la fin de la partie, gagne +4 points si ta Losezone ne contient aucune carte Rouge.",
25:"Pioche 1 carte. Reed gagne +50 SPD pendant ce Faceoff.",
26:"Tu peux échanger 2 cartes sur ton Bench. Si elles sont de la même couleur, Leon gagne +100 SPD.",
27:"À la fin de la partie, gagne +2 points si Seth est la première ou la dernière carte de ta Winzone.",
28:"Winzone : quand tu joues une carte Bleue, pioche 1 carte.",
29:"Winzone ou Losezone : quand tu attaques avec une carte Verte, déplace la dernière carte de la Winzone adverse vers sa Losezone.",
30:"Tu peux Flip 1 de tes cartes. Score 1 point pour chacun de ses voisins.",
31:"À la fin de la partie, gagne +2 points si ta Losezone contient une carte Bleue.",
32:"Pioche 1 carte, puis défausse la carte du dessus du deck.",
33:"Échange la position de 2 cartes sur ton Bench, OU Nao devient Wild.",
34:"Losezone : quand tu joues une carte, tu peux échanger son POW et son SPD pour ce Faceoff.",
35:"Si ton Bench contient une carte Bleue, déplace la dernière carte de la Winzone adverse vers sa Losezone.",
36:"Winzone ou Losezone : tes cartes avec un effet Permanent gagnent +50 POW.",
37:"Losezone : quand tu joues une carte Rouge, pioche 1 carte.",
38:"Winzone ou Losezone : tes cartes de la même couleur que la première carte de ta Losezone gagnent +50 POW.",
39:"Tu peux Flip 1 de tes cartes. Si elle possède un effet Instant, tu peux copier cet effet.",
40:"À la fin de la partie, gagne +1 point pour chaque carte de ton Bench avec 2★ ou moins.",
41:"Tu peux défausser 1 carte face visible de ta Winzone pour piocher 1 carte.",
42:"Winzone ou Losezone : quand une carte Rouge entre dans ta Losezone, tu peux la déplacer vers ta Winzone.",
43:"Winzone ou Losezone : tes cartes avec 3★ ou plus gagnent +30 SPD.",
44:"Losezone : à la fin de la partie, tu peux Flip la dernière carte de n’importe quelle zone.",
45:"Winzone ou Losezone : quand tu joues une carte avec un effet Permanent ou End Game, pioche 1 carte.",
46:"Échange la dernière carte d’une zone avec la dernière carte de n’importe quelle autre zone.",
47:"Tu peux défausser 1 carte Verte pour donner +100 SPD à Hina pendant ce Faceoff. Si tu le fais, pioche 1 carte.",
48:"Score 1 pour chaque couleur différente dans ta Winzone.",
49:"Losezone : à la fin de la partie, gagne +1 point par étoile sur la dernière carte de ta Losezone.",
50:"Ton rival Flip 1 de ses cartes avec un effet End Game.",
51:"Winzone ou Losezone : à la fin de la partie, gagne +4 points si ta Losezone contient au moins 4 cartes.",
52:"Losezone : tes cartes gagnent +30 POW."
};
function abilityCategory(c){
 if(c.timing==='ONGOING')return 'PERMANENT';
 if(c.timing==='END GAME'||c.timing==='END_GAME')return 'END GAME';
 return 'INSTANT';
}
function triggerLabel(c){return ({PLAY:'Play',ATTACK:'Attack',DEFENSE:'Defense',WIN:'Win',LOSE:'Lose',AFTER:'After'})[c.timing]||''}
function displayAbility(c){let t=triggerLabel(c),txt=cardDisplayText(c);return t?`<b class="effectTrigger">${t} :</b> ${txt}`:txt}
function cardDisplayText(c){return CARD_DISPLAY_TEXT[c.id]||c.text}
function cardOwner(c){
 if(!c)return null;
 if(S.h?.includes(c)||S.hw?.includes(c)||S.hl?.includes(c)||S.hf===c)return 'h';
 if(S.a?.includes(c)||S.aw?.includes(c)||S.al?.includes(c)||S.af===c)return 'a';
 return null;
}
function displayStats(c){
 let o=cardOwner(c);
 if(!o)return {p:c.pow,s:c.spd,pd:0,sd:0,w:c.color==='WILD'};
 let role=S.hf===c?(S.ball==='h'?'atk':'def'):S.af===c?(S.ball==='a'?'atk':'def'):'';
 let d=dyn(c,o,role);
 return {p:d.p,s:d.s,pd:d.p-c.pow,sd:d.s-c.spd,w:d.w};
}
function statHTML(kind,value,delta){
 let cls=delta>0?' statBoost':delta<0?' statNerf':'';
 let digits=Math.abs(Number(value)||0)>=100?' stat3':Math.abs(Number(value)||0)>=10?' stat2':' stat1';
 return `<span class="${kind.toLowerCase()}Stat${cls}${digits}"><small>${kind}</small><b>${value}</b></span>`;
}
function card(c,hide=false,sel=false,view=''){if(hide)return `<div class="card back ${view?'mobile-'+view:''}" data-u="${c.uid}" aria-label="Carte face cachée"></div>`;let badge=c.custom?'◆ CUSTOM':(c.experimental?'🧪 EXPÉRIMENTAL':'✓ RECONSTRUITE'),cat=abilityCategory(c),tr=triggerLabel(c),starMeta=c.stars?` · ${c.stars}★`:'',ds=displayStats(c),nativeWild=c.color==='WILD',wildMeta=ds.w&&!nativeWild?` · ${c.color} → WILD`:'',modMeta=(ds.pd||ds.sd)?` · valeur actuelle${ds.pd?` · POW ${ds.pd>0?'+':''}${ds.pd}`:''}${ds.sd?` · SPD ${ds.sd>0?'+':''}${ds.sd}`:''}`:'';let colorClass=nativeWild?'nativeWild':c.color;return `<div class="card ${view?'mobile-'+view:''} ${colorClass} ${sel?'selected':''} ${(ds.pd||ds.sd)?'statsModified':''} ${ds.w&&!nativeWild?'dynamicWild':''}" data-u="${c.uid}"><div class=impl>${badge}</div>${ds.w&&c.chosenColor?`<div class=wildChoice>WILD → ${c.chosenColor}</div>`:''}<div class=cardHead><div class=name>${c.name}</div><div class=stars>${'★'.repeat(c.stars)}</div></div><div class=stats>${statHTML('POW',ds.p,ds.pd)}${statHTML('SPD',ds.s,ds.sd)}</div><div class=ability><div class=timing>${cat}</div><div class=abilityText>${displayAbility(c)}</div></div><div class=cardtip><div class=tiptitle>${c.name}</div><div class=tiptrigger>${cat}${tr?` · ${tr}`:''}</div><div class=tiprule>${displayAbility(c)}</div><div class=tipexplain>${explain(c)}</div><div class=tipstats>POW ${ds.p} · SPD ${ds.s}${starMeta}${wildMeta}${modMeta}</div></div></div>`}
function z(t,a){return `<div><div class=label>${t}</div><div class=zone>${a.map(x=>card(x,x.down)).join('')}</div></div>`}
function lg(x){S.log.push(x);if(S.log.length>250)S.log.shift();refreshLiveLog()}
function liveLogPanel(){let rows=S.log.slice().reverse().map((x,i)=>`<div class=liveLogRow><span>${i===0?'●':'·'}</span><p>${x}</p></div>`).join('');return `<aside class=liveLog><div class=liveLogTitle>FIL DU MATCH</div><div class=liveLogSub>Interactions en direct</div><div class=liveLogRows>${rows||'<div class=liveLogEmpty>La partie commence…</div>'}</div></aside>`}
function refreshLiveLog(){
  let el=document.querySelector('.liveLog');if(!el)return;
  let oldRows=el.querySelector('.liveLogRows');
  let oldScroll=oldRows?oldRows.scrollTop:0;
  let userBrowsing=oldRows?oldScroll>8:false;
  let tmp=document.createElement('div');tmp.innerHTML=liveLogPanel();
  let fresh=tmp.firstElementChild;el.replaceWith(fresh);
  let newRows=fresh.querySelector('.liveLogRows');
  if(newRows) newRows.scrollTop=userBrowsing?oldScroll:0;
}
async function draw(o,n){let h=hand(o),k=0;while(n--&&S.deck.length){let c=S.deck.pop();h.push(c);k++;queueVisual('draw',o==='h'?'PIOCHE':'PIOCHE RIVALE',o==='h'?`${c.name} rejoint ta main.`:'Le rival pioche une carte.',c,o==='a');let noah=activeOngoing(o,62,'lose');if(noah){let cash=o==='a'?c.stars<=2:await gameDecision('NOAH KIM',`Défausser ${c.name} immédiatement pour Score 1 ?`,'DÉFAUSSER · SCORE 1','GARDER EN MAIN');if(cash){h.splice(h.indexOf(c),1);S.disc.push(c);score(o,1);lg(`Noah Kim convertit ${c.name} en 1 point.`)}}}if(k){lg(`${ownerName(o)} pioche ${k}.`);setTimeout(()=>boardFx(`PIOCHE +${k} · ${o==='h'?'TOI':'RIVAL'}`,'draw'),45);let ro=opp(o),dalia=activeOngoing(ro,91,'lose');S.antiDrawUsed=S.antiDrawUsed||{};if(dalia&&!S.antiDrawUsed[o]&&hand(o).length){S.antiDrawUsed[o]=true;let t=o==='a'?hand(o).slice().sort((x,y)=>x.stars-y.stars)[0]:await choose(hand(o),'Dalia Reed : choisis la carte à défausser',o);if(!t)t=hand(o)[0];hand(o).splice(hand(o).indexOf(t),1);S.disc.push(t);lg(`Dalia Reed : ${t.name} est défaussée.`)}}}
function cardOwner(c){if(!c)return null;for(let o of ['h','a']){let b=(S[o+'w']||[]).concat(S[o+'l']||[]),h=S[o]||[];if(b.includes(c)||h.includes(c)||S[o+'f']===c)return o}return null}
function flip(c){if(!c)return;let was=c.down;cardFx(c,c.down?'FACE VISIBLE':'FLIP !','flip');c.down=!c.down;lg(`${c.name} est ${c.down?'face cachée':'face visible'}.`);let o=cardOwner(c);if(o&&was&&!c.down&&activeOngoing(o,68,'lose'))score(o,1)}
async function hostileFlip(c,actor){if(!c)return false;let victim=cardOwner(c);if(!victim||victim===actor){flip(c);return true}if(S.flipShield?.[victim]){lg('Ravi Ellis protège le Bench contre le Flip adverse.');return false}let guard=activeOngoing(victim,94,'win');S.guardUsed=S.guardUsed||{};if(guard&&guard!==c&&!S.guardUsed[victim]){S.guardUsed[victim]=true;flip(guard);lg(`Omar Price prend le Flip à la place de ${c.name}.`);c=guard} else flip(c);if(activeOngoing(victim,95,'lose'))await draw(victim,1);if(activeOngoing(victim,96,'win')){S.retaliateUsed=S.retaliateUsed||{};if(!S.retaliateUsed[victim]){S.retaliateUsed[victim]=true;score(victim,1)}}return true}
function zoneMoveEvent(o){S.moveScoreUsed=S.moveScoreUsed||{};if(activeOngoing(o,76,'win')&&!S.moveScoreUsed[o]){S.moveScoreUsed[o]=true;score(o,1)}}
let targetMode=null;
function choose(arr,msg,o='h',allowCancel=false){
 if(!arr.length)return Promise.resolve(null);
 if(o==='a')return Promise.resolve(arr[Math.floor(Math.random()*arr.length)]);
 return new Promise(resolve=>{
  targetMode={uids:new Set(arr.map(c=>c.uid)),msg,resolve,allowCancel};
  render();
 });
}
function bindTargetMode(){
 if(!targetMode)return;
 document.body.classList.add('targetingMode');
 document.querySelectorAll('.card[data-u]').forEach(el=>{
  if(targetMode.uids.has(el.dataset.u)){
   el.classList.add('targetEligible');
   el.onclick=e=>{e.stopPropagation();let uid=el.dataset.u,cardObj=[...S.h,...S.a,...S.hw,...S.hl,...S.aw,...S.al,...(S.hf?[S.hf]:[]),...(S.af?[S.af]:[])].find(c=>c.uid===uid);let done=targetMode.resolve;targetMode=null;document.body.classList.remove('targetingMode');done(cardObj||null)};
  }else el.classList.add('targetDim');
 });
 let cancel=document.querySelector('.targetCancel');
 if(cancel)cancel.onclick=e=>{e.stopPropagation();if(!targetMode)return;let done=targetMode.resolve;targetMode=null;document.body.classList.remove('targetingMode');done(null)};
}
function targetPrompt(){return targetMode?`<div class=targetPrompt><b>CHOISIS UNE CARTE</b><span>${targetMode.msg}</span>${targetMode.allowCancel?'<button class=targetCancel type=button>ANNULER</button>':''}</div>`:''}

function aiChooseColor(){
 // Fair AI: only use public Bench information, never peek at the player's hidden hand.
 let colors=['RED','BLUE','GREEN'],seen={RED:0,BLUE:0,GREEN:0};
 bench('h').filter(c=>!c.down&&seen[c.color]!==undefined).forEach(c=>seen[c.color]++);
 let min=Math.min(...colors.map(c=>seen[c]));
 let best=colors.filter(c=>seen[c]===min);
 return best[Math.floor(Math.random()*best.length)];
}

function gameDecision(title,text,yesLabel='OUI',noLabel='NON'){
 return new Promise(resolve=>{
  document.querySelector('#gameDecisionModal')?.remove();
  let host=document.createElement('div');host.id='gameDecisionModal';host.className='gameDecisionModal';
  host.innerHTML=`<div class=decisionBox><small>DÉCISION</small><h2>${title}</h2><p>${text}</p><div class=decisionActions><button id=decisionNo>${noLabel}</button><button class=primary id=decisionYes>${yesLabel}</button></div></div>`;
  document.body.appendChild(host);
  let done=v=>{host.remove();resolve(v)};host.querySelector('#decisionYes').onclick=()=>done(true);host.querySelector('#decisionNo').onclick=()=>done(false);
 })
}
function gameColor(title,text='Choisis une couleur pour ce Face-Off.'){
 return new Promise(resolve=>{
  document.querySelector('#gameDecisionModal')?.remove();
  let host=document.createElement('div');host.id='gameDecisionModal';host.className='gameDecisionModal';
  host.innerHTML=`<div class="decisionBox colorDecision"><small>COULEUR</small><h2>${title}</h2><p>${text}</p><div class=colorChoices><button data-c=RED class=redChoice>ROUGE</button><button data-c=BLUE class=blueChoice>BLEU</button><button data-c=GREEN class=greenChoice>VERT</button></div></div>`;
  document.body.appendChild(host);host.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{let v=b.dataset.c;host.remove();resolve(v)})
 })
}
async function chooseColor(msg,o='h'){if(o==='a')return aiChooseColor();return await gameColor(msg.replace(/\s*:\s*couleur\s*\?$/i,'').replace(/\s*\?$/,''))}
function resetTemps(c){if(c){c.tempPow=0;c.tempSpd=0;c.tempWild=false;c.tempSwap=false;c.chosenColor=null}}
function goMenu(){
 visualBusy=false;targetMode=null;document.body.classList.remove('targetingMode');
 Object.assign(S,{phase:'menu',log:[],visualQueue:[]});render();
}
function openLab(){
 visualBusy=false;targetMode=null;document.body.classList.remove('targetingMode');
 S.phase='lab';S.labH=[];S.labA=[];S.labBall='h';S.labSearch='';S.labColor='ALL';S.labType='ALL';S.labSource='ALL';render();
}
function openCollection(){
 visualBusy=false;targetMode=null;document.body.classList.remove('targetingMode');
 S.phase='collection';S.labSearch='';S.labColor='ALL';S.labType='ALL';S.labSource='ALL';S.collectionPage=0;render();
}
function labAdd(side,id){let arr=side==='h'?S.labH:S.labA;if(arr.length>=6||arr.includes(id))return;arr.push(id);render()}
function labRemove(side,id){let arr=side==='h'?S.labH:S.labA,ix=arr.indexOf(id);if(ix>=0)arr.splice(ix,1);render()}
async function startLab(){
 if(!S.labH.length||!S.labA.length){await gameDecision('LABO','Ajoute au moins 1 carte dans chaque main.','OK','RETOUR');return}
 let used=new Set([...S.labH,...S.labA]);
 Object.assign(S,{phase:'play',h:S.labH.map(id=>cp(ALL.find(c=>c.id===id))),a:S.labA.map(id=>cp(ALL.find(c=>c.id===id))),hw:[],hl:[],aw:[],al:[],hf:null,af:null,disc:[],visualQueue:[],ball:S.labBall,hs:0,as:0,log:[],round:0,sel:new Set()});
 S.deck=sh(ALL.filter(c=>!used.has(c.id)).map(c=>cp(c)));
 beginMatchStats('lab');
 lg(`Mode LABO : partie de test lancée. ${S.ball==='h'?'Tu as':'IA a'} la balle.`);render();if(S.ball==='a')setTimeout(aiAtk,350);
}
function renderLab(){
 let q=(S.labSearch||'').toLowerCase(), list=ALL.filter(c=>(!q||c.name.toLowerCase().includes(q))&&(S.labColor==='ALL'||c.color===S.labColor)&&(S.labType==='ALL'||abilityCategory(c)===S.labType)&&(S.labSource==='ALL'||(S.labSource==='CUSTOM'?c.custom:!c.custom)));
 let mini=(ids,side)=>ids.length?ids.map(id=>{let c=cp(ALL.find(x=>x.id===id));return `<div title="Cliquer pour retirer" onclick="labRemove('${side}',${id})">${card(c)}</div>`}).join(''):'<div class=labEmpty>Aucune carte sélectionnée.</div>';
 app.innerHTML=`<div class="shell labShell"><div class=labHeader><div class=logo>ODDBALL</div><h1>LABO · COLLECTION</h1><div class=spacer></div><button class=btn id=labBack>Retour au menu</button><button class="btn labLaunch" id=labLaunch>Lancer le test</button></div>
 <div class=labToolbar><input id=labSearch placeholder="Rechercher une carte…" value="${S.labSearch||''}"><select id=labColor><option value=ALL>Toutes couleurs</option><option>RED</option><option>BLUE</option><option>GREEN</option><option>WILD</option></select><select id=labType><option value=ALL>Tous les effets</option><option>INSTANT</option><option>PERMANENT</option><option>END GAME</option></select><select id=labSource><option value=ALL>Toutes sources</option><option value=RECON>Reconstruites</option><option value=CUSTOM>Custom</option></select><label class=labBall>Balle : <select id=labBall><option value=h>TOI</option><option value=a>RIVAL</option></select></label></div>
 <div class=labTeams><div class=labTeam><div class=labTeamHead><span>TA MAIN</span><span>${S.labH.length}/6</span></div><div class=labMiniHand>${mini(S.labH,'h')}</div><div class=labHint>Cliquer une carte sélectionnée pour la retirer.</div></div><div class=labTeam><div class=labTeamHead><span>MAIN RIVALE</span><span>${S.labA.length}/6</span></div><div class=labMiniHand>${mini(S.labA,'a')}</div><div class=labHint>Cliquer une carte sélectionnée pour la retirer.</div></div></div>
 <div class=labGrid>${list.map(c=>{let cc=cp(c),inh=S.labH.includes(c.id),ina=S.labA.includes(c.id);return `<div class=labEntry>${card(cc)}<div class=labActions><button class=labAddH data-id=${c.id} ${inh||S.labH.length>=6?'disabled':''}>+ TOI</button><button class=labAddA data-id=${c.id} ${ina||S.labA.length>=6?'disabled':''}>+ RIVAL</button></div></div>`}).join('')}</div></div>`;
 document.querySelector('#labColor').value=S.labColor;document.querySelector('#labType').value=S.labType;document.querySelector('#labSource').value=S.labSource;document.querySelector('#labBall').value=S.labBall;
 document.querySelector('#labBack').onclick=goMenu;document.querySelector('#labLaunch').onclick=startLab;
 document.querySelector('#labSearch').oninput=e=>{S.labSearch=e.target.value;render()};document.querySelector('#labColor').onchange=e=>{S.labColor=e.target.value;render()};document.querySelector('#labType').onchange=e=>{S.labType=e.target.value;render()};document.querySelector('#labSource').onchange=e=>{S.labSource=e.target.value;render()};document.querySelector('#labBall').onchange=e=>S.labBall=e.target.value;
 document.querySelectorAll('.labAddH').forEach(b=>b.onclick=()=>labAdd('h',+b.dataset.id));document.querySelectorAll('.labAddA').forEach(b=>b.onclick=()=>labAdd('a',+b.dataset.id));
}
window.labRemove=labRemove;
function startDraft(){visualBusy=false;targetMode=null;document.body.classList.remove('targetingMode');Object.assign(S,{phase:'d1',deck:sh(ALL.map(c=>cp(c))),h:[],a:[],hw:[],hl:[],aw:[],al:[],hf:null,af:null,disc:[],visualQueue:[],ball:Math.random()<.5?'h':'a',hs:0,as:0,log:[],round:0,sel:new Set()});d1()}
function d1(){S.pool=S.deck.splice(0,4);S.phase='d1';S.sel.clear();render()}
function pick1(u){let c=S.pool.find(x=>x.uid===u);S.h.push(c);S.toA=S.pool.filter(x=>x!==c);let q=S.deck.splice(0,4).sort((x,y)=>(y.stars+y.pow/100+y.spd/150)-(x.stars+x.pow/100+x.spd/150));S.a.push(q.shift());S.pool=q;S.phase='d2';render()}
function pick2(u){S.sel.has(u)?S.sel.delete(u):S.sel.size<2&&S.sel.add(u);render()}
function conf(){if(S.sel.size!==2)return;S.h.push(...S.pool.filter(x=>S.sel.has(x.uid)));S.deck.push(...S.pool.filter(x=>!S.sel.has(x.uid)));let q=S.toA.sort((x,y)=>(y.stars+y.pow/100)-(x.stars+x.pow/100));S.a.push(...q.slice(0,2));S.deck.push(...q.slice(2));if(++S.round<2)d1();else{S.phase='play';beginMatchStats('draft');lg('Draft terminé. '+(S.ball==='h'?'Tu':'IA')+' as la balle.');render();if(S.ball==='a')setTimeout(aiAtk,350)}}
function rawOngoing(o,id,zone='both'){let arr=zone==='win'?winz(o):zone==='lose'?losez(o):bench(o);return arr.find(x=>x.id===id&&!x.down)}
function activeOngoing(o,id,zone='both'){if(zone==='win'&&rawOngoing(opp(o),88,'lose'))return null;if(zone==='lose'&&rawOngoing(opp(o),89,'win'))return null;return rawOngoing(o,id,zone)}
function dyn(c,o,role){let p=(c.tempSwap?c.spd:c.pow)+(c.tempPow||0),s=(c.tempSwap?c.pow:c.spd)+(c.tempSpd||0),w=c.color==='WILD'||c.tempWild;
 if(isInstant(c)&&activeOngoing(o,14))p+=20;
 if(isInstant(c)&&activeOngoing(o,22))s+=30;
 if(c.timing==='ONGOING'&&activeOngoing(o,36))p+=50;
 if(activeOngoing(o,19)){let st=losez(o).filter(x=>!x.down).reduce((n,x)=>n+x.stars,0);if(st>=4)w=true}
 if(activeOngoing(o,5,'win')&&p>=50)w=true;
 if(activeOngoing(o,43)&&c.stars>=3)s+=30;
 if(activeOngoing(o,52,'lose'))p+=30;
 let sad=activeOngoing(o,38);if(sad&&losez(o).length){let first=losez(o)[0];if(!first.down&&c.color===first.color)p+=50}
 if(c.color==='RED'&&activeOngoing(o,80,'win'))p+=30;
 if(c.color==='BLUE'&&activeOngoing(o,81,'lose'))s+=30;
 if(p<50&&activeOngoing(o,72,'win'))s+=30;
 if(rawOngoing(opp(o),93,'win'))w=false;
 return{p,s,w}
}
async function triggerOngoingsOnPlay(c,o){
 if(c.color==='RED'&&activeOngoing(o,37,'lose')){await draw(o,1);lg('Aubrey Mercado se déclenche.')}
 if(c.color==='BLUE'&&activeOngoing(o,28,'win')){await draw(o,1);lg('Cash Lester se déclenche.')}
 let king=activeOngoing(o,2);if(c.color==='RED'&&king){let yes=o==='a'||await gameDecision('KING CHOI','Flip King pour donner +100 POW à la carte jouée et piocher 2 ?','FLIP KING','GARDER KING');if(yes){flip(king);c.tempPow+=100;cardFx(c,'+100 POW','pow');await draw(o,2)}}
 let nao=activeOngoing(o,34,'lose');if(nao){let yes=o==='a'||await gameDecision('NAO CLARK','Échanger POW et SPD de la carte jouée pour ce Face-Off ?','ÉCHANGER','GARDER');if(yes){c.tempSwap=true;lg('Nao Clark échange temporairement POW/SPD de '+c.name+' pour ce Faceoff.')}}
 if((c.timing==='ONGOING'||isEndGame(c))&&activeOngoing(o,45)){await draw(o,1);lg('Gloria Mayer se déclenche.')}
 if(c.stars===0&&activeOngoing(o,66,'win')){c.tempWild=true;c.chosenColor=await chooseColor(`${c.name} devient Wild grâce à Tariq Moss : couleur ?`,o)}
 if(c.color==='GREEN'&&activeOngoing(o,82,'win')){let last=winz(o).at(-1);if(last&&!last.down&&last.color==='GREEN')await draw(o,1)}
}
async function moveLastEnemyWinToLose(o,why){let ro=opp(o),ow=winz(ro);if(ow.length){let moved=ow.pop();losez(ro).push(moved);cardFx(moved,'→ LOSEZONE','move');lg(`${why} : dernière Winzone adverse déplacée en Losezone.`);await handleLosezoneEntry(moved,ro)}}
async function swapLastAcrossZones(o){let zones=[{name:'ta Winzone',arr:winz(o)},{name:'ta Losezone',arr:losez(o)},{name:'Winzone rivale',arr:winz(opp(o))},{name:'Losezone rivale',arr:losez(opp(o))}].filter(z=>z.arr.length);if(zones.length<2)return;let pickZone=async(zs,msg,who)=>{if(who==='a')return zs[Math.floor(Math.random()*zs.length)];let cards=zs.map(z=>z.arr[z.arr.length-1]);let picked=await choose(cards,msg,who);return zs.find(z=>z.arr[z.arr.length-1]===picked)||null};let a=await pickZone(zones,'Wally : première zone',o);if(!a)return;let b=await pickZone(zones.filter(z=>z!==a),'Wally : autre zone',o);if(!b)return;let ca=a.arr[a.arr.length-1],cb=b.arr[b.arr.length-1];a.arr[a.arr.length-1]=cb;b.arr[b.arr.length-1]=ca;cardFx(ca,'ÉCHANGE','move');cardFx(cb,'ÉCHANGE','move');lg(`Wally Sanford échange ${ca.name} et ${cb.name}.`);for(let ro of ['h','a']){if(losez(ro).includes(ca))await handleLosezoneEntry(ca,ro);if(losez(ro).includes(cb))await handleLosezoneEntry(cb,ro)}}
async function defenseFx(c,o){if(c.id===46)await swapLastAcrossZones(o);if(c.id===67&&hand(o).length<hand(opp(o)).length)await draw(o,1);if(c.id===97){S.flipShield=S.flipShield||{};S.flipShield[o]=true}}
async function beforePlayFx(o){
 let willie=activeOngoing(o,8);if(!willie)return;
 let b=bench(o);if(b.length<2)return;
 let yes=o==='a'?Math.random()<.65:await gameDecision('WILLIE DUKE','Échanger 2 cartes sur ton Bench avant de jouer ?','ÉCHANGER','PASSER');if(!yes)return;
 let a=await choose(b,'Willie Duke : première carte à échanger',o),bb=a?await choose(b.filter(x=>x!==a),'Willie Duke : deuxième carte à échanger',o):null;
 if(a&&bb){await swapBenchCards(o,a,bb);lg('Willie Duke agit avant le Play.')}
}
async function handleLosezoneEntry(c,o){if(!c||c.color!=='RED'||!activeOngoing(o,42))return;let yes=o==='a'||await gameDecision('ALONZO FRY',`Déplacer ${c.name} de ta Losezone vers ta Winzone ?`,'DÉPLACER','LAISSER');if(yes){let l=losez(o),i=l.lastIndexOf(c);if(i>=0){l.splice(i,1);winz(o).push(c);cardFx(c,'→ WINZONE','move');lg(`Alonzo Fry : ${c.name} passe de la Losezone à la Winzone.`)}}}
async function copyInstantEffect(target,source,o,role){
 let proxy={...source,id:target.id,name:source.name+' → '+target.name,timing:target.timing,text:target.text};
 lg(`Takaya Herrera copie l’effet de ${target.name}.`);
 if(target.timing==='PLAY')await playFx(proxy,o,role,true);
 else if(target.timing==='ATTACK')await attackFx(proxy,o);
 else if(target.timing==='DEFENSE')await defenseFx(proxy,o);
 else if(target.timing==='LOSE')await loseFx(proxy,o);
 else if(target.timing==='WIN')await winFx(proxy,o);
 // Les modifications temporaires appartiennent à Takaya, pas à la carte copiée.
 let di=S.disc.indexOf(proxy);if(di>=0)S.disc[di]=source;source.tempPow=proxy.tempPow||source.tempPow;source.tempSpd=proxy.tempSpd||source.tempSpd;source.tempWild=proxy.tempWild||source.tempWild;source.tempSwap=proxy.tempSwap||source.tempSwap;source.chosenColor=proxy.chosenColor||source.chosenColor;
}
async function playFx(c,o,role,copied=false){
 let currentWild=dyn(c,o,role).w;
 if(!copied&&currentWild&&!(c.id===7&&role==='atk')){c.chosenColor=await chooseColor(`${c.name} est actuellement Wild : couleur du Faceoff ?`,o);lg(`${c.name} est Wild et choisit ${c.chosenColor}.`)}
 if(c.id===6){score(o,1);let my=bench(o).filter(x=>x.down).length,his=bench(opp(o)).filter(x=>x.down).length;if(my<his)score(o,1)}
 if(c.id===16)score(S.ball,1);
 if(c.id===25){await draw(o,1);c.tempSpd+=50;cardFx(c,'+50 SPD','spd');lg(`Reed Crane : +50 SPD pendant ce Faceoff → ${dyn(c,o,role).s} SPD.`)}
 if(c.id===20){if(o==='a'||await gameDecision('DARCY DAVIS','Choisis l’effet à résoudre.','PIOCHER 1','FLIP 1 CARTE'))await draw(o,1);else flip(await choose(bench(o),'Choisis une carte à Flip',o))}
 if(c.id===23){let t=await choose(bench(o),'Nino : choisis une carte à Flip pour +50 POW',o);if(t){flip(t);c.tempPow+=50;cardFx(c,'+50 POW','pow')}}
 if(c.id===26){let b=bench(o).filter(x=>!x.down);if(b.length>=2){let a=await choose(b,'Leon : première carte à swap',o),bb=a?await choose(b.filter(x=>x!==a),'Leon : deuxième carte',o):null;if(a&&bb){await swapBenchCards(o,a,bb);if(a.color===bb.color){c.tempSpd+=100;cardFx(c,'+100 SPD','spd')}}}}
 if(c.id===33){let doWild=o==='a'||await gameDecision('NAO DUFFY','Choisis son effet.','DEVENIR WILD','SWAP 2 CARTES');if(doWild){c.tempWild=true;cardFx(c,'WILD','wild');c.chosenColor=await chooseColor('Nao Duffy devient Wild : couleur ?',o)}else{let b=bench(o);let a=await choose(b,'1re carte',o),bb=a?await choose(b.filter(x=>x!==a),'2e carte',o):null;if(a&&bb)await swapBenchCards(o,a,bb)}}
 if(c.id===35&&bench(o).some(x=>!x.down&&x.color==='BLUE'))await moveLastEnemyWinToLose(o,'Cheryl Hamilton');
 if(c.id===47){let greens=hand(o).filter(x=>x.color==='GREEN');if(greens.length){let yes=o==='a'||await gameDecision('HINA MASSEY','Défausser 1 carte Verte pour gagner +100 SPD et piocher 1 ?','DÉFAUSSER','PASSER');if(yes){let t=await choose(greens,'Hina : carte Verte à défausser',o);if(t){hand(o).splice(hand(o).indexOf(t),1);S.disc.push(t);c.tempSpd+=100;cardFx(c,'+100 SPD','spd');await draw(o,1);lg('Hina Massey : +100 SPD pour ce Faceoff et pioche 1.')}}}}
 if(c.id===48){let n=new Set(winz(o).filter(x=>!x.down).map(x=>x.color)).size;score(o,n);lg(`Kasimir Anthony : ${n} couleur${n>1?'s':''} différente${n>1?'s':''} dans la Winzone.`)}
 if(c.id===64){let t=winz(o).at(-1);if(t){let st=t.down?1:t.stars;flip(t);c.tempPow+=20*st;cardFx(c,`+${20*st} POW`,'pow')}}
 if(c.id===70){let max=Math.min(2,hand(o).length),chosen=[];if(max){if(o==='a'){chosen=hand(o).slice().sort((x,y)=>x.stars-y.stars).slice(0,max)}else{for(let z=0;z<max;z++){let t=await choose(hand(o).filter(x=>!chosen.includes(x)),`Yumi Hayes : carte ${z+1} à défausser`,o,true);if(!t)break;chosen.push(t)}}for(let t of chosen){hand(o).splice(hand(o).indexOf(t),1);S.disc.push(t)}await draw(o,chosen.length+1)}}
 if(c.id===77){let t=losez(o).at(-1);if(t){losez(o).pop();winz(o).push(t);zoneMoveEvent(o);if(!t.down)flip(t);lg(`Dante Wu déplace ${t.name} en Winzone face cachée.`)}}
 if(!copied&&c.id===39){let opts=bench(o).filter(x=>!x.down);let t=await choose(opts,'Takaya Herrera : choisis 1 de tes cartes à Flip — ou passe',o,true);if(t){let instant=isInstant(t);flip(t);if(instant){let yes=o==='a'||await gameDecision('TAKAYA HERRERA',`Copier l’effet Instant de ${t.name} ?`,'COPIER','PASSER');if(yes)await copyInstantEffect(t,c,o,role)}}}
 if(!copied){await triggerOngoingsOnPlay(c,o);if(role==='atk')await attackFx(c,o);else if(role==='def')await defenseFx(c,o)}
}
async function swapBenchCards(o,a,b){let zones=[winz(o),losez(o)],pa,pb;for(let z of zones){let i=z.indexOf(a);if(i>=0)pa=[z,i];i=z.indexOf(b);if(i>=0)pb=[z,i]}if(pa&&pb){pa[0][pa[1]]=b;pb[0][pb[1]]=a;cardFx(a,'ÉCHANGE','move');cardFx(b,'ÉCHANGE','move');lg(`${a.name} et ${b.name} sont échangées.`);if(losez(o).includes(a))await handleLosezoneEntry(a,o);if(losez(o).includes(b))await handleLosezoneEntry(b,o)}}
async function attackFx(c,o){
 if(c.id===0){c.tempPow+=20;cardFx(c,'+20 POW','pow')};
 if(c.id===3){c.tempPow+=50;cardFx(c,'+50 POW','pow');c.tempWild=true;cardFx(c,'WILD','wild');c.chosenColor=await chooseColor('Candy devient Wild : couleur ?',o)}
 if(c.id===15){let col=await chooseColor('Demi Boone : annonce une couleur',o),h=hand(opp(o)).filter(x=>x.color===col);let t=await choose(h,'Carte à défausser',opp(o));if(t){hand(opp(o)).splice(hand(opp(o)).indexOf(t),1);S.disc.push(t);lg(`Demi : ${t.name} défaussée.`);queueVisual('discard','DÉFAUSSÉE PAR DEMI BOONE',`${t.name} quitte la main ${opp(o)==='h'?'du joueur':'rivale'}.`,t,false)}else{queueVisual('discard','DEMI BOONE',`Aucune carte ${col} à défausser.`)}}
 if(c.id===18){let wild=o==='a'||await gameDecision('DEVIN PRICE','Choisis son effet.','DEVENIR WILD','FLIP UNE CARTE');if(wild){c.tempWild=true;cardFx(c,'WILD','wild');c.chosenColor=await chooseColor('Devin devient Wild : couleur ?',o)}else{let opts=[...winz(o).slice(-1),...losez(o).slice(-1),...winz(opp(o)).slice(-1),...losez(opp(o)).slice(-1)];flip(await choose(opts,'Choisis la dernière carte à Flip',o))}}
 if(c.id===29&&activeOngoing(o,29)){/* source itself only once on bench, current Aditi not active */ }
 if(c.color==='GREEN'&&activeOngoing(o,29))await moveLastEnemyWinToLose(o,'Aditi Russo');
 if(c.id===30){let t=await choose(bench(o),'Abel : choisis une carte à Flip',o);if(t){let zones=[winz(o),losez(o)],neighbors=0;for(let z of zones){let i=z.indexOf(t);if(i>=0){if(i>0)neighbors++;if(i<z.length-1)neighbors++}}flip(t);score(o,neighbors)}}
 if(c.id===4&&winz(o).length&&hand(o).length){let h=await choose(hand(o),'Nolan : carte de main à échanger',o),w=h?await choose(winz(o),'Nolan : carte de Winzone',o):null;if(h&&w){hand(o)[hand(o).indexOf(h)]=w;winz(o)[winz(o).indexOf(w)]=h;lg('Nolan effectue le swap main ↔ Winzone.')}}
 if(c.id===7){
  await draw(o,1);let newest=hand(o)[hand(o).length-1];
  if(!newest){if(dyn(c,o,'atk').w){c.chosenColor=await chooseColor('Asta reste en jeu : couleur du Faceoff ?',o);lg(`Asta Farley choisit ${c.chosenColor}.`)}return}
  if(o==='a'){
    let yes=Math.random()<.5;
    if(yes){hand(o).splice(hand(o).indexOf(newest),1);S.disc.push(c);S.af=newest;lg(`Asta est défaussée et remplacée par ${newest.name}.`);await beforePlayFx(o);await playFx(newest,o,'atk')}
    else if(dyn(c,o,'atk').w){c.chosenColor=await chooseColor('Asta reste en jeu : couleur du Faceoff ?',o);lg(`Asta Farley choisit ${c.chosenColor}.`)}
  }else{
    S.awaitingAsta=true;render();setTimeout(()=>showAstaChoice(c,newest),60);
  }
 }
 if(c.id===41){let opts=winz(o).filter(x=>!x.down);if(opts.length){let yes=o==='a'||await gameDecision('GIULIA PEARSON','Défausser 1 carte face visible de ta Winzone pour piocher 1 ?','DÉFAUSSER','PASSER');if(yes){let t=await choose(opts,'Giulia : carte de Winzone à défausser',o);if(t){winz(o).splice(winz(o).indexOf(t),1);S.disc.push(t);await draw(o,1);lg(`Giulia Pearson : ${t.name} défaussée, pioche 1.`)}}}}
 if(c.id===53){let t=winz(o).at(-1);if(t){let st=t.down?1:t.stars;flip(t);c.tempPow+=30*st;cardFx(c,`+${30*st} POW`,'pow')}}
 if(c.id===54){let ro=opp(o),opts=bench(ro).filter(x=>!x.down);if(opts.length){if(ro==='a'){await hostileFlip(opts.slice().sort((x,y)=>x.stars-y.stars)[0],o)}else{let accept=await gameDecision('NADIA BROOKS','Flip une de tes cartes de Bench pour empêcher Nadia de gagner +70 POW ?','FLIP UNE CARTE','+70 POW À NADIA');if(accept){let t=await choose(opts,'Choisis la carte à Flip',ro);await hostileFlip(t,o)}else c.tempPow+=70}}else c.tempPow+=70}
 if(c.id===59&&hand(o).length<hand(opp(o)).length){c.tempWild=true;c.tempSpd+=30;c.chosenColor=await chooseColor('Zuri Dean devient Wild : couleur ?',o)}
 if(c.id===61&&hand(o).length){let t=await choose(hand(o),'Rina Foster : carte à défausser pour ajouter son POW',o);if(t){hand(o).splice(hand(o).indexOf(t),1);S.disc.push(t);c.tempPow+=t.pow;cardFx(c,`+${t.pow} POW`,'pow')}}
 if(c.id===78){let opts=bench(o).filter(x=>!x.down);let t=await choose(opts,'Mei Carter : carte du Bench dont utiliser le POW',o);if(t){let targetPow=dyn(t,o,'').p,current=dyn(c,o,'atk').p;c.tempPow+=targetPow-current;lg(`Mei Carter utilise ${targetPow} POW de ${t.name}.`)}}
 if(c.id===86){let opts=bench(opp(o)).filter(x=>!x.down);let t=await choose(opts,'Lexi Monroe : carte adverse à Flip',o);if(t)await hostileFlip(t,o)}
 if(c.id===92){let ro=opp(o),opts=bench(ro).filter(x=>!x.down&&x.timing==='ONGOING');if(opts.length){if(ro==='h'){let yes=await gameDecision('VICTOR HALE','Choisis : Flip un de tes Permanents, ou Victor gagne +60 POW.','FLIP UN PERMANENT','VICTOR +60 POW');if(yes){let t=await choose(opts,'Permanent à Flip',ro);await hostileFlip(t,o)}else c.tempPow+=60}else await hostileFlip(opts.slice().sort((x,y)=>x.stars-y.stars)[0],o)}else c.tempPow+=60}
}
function showAstaChoice(asta,drawn){
 // Persistent modal outside #app/#visualFx: normal renders and queued FX can no longer erase the decision.
 document.querySelector('#astaDecisionModal')?.remove();
 visualBusy=true;
 let host=document.createElement('div');host.id='astaDecisionModal';host.className='astaDecisionModal';
 host.innerHTML=`<div class=fxPanel><div class=fxKicker>ASTA — CARTE PIOCHÉE</div>${card(drawn)}<div class=fxText>Veux-tu jouer <b>${drawn.name}</b> à la place d’Asta ?</div><div class=astaActions><button id=astaPlay class=btn>JOUER CETTE CARTE</button><button id=astaKeep class=btn>GARDER EN MAIN</button></div></div>`;
 document.body.appendChild(host);
 let locked=false;
 const finish=async play=>{if(locked)return;locked=true;host.remove();visualBusy=false;S.awaitingAsta=false;if(play){let i=hand('h').indexOf(drawn);if(i>=0)hand('h').splice(i,1);S.disc.push(asta);S.hf=drawn;lg(`Asta est défaussée et remplacée par ${drawn.name}.`);await beforePlayFx('h');await playFx(drawn,'h','atk')}else{if(dyn(asta,'h','atk').w){asta.chosenColor=await chooseColor('Asta reste en jeu : couleur du Faceoff ?','h');lg(`Asta Farley choisit ${asta.chosenColor}.`)}}render();setTimeout(aiDef,PACE.aiResponse)};
 host.querySelector('#astaPlay').onclick=()=>finish(true);host.querySelector('#astaKeep').onclick=()=>finish(false);
}

async function loseFx(c,o){
 if(c.id===9){let n=bench(o).filter(x=>!x.down&&isInstant(x)).length;await draw(o,n)}
 if(c.id===11){let n=new Set(bench(o).filter(x=>!x.down).map(x=>x.color)).size;await draw(o,n)}
 if(c.id===12){let col=await chooseColor('Susie : annonce une couleur',o),n=hand(opp(o)).filter(x=>x.color===col).length;score(o,n)}
 if(c.id===13)await draw(o,1);
 if(c.id===21){let t=await choose(bench(o),'Kay Lee : choisis une carte à Flip pour scorer 2',o);if(t){flip(t);score(o,2)}}
 if(c.id===50){let ro=opp(o),opts=bench(ro).filter(x=>!x.down&&isEndGame(x));let t=await choose(opts,'Reuben Browning : choisis une de tes cartes End Game à Flip',ro);if(t){flip(t);lg(`Reuben Browning : ${t.name} est Flip.`)}}
 if(c.id===87){let t=winz(opp(o)).at(-1);if(t)await hostileFlip(t,o)}
 if(c.id===74){let enemy=o==='h'?S.af:S.hf;if(enemy&&dyn(c,o,'').s>dyn(enemy,opp(o),'').s)c._loseToWinDown=true}
}
async function winFx(c,o){if(c.id===32){await draw(o,1);if(S.deck.length){S.deck.pop();lg('Air Irwin défausse le dessus du deck.')}}if(c.id===58||c.customId==='C11'||c.name==='Otis Webb'){let yes=o==='a'||await gameDecision('OTIS WEBB','Tu as gagné le Face-Off. Placer Otis en Losezone au lieu de Winzone pour marquer 2 points ?','LOSEZONE · +2 PTS','WINZONE');if(yes){c._winToLose=true;score(o,2);cardFx(c,'+2 PTS','score');lg(`${o==='h'?'Tu actives':'IA active'} Otis Webb : Losezone et +2 points.`)}else lg('Otis Webb reste en Winzone.')}if(c.id===69){let yes=o==='a'||await gameDecision('MARCO LIN','Placer Marco face cachée en Winzone pour piocher 2 ?','FACE CACHÉE + DRAW 2','FACE VISIBLE');if(yes){c._winDown=true;await draw(o,2)}}}

async function finishUnopposedFaceoff(atk){
 let ac=atk==='h'?S.hf:S.af,def=opp(atk);
 if(!ac||hand(def).length)return false;
 if(S.matchStats)S.matchStats.faceoffs++;
 lg(`${def==='h'?'Tu n’as':'Le rival n’a'} plus de carte pour défendre : ${atk==='h'?'tu gagnes':'IA gagne'} automatiquement le Faceoff.`);
 await winFx(ac,atk);
 if(ac._winToLose){losez(atk).push(ac);delete ac._winToLose;await handleLosezoneEntry(ac,atk)}else{winz(atk).push(ac);if(ac._winDown&&!ac.down)flip(ac);delete ac._winDown}
 resetTemps(ac);
 if(atk==='h')S.hf=null;else S.af=null;
 let previousBall=S.ball;S.ball=atk;
 render();setTimeout(()=>animatePossession(previousBall,S.ball),80);
 showEvent('FACE-OFF AUTOMATIQUE',`${atk==='h'?'Tu gagnes':'IA gagne'} : aucune carte disponible en défense.`);
 setTimeout(end,PACE.afterResult);
 return true;
}
async function hplay(u){if(S.phase!=='play')return;let i=S.h.findIndex(x=>x.uid===u);if(i<0)return;/* If the rival is already empty, preserve the player's click visually before final scoring instead of leaving a ghost card in hand. No Faceoff is resolved. */if(!S.a.length&&!S.af){lg('Le rival n’a plus de carte : la partie est déjà terminée, aucune nouvelle carte n’est jouée.');showEvent('FIN DU JEU','Le rival ne peut plus participer au prochain Faceoff.');setTimeout(end,250);return}if(!S.h.length){end();return}if(S.ball==='h'&&!S.hf){S.hf=S.h.splice(i,1)[0];markPlayed('h',S.hf);await beforePlayFx('h');lg('Tu attaques avec '+S.hf.name);await playFx(S.hf,'h','atk');if(await finishUnopposedFaceoff('h'))return;render();animateFaceoffEntry('h','attack');showEvent('TON ATTAQUE',`${S.hf.name} entre en jeu.`);if(!S.awaitingAsta)setTimeout(aiDef,PACE.aiResponse)}else if(S.ball==='a'&&S.af&&!S.hf){S.hf=S.h.splice(i,1)[0];markPlayed('h',S.hf);await beforePlayFx('h');lg('Tu défends avec '+S.hf.name);await playFx(S.hf,'h','def');render();animateFaceoffEntry('h','defense');duelImpact();showEvent('TA DÉFENSE',`${S.hf.name} répond au Faceoff.`);setTimeout(resolve,PACE.showDefense)}}
function aiGameStage(){
 // Public information only: hand sizes, Bench and score are visible to both players.
 let cardsLeft=S.a.length+S.h.length+(S.af?1:0)+(S.hf?1:0);
 return cardsLeft<=4?'late':cardsLeft<=8?'mid':'early';
}
function aiSynergyValue(c,o='a'){
 let v=0,b=bench(o),w=winz(o),l=losez(o),stage=aiGameStage();
 if(c.timing==='PLAY')v+=10;
 if(c.timing==='ATTACK')v+=14;
 if(c.timing==='ONGOING')v+=stage==='early'?27:stage==='mid'?20:10;
 if(isEndGame(c))v+=stage==='late'?25:10;
 if(c.timing==='LOSE')v+=8;
 if(c.timing==='WIN')v+=9;
 if(isInstant(c)&&activeOngoing(o,14))v+=9;
 if(isInstant(c)&&activeOngoing(o,22))v+=9;
 if(c.timing==='ONGOING'&&activeOngoing(o,36))v+=13;
 if(c.color==='RED'&&activeOngoing(o,37,'lose'))v+=11;
 if(c.color==='BLUE'&&activeOngoing(o,28,'win'))v+=11;
 if((c.timing==='ONGOING'||isEndGame(c))&&activeOngoing(o,45))v+=11;
 if(c.stars>=3&&activeOngoing(o,43))v+=8;
 if(c.pow>=50&&activeOngoing(o,5,'win'))v+=9;
 if(c.id===24&&l.some(x=>!x.down&&x.color==='RED'))v-=20;
 if(c.id===31&&l.some(x=>!x.down&&x.color==='BLUE'))v+=12;
 if(c.id===48)v+=Math.min(15,new Set(w.filter(x=>!x.down).map(x=>x.color)).size*5);
 return v;
}
function aiFutureValue(c){
 let stage=aiGameStage(),v=c.stars*5;
 if(isEndGame(c))v+=stage==='early'?34:stage==='mid'?22:8;
 if(c.timing==='ONGOING')v+=stage==='early'?25:stage==='mid'?14:4;
 if(c.timing==='DEFENSE')v+=8;
 if(c.color==='WILD')v+=12;
 return v;
}
function aiAttackValue(c){
 let d=dyn(c,'a','atk'),stage=aiGameStage(),v=d.p*1.18+d.s*.28+c.stars*6+aiSynergyValue(c,'a');
 if(c.id===0)v+=25;if(c.id===3)v+=40;if(c.id===15)v+=22;if(c.id===18)v+=15;if(c.id===30)v+=14;if(c.id===41)v+=10;
 // Keep long-term engines / scoring pieces when the match is not yet near its end.
 if(stage!=='late')v-=aiFutureValue(c)*.42;
 // When behind late, value immediate power more; when ahead, protect valuable scoring cards.
 if(stage==='late')v+=(S.as<S.hs?d.p*.16:c.stars*5);
 return v;
}
function aiDefenseValue(c,demand,enemyPow){
 let d=dyn(c,'a','def'),match=d.w||c.color===demand,canWin=match&&d.p>=enemyPow;
 let v=(match?650:0)+d.p*.72+d.s*.16+c.stars*3+aiSynergyValue(c,'a');
 if(canWin){
   // Strong preference for a sufficient defender, but reward efficiency: don't burn 97 POW for 20 if 30 does it.
   v+=650-Math.max(0,d.p-enemyPow)*2.2;
 }else{
   // If this Face-Off is effectively lost, sacrifice the least valuable future card.
   v-=aiFutureValue(c)*1.55;
   if(c.timing==='LOSE')v+=45;
 }
 if(c.timing==='DEFENSE')v+=34;
 return v;
}
function aiPickScored(cards,scoreFn){
 let scored=cards.map(c=>({c,v:scoreFn(c)})).sort((a,b)=>b.v-a.v);
 if(!scored.length)return null;
 // Small controlled imperfection: only vary between genuinely close decisions.
 let top=scored[0].v,near=scored.filter(x=>top-x.v<=18).slice(0,3);
 let pick=near.length>1&&Math.random()<.28?near[Math.floor(Math.random()*near.length)]:scored[0];
 return pick.c;
}
async function aiAtk(){
 if(!S.a.length)return end();
 let pick=aiPickScored(S.a,aiAttackValue),ix=S.a.indexOf(pick);S.af=S.a.splice(ix,1)[0];markPlayed('a',S.af);
 // Reveal/place the rival card BEFORE resolving interactive Play/Attack effects.
 // This lets the player read the card (e.g. Nadia Brooks) before a choice popup appears.
 render();animateFaceoffEntry('a','attack');showEvent('ATTAQUE RIVALE',`${S.af.name} entre en jeu.`);
 await new Promise(r=>setTimeout(r,320));
 await beforePlayFx('a');lg('IA attaque avec '+S.af.name);await playFx(S.af,'a','atk');if(await finishUnopposedFaceoff('a'))return;
 let st=dyn(S.af,'a','atk'),wildMsg=st.w&&S.af.chosenColor?` · WILD choisit ${S.af.chosenColor}`:'';render();if(wildMsg)showEvent('ATTAQUE RIVALE',`${S.af.name} entre en jeu${wildMsg}.`)
}
async function aiDef(){
 if(!S.a.length)return end();
 let atkS=dyn(S.hf,'h','atk'),demand=atkS.w?(S.hf.chosenColor||S.hf.color):S.hf.color;
 let pick=aiPickScored(S.a,c=>aiDefenseValue(c,demand,atkS.p)),ix=S.a.indexOf(pick);S.af=S.a.splice(ix,1)[0];markPlayed('a',S.af);
 // Same presentation rule on defense: show the card first, then ask for any reaction/choice.
 render();animateFaceoffEntry('a','defense');showEvent('DÉFENSE RIVALE',`${S.af.name} répond au Faceoff.`);
 await new Promise(r=>setTimeout(r,320));
 await beforePlayFx('a');lg('IA défend avec '+S.af.name);await playFx(S.af,'a','def');render();duelImpact();setTimeout(resolve,PACE.showDefense)
}
function finalColor(c,stats){return stats.w?(c.chosenColor||c.color):c.color}
async function resolve(){
 if(S.matchStats)S.matchStats.faceoffs++;
 let travelSnap=captureDuelCards();
 let atk=S.ball,ac=atk==='h'?S.hf:S.af,dc=atk==='h'?S.af:S.hf,def=opp(atk);
 let AT=dyn(ac,atk,'atk'),DT=dyn(dc,def,'def'),acol=finalColor(ac,AT),dcol=finalColor(dc,DT);
 let demanded=AT.w?(ac.chosenColor||acol):acol; let ok=DT.w||dcol===demanded,H=atk==='h'?AT:DT,Ai=atk==='a'?AT:DT,win;
 if(!ok)win=atk;else if(H.p>Ai.p)win='h';else if(Ai.p>H.p)win='a';else win=atk;
 let lose=opp(win);showFaceoffResult(win);await new Promise(r=>setTimeout(r,420));lg(`Couleur demandée : ${demanded}. Défense : ${DT.w?'WILD':dcol}.`);lg(`POW du duel : ${S.hf.name} ${H.p} vs ${S.af.name} ${Ai.p}.`);lg((ok?'Couleurs compatibles':'Défense hors couleur — perte automatique du Faceoff')+' → '+(win==='h'?'tu gagnes':'IA gagne')+'.');
 let wc=win==='h'?S.hf:S.af,lc=lose==='h'?S.hf:S.af;await winFx(wc,win);await loseFx(lc,lose);
 let Hs=dyn(S.hf,'h',atk==='h'?'atk':'def').s,Ais=dyn(S.af,'a',atk==='a'?'atk':'def').s;let previousBall=S.ball;S.ball=Hs===Ais?atk:(Hs>Ais?'h':'a');let nextBall=S.ball;lg(`Possession suivante : ${S.ball==='h'?'toi':'IA'} (${Hs}–${Ais} SPD).`);
 if(wc._winToLose){losez(win).push(wc);delete wc._winToLose;await handleLosezoneEntry(wc,win)}else{winz(win).push(wc);if(wc._winDown&&!wc.down)flip(wc);delete wc._winDown}if(lc._loseToWinDown){winz(lose).push(lc);if(!lc.down)flip(lc);delete lc._loseToWinDown}else{losez(lose).push(lc);await handleLosezoneEntry(lc,lose)}if(activeOngoing(lose,73,'lose')&&dyn(lc,lose,'').s>dyn(wc,win,'').s)score(lose,1);resetTemps(wc);resetTemps(lc);S.hf=S.af=null;S.flipShield={};S.guardUsed={};S.retaliateUsed={};S.moveScoreUsed={};S.antiDrawUsed={};
 if(!S.h.length||!S.a.length)return end();render();flyDuelCards(travelSnap,win);setTimeout(()=>animatePossession(previousBall,nextBall),780);showEvent('RÉSULTAT',`${win==='h'?'Tu gagnes':'IA gagne'} le Faceoff · prochaine balle : ${S.ball==='h'?'toi':'IA'}.`);if(S.ball==='a')setTimeout(aiAtk,PACE.afterResult)
}
function endGameBreakdown(o){
 let w=winz(o),l=losez(o),b=bench(o),out=[];
 for(let c of b.filter(x=>!x.down)){
  if(S.cancelEndGame?.[c.uid])continue;
  let pts=0,reason='';
  if(c.id===1){pts=b.filter(x=>!x.down&&x.timing==='ONGOING').length;reason=`${pts} carte${pts>1?'s':''} Permanent sur le Bench`}
  if(c.id===10){pts=b.filter(x=>!x.down&&dyn(x,o,'').p>=50).length;reason=`${pts} carte${pts>1?'s':''} à 50 POW ou plus`}
  if(c.id===17&&l.includes(c)){pts=b.filter(x=>/^[AM]/i.test(x.name)).length;reason=`${pts} nom${pts>1?'s':''} commençant par A ou M`}
  if(c.id===24&&!l.some(x=>!x.down&&x.color==='RED')){pts=4;reason='aucune carte Rouge en Losezone'}
  if(c.id===27&&w.includes(c)&&(w[0]===c||w[w.length-1]===c)){pts=2;reason='première ou dernière de la Winzone'}
  if(c.id===31&&l.some(x=>!x.down&&x.color==='BLUE')){pts=2;reason='une carte Bleue en Losezone'}
  if(c.id===40){pts=b.filter(x=>!x.down&&x.stars<=2).length;reason=`${pts} carte${pts>1?'s':''} du Bench à 2★ ou moins`}
  if(c.id===49&&l.includes(c)){let last=l[l.length-1];pts=last?(last.down?1:last.stars):0;reason=last?`${pts}★ sur la dernière carte de Losezone`:'Losezone vide'}
  if(c.id===51&&l.length>=4){pts=4;reason='au moins 4 cartes en Losezone'}
  if(c.id===55){let v=w.filter(x=>!x.down);pts=0;for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++)if(v[i].color!==v[j].color)pts++;reason='paires de couleurs différentes en Winzone'}
  if(c.id===56){let v=w.filter(x=>!x.down);pts=0;for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++)if(v[i].color===v[j].color)pts++;reason='paires de même couleur en Winzone'}
  if(c.id===63){pts=new Set(w.filter(x=>!x.down).map(x=>x.stars)).size;reason='valeurs d’étoiles différentes en Winzone'}
  if(c.id===65){let v=w.filter(x=>!x.down),ss=v.map(x=>x.stars);if(v.length&&new Set(ss).size===ss.length){pts=2;reason='toutes les étoiles visibles de Winzone sont différentes'}}
  if(c.id===71){pts=w.filter(x=>!x.down&&dyn(x,o,'').p<50).length;reason='cartes de Winzone sous 50 POW'}
  if(c.id===79&&w.length===l.length){pts=3;reason='Winzone et Losezone de même taille'}
  if(c.id===83){let v=w.filter(x=>!x.down);if(v.length&&new Set(v.map(x=>x.color)).size===1){pts=3;reason='Winzone visible mono-couleur'}}
  if(c.id===84){let v=l.filter(x=>!x.down);if(v.length&&new Set(v.map(x=>x.color)).size===1){pts=3;reason='Losezone visible mono-couleur'}}
  if(c.id===85){let v=b.filter(x=>!x.down);if(v.length&&new Set(v.map(x=>x.color)).size===1){pts=6;reason='Bench visible mono-couleur'}}
  if(pts)out.push({owner:o,type:'endgame',points:pts,label:c.name,reason,uid:c.uid});
 }
 return out
}
async function resolveEndGameManipulations(){S.cancelEndGame={};for(let o of ['a','h']){let hattie=activeOngoing(o,44,'lose');if(hattie){let opts=[...winz(o).slice(-1),...losez(o).slice(-1),...winz(opp(o)).slice(-1),...losez(opp(o)).slice(-1)];let t=await choose(opts,'Hattie Archer : Flip la dernière carte de quelle zone ?',o);if(t){flip(t);lg(`Hattie Archer agit avant le décompte : ${t.name} est Flip.`)}}let akira=bench(o).find(x=>x.id===90&&!x.down);if(akira){let opts=bench(opp(o)).filter(x=>!x.down&&isEndGame(x));let t=await choose(opts,'Akira Bell : End Game adverse à annuler',o);if(t){S.cancelEndGame[t.uid]=true;lg(`Akira Bell annule l’End Game de ${t.name}.`)}}}}
function finalSteps(){
 let out=[];
 out.push(...endGameBreakdown('a'),...endGameBreakdown('h'));
 for(let o of ['a','h']){
  for(let c of winz(o)){let pts=c.down?1:c.stars;if(c.down&&activeOngoing(o,57,'lose'))pts=2;if(!c.down&&c.stars===0&&activeOngoing(o,60,'lose'))pts=2;out.push({owner:o,type:'stars',points:pts,label:c.down?'Carte face cachée':c.name,reason:c.down?`Face cachée en Winzone (${pts}★)`: `${pts} étoile${pts>1?'s':''} en Winzone`,uid:c.uid})}let theo=activeOngoing(o,75,'lose');if(theo&&losez(o)[0]){let z=losez(o)[0],pts=z.down?1:z.stars;if(pts)out.push({owner:o,type:'endgame',points:pts,label:'Theo Quinn',reason:'étoiles de la première Losezone',uid:theo.uid})}
 }
 out.push({owner:S.ball,type:'ball',points:2,label:'BALLON',reason:'Possession finale',uid:null});
 return out.filter(x=>x.points>0)
}
function pulseScoring(uid){if(!uid)return;document.querySelectorAll(`[data-u="${uid}"]`).forEach(el=>{el.classList.add('scoringPulse');setTimeout(()=>el.classList.remove('scoringPulse'),850)})}
function scoringMessage(st){
 let who=st.owner==='h'?'TOI':'RIVAL';
 if(st.type==='stars')return [`${who} · WINZONE`,`${st.label}  +${st.points}`];
 if(st.type==='endgame')return [`${st.label} · END GAME`,`${who} +${st.points} · ${st.reason}`];
 return ['BALLON FINAL',`${who} +2`]
}
function runFinalStep(){
 if(S.phase!=='scoring')return;
 let i=S.finalFlow.index,steps=S.finalFlow.steps;
 if(i>=steps.length){
  S.phase='end';S.finalFlow.done=true;recordMatch();lg(`Fin : ${S.hs}–${S.as}`);render();showEvent('FIN DE PARTIE',`${S.hs>S.as?'VICTOIRE':S.hs<S.as?'DÉFAITE':'ÉGALITÉ'} · ${S.hs} – ${S.as}`);return
 }
 let st=steps[i];S.finalFlow.index++;
 if(st.owner==='h')S.hs+=st.points;else S.as+=st.points;
 S.finalFlow.applied.push(st);lg(`${st.label} : ${ownerName(st.owner)} +${st.points}.`);render();pulseScoring(st.uid);
 let [t,x]=scoringMessage(st);showEvent(t,x);
 S.finalTimer=setTimeout(runFinalStep,1050)
}
async function end(){
 if(S.phase==='end'||S.phase==='scoring')return;
 await resolveEndGameManipulations();S.phase='scoring';S.finalFlow={steps:finalSteps(),index:0,applied:[],done:false};render();showEvent('FIN DU JEU','Décompte final…');S.finalTimer=setTimeout(runFinalStep,1200)
}
function skipFinal(){if(S.phase!=='scoring')return;clearTimeout(S.finalTimer);while(S.finalFlow.index<S.finalFlow.steps.length){let st=S.finalFlow.steps[S.finalFlow.index++];if(st.owner==='h')S.hs+=st.points;else S.as+=st.points;S.finalFlow.applied.push(st)}S.phase='end';S.finalFlow.done=true;recordMatch();render();showEvent('FIN DE PARTIE',`${S.hs>S.as?'VICTOIRE':S.hs<S.as?'DÉFAITE':'ÉGALITÉ'} · ${S.hs} – ${S.as}`)}
function finalPanel(){
 if(!S.finalFlow)return'';
 if(S.phase==='scoring')return `<div class=finalStatus><b>DÉCOMPTE FINAL</b><span>${S.finalFlow.index}/${S.finalFlow.steps.length}</span><button class=miniBtn id=skipFinal>Passer</button></div>`;
 if(S.phase!=='end')return'';
 let rows=S.finalFlow.applied.map(x=>`<div class=scoreDetailRow><span>${x.owner==='h'?'TOI':'RIVAL'} · ${x.label}</span><b>+${x.points}</b></div>`).join('');
 return `<div class=finalResult><div class=finalResultHead><small>FIN DE PARTIE</small><strong>${S.hs>S.as?'VICTOIRE':S.hs<S.as?'DÉFAITE':'ÉGALITÉ'} · ${S.hs} – ${S.as}</strong></div><details><summary>Voir le détail du score</summary><div class=scoreDetails>${rows}</div></details><button class=miniBtn id=endNew>${S.leagueActive?'RETOUR LEAGUE':'Nouvelle partie'}</button></div>`
}
function faceoffDemandBanner(){
 if(!S.af||S.hf||S.ball!=='a')return '';
 let st=dyn(S.af,'a','atk');
 if(!st.w||!S.af.chosenColor)return '';
 let c=S.af.chosenColor,fr={RED:'ROUGE',BLUE:'BLEU',GREEN:'VERT'}[c]||c;
 return `<div class=faceoffDemand data-color="${c}"><small>COULEUR DEMANDÉE</small><strong>${fr}</strong></div>`
}
// v1.41 — LEAGUE FOUNDATION
const LEAGUE_TEAMS=[
 {id:'grizzlies',name:'GENEVA WHOOPERS',mark:'G',motto:'BUILT FOR THE CLUTCH'},
 {id:'vipers',name:'NEON VIPERS',mark:'V',motto:'STRIKE FAST'},
 {id:'jackals',name:'IRON JACKALS',mark:'J',motto:'NO EASY POINTS'},
 {id:'comets',name:'NOVA COMETS',mark:'C',motto:'PLAY BEYOND'},
 {id:'aces',name:'ROYAL ACES',mark:'A',motto:'OWN THE COURT'},
 {id:'ravens',name:'STREET RAVENS',mark:'R',motto:'TAKE WHAT IS YOURS'}
];
function lSh(a){return sh([...a])}
function leagueTags(c){let t=[c.color],x=(c.text||'').toUpperCase();if(x.includes('FLIP')||x.includes('FACE CACH'))t.push('FLIP');if(x.includes('DRAW')||x.includes('PIOCH'))t.push('DRAW');if(x.includes('LOSEZONE'))t.push('LOSEZONE');if(x.includes('WINZONE'))t.push('WINZONE');if(x.includes('SPD'))t.push('SPD');if(x.includes('POW'))t.push('POW');if(x.includes('WILD'))t.push('WILD');if(x.includes('PERMANENT')||c.timing==='ONGOING')t.push('PERMANENT');if(String(c.timing).includes('END'))t.push('ENDGAME');if(c.stars===0)t.push('ZERO');if(c.pow<50)t.push('LOWPOW');return [...new Set(t)]}
function leagueArchetypeCounts(cards=[]){let out={};for(let c of cards)for(let t of leagueTags(c))out[t]=(out[t]||0)+1;return out}
function leagueFit(c,roster=[]){
 let tags=leagueTags(c),rc=leagueArchetypeCounts(roster),score=c.stars*1.35+c.pow/60+c.spd/75+(c.color==='WILD'?1.25:0);
 // League AI v2: compounding value. Once a roster starts an engine, complementary pieces become increasingly valuable.
 for(let tag of tags){let n=rc[tag]||0;score+=n*.9+Math.max(0,n-1)*.42}
 if(tags.includes('FLIP'))score+=(rc.FLIP||0)*1.15;
 if(tags.includes('DRAW'))score+=(rc.DRAW||0)*.9;
 if(tags.includes('ZERO'))score+=(rc.ZERO||0)*1.05;
 if(tags.includes('SPD'))score+=(rc.SPD||0)*.55;
 if(tags.includes('WINZONE'))score+=(rc.WINZONE||0)*.6;
 if(tags.includes('LOSEZONE'))score+=(rc.LOSEZONE||0)*.7;
 // Build-around/custom engines deserve extra recruitment gravity when their support already exists.
 if([57,58,59,62,68,72,73,75,76,80,81,82,83,84,85].includes(c.id))score+=1.4;
 return score
}
function aiPick(pool,n,roster=[]){
 let chosen=[],base=[...roster],left=[...pool];
 while(chosen.length<n&&left.length){let ranked=left.map(c=>({c,v:leagueFit(c,base)})).sort((a,b)=>b.v-a.v),top=ranked[0].v,near=ranked.filter(x=>top-x.v<.65).slice(0,2),pick=near.length>1&&Math.random()<.12?near[1].c:ranked[0].c;chosen.push(pick);base.push(pick);left=left.filter(x=>x!==pick)}
 return chosen
}
function roundRobin(ids){let a=[...ids],rounds=[];for(let r=0;r<a.length-1;r++){let games=[];for(let i=0;i<a.length/2;i++)games.push([a[i],a[a.length-1-i]]);rounds.push(games);a=[a[0],a.at(-1),...a.slice(1,-1)]}return lSh(rounds)}
function leagueTeam(id){return S.league.teams.find(t=>t.id===id)}
function leagueFree(){let used=new Set(S.league.teams.flatMap(t=>t.roster));return ALL.filter(c=>!used.has(c.id))}
function newLeague(mode){let teams=LEAGUE_TEAMS.map((t,i)=>({...t,player:i===0,roster:[],w:0,d:0,l:0,pf:0,pa:0}));S.league={mode,teams,day:0,schedule:roundRobin(teams.map(t=>t.id)),stage:'regular',selected:[],draftRound:0,draftPicks:[],booster:[],boosterSel:[],history:[],difficultyLog:[]};if(mode==='random'){let pool=lSh(ALL);for(let t of lSh(teams))t.roster=pool.splice(0,6).map(c=>c.id);S.phase='leagueHub';render()}else{S.phase='leagueDraft';leagueDraftBooster()}}
function leagueDraftBooster(){let L=S.league,free=leagueFree().filter(c=>!L.draftPicks.includes(c.id));L.booster=lSh(free).slice(0,5).map(c=>c.id);L.boosterSel=[];render()}
function leagueToggleDraft(id){let a=S.league.boosterSel,i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<2)a.push(id);render()}
function leagueConfirmDraft(){let L=S.league;if(L.boosterSel.length!==2)return;L.draftPicks.push(...L.boosterSel);leagueTeam('grizzlies').roster=[...L.draftPicks];L.draftRound++;if(L.draftRound<3){leagueDraftBooster();return}let free=lSh(leagueFree());for(let t of lSh(L.teams.filter(x=>!x.player))){for(let r=0;r<3;r++){let pack=free.splice(0,5),p=aiPick(pack,2,t.roster);t.roster.push(...p.map(c=>c.id));free.push(...pack.filter(c=>!p.includes(c)));free=lSh(free)}}L.stage='regular';S.phase='leagueHub';render()}
function leaguePoints(t){return (t.w||0)*3+(t.d||0)}
function leagueStandings(){let H=S.league.history||[];return [...S.league.teams].sort((a,b)=>leaguePoints(b)-leaguePoints(a)||((b.pf-b.pa)-(a.pf-a.pa))||(()=>{let r=H.find(x=>(x.a===a.id&&x.b===b.id)||(x.a===b.id&&x.b===a.id));if(!r)return 0;let ad=r.a===a.id?r.sa:r.sb,bd=r.a===b.id?r.sa:r.sb;return bd-ad})())}
function openLeague(){S.phase='leagueStart';render()}
function leagueRoster(id){S.league.viewTeam=id;S.phase='leagueRoster';render()}
function leagueBack(){S.phase='leagueHub';render()}
function leagueCurrentOpponent(){let games=S.league.schedule[S.league.day]||[],g=games.find(x=>x.includes('grizzlies'));return g?g.find(x=>x!=='grizzlies'):null}
function leaguePrep(){S.league.selected=[];S.phase='leaguePrep';render()}
function leagueToggleStarter(id){let a=S.league.selected,i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<6)a.push(id);render()}
function leagueReuseLastLineup(){let L=S.league,ro=new Set(leagueTeam('grizzlies').roster);if(L.lastLineup?.length===6&&L.lastLineup.every(id=>ro.has(id)))L.selected=[...L.lastLineup];render()}

// v1.42 — LEAGUE LOOP: real playable regular season, AI fixtures, standings and recruiting.
function leagueComboScore(ids,enemyRoster=[]){
 let cs=ids.map(id=>ALL.find(c=>c.id===id)).filter(Boolean),score=cs.reduce((n,c)=>n+leagueFit(c,cs.filter(x=>x!==c)),0);
 let tags=cs.flatMap(leagueTags),count=x=>tags.filter(t=>t===x).length;
 for(let k of ['FLIP','DRAW','SPD','PERMANENT','ENDGAME','ZERO','WINZONE','LOSEZONE']){let n=count(k);if(n>1)score+=n*(n-1)*.65}
 if(enemyRoster.length){
  let ec=enemyRoster.map(id=>ALL.find(c=>c.id===id)).filter(Boolean),et=ec.flatMap(leagueTags),cnt=x=>et.filter(t=>t===x).length;
  // Counter only information the AI is legitimately allowed to know: the opponent's full roster, never the hidden six.
  if(cnt('PERMANENT')>=3)score+=cs.filter(c=>[86,87,88,89,90,92].includes(c.id)).length*(3+cnt('PERMANENT')*.35);
  if(cnt('WILD')>=2)score+=cs.filter(c=>c.id===93).length*(4+cnt('WILD')*.5);
  if(cnt('DRAW')>=3)score+=cs.filter(c=>c.id===91).length*5;
  if(cnt('FLIP')>=3)score+=cs.filter(c=>[94,95,96,97].includes(c.id)).length*3.5;
  if(cnt('WINZONE')>=4)score+=cs.filter(c=>[86,87,88].includes(c.id)).length*1.8;
 }
 return score;
}
function chooseLeagueSix(team,enemyRoster=[]){
 let r=team.roster;if(r.length<=6)return [...r];let best=[],bestScore=-1e9,n=r.length;
 function rec(start,a){if(a.length===6){let z=leagueComboScore(a,enemyRoster)+Math.random()*.35;if(z>bestScore){bestScore=z;best=[...a]}return}for(let i=start;i<=n-(6-a.length);i++){a.push(r[i]);rec(i+1,a);a.pop()}}
 rec(0,[]);return best;
}
function leagueSimMatch(a,b){
 // Fast full-roster AI fixture simulation: six selected athletes resolve six Face-Offs, then stars + final ball.
 let A=chooseLeagueSix(a,b.roster).map(id=>ALL.find(c=>c.id===id)),B=chooseLeagueSix(b,a.roster).map(id=>ALL.find(c=>c.id===id));
 let ball=Math.random()<.5?'A':'B',sa=0,sb=0,wa=[],wb=[];
 for(let i=0;i<6;i++){let atk=ball==='A'?A:B,def=ball==='A'?B:A,ac=atk[i],dc=def[i];if(!ac||!dc)break;let wildA=ac.color==='WILD',wildD=dc.color==='WILD',match=wildD||wildA||dc.color===ac.color;let ap=ac.pow+(Math.random()*18-9),dp=dc.pow+(Math.random()*18-9);let awin=!match?true:ap>=dp;if(ball==='A'){(awin?wa:wb).push(awin?ac:dc);(awin?wb:wa).push(awin?dc:ac)}else{(awin?wb:wa).push(awin?ac:dc);(awin?wa:wb).push(awin?dc:ac)}let asp=ac.spd+Math.random()*12,dsp=dc.spd+Math.random()*12;if(dsp>asp)ball=ball==='A'?'B':'A'}
 sa+=wa.reduce((n,c)=>n+c.stars,0)+(ball==='A'?2:0);sb+=wb.reduce((n,c)=>n+c.stars,0)+(ball==='B'?2:0);
 // v1.43: no artificial synergy points. Synergy decides lineups; the scoreboard only reflects cards actually won + final ball.
 return {a:a.id,b:b.id,sa,sb};
}
function leagueApplyResult(r){let a=leagueTeam(r.a),b=leagueTeam(r.b);S.league.history=S.league.history||[];S.league.history.push({...r,day:S.league.day});a.pf+=r.sa;a.pa+=r.sb;b.pf+=r.sb;b.pa+=r.sa;if(r.sa>r.sb){a.w++;b.l++}else if(r.sb>r.sa){b.w++;a.l++}else{a.d=(a.d||0)+1;b.d=(b.d||0)+1}}
function launchLeagueMatch(){
 let L=S.league;if(L.selected.length!==6)return;L.lastLineup=[...L.selected];let opp=leagueTeam(leagueCurrentOpponent()),enemy=chooseLeagueSix(opp,leagueTeam('grizzlies').roster),used=new Set([...L.selected,...enemy]);
 L.current={day:L.day,opp:opp.id,h:[...L.selected],a:enemy,recorded:false};
 Object.assign(S,{phase:'play',h:L.selected.map(id=>cp(ALL.find(c=>c.id===id))),a:enemy.map(id=>cp(ALL.find(c=>c.id===id))),hw:[],hl:[],aw:[],al:[],hf:null,af:null,disc:[],visualQueue:[],ball:Math.random()<.5?'h':'a',hs:0,as:0,log:[],round:0,sel:new Set(),leagueActive:true});
 S.deck=sh(ALL.filter(c=>!used.has(c.id)).map(c=>cp(c)));beginMatchStats('league');lg(`LEAGUE J${L.day+1} : Geneva Whoopers vs ${opp.name}.`);render();if(S.ball==='a')setTimeout(aiAtk,350)
}
function leagueFinishPlayedMatch(){
 let L=S.league,c=L.current;if(!c||c.recorded)return;c.recorded=true;let r={a:'grizzlies',b:c.opp,sa:S.hs,sb:S.as};leagueApplyResult(r);L.difficultyLog=L.difficultyLog||[];L.difficultyLog.push({stage:'regular',day:L.day+1,opp:c.opp,result:S.hs>S.as?'W':S.hs<S.as?'L':'D',for:S.hs,against:S.as,diff:S.hs-S.as,faceoffs:S.matchStats?.faceoffs||0,h:[...c.h],a:[...c.a]});L.dayResults=[r];
 for(let g of L.schedule[L.day])if(!g.includes('grizzlies')){let rr=leagueSimMatch(leagueTeam(g[0]),leagueTeam(g[1]));leagueApplyResult(rr);L.dayResults.push(rr)}
 S.leagueActive=false;S.phase='leagueResults';render();
}
function renderLeagueResults(){let L=S.league;app.innerHTML=`<div class="leaguePage leagueHub"><div class=leagueTop><div><div class=logo>ODDBALL</div><div class=leaguePill>JOURNÉE ${L.day+1} TERMINÉE</div></div></div><div class=leagueDash><section class=leagueClub><div class=clubMark>✓</div><div><small>RÉSULTATS</small><h1>JOURNÉE ${L.day+1}</h1><p>Les trois matchs sont terminés.</p></div></section><section class=leagueFixtures><div class=sectionTitle>SCORES</div>${L.dayResults.map(r=>`<div class=leagueResultRow><span class=leagueResultTeam>${leagueTeam(r.a).name}</span><div class=leagueResultScore><b>${r.sa}</b><i>—</i><b>${r.sb}</b></div><span class="leagueResultTeam away">${leagueTeam(r.b).name}</span></div>`).join('')}</section><section class=leagueStand><div class=sectionTitle>CLASSEMENT</div>${leagueStandings().map((t,i)=>`<div class="standRow ${t.player?'mine':''}"><b>${i+1}</b><span>${t.name}</span><em>${t.w}V ${(t.d||0)}N ${t.l}D · ${leaguePoints(t)} PTS</em><strong>${t.pf-t.pa>=0?'+':''}${t.pf-t.pa}</strong></div>`).join('')}</section><section class=nextMatch><small>ÉTAPE SUIVANTE</small><h2>RECRUTEMENT</h2><p>Chaque franchise ouvre 5 cartes et en conserve 2.</p><button class=menuPrimary id=leagueRecruitGo>LANCER LE RECRUTEMENT</button></section></div></div>`;document.querySelector('#leagueRecruitGo').onclick=leagueBeginRecruitment}
function leagueBeginRecruitment(){let L=S.league;L.recruitOrder=lSh(L.teams.map(t=>t.id));L.recruitIndex=0;L.recruitLog=[];leagueRecruitNext()}
function leagueRecruitNext(){let L=S.league;if(L.recruitIndex>=L.recruitOrder.length){L.day++;L.selected=[];L.booster=[];L.boosterSel=[];if(L.day>=5){L.stage='playoffsReady';S.phase='leagueSeasonEnd';render()}else{S.phase='leagueHub';render()}return}let id=L.recruitOrder[L.recruitIndex],t=leagueTeam(id),pack=lSh(leagueFree()).slice(0,5);if(t.player){L.booster=pack.map(c=>c.id);L.boosterSel=[];L.packOpened=false;L.packReveal=0;L.rosterCollapsed=false;S.phase='leagueRecruit';render();return}let picks=aiPick(pack,2,t.roster);t.roster.push(...picks.map(c=>c.id));L.recruitLog.push({team:id,picks:picks.map(c=>c.id)});L.recruitIndex++;leagueRecruitNext()}
function leagueToggleRecruit(id){let a=S.league.boosterSel,i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<2)a.push(id);render()}
function leagueConfirmRecruit(){let L=S.league;if(L.boosterSel.length!==2)return;leagueTeam('grizzlies').roster.push(...L.boosterSel);L.recruitLog.push({team:'grizzlies',picks:[...L.boosterSel]});L.recruitIndex++;leagueRecruitNext()}
function renderLeagueRecruit(){
 let L=S.league,me=leagueTeam('grizzlies');
 if(!L.packOpened){
  app.innerHTML=`<div class="leaguePage packStage"><div class=leagueTop><div class=logo>ODDBALL</div><div class=leaguePill>RECRUTEMENT · J${L.day+1}</div></div><div class=packScene><small>RECRUITMENT DROP</small><h1>NOUVEAUX ATHLÈTES DISPONIBLES</h1><p>5 cartes. Tu pourras en signer 2.</p><button class=recruitPack id=openPack><span>ODDBALL</span><b>LEAGUE</b><i>RECRUITMENT PACK</i><em>5 ATHLÈTES</em></button><div class=packHint>CLIQUE SUR LE BOOSTER POUR L'OUVRIR</div></div></div>`;
  document.querySelector('#openPack').onclick=()=>{L.packOpened=true;L.packReveal=0;render();setTimeout(revealRecruitCard,180)};return
 }
 let reveal=L.packReveal??5;
 app.innerHTML=`<div class="leaguePage boosterPage"><div class=leagueTop><div><div class=logo>ODDBALL</div><div class=leaguePill>RECRUTEMENT · J${L.day+1}</div></div><div class=recruitCounter><b>${L.boosterSel.length}</b><span>/ 2 SIGNÉS</span></div></div><div class=boosterIntro><small>RECRUITMENT PACK OUVERT</small><h2>Construis ton roster</h2><p>Analyse tes synergies et choisis les 2 athlètes qui rejoindront les Geneva Whoopers.</p></div><div class="boosterCards revealPack">${L.booster.map((id,i)=>{let c=cp(ALL.find(x=>x.id===id)),shown=i<reveal;return `<div class="boosterPick ${L.boosterSel.includes(id)?'picked':''} ${shown?'revealed':'unrevealed'}" data-id=${id}>${shown?card(c):`<div class=packCardBack><b>ODDBALL</b><span>?</span></div>`}<span>${shown?(L.boosterSel.includes(id)?'✓ SIGNÉ':'SIGNER'):'RÉVÉLATION...'}</span></div>`}).join('')}</div><div class=boosterBar><div><small>RECRUES</small><b>${L.boosterSel.length}/2</b></div><button class=menuPrimary id=recruitConfirm ${L.boosterSel.length===2&&reveal>=5?'':'disabled'}>CONFIRMER LES 2 RECRUES →</button></div><section class=recruitRoster><div class=recruitRosterHead><div><div class=sectionTitle>TON ROSTER ACTUEL · ${me.roster.length} ATHLÈTES</div><p>Compare les propositions avec tes moteurs et tes cartes de contre.</p></div><button class=btn id=toggleRoster>${L.rosterCollapsed?'AFFICHER LE ROSTER':'MASQUER LE ROSTER'}</button></div>${L.rosterCollapsed?'':`<div class=leagueCardGrid>${me.roster.map(id=>card(cp(ALL.find(c=>c.id===id)))).join('')}</div>`}</section></div>`;
 if(reveal<5)setTimeout(revealRecruitCard,320);
 document.querySelectorAll('.boosterPick.revealed').forEach(e=>e.onclick=()=>leagueToggleRecruit(+e.dataset.id));
 document.querySelector('#recruitConfirm').onclick=leagueConfirmRecruit;
 document.querySelector('#toggleRoster').onclick=()=>{L.rosterCollapsed=!L.rosterCollapsed;render()}
}
function revealRecruitCard(){let L=S.league;if(S.phase!=='leagueRecruit'||!L?.packOpened)return;L.packReveal=Math.min(5,(L.packReveal||0)+1);render()}

function leagueTieBreakerSim(a,b){
 // Sudden-death Face-Off: fresh random athletes from the common pool; POW decides after color compatibility.
 let used=new Set([...(a.roster||[]),...(b.roster||[])]),pool=ALL.filter(c=>!used.has(c.id));
 if(pool.length<2)pool=[...ALL];
 for(let tries=0;tries<50;tries++){
  let x=pool[Math.floor(Math.random()*pool.length)],y=pool[Math.floor(Math.random()*pool.length)];
  if(x.id===y.id)continue;
  let match=x.color==='WILD'||y.color==='WILD'||x.color===y.color;
  if(!match)return a.id;
  if(x.pow!==y.pow)return x.pow>y.pow?a.id:b.id;
 }
 return Math.random()<.5?a.id:b.id;
}
function leaguePlayoffWinner(r,a,b){
 if(r.sa>r.sb)return a.id;if(r.sb>r.sa)return b.id;return leagueTieBreakerSim(a,b);
}
function initLeaguePlayoffs(){
 let L=S.league,st=leagueStandings(),top=st.slice(0,4);
 L.playoffs={round:'semi',semis:[
  {a:top[0].id,b:top[3].id,wa:0,wb:0,games:[]},
  {a:top[1].id,b:top[2].id,wa:0,wb:0,games:[]}
 ],final:null,champion:null,playerAlive:top.some(t=>t.player)};
 L.stage='playoffs';S.phase='leaguePlayoffs';render();
}
function playoffSeriesWithPlayer(){
 let P=S.league.playoffs;if(!P)return null;
 if(P.round==='semi')return P.semis.find(x=>x.a==='grizzlies'||x.b==='grizzlies')||null;
 if(P.round==='final'&&P.final&&(P.final.a==='grizzlies'||P.final.b==='grizzlies'))return P.final;
 return null;
}
function playoffNeed(s){return s.round==='final'?3:2}
function playoffSeriesDone(s){return s.wa>=playoffNeed(s)||s.wb>=playoffNeed(s)}
function playoffSeriesWinner(s){return s.wa>s.wb?s.a:s.b}
function simulatePlayoffGame(s){
 let a=leagueTeam(s.a),b=leagueTeam(s.b),r=leagueSimMatch(a,b),w=leaguePlayoffWinner(r,a,b);
 r.tb=r.sa===r.sb;r.winner=w;s.games.push(r);if(w===s.a)s.wa++;else s.wb++;return r;
}
function simulateSeriesToEnd(s){while(!playoffSeriesDone(s))simulatePlayoffGame(s)}
function advancePlayoffs(){
 let L=S.league,P=L.playoffs;
 if(P.round==='semi'){
  // Complete any AI-only semifinal.
  P.semis.forEach(s=>{if(!playoffSeriesDone(s)&&s.a!=='grizzlies'&&s.b!=='grizzlies')simulateSeriesToEnd(s)});
  if(P.semis.every(playoffSeriesDone)){
   let w1=playoffSeriesWinner(P.semis[0]),w2=playoffSeriesWinner(P.semis[1]);
   P.final={round:'final',a:w1,b:w2,wa:0,wb:0,games:[]};P.round='final';
   if(w1!=='grizzlies'&&w2!=='grizzlies'){simulateSeriesToEnd(P.final);P.champion=playoffSeriesWinner(P.final);P.round='done'}
  }
 }else if(P.round==='final'&&P.final&&playoffSeriesDone(P.final)){P.champion=playoffSeriesWinner(P.final);P.round='done'}
 if(P.round==='done'){S.phase='leagueChampion';render()}else{L.selected=[];S.phase='leaguePlayoffs';render()}
}
function leaguePlayoffPrep(){
 let s=playoffSeriesWithPlayer();if(!s){advancePlayoffs();return}
 S.league.selected=[];S.phase='leaguePlayoffPrep';render();
}
function launchLeaguePlayoffMatch(){
 let L=S.league,s=playoffSeriesWithPlayer();if(!s||L.selected.length!==6)return;L.lastLineup=[...L.selected];
 let oppId=s.a==='grizzlies'?s.b:s.a,opp=leagueTeam(oppId),enemy=chooseLeagueSix(opp,leagueTeam('grizzlies').roster),used=new Set([...L.selected,...enemy]);
 L.current={playoff:true,seriesRound:s.round,opp:opp.id,h:[...L.selected],a:enemy,recorded:false};
 Object.assign(S,{phase:'play',h:L.selected.map(id=>cp(ALL.find(c=>c.id===id))),a:enemy.map(id=>cp(ALL.find(c=>c.id===id))),hw:[],hl:[],aw:[],al:[],hf:null,af:null,disc:[],visualQueue:[],ball:Math.random()<.5?'h':'a',hs:0,as:0,log:[],round:0,sel:new Set(),leagueActive:true});
 S.deck=sh(ALL.filter(c=>!used.has(c.id)).map(c=>cp(c)));beginMatchStats('league-playoff');lg(`PLAYOFFS : Geneva Whoopers vs ${opp.name}.`);render();if(S.ball==='a')setTimeout(aiAtk,350)
}
function leagueFinishPlayoffMatch(){
 let L=S.league,c=L.current;if(!c||c.recorded)return;c.recorded=true;let s=playoffSeriesWithPlayer(),opp=leagueTeam(c.opp);
 let r={a:'grizzlies',b:c.opp,sa:S.hs,sb:S.as},winner;
 if(r.sa===r.sb){winner=leagueTieBreakerSim(leagueTeam('grizzlies'),opp);r.tb=true}else winner=r.sa>r.sb?'grizzlies':c.opp;
 r.winner=winner;s.games.push(r);L.difficultyLog=L.difficultyLog||[];L.difficultyLog.push({stage:s.round,game:s.games.length,opp:c.opp,result:winner==='grizzlies'?'W':'L',for:S.hs,against:S.as,diff:S.hs-S.as,faceoffs:S.matchStats?.faceoffs||0,h:[...c.h],a:[...c.a]});if(winner===s.a)s.wa++;else s.wb++;
 S.leagueActive=false;S.phase='leaguePlayoffResult';render();
}
function renderLeaguePlayoffs(){
 let P=S.league.playoffs,s=playoffSeriesWithPlayer();
 if(!s){advancePlayoffs();return}
 let opp=leagueTeam(s.a==='grizzlies'?s.b:s.a),need=playoffNeed(s);
 app.innerHTML=`<div class="leaguePage leagueHub"><div class=leagueTop><div class=logo>ODDBALL</div><div class=leaguePill>${s.round==='semi'?'DEMI-FINALE · BO3':'FINALE · BO5'}</div></div><div class=playoffBracket><div class=playoffSeries><div class=sectionTitle>${s.round==='semi'?'SÉRIE EN COURS':'FINALE'}</div><b><span>${leagueTeam(s.a).name}</span><span class=seriesScore>${s.wa}</span></b><b><span>${leagueTeam(s.b).name}</span><span class=seriesScore>${s.wb}</span></b></div><div class=playoffArrow>▶</div><div class=playoffSeries><div class=sectionTitle>FORMAT</div><b><span>${s.round==='semi'?'BO3':'BO5'}</span><span class=seriesScore>1ER À ${need}</span></b><b><span>ROSTER</span><span>16 ATHLÈTES</span></b></div></div><div class=leagueDash><section class=leagueClub><div class=clubMark>🔥</div><div><small>PLAYOFFS</small><h1>${leagueTeam(s.a).name} ${s.wa} — ${s.wb} ${leagueTeam(s.b).name}</h1><p>Premier à ${need} victoires. Tu peux modifier tes 6 titulaires avant chaque manche.</p></div></section><section class=nextMatch><small>PROCHAINE MANCHE</small><h2>${opp.name}</h2><p>Tu connais son roster complet, mais pas les 6 qu'il alignera.</p><div class=playoffActions><button class=menuPrimary id=poPrep>PRÉPARER MES 6</button><button class=btn id=poRoster>VOIR LE ROSTER ADVERSE</button></div></section></div></div>`;
 document.querySelector('#poPrep').onclick=leaguePlayoffPrep;document.querySelector('#poRoster').onclick=()=>{S.league.viewTeam=opp.id;S.league.rosterReturn='leaguePlayoffs';S.phase='leagueRoster';render()};
}
function renderLeaguePlayoffPrep(){
 let L=S.league,s=playoffSeriesWithPlayer(),opp=leagueTeam(s.a==='grizzlies'?s.b:s.a),me=leagueTeam('grizzlies'),canReuse=L.lastLineup?.length===6;
 app.innerHTML=`<div class="leaguePage prepPage"><div class=leagueTop><div><div class=logo>ODDBALL</div><div class=leaguePill>${s.round==='semi'?'DEMI-FINALE BO3':'FINALE BO5'} · ${s.wa}-${s.wb}</div></div><button class=btn id=poBack>RETOUR</button></div><div class=prepHead><div><small>ADVERSAIRE : ${opp.name}</small><h1>CHOISIS TES 6</h1><p>${L.selected.length}/6 titulaires · le rival choisit ses 6 sans voir ta sélection.</p></div><div class=starterCount>${L.selected.length}<span>/6</span></div></div><div class=prepTools><button class=btn id=poOppRoster>VOIR LE ROSTER ADVERSE</button><button class=btn id=poReuse ${canReuse?'':'disabled'}>REPRENDRE LES 6 DU MATCH PRÉCÉDENT</button></div><div class=leagueCardGrid>${me.roster.map(id=>`<div class="starterCard ${L.selected.includes(id)?'picked':''}" data-id=${id}>${card(cp(ALL.find(c=>c.id===id)))}<span>${L.selected.includes(id)?'TITULAIRE':'SÉLECTIONNER'}</span></div>`).join('')}</div><div class=boosterBar><button class=menuPrimary id=poLaunch ${L.selected.length===6?'':'disabled'}>LANCER LA MANCHE</button></div></div>`;
 document.querySelectorAll('.starterCard').forEach(e=>e.onclick=()=>leagueToggleStarter(+e.dataset.id));document.querySelector('#poBack').onclick=()=>{S.phase='leaguePlayoffs';render()};document.querySelector('#poLaunch').onclick=launchLeaguePlayoffMatch;document.querySelector('#poReuse').onclick=leagueReuseLastLineup;document.querySelector('#poOppRoster').onclick=()=>{L.viewTeam=opp.id;L.rosterReturn='leaguePlayoffPrep';S.phase='leagueRoster';render()};
}
function renderLeaguePlayoffResult(){
 let s=playoffSeriesWithPlayer(),r=s.games.at(-1),won=r.winner==='grizzlies',done=playoffSeriesDone(s);
 app.innerHTML=`<div class="leaguePage leagueHub"><div class=leagueTop><div class=logo>ODDBALL</div><div class=leaguePill>${s.round==='semi'?'DEMI-FINALE':'FINALE'}</div></div><div class=leagueDash><section class=leagueClub><div class=clubMark>${won?'✓':'✕'}</div><div><small>${r.tb?'ÉGALITÉ · FACE-OFF DÉCISIF':'MANCHE TERMINÉE'}</small><h1>${r.sa} — ${r.sb}</h1><p>${won?'MANCHE GAGNÉE':'MANCHE PERDUE'} · Série ${s.wa}-${s.wb}</p></div></section><section class=nextMatch><h2>${done?'SÉRIE TERMINÉE':'MANCHE SUIVANTE'}</h2><p>${done?(won?'Qualification acquise.':'La League continue et les autres rencontres seront simulées.'):'Tu peux changer librement tes 6 titulaires.'}</p><button class=menuPrimary id=poContinue>${done?'CONTINUER':'ADAPTER MES 6'}</button></section></div></div>`;
 document.querySelector('#poContinue').onclick=()=>{if(done){if(!won){ // player eliminated: finish remaining bracket
   if(s.round==='semi'){let P=S.league.playoffs;P.semis.forEach(x=>{if(!playoffSeriesDone(x))simulateSeriesToEnd(x)});let w1=playoffSeriesWinner(P.semis[0]),w2=playoffSeriesWinner(P.semis[1]);P.final={round:'final',a:w1,b:w2,wa:0,wb:0,games:[]};simulateSeriesToEnd(P.final);P.champion=playoffSeriesWinner(P.final);P.round='done'}else{S.league.playoffs.champion=playoffSeriesWinner(s);S.league.playoffs.round='done'}S.phase='leagueChampion';render()}else advancePlayoffs()}else leaguePlayoffPrep()};
}
function renderLeagueChampion(){
 let L=S.league,P=L.playoffs,champ=leagueTeam(P.champion),meWon=P.champion==='grizzlies';
 app.innerHTML=`<div class="leaguePage leagueHub"><div class=leagueTop><div><div class=logo>ODDBALL</div><div class=leaguePill>LEAGUE TERMINÉE</div></div></div><section class=championHero><div class=trophy>🏆</div><small>ODDBALL LEAGUE CHAMPIONS</small><h1>${champ.name}</h1><p>${meWon?'TU REMPORTES LA LEAGUE. Une saison construite match après match, jusqu’au titre.':'La saison est terminée. Le champion a été simulé jusqu’au bout.'}</p></section><div class=leagueDash><section class=leagueStand><div class=sectionTitle>SAISON RÉGULIÈRE</div>${leagueStandings().map((t,i)=>`<div class="standRow ${t.player?'mine':''}"><b>${i+1}</b><span>${t.name}</span><em>${t.w}V ${(t.d||0)}N ${t.l}D · ${leaguePoints(t)} PTS</em><strong>${t.pf-t.pa>=0?'+':''}${t.pf-t.pa}</strong></div>`).join('')}</section><section class=nextMatch><small>ROSTER FINAL</small><h2>${leagueTeam('grizzlies').roster.length} ATHLÈTES</h2><p>${meWon?'LES GRIZZLIES SONT CHAMPIONS.':'SAISON TERMINÉE.'}</p><button class=menuPrimary id=champMenu>RETOUR AU MENU</button></section></div></div>`;
 document.querySelector('#champMenu').onclick=goMenu;
}
function renderLeagueSeasonEnd(){let st=leagueStandings(),qualified=st.slice(0,4).some(t=>t.player);app.innerHTML=`<div class="leaguePage leagueHub"><div class=leagueTop><div class=logo>ODDBALL</div><div class=leaguePill>SAISON RÉGULIÈRE TERMINÉE</div></div><div class=leagueDash><section class=leagueClub><div class=clubMark>🏁</div><div><small>5 JOURNÉES JOUÉES</small><h1>TOP 4 QUALIFIÉ</h1><p>Demi-finales BO3 · Finale BO5 · aucun recrutement.</p></div></section><section class=leagueStand><div class=sectionTitle>CLASSEMENT FINAL</div>${st.map((t,i)=>`<div class="standRow ${t.player?'mine':''}"><b>${i+1}</b><span>${t.name}</span><em>${t.w}V ${(t.d||0)}N ${t.l}D · ${leaguePoints(t)} PTS</em><strong>${t.pf-t.pa>=0?'+':''}${t.pf-t.pa}</strong></div>`).join('')}</section><section class=nextMatch><small>${qualified?'QUALIFIÉ':'ÉLIMINÉ'}</small><h2>${qualified?'PLAYOFFS':'SIMULER LES PLAYOFFS'}</h2><p>Ton roster final contient ${leagueTeam('grizzlies').roster.length} athlètes.</p><button class=menuPrimary id=seasonPlay>${qualified?'LANCER LES PLAYOFFS':'VOIR LE CHAMPION'}</button></section></div></div>`;document.querySelector('#seasonPlay').onclick=()=>{initLeaguePlayoffs();if(!qualified){let P=S.league.playoffs;P.semis.forEach(simulateSeriesToEnd);P.final={round:'final',a:playoffSeriesWinner(P.semis[0]),b:playoffSeriesWinner(P.semis[1]),wa:0,wb:0,games:[]};simulateSeriesToEnd(P.final);P.champion=playoffSeriesWinner(P.final);P.round='done';S.phase='leagueChampion';render()}}}
function renderLeagueStart(){app.innerHTML=`<main class="leaguePage leagueStart"><div class=leagueTop><div class=logo>ODDBALL</div><button class=btn id=leagueExit>MENU</button></div><section class=leagueHero><small>NEW MODE</small><h1>ODDBALL LEAGUE</h1><p>6 franchises · 5 journées · recrutement progressif · Top 4 en playoffs.</p><div class=leagueModeGrid><button class=leagueMode id=leagueRandom><b>RANDOM START</b><span>6 athlètes aléatoires. Construis avec ce que la League te donne.</span></button><button class=leagueMode id=leagueDraft><b>DRAFT START</b><span>3 boosters de 5. Choisis 2 cartes à chaque ouverture.</span></button></div></section></main>`;document.querySelector('#leagueExit').onclick=goMenu;document.querySelector('#leagueRandom').onclick=()=>newLeague('random');document.querySelector('#leagueDraft').onclick=()=>newLeague('draft')}
function renderLeagueDraft(){let L=S.league,picks=L.draftPicks.map(id=>ALL.find(c=>c.id===id));app.innerHTML=`<div class="leaguePage boosterPage"><div class=leagueTop><div class=logo>ODDBALL</div><div class=leaguePill>DRAFT START · BOOSTER ${L.draftRound+1}/3</div></div><div class=boosterIntro><small>CONSTITUE TON ROSTER</small><h2>Choisis 2 athlètes</h2><p>${picks.length}/6 recrutés</p></div><div class=boosterCards>${L.booster.map(id=>{let c=cp(ALL.find(x=>x.id===id));return `<div class="boosterPick ${L.boosterSel.includes(id)?'picked':''}" data-id=${id}>${card(c)}<span>${L.boosterSel.includes(id)?'SÉLECTIONNÉ':'CHOISIR'}</span></div>`}).join('')}</div><div class=boosterBar><b>${L.boosterSel.length}/2</b><button class=menuPrimary id=draftConfirm ${L.boosterSel.length===2?'':'disabled'}>CONFIRMER</button></div></div>`;document.querySelectorAll('.boosterPick').forEach(e=>e.onclick=()=>leagueToggleDraft(+e.dataset.id));document.querySelector('#draftConfirm').onclick=leagueConfirmDraft}

function leagueRank(id){return leagueStandings().findIndex(t=>t.id===id)+1}
function leagueTeamBadge(t,large=false){let icons={grizzlies:'🐻',vipers:'🐍',jackals:'🐺',comets:'☄',aces:'♠',ravens:'◆'};return `<div class="teamBadge ${t.id} ${large?'large':''}"><span>${icons[t.id]||t.mark}</span></div>`}
function leagueNav(active='home'){return `<nav class=leagueNav><div class=leagueBrand><b>ODDBALL</b><i>LEAGUE</i></div><button class="${active==='home'?'active':''}" id=navHome>⌂ <span>ACCUEIL</span></button><button id=navMyRoster>♟ <span>MON ÉQUIPE</span></button><button class="${active==='rosters'?'active':''}" id=navRosters>◈ <span>ROSTERS</span></button><button class="${active==='standings'?'active':''}" id=navStandings>▥ <span>CLASSEMENT</span></button><button class="${active==='calendar'?'active':''}" id=navCalendar>▦ <span>CALENDRIER</span></button><div class=navSpacer></div><button id=navExit>← <span>MENU</span></button></nav>`}
function bindLeagueNav(){
 let q=(x)=>document.querySelector(x);
 if(q('#navHome'))q('#navHome').onclick=()=>{S.phase='leagueHub';render()};
 if(q('#navMyRoster'))q('#navMyRoster').onclick=()=>leagueRoster('grizzlies');
 if(q('#navRosters'))q('#navRosters').onclick=()=>{S.phase='leagueRosters';render()};
 if(q('#navStandings'))q('#navStandings').onclick=()=>{S.phase='leagueStandings';render()};
 if(q('#navCalendar'))q('#navCalendar').onclick=()=>{S.phase='leagueCalendar';render()};
 if(q('#navExit'))q('#navExit').onclick=goMenu;
}
function renderLeagueRosters(){
 let L=S.league;
 app.innerHTML=`<div class=leagueShell>${leagueNav('rosters')}<main class="leagueHome leagueSectionPage"><header class=leagueHomeTop><div><small>SCOUTING</small><h1>ROSTERS <span>DES FRANCHISES</span></h1></div></header><section class=leagueSectionCard><p class=sectionLead>Consulte les effectifs complets. Les 6 titulaires restent cachés jusqu'au match.</p><div class=franchiseGrid>${L.teams.map(t=>`<button class="franchiseTile ${t.id}" data-id=${t.id}>${leagueTeamBadge(t)}<b>${t.name}</b><span>#${leagueRank(t.id)} · ${t.roster.length} ATHLÈTES · ${t.w}V ${t.d||0}N ${t.l}D</span></button>`).join('')}</div></section></main></div>`;
 bindLeagueNav();document.querySelectorAll('.franchiseTile').forEach(b=>b.onclick=()=>leagueRoster(b.dataset.id))
}
function renderLeagueStandings(){
 let st=leagueStandings();
 app.innerHTML=`<div class=leagueShell>${leagueNav('standings')}<main class="leagueHome leagueSectionPage"><header class=leagueHomeTop><div><small>SAISON RÉGULIÈRE</small><h1>CLASSEMENT</h1></div><div class=leagueStatus>TOP 4 · PLAYOFFS</div></header><section class="leagueStand leagueSectionCard fullStandings"><div class=sectionTitle>CLASSEMENT COMPLET</div><div class=standHead><span>#</span><span></span><span>ÉQUIPE</span><span>BILAN</span><span>PM</span><span>PE</span><span>DIFF</span></div>${st.map((t,i)=>`<div class="standRow ${t.player?'mine':''} ${i<4?'playoffSpot':''}"><b>${i+1}</b>${leagueTeamBadge(t)}<span>${t.name}</span><em class=recordLine>${leagueRecordHTML(t)}</em><i>${t.pf}</i><i>${t.pa}</i><strong>${t.pf-t.pa>=0?'+':''}${t.pf-t.pa}</strong></div>`).join('')}<div class=standLegend>PM = points marqués · PE = points encaissés · DIFF = différence de points</div></section></main></div>`;bindLeagueNav()
}
function renderLeagueCalendar(){
 let L=S.league;
 let rounds=L.schedule.map((round,i)=>`<section class="leagueRound ${i===L.day?'current':''}"><header><b>JOURNÉE ${i+1}</b><span>${i<L.day?'TERMINÉE':i===L.day?'EN COURS':'À VENIR'}</span></header>${round.map(pair=>{let a=leagueTeam(pair[0]),b=leagueTeam(pair[1]),r=(L.history||[]).find(x=>x.day===i&&((x.a===a.id&&x.b===b.id)||(x.a===b.id&&x.b===a.id)));let sa=null,sb=null;if(r){sa=r.a===a.id?r.sa:r.sb;sb=r.a===a.id?r.sb:r.sa}let player=a.player||b.player,res='';if(r&&player){let us=a.player?sa:sb,them=a.player?sb:sa;res=us>them?'win':us<them?'loss':'draw'}return `<div class="allMatchRow ${player?'playerMatch':''} ${res}"><span>${leagueTeamBadge(a)}<b>${a.name}</b></span><strong>${r?`${sa}<em>—</em>${sb}`:'—'}</strong><span>${leagueTeamBadge(b)}<b>${b.name}</b></span></div>`}).join('')}</section>`).join('');
 app.innerHTML=`<div class=leagueShell>${leagueNav('calendar')}<main class="leagueHome leagueSectionPage"><header class=leagueHomeTop><div><small>SAISON 01</small><h1>CALENDRIER <span>COMPLET</span></h1></div><div class=leagueStatus>6 FRANCHISES · 5 JOURNÉES</div></header><div class=fullCalendar>${rounds}</div></main></div>`;bindLeagueNav()
}
function seasonCalendarRows(){
 let L=S.league;
 return L.schedule.map((round,i)=>{
  let g=round.find(x=>x.includes('grizzlies')),opp=g&&leagueTeam(g.find(x=>x!=='grizzlies'));
  let r=(L.history||[]).find(x=>x.day===i&&((x.a==='grizzlies'&&x.b===opp?.id)||(x.b==='grizzlies'&&x.a===opp?.id)));
  let score='—',result='';
  if(r){let us=r.a==='grizzlies'?r.sa:r.sb,them=r.a==='grizzlies'?r.sb:r.sa;score=`${us} — ${them}`;result=us>them?'win':us<them?'loss':'draw'}
  return `<div class="calendarRow ${i===L.day?'current':''} ${r?'done':''} ${result}"><b>J${i+1}</b><span>${opp?opp.name:'—'}</span><strong>${score}</strong></div>`
 }).join('')
}
function leagueRecordHTML(t){return `<span class=recStat><b>${t.w}</b>V</span><span class=recStat><b>${t.d||0}</b>N</span><span class=recStat><b>${t.l}</b>D</span><span class=recPts>${leaguePoints(t)} PTS</span>`}
function renderLeagueHub(){let L=S.league,st=leagueStandings(),opp=leagueCurrentOpponent(),ot=opp&&leagueTeam(opp),me=leagueTeam('grizzlies'),rank=leagueRank('grizzlies'),last=[...(L.history||[])].reverse().find(r=>r.a==='grizzlies'||r.b==='grizzlies');app.innerHTML=`<div class="leagueShell">${leagueNav('home')}<main class="leagueHome"><header class=leagueHomeTop><div><small>SAISON 01</small><h1>JOURNÉE ${L.day+1}<span>/ 5</span></h1></div><div class=leagueStatus>${L.mode==='random'?'RANDOM':'DRAFT'} START · ${leagueFree().length} FREE AGENTS</div></header><div class=leagueHomeGrid><section class=franchiseHero>${leagueTeamBadge(me,true)}<div><small>VOTRE FRANCHISE</small><h2>GENEVA<br><strong>WHOOPERS</strong></h2><p>${me.w}V&nbsp;&nbsp;${me.d||0}N&nbsp;&nbsp;${me.l}D · ${leaguePoints(me)} PTS</p></div><b class=heroRank>#${rank}</b></section><section class=matchHero><small>PROCHAIN MATCH · JOURNÉE ${L.day+1}</small><div class=matchTeams><div>${leagueTeamBadge(me,true)}<b>WHOOPERS</b></div><i>VS</i><div>${leagueTeamBadge(ot,true)}<b>${ot.name.replace(/^[^ ]+ /,'')}</b></div></div><button class=leagueCTA id=leaguePrepare>PRÉPARER LE MATCH →</button></section><section class=leagueStand><div class=sectionTitle>CLASSEMENT SAISON RÉGULIÈRE</div>${st.map((t,i)=>`<div class="standRow ${t.player?'mine':''} ${i<4?'playoffSpot':''}"><b>${i+1}</b>${leagueTeamBadge(t)}<span>${t.name}</span><em class=recordLine>${leagueRecordHTML(t)}</em><strong>${t.pf-t.pa>=0?'+':''}${t.pf-t.pa}</strong></div>`).join('')}</section><section class="seasonCalendar"><div class=sectionTitle>CALENDRIER</div>${seasonCalendarRows()}</section><section class=lastResult><div class=sectionTitle>DERNIER MATCH</div>${last?(()=>{let us=last.a==='grizzlies'?last.sa:last.sb,them=last.a==='grizzlies'?last.sb:last.sa,other=leagueTeam(last.a==='grizzlies'?last.b:last.a),res=us>them?'win':us<them?'loss':'draw';return `<div class="lastScore ${res}"><span>GENEVA WHOOPERS</span><b><i>${us}</i><em>—</em><i>${them}</i></b><span>${other.name}</span></div>`})():`<p>La saison vient de commencer.</p>`}</section><section class="leagueFranchiseStrip"><div class=sectionTitle>LES AUTRES FRANCHISES · CLIQUE POUR SCOUTER</div><div class=franchiseGrid>${L.teams.filter(t=>!t.player).map(t=>`<button class="franchiseTile ${t.id}" data-id=${t.id}>${leagueTeamBadge(t)}<b>${t.name}</b><span>#${leagueRank(t.id)} · ${t.w}V ${t.d||0}N ${t.l}D</span></button>`).join('')}</div></section></div></main></div>`;bindLeagueNav();document.querySelector('#leaguePrepare').onclick=leaguePrep;document.querySelectorAll('.franchiseTile').forEach(b=>b.onclick=()=>leagueRoster(b.dataset.id))}
function renderLeagueRoster(){let t=leagueTeam(S.league.viewTeam);app.innerHTML=`<div class="leaguePage rosterPage"><div class=leagueTop><div><div class=logo>ODDBALL</div><div class=leaguePill>${t.name}</div></div><button class=btn id=rosterBack>RETOUR LEAGUE</button></div><div class=rosterTitle><div class=clubMark>${t.mark}</div><div><small>ROSTER COMPLET</small><h1>${t.name}</h1><p>Tu connais le roster, pas les 6 titulaires du prochain match.</p></div></div><div class=leagueCardGrid>${t.roster.map(id=>card(cp(ALL.find(c=>c.id===id)))).join('')}</div></div>`;document.querySelector('#rosterBack').onclick=()=>{let r=S.league.rosterReturn;S.league.rosterReturn=null;if(r){S.phase=r;render()}else leagueBack()}}
function renderLeaguePrep(){let L=S.league,t=leagueTeam('grizzlies'),opp=leagueTeam(leagueCurrentOpponent());app.innerHTML=`<div class="leaguePage prepPage"><div class=leagueTop><div><div class=logo>ODDBALL</div><div class=leaguePill>J${L.day+1} · ${opp.name}</div></div><button class=btn id=prepBack>RETOUR</button></div><div class=prepHead><div><small>COMPOSITION</small><h1>Choisis tes 6 titulaires</h1><p>L'adversaire voit ton roster complet, mais pas cette sélection.</p></div><div class=starterCount>${L.selected.length}<span>/6</span></div></div><div class=leagueCardGrid>${t.roster.map(id=>`<div class="starterCard ${L.selected.includes(id)?'picked':''}" data-id=${id}>${card(cp(ALL.find(c=>c.id===id)))}<span>${L.selected.includes(id)?'TITULAIRE':'SÉLECTIONNER'}</span></div>`).join('')}</div><div class=boosterBar><button class=btn id=leagueReuse ${L.lastLineup?.length===6?'':'disabled'}>REPRENDRE LES 6 DU MATCH PRÉCÉDENT</button><button class=menuPrimary id=leagueLaunch ${L.selected.length===6?'':'disabled'}>LANCER LE MATCH</button></div></div>`;document.querySelector('#prepBack').onclick=leagueBack;document.querySelectorAll('.starterCard').forEach(e=>e.onclick=()=>leagueToggleStarter(+e.dataset.id));document.querySelector('#leagueReuse').onclick=leagueReuseLastLineup;document.querySelector('#leagueLaunch').onclick=launchLeagueMatch}

function renderMenu(){
 app.innerHTML=`<main class=mainMenu><div class=menuGlow></div><section class=menuCard><div class=menuLogo>ODDBALL</div><div class=menuSub>PLAY · ATTACK · SCORE</div><div class=menuVersion>Digital v1.72 · MOBILE UI · 98 cartes</div><div class=menuActions><button class=menuPrimary id=menuLeague>LEAGUE <span class=newBadge>NEW</span></button><button class=menuSecondary id=menuPlay>QUICK MATCH</button><button class=menuSecondary id=menuLab>LABO</button><button class=menuSecondary id=menuCollection>COLLECTION</button><button class="menuSecondary devMenuBtn" id=menuStats>STATS <span>DEV</span></button></div><p class=menuHint>League construit ton roster au fil d’une saison. Quick Match conserve la draft Oddball classique.</p></section></main>`;
 document.querySelector('#menuLeague').onclick=openLeague;document.querySelector('#menuPlay').onclick=startDraft;document.querySelector('#menuLab').onclick=openLab;document.querySelector('#menuCollection').onclick=openCollection;document.querySelector('#menuStats').onclick=openStats;
}
function renderCollection(){
 let q=(S.labSearch||'').toLowerCase();
 let list=ALL.filter(c=>(!q||c.name.toLowerCase().includes(q))&&(S.labColor==='ALL'||c.color===S.labColor)&&(S.labType==='ALL'||abilityCategory(c)===S.labType)&&(S.labSource==='ALL'||(S.labSource==='CUSTOM'?c.custom:!c.custom)));
 const perPage=24,pages=Math.max(1,Math.ceil(list.length/perPage));
 S.collectionPage=Math.max(0,Math.min(S.collectionPage||0,pages-1));
 let shown=list.slice(S.collectionPage*perPage,(S.collectionPage+1)*perPage);
 app.innerHTML=`<div class=collectionPage><div class=collectionSticky><div class=labHeader><div class=logo>ODDBALL</div><h1>COLLECTION · ${list.length}/${ALL.length}</h1><div class=spacer></div><button class=btn id=collectionBack>Retour au menu</button></div><div class=labToolbar><input id=labSearch placeholder="Rechercher une carte…" value="${S.labSearch||''}"><select id=labColor><option value=ALL>Toutes couleurs</option><option>RED</option><option>BLUE</option><option>GREEN</option><option>WILD</option></select><select id=labType><option value=ALL>Tous les effets</option><option>INSTANT</option><option>PERMANENT</option><option>END GAME</option></select><select id=labSource><option value=ALL>Toutes sources</option><option value=RECON>Reconstruites</option><option value=CUSTOM>Custom</option></select></div><div class=collectionPager><button class=btn id=collectionPrev ${S.collectionPage===0?'disabled':''}>‹ Précédent</button><span>Page ${S.collectionPage+1} / ${pages}</span><button class=btn id=collectionNext ${S.collectionPage>=pages-1?'disabled':''}>Suivant ›</button></div></div><div class=labGrid>${shown.map(c=>`<div class=labEntry collectionEntry>${card(cp(c))}</div>`).join('')}</div></div>`;
 document.querySelector('#labColor').value=S.labColor;document.querySelector('#labType').value=S.labType;document.querySelector('#labSource').value=S.labSource;
 document.querySelector('#collectionBack').onclick=goMenu;
 const resetPage=()=>{S.collectionPage=0;render()};
 document.querySelector('#labSearch').oninput=e=>{S.labSearch=e.target.value;resetPage()};
 document.querySelector('#labColor').onchange=e=>{S.labColor=e.target.value;resetPage()};
 document.querySelector('#labType').onchange=e=>{S.labType=e.target.value;resetPage()};
 document.querySelector('#labSource').onchange=e=>{S.labSource=e.target.value;resetPage()};
 document.querySelector('#collectionPrev').onclick=()=>{if(S.collectionPage>0){S.collectionPage--;render()}};
 document.querySelector('#collectionNext').onclick=()=>{if(S.collectionPage<pages-1){S.collectionPage++;render()}};
}

function mobileMatchUI(){
 const portrait=matchMedia('(orientation:portrait) and (pointer:coarse) and (max-width:700px)').matches;
 if(!portrait)return false;
 const allVisible=()=>[...S.h,...S.hw,...S.hl,...S.aw,...S.al,...(S.hf?[S.hf]:[]),...(S.af?[S.af]:[])];
 const tile=(c,o)=>{
  if(!c)return '';
  if(c.down)return `<button class="m2Tile m2Down" data-u="${c.uid}"><b>ODDBALL</b><span>FACE CACHÉE</span></button>`;
  let d=dyn(c,o,'bench'),cl=c.color==='WILD'?'WILD':c.color;
  return `<button class="m2Tile ${cl}" data-u="${c.uid}"><strong>${c.name}</strong><em>${'★'.repeat(c.stars||0)||'0★'}</em><span>POW <b>${d.p}</b> · SPD <b>${d.s}</b></span></button>`;
 };
 const summary=(who,win,lose,o)=>`<button class="m2BenchSummary" data-openbench="${who}"><span><b>${who==='a'?'BENCH RIVAL':'TON BENCH'}</b><small>${win.length+lose.length} carte${win.length+lose.length!==1?'s':''}</small></span><span class=m2BenchCounts><i>✓ ${win.length}</i><i>✕ ${lose.length}</i></span><span class=m2Chev>›</span></button>`;
 const duelCard=(c,o,label)=>c?`<div class=m2DuelCard data-u="${c.uid}">${card(c,false,false,'faceoff')}</div>`:`<div class=m2DuelEmpty>${label}</div>`;
 const inFaceoff=!!(S.hf||S.af)||['scoring','end'].includes(S.phase);
 const title=inFaceoff?'FACE-OFF':(S.ball==='h'?'À TOI DE JOUER':'TOUR RIVAL');
 app.innerHTML=`<div class="m2Match">
  <header class=m2Top><button id=mMenu>☰</button><div class=m2Brand><b>ODDBALL</b><span>${S.ball==='h'?'● TA BALLE':'● BALLE RIVALE'}</span></div><div class=m2Score><span>RIVAL <b>${S.as}</b></span><i>–</i><span>TOI <b>${S.hs}</b></span></div></header>
  <main class=m2Stage>
   <div class=m2StageHead><span>${title}</span><button id=mQuick>•••</button></div>
   <div class=m2LiveBenches>
 <div class=m2LiveRow><b>RIVAL</b><button data-openbench="a"><span>✓ WIN</span><i>${S.aw.length}</i><div>${S.aw.slice(-4).map(c=>tile(c,'a')).join('')||'<small>VIDE</small>'}</div></button><button data-openbench="a"><span>✕ LOSE</span><i>${S.al.length}</i><div>${S.al.slice(-4).map(c=>tile(c,'a')).join('')||'<small>VIDE</small>'}</div></button></div>
 <div class=m2LiveRow><b>TOI</b><button data-openbench="h"><span>✕ LOSE</span><i>${S.hl.length}</i><div>${S.hl.slice(-4).map(c=>tile(c,'h')).join('')||'<small>VIDE</small>'}</div></button><button data-openbench="h"><span>✓ WIN</span><i>${S.hw.length}</i><div>${S.hw.slice(-4).map(c=>tile(c,'h')).join('')||'<small>VIDE</small>'}</div></button></div>
</div>
   ${inFaceoff?`<section class=m2Face><div class=m2FaceLabel>FACE-OFF ${faceoffDemandBanner()}</div><div class=m2Duel>${duelCard(S.af,'a','RIVAL')}<div class=m2Vs>${S.phase==='end'?(S.hs>S.as?'FIN':S.hs<S.as?'FIN':'FIN'):(S.phase==='scoring'?'SCORE':'VS')}</div>${duelCard(S.hf,'h','TOI')}</div></section>`:`<section class=m2TurnHero><div class=m2Ball>${S.ball==='h'?'●':'○'}</div><h1>${S.ball==='h'?'CHOISIS TON ATHLÈTE':'LE RIVAL PRÉPARE SON ATTAQUE'}</h1><p>${S.ball==='h'?'Touche une carte pour la lire puis la jouer.':'Ta main reste prête pendant que le rival joue.'}</p></section>`}
  </main>
  <section class=m2HandArea><div class=m2HandHead><b>TA MAIN</b><span>${S.h.length} CARTE${S.h.length!==1?'S':''}</span></div><div class=m2Hand id=myhand>${S.h.map(c=>`<div class=m2HandCard data-u="${c.uid}">${card(c,false,false,'hand')}</div>`).join('')}</div></section>
  <div id=m2Sheet class=m2Sheet></div><div id=m2BenchSheet class=m2Sheet></div><div id=m2QuickSheet class=m2Sheet></div>
  <div id=visualFx class=visualFx></div>${targetPrompt()}${finalPanel()}<div id=eventToast class=eventToast></div>
 </div>`;
 document.querySelector('#mMenu').onclick=goMenu;
 let en=document.querySelector('#endNew');if(en)en.onclick=S.leagueActive?(S.league?.current?.playoff?leagueFinishPlayoffMatch:leagueFinishPlayedMatch):startDraft;let sf=document.querySelector('#skipFinal');if(sf)sf.onclick=skipFinal;
 bindTargetMode();setTimeout(playVisualQueue,20);setTimeout(flushCardFx,30);
 const closeSheet=box=>{box.classList.remove('open');box.innerHTML=''};
 const preview=c=>{
  if(!c||c.down)return;
  let mine=S.h.some(x=>x.uid===c.uid),box=document.querySelector('#m2Sheet');
  box.innerHTML=`<div class=m2Shade></div><div class=m2CardSheet><div class=m2Grab></div><button class=m2Close>✕</button><div class=m2Inspect>${card(c,false,false,'inspect')}</div><div class=m2CardMeta><b>${c.name}</b><span>${abilityCategory(c)}${triggerLabel(c)?' · '+triggerLabel(c):''}</span></div>${mine?`<button class=m2Play data-u="${c.uid}">JOUER CETTE CARTE</button>`:''}</div>`;
  box.classList.add('open');box.querySelector('.m2Shade').onclick=()=>closeSheet(box);box.querySelector('.m2Close').onclick=()=>closeSheet(box);
  let play=box.querySelector('.m2Play');if(play)play.onclick=()=>{closeSheet(box);hplay(play.dataset.u)};
 };
 if(!targetMode){
  document.querySelectorAll('.m2HandCard[data-u]').forEach(el=>{el.onclick=e=>{e.stopPropagation();hplay(el.dataset.u)};el.oncontextmenu=e=>e.preventDefault()});
  document.querySelectorAll('.m2DuelCard[data-u],.m2Tile[data-u]').forEach(el=>{el.onclick=e=>{e.stopPropagation();preview(allVisible().find(c=>c.uid===el.dataset.u))};el.oncontextmenu=e=>e.preventDefault()});
 }
 document.querySelectorAll('[data-openbench]').forEach(btn=>btn.onclick=()=>{
  let own=btn.dataset.openbench==='h',win=own?S.hw:S.aw,lose=own?S.hl:S.al,o=own?'h':'a',box=document.querySelector('#m2BenchSheet');
  box.innerHTML=`<div class=m2Shade></div><div class="m2PanelSheet m2BenchPanel"><div class=m2Grab></div><div class=m2PanelHead><div><small>ZONES DE JEU</small><b>${own?'TON BENCH':'BENCH RIVAL'}</b></div><button class=m2Close>✕</button></div><div class=m2ZoneBlock><h3>✓ WINZONE <span>${win.length}</span></h3><div class=m2ZoneGrid>${win.length?win.map(c=>tile(c,o)).join(''):'<p>VIDE</p>'}</div></div><div class=m2ZoneBlock><h3>✕ LOSEZONE <span>${lose.length}</span></h3><div class=m2ZoneGrid>${lose.length?lose.map(c=>tile(c,o)).join(''):'<p>VIDE</p>'}</div></div></div>`;
  box.classList.add('open');box.querySelector('.m2Shade').onclick=()=>closeSheet(box);box.querySelector('.m2Close').onclick=()=>closeSheet(box);
  box.querySelectorAll('[data-u]').forEach(el=>el.onclick=()=>preview(allVisible().find(c=>c.uid===el.dataset.u)));
 });
 document.querySelector('#mQuick').onclick=()=>{
  let box=document.querySelector('#m2QuickSheet');
  box.innerHTML=`<div class=m2Shade></div><div class="m2PanelSheet m2QuickPanel"><div class=m2Grab></div><div class=m2PanelHead><b>PARTIE</b><button class=m2Close>✕</button></div><button id=m2Zones>ZONES DE JEU <span>›</span></button><button id=m2Feed>HISTORIQUE DU MATCH <span>›</span></button><div class=m2DeckInfo><span>PIOCHE <b>${S.deck.length}</b></span><span>DÉFAUSSE <b>${S.disc?.length||0}</b></span></div><button class=m2Danger id=m2End>FORCER LA FIN</button></div>`;
  box.classList.add('open');box.querySelector('.m2Shade').onclick=()=>closeSheet(box);box.querySelector('.m2Close').onclick=()=>closeSheet(box);
  box.querySelector('#m2Zones').onclick=()=>{closeSheet(box);document.querySelector('[data-openbench="h"]').click()};
  box.querySelector('#m2Feed').onclick=()=>{box.querySelector('.m2PanelSheet').innerHTML=`<div class=m2Grab></div><div class=m2PanelHead><b>HISTORIQUE</b><button class=m2Close>✕</button></div><div class=m2FeedRows>${(S.log||[]).slice().reverse().map(x=>`<p>${x}</p>`).join('')||'<p>Aucune interaction.</p>'}</div>`;box.querySelector('.m2Close').onclick=()=>closeSheet(box)};
  box.querySelector('#m2End').onclick=()=>{closeSheet(box);end()};
 };
 return true;
}
function render(){if(S.phase==='menu'){renderMenu();return}if(S.phase==='leagueStart'){renderLeagueStart();return}if(S.phase==='leagueDraft'){renderLeagueDraft();return}if(S.phase==='leagueHub'){renderLeagueHub();return}if(S.phase==='leagueRosters'){renderLeagueRosters();return}if(S.phase==='leagueStandings'){renderLeagueStandings();return}if(S.phase==='leagueCalendar'){renderLeagueCalendar();return}if(S.phase==='leagueRoster'){renderLeagueRoster();return}if(S.phase==='leaguePrep'){renderLeaguePrep();return}if(S.phase==='leagueResults'){renderLeagueResults();return}if(S.phase==='leagueRecruit'){renderLeagueRecruit();return}if(S.phase==='leagueSeasonEnd'){renderLeagueSeasonEnd();return}if(S.phase==='leaguePlayoffs'){renderLeaguePlayoffs();return}if(S.phase==='leaguePlayoffPrep'){renderLeaguePlayoffPrep();return}if(S.phase==='leaguePlayoffResult'){renderLeaguePlayoffResult();return}if(S.phase==='leagueChampion'){renderLeagueChampion();return}if(S.phase==='stats'){renderStats();return}if(S.phase==='collection'){renderCollection();return}if(S.phase==='lab'){renderLab();return}if(S.phase==='d1'||S.phase==='d2'){let pending=S.phase==='d2'?S.pool.filter(c=>S.sel.has(c.uid)):[],draftHand=[...S.h,...pending];app.innerHTML=`<div class="shell draftShell"><div class=top><div class=logo>ODDBALL</div><div class=tag>Digital v1.45 · PLAYOFF UX</div></div><div class="panel draftPanel"><h2>${S.phase==='d1'?'Choisis 1 carte':'Choisis 2 cartes reçues'}</h2><p>Draft ${S.round+1}/2 · ${S.h.length} carte${S.h.length>1?'s':''} confirmée${S.h.length>1?'s':''}${pending.length?` · ${pending.length} sélectionnée${pending.length>1?'s':''} en attente`:''}</p><div class=choices>${S.pool.map(c=>card(c,false,S.sel.has(c.uid))).join('')}</div>${S.phase==='d2'?'<br><button class=btn id=ok>Confirmer</button>':''}</div><div class=draftHandDock><div class=draftHandTitle>TA MAIN · SYNERGIES <span>${draftHand.length}/6</span></div><div class=draftHand>${draftHand.length?draftHand.map(c=>`<div class="draftHandCard ${pending.includes(c)?'pendingPick':''}">${card(c)}</div>`).join(''):'<div class=draftHandEmpty>Tes cartes choisies apparaîtront ici au fur et à mesure.</div>'}</div></div></div>`;document.querySelectorAll('.choices .card').forEach(e=>e.onclick=()=>S.phase==='d1'?pick1(e.dataset.u):pick2(e.dataset.u));if(document.querySelector('#ok'))document.querySelector('#ok').onclick=conf;return}
 if(mobileMatchUI())return;
 app.innerHTML=`<div class=shell><div class=top><div class=logo>ODDBALL</div><div class=tag>v1.45 · PLAYOFF UX · 98 CARTES</div></div>
 <div class=tabletop>
 <div class=arenaBrand>ODDBALL<span>PLAY · ATTACK · SCORE</span></div><div class=arenaSlogan>GOOD PLAYERS<br>BETTER PEOPLE</div><div class=deckPile><b>♛</b><span>PIOCHE</span><strong>${S.deck.length}</strong></div><div class=discardPile><b>⌫</b><span>DÉFAUSSE</span><strong>${S.disc?.length||0}</strong></div>
 <div class=opponentHandRow><div class=compactLabel>MAIN RIVAL · ${S.a.length}</div><div class=miniHand>${S.a.map(x=>card(x,true)).join('')}</div></div>${liveLogPanel()}
 <div class="playerBoard opponentBoard"><div class="benchSide rivalWinSide"><div class=benchTag>✓ WINZONE</div><div class=benchCards>${[...S.aw].reverse().map(x=>card(x,x.down)).join('')}</div></div><div class="playerMat opponentMat"><div class=matWin>✓</div><div class="ballDock ${S.ball==='a'?'hasBall':''}">${S.ball==='a'?'<div class=gameBall><i></i></div>':'<div class=emptyBall></div>'}</div><div class=matLose>✕</div><div class=matName>RIVAL</div></div><div class="benchSide rivalLoseSide"><div class=benchTag>LOSEZONE ✕</div><div class=benchCards>${S.al.map(x=>card(x,x.down,false,'bench')).join('')}</div></div></div>
 <div class=faceoffLane><div class=faceoffCaption>FACE-OFF</div>${faceoffDemandBanner()}<div class=mainScoreboard><div class=rivalScore><small>RIVAL</small><b>${S.as}</b></div><span class=scoreSep>–</span><div class=humanScore><b>${S.hs}</b><small>TOI</small></div></div><div class="duelSlot rivalSlot">${S.af?card(S.af):'<span>RIVAL</span>'}</div><div class=versus>${S.phase==='end'?(S.hs>S.as?'WIN':S.hs<S.as?'LOSE':'DRAW'):(S.phase==='scoring'?'SCORE':'VS')}</div><div class="duelSlot humanSlot">${S.hf?card(S.hf):'<span>TOI</span>'}</div></div>
 <div class="playerBoard humanBoard"><div class="benchSide loseSide"><div class=benchTag>✕ LOSEZONE</div><div class=benchCards>${[...S.hl].reverse().map(x=>card(x,x.down)).join('')}</div></div><div class="playerMat humanMat"><div class=matLose>✕</div><div class="ballDock ${S.ball==='h'?'hasBall':''}">${S.ball==='h'?'<div class=gameBall><i></i></div>':'<div class=emptyBall></div>'}</div><div class=matWin>✓</div><div class=matName>TOI</div></div><div class="benchSide winSide"><div class=benchTag>WINZONE ✓</div><div class=benchCards>${S.hw.map(x=>card(x,x.down,false,'bench')).join('')}</div></div></div>
 <div class=humanHandRow><div class=compactLabel>TA MAIN · ${S.h.length}</div><div class=hand id=myhand>${S.h.map(x=>card(x,false,false,'hand')).join('')}</div></div>
 <div id=visualFx class=visualFx></div>${targetPrompt()}${finalPanel()}</div><div id=cardInspector class="cardInspector compactInspector"><div class=inspectHint>Survole une carte pour voir son effet.</div></div><div id=eventToast class=eventToast></div><div class=controls><button class=btn id=new>Nouvelle partie</button><button class=btn id=menu>MENU</button><button class=btn id=end>Forcer fin</button></div></div>`;
 document.querySelector('#new').onclick=startDraft;document.querySelector('#menu').onclick=goMenu;document.querySelector('#end').onclick=end;let en=document.querySelector('#endNew');if(en)en.onclick=S.leagueActive?(S.league?.current?.playoff?leagueFinishPlayoffMatch:leagueFinishPlayedMatch):startDraft;let sf=document.querySelector('#skipFinal');if(sf)sf.onclick=skipFinal;setTimeout(playVisualQueue,20);document.querySelectorAll('#myhand .card').forEach(e=>e.onclick=()=>hplay(e.dataset.u));
 bindTargetMode();setTimeout(flushCardFx,30);const visible=[...S.h,...S.hw,...S.hl,...S.aw,...S.al,...(S.hf?[S.hf]:[]),...(S.af?[S.af]:[])];
 document.querySelectorAll('.tabletop .card:not(.back)').forEach(e=>{e.onmouseenter=()=>{if(matchMedia('(pointer:coarse)').matches)return;let c=visible.find(x=>x.uid===e.dataset.u),box=document.querySelector('#cardInspector');if(!c||!box)return;box.innerHTML=`<div class=inspectName>${c.name}</div><div class=inspectMeta>${abilityCategory(c)}${triggerLabel(c)?' · '+triggerLabel(c):''} · ${c.color} · ${c.stars?c.stars+'★ · ':''}POW ${c.pow} · SPD ${c.spd}</div><div class=inspectRule>${c.text}</div><div class=howItWorks>COMMENT ÇA MARCHE</div><div class=inspectExplain>${explain(c)}</div>`;box.classList.add('active')};e.onmouseleave=()=>{let box=document.querySelector('#cardInspector');if(box)box.classList.remove('active')};if(matchMedia('(pointer:coarse)').matches){let timer=null,moved=false,startX=0,startY=0;const clear=()=>{if(timer){clearTimeout(timer);timer=null}};e.addEventListener('contextmenu',ev=>ev.preventDefault());e.addEventListener('selectstart',ev=>ev.preventDefault());e.addEventListener('pointerdown',ev=>{moved=false;startX=ev.clientX;startY=ev.clientY;clear();if(e.setPointerCapture)try{e.setPointerCapture(ev.pointerId)}catch(_){};timer=setTimeout(()=>{if(moved)return;let c=visible.find(x=>x.uid===e.dataset.u),box=document.querySelector('#cardInspector');if(!c||!box)return;box.innerHTML=`<div class=mobileInspectCard>${card(c,false,false,'inspect')}</div>`;box.classList.add('mobileInspect');navigator.vibrate?.(20)},420)});e.addEventListener('pointermove',ev=>{if(Math.abs(ev.clientX-startX)>10||Math.abs(ev.clientY-startY)>10){moved=true;clear()}});e.addEventListener('pointerup',clear);e.addEventListener('pointercancel',clear)}});let feed=document.querySelector('.liveLog');if(feed){feed.onclick=ev=>{if(ev.target.closest('.liveLogRows'))return;feed.classList.toggle('mobileOpen')}};let inspector=document.querySelector('#cardInspector');if(inspector)inspector.addEventListener('pointerup',ev=>{if(ev.target===inspector){inspector.classList.remove('mobileInspect');inspector.innerHTML='<div class=inspectHint>Survole une carte pour voir son effet.</div>'}})}
goMenu();
