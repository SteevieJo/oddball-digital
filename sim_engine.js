/* Oddball Digital v1.38 — headless AI-vs-AI simulation engine.
   No DOM, no animation, no hidden-information peeking for card selection. */
'use strict';
global.window={}; require('./cards.js'); const ALL=window.CARDS;
let uid=1; const clone=c=>({...c,uid:`s${uid++}`,down:false,tempPow:0,tempSpd:0,tempWild:false,tempSwap:false,chosenColor:null});
function rng(seed=1){let x=seed>>>0||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)}
function shuffle(a,R){for(let i=a.length-1;i>0;i--){let j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const opp=o=>o==='h'?'a':'h';
function simOne(seed=1,opts={}){
 const R=rng(seed), S={h:[],a:[],hw:[],hl:[],aw:[],al:[],deck:[],disc:[],ball:R()<.5?'h':'a',hs:0,as:0,faceoffs:0,played:{h:[],a:[]},initial:{h:[],a:[]}};
 const hand=o=>S[o], win=o=>S[o+'w'], lose=o=>S[o+'l'], bench=o=>[...win(o),...lose(o)];
 const instant=c=>['PLAY','ATTACK','DEFENSE','WIN','LOSE'].includes(c.timing), endg=c=>String(c.timing).replace('_',' ')==='END GAME';
 const ongoing=(o,id,z='both')=>(z==='win'?win(o):z==='lose'?lose(o):bench(o)).find(c=>c.id===id&&!c.down);
 function dyn(c,o){let p=(c.tempSwap?c.spd:c.pow)+(c.tempPow||0),s=(c.tempSwap?c.pow:c.spd)+(c.tempSpd||0),w=c.color==='WILD'||c.tempWild;if(instant(c)&&ongoing(o,14))p+=20;if(instant(c)&&ongoing(o,22))s+=30;if(c.timing==='ONGOING'&&ongoing(o,36))p+=50;if(ongoing(o,19)&&lose(o).filter(x=>!x.down).reduce((n,x)=>n+x.stars,0)>=4)w=true;if(ongoing(o,5,'win')&&p>=50)w=true;if(ongoing(o,43)&&c.stars>=3)s+=30;if(ongoing(o,52,'lose'))p+=30;let sad=ongoing(o,38),f=lose(o)[0];if(sad&&f&&!f.down&&c.color===f.color)p+=50;return{p,s,w}}
 const score=(o,n)=>{if(o==='h')S.hs+=n;else S.as+=n}; const flip=c=>{if(c)c.down=!c.down};
 function draw(o,n){while(n--&&S.deck.length)hand(o).push(S.deck.pop())}
 function color(o){let cs=['RED','BLUE','GREEN'], seen={RED:0,BLUE:0,GREEN:0};bench(opp(o)).filter(c=>!c.down&&seen[c.color]!=null).forEach(c=>seen[c.color]++);let m=Math.min(...cs.map(c=>seen[c]));let b=cs.filter(c=>seen[c]===m);return b[Math.floor(R()*b.length)]}
 function choose(a,fn=x=>future(x)){if(!a.length)return null;return [...a].sort((x,y)=>fn(y)-fn(x))[0]}
 function future(c){return c.stars*5+(endg(c)?22:0)+(c.timing==='ONGOING'?18:0)+(c.color==='WILD'?10:0)+(c.timing==='LOSE'?4:0)}
 function discardCard(o,c){let i=hand(o).indexOf(c);if(i>=0){hand(o).splice(i,1);S.disc.push(c)}}
 function moveEnemyWin(o){let ro=opp(o);if(win(ro).length)lose(ro).push(win(ro).pop())}
 function triggerPlay(c,o){if(c.color==='RED'&&ongoing(o,37,'lose'))draw(o,1);if(c.color==='BLUE'&&ongoing(o,28,'win'))draw(o,1);let k=ongoing(o,2);if(c.color==='RED'&&k){flip(k);c.tempPow+=100;draw(o,2)}let n=ongoing(o,34,'lose');if(n&&c.spd>c.pow)c.tempSwap=true;if((c.timing==='ONGOING'||endg(c))&&ongoing(o,45))draw(o,1)}
 function swapBench(o){let b=bench(o).filter(x=>!x.down);if(b.length<2)return;let a=b[0],z=b[b.length-1],wa=win(o).indexOf(a),la=lose(o).indexOf(a),wz=win(o).indexOf(z),lz=lose(o).indexOf(z);if(wa>=0&&lz>=0){win(o)[wa]=z;lose(o)[lz]=a}else if(la>=0&&wz>=0){lose(o)[la]=z;win(o)[wz]=a}}
 function playFx(c,o,role){
  if(dyn(c,o).w)c.chosenColor=color(o);
  if(c.id===6){score(o,1);if(bench(o).filter(x=>x.down).length<bench(opp(o)).filter(x=>x.down).length)score(o,1)}
  if(c.id===16)score(S.ball,1); if(c.id===25){draw(o,1);c.tempSpd+=50}
  if(c.id===20){if(R()<.65)draw(o,1);else flip(choose(bench(o)))}
  if(c.id===23){let t=choose(bench(o));if(t){flip(t);c.tempPow+=50}}
  if(c.id===26){let b=bench(o).filter(x=>!x.down);if(b.length>=2){let a=b[0],d=b[b.length-1];swapBench(o);if(a.color===d.color)c.tempSpd+=100}}
  if(c.id===33){c.tempWild=true;c.chosenColor=color(o)}
  if(c.id===35&&bench(o).some(x=>!x.down&&x.color==='BLUE'))moveEnemyWin(o)
  if(c.id===47){let g=choose(hand(o).filter(x=>x.color==='GREEN'),x=>-future(x));if(g){discardCard(o,g);c.tempSpd+=100;draw(o,1)}}
  if(c.id===48)score(o,new Set(win(o).filter(x=>!x.down).map(x=>x.color)).size)
  if(c.id===39){let t=choose(bench(o).filter(x=>!x.down),x=>-future(x));if(t)flip(t)}
  triggerPlay(c,o);
  if(role==='atk')attackFx(c,o); else if(role==='def'&&c.id===46)swapBench(o);
 }
 function attackFx(c,o){
  if(c.id===0)c.tempPow+=20;if(c.id===3){c.tempPow+=50;c.tempWild=true;c.chosenColor=color(o)}
  if(c.id===15){let col=color(o),t=choose(hand(opp(o)).filter(x=>x.color===col),x=>-future(x));if(t)discardCard(opp(o),t)}
  if(c.id===18){c.tempWild=true;c.chosenColor=color(o)}
  if(c.color==='GREEN'&&ongoing(o,29))moveEnemyWin(o)
  if(c.id===30){let t=choose(bench(o),x=>-future(x));if(t){let z=win(o).includes(t)?win(o):lose(o),i=z.indexOf(t),n=(i>0?1:0)+(i<z.length-1?1:0);flip(t);score(o,n)}}
  if(c.id===4&&win(o).length&&hand(o).length){let h=choose(hand(o),x=>-future(x)),w=choose(win(o),future);hand(o)[hand(o).indexOf(h)]=w;win(o)[win(o).indexOf(w)]=h}
  if(c.id===7){draw(o,1);let newest=hand(o)[hand(o).length-1];if(newest&&attackValue(newest,o)>attackValue(c,o)+15){hand(o).pop();S.disc.push(c);c._replace=newest}}
  if(c.id===41&&win(o).some(x=>!x.down)){let t=choose(win(o).filter(x=>!x.down),x=>-future(x));win(o).splice(win(o).indexOf(t),1);S.disc.push(t);draw(o,1)}
 }
 function loseFx(c,o){if(c.id===9)draw(o,bench(o).filter(x=>!x.down&&instant(x)).length);if(c.id===11)draw(o,new Set(bench(o).filter(x=>!x.down).map(x=>x.color)).size);if(c.id===12)score(o,hand(opp(o)).filter(x=>x.color===color(o)).length);if(c.id===13)draw(o,1);if(c.id===21){let t=choose(bench(o),x=>-future(x));if(t){flip(t);score(o,2)}}if(c.id===50){let t=choose(bench(opp(o)).filter(x=>!x.down&&endg(x)),future);if(t)flip(t)}}
 function winFx(c,o){if(c.id===32){draw(o,1);if(S.deck.length)S.deck.pop()}}
 function reset(c){c.tempPow=c.tempSpd=0;c.tempWild=c.tempSwap=false;c.chosenColor=null}
 function stage(){let n=S.h.length+S.a.length;return n<=4?'late':n<=8?'mid':'early'}
 function synergy(c,o){let v=0,st=stage();if(c.timing==='PLAY')v+=10;if(c.timing==='ATTACK')v+=14;if(c.timing==='ONGOING')v+=st==='early'?27:st==='mid'?20:10;if(endg(c))v+=st==='late'?25:10;if(c.timing==='LOSE')v+=8;if(instant(c)&&ongoing(o,14))v+=9;if(c.stars>=3&&ongoing(o,43))v+=8;return v}
 function attackValue(c,o){let d=dyn(c,o),v=d.p*1.18+d.s*.28+c.stars*6+synergy(c,o);if(stage()!=='late')v-=future(c)*.42;return v}
 function defenseValue(c,o,demand,ep){let d=dyn(c,o),m=d.w||c.color===demand,w=m&&d.p>=ep,v=(m?650:0)+d.p*.72+d.s*.16+c.stars*3+synergy(c,o);if(w)v+=650-Math.max(0,d.p-ep)*2.2;else{v-=future(c)*1.55;if(c.timing==='LOSE')v+=45}if(c.timing==='DEFENSE')v+=34;return v}
 function pickAttack(o){return choose(hand(o),c=>attackValue(c,o)+R()*8)}
 function pickDefense(o,ac,ao){let A=dyn(ac,ao),d=A.w?(ac.chosenColor||ac.color):ac.color;return choose(hand(o),c=>defenseValue(c,o,d,A.p)+R()*8)}
 function draftValue(c){return c.stars*7+c.pow*.45+c.spd*.28+(c.color==='WILD'?14:0)+(c.timing==='ONGOING'?12:0)+(endg(c)?10:0)}
 // Draft policies. 'ai' reconstructs the public draft; 'random' gives six random cards per side.
 let deck=shuffle(ALL.map(clone),R);
 if(opts.draftMode==='random'){S.h=deck.splice(0,6);S.a=deck.splice(0,6)}
 else {for(let round=0;round<2;round++){let ph=deck.splice(0,4),pa=deck.splice(0,4),h1=choose(ph,draftValue),a1=choose(pa,draftValue);S.h.push(h1);S.a.push(a1);ph=ph.filter(x=>x!==h1);pa=pa.filter(x=>x!==a1);let hk=[...pa].sort((x,y)=>draftValue(y)-draftValue(x)),ak=[...ph].sort((x,y)=>draftValue(y)-draftValue(x));S.h.push(...hk.slice(0,2));S.a.push(...ak.slice(0,2));deck.push(hk[2],ak[2])}}
 // Forced-card experiments replace one random starting card while preserving uniqueness.
 if(Number.isInteger(opts.forceCardId)){let side=opts.forceSide==='a'?'a':'h',other=opp(side),all=[...S[side],...S[other],...deck],forced=all.find(c=>c.id===opts.forceCardId);if(forced&&!S[side].some(c=>c.id===forced.id)){for(let arr of [S[side],S[other],deck]){let i=arr.indexOf(forced);if(i>=0)arr.splice(i,1)}let slot=Math.floor(R()*S[side].length),removed=S[side][slot];S[side][slot]=forced;deck.push(removed)}}
 S.deck=shuffle(deck,R);S.initial.h=S.h.map(x=>x.id);S.initial.a=S.a.map(x=>x.id);
 let guard=0;
 while(S.h.length&&S.a.length&&guard++<80){let atk=S.ball,def=opp(atk),ac=pickAttack(atk);hand(atk).splice(hand(atk).indexOf(ac),1);S.played[atk].push(ac.id);playFx(ac,atk,'atk');if(ac._replace){ac=ac._replace;S.played[atk].push(ac.id);playFx(ac,atk,'atk')}
  if(!hand(def).length){winFx(ac,atk);win(atk).push(ac);S.ball=atk;reset(ac);break}
  let dc=pickDefense(def,ac,atk);hand(def).splice(hand(def).indexOf(dc),1);S.played[def].push(dc.id);playFx(dc,def,'def');S.faceoffs++;
  let A=dyn(ac,atk),D=dyn(dc,def),demand=A.w?(ac.chosenColor||ac.color):ac.color,ok=D.w||dc.color===demand,fw=!ok?atk:(A.p>D.p?atk:D.p>A.p?def:atk),fl=opp(fw);let wc=fw===atk?ac:dc,lc=fl===atk?ac:dc;winFx(wc,fw);loseFx(lc,fl);let as=dyn(ac,atk).s,ds=dyn(dc,def).s;S.ball=as===ds?atk:(as>ds?atk:def);win(fw).push(wc);lose(fl).push(lc);reset(ac);reset(dc);
 }
 // Hattie: deterministic AI flips the most valuable opposing last End Game if available, otherwise leaves state.
 for(let o of ['h','a'])if(ongoing(o,44,'lose')){let ro=opp(o),opts=[win(ro).at(-1),lose(ro).at(-1)].filter(x=>x&&!x.down&&endg(x));let t=choose(opts,future);if(t)flip(t)}
 function eg(o){let b=bench(o),w=win(o),l=lose(o),n=0;for(let c of b.filter(x=>!x.down)){if(c.id===1)n+=b.filter(x=>!x.down&&x.timing==='ONGOING').length;if(c.id===10)n+=b.filter(x=>!x.down&&dyn(x,o).p>=50).length;if(c.id===17&&l.includes(c))n+=b.filter(x=>/^[AM]/i.test(x.name)).length;if(c.id===24&&!l.some(x=>!x.down&&x.color==='RED'))n+=4;if(c.id===27&&w.includes(c)&&(w[0]===c||w.at(-1)===c))n+=2;if(c.id===31&&l.some(x=>!x.down&&x.color==='BLUE'))n+=2;if(c.id===40)n+=b.filter(x=>!x.down&&x.stars<=2).length;if(c.id===49&&l.includes(c)){let z=l.at(-1);n+=z?(z.down?1:z.stars):0}if(c.id===51&&l.length>=4)n+=4}return n}
 let egh=eg('h'),ega=eg('a');S.hs+=egh+win('h').reduce((n,c)=>n+(c.down?1:c.stars),0)+(S.ball==='h'?2:0);S.as+=ega+win('a').reduce((n,c)=>n+(c.down?1:c.stars),0)+(S.ball==='a'?2:0);
 return{seed,winner:S.hs>S.as?'h':S.as>S.hs?'a':'draw',score:{h:S.hs,a:S.as},ball:S.ball,faceoffs:S.faceoffs,initial:S.initial,played:S.played,finalZones:{h:{win:S.hw.map(c=>c.id),lose:S.hl.map(c=>c.id)},a:{win:S.aw.map(c=>c.id),lose:S.al.map(c=>c.id)}},endGame:{h:egh,a:ega}};
}
function runBatch(n=1000,seed=1,opts={}){let games=[];for(let i=0;i<n;i++)games.push(simOne((seed+i*2654435761)>>>0,opts));let card=new Map(ALL.map(c=>[c.id,{id:c.id,name:c.name,starts:0,wins:0,played:0,winzone:0,losezone:0}]));for(let g of games)for(let o of ['h','a']){let won=g.winner===o;for(let id of g.initial[o]){let z=card.get(id);z.starts++;if(won)z.wins++}for(let id of g.played[o])card.get(id).played++;for(let id of g.finalZones[o].win)card.get(id).winzone++;for(let id of g.finalZones[o].lose)card.get(id).losezone++}let H=games.filter(g=>g.winner==='h').length,A=games.filter(g=>g.winner==='a').length,D=n-H-A;return{schema:'oddball-sim-v2',version:'1.39',engine:'headless-ai-vs-ai',options:opts,games:n,seed,summary:{hWins:H,aWins:A,draws:D,avgFaceoffs:games.reduce((s,g)=>s+g.faceoffs,0)/n,avgScoreH:games.reduce((s,g)=>s+g.score.h,0)/n,avgScoreA:games.reduce((s,g)=>s+g.score.a,0)/n},cards:[...card.values()].map(x=>({...x,winRate:x.starts?x.wins/x.starts:null})),raw:games};}
function runBalanceLab(perCard=1000,seed=139){
 const results=[];
 for(const c of ALL){let W=0,L=0,D=0,scoreFor=0,scoreAgainst=0,played=0,wz=0,lz=0;
  for(let i=0;i<perCard;i++){let side=i%2?'a':'h',g=simOne((seed+c.id*1000003+i*2654435761)>>>0,{draftMode:'random',forceCardId:c.id,forceSide:side}),other=opp(side);if(g.winner===side)W++;else if(g.winner===other)L++;else D++;scoreFor+=g.score[side];scoreAgainst+=g.score[other];played+=g.played[side].includes(c.id)?1:0;wz+=g.finalZones[side].win.includes(c.id)?1:0;lz+=g.finalZones[side].lose.includes(c.id)?1:0}
  results.push({id:c.id,name:c.name,games:perCard,wins:W,losses:L,draws:D,winRate:W/perCard,nonDrawWinRate:(W+L)?W/(W+L):null,avgScoreFor:scoreFor/perCard,avgScoreAgainst:scoreAgainst/perCard,playRate:played/perCard,winzoneRate:wz/perCard,losezoneRate:lz/perCard});
 }
 return{schema:'oddball-balance-lab-v1',version:'1.39',method:'forced card + random starting hands + alternating side',perCard,seed,totalGames:perCard*ALL.length,cards:results};
}
module.exports={simOne,runBatch,runBalanceLab,ALL};
