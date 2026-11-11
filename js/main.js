import { loadCards } from './cards.js';
import { Battle } from './engine.js';

const $ = s => document.querySelector(s);
let battle;
const hand = $('#hand'), choice = $('#choice'), choiceCards = $('#choice-cards');

const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'phaser-stage', transparent: true, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: { create() {
  const { width, height } = this.scale;
  const mist = this.add.graphics();
  mist.fillStyle(0x8c9d9b,.12); mist.fillEllipse(width*.25,height*.57,width*.58,height*.25); mist.fillStyle(0xd48852,.12); mist.fillEllipse(width*.76,height*.42,width*.42,height*.38);
  const target = this.add.graphics(); target.lineStyle(2,0xe9c77d,.4); target.strokeCircle(width*.73,height*.46,88); target.lineStyle(1,0xe9c77d,.18); target.strokeCircle(width*.73,height*.46,104);
  const hero = this.add.container(width*.26,height*.61); hero.add([this.add.circle(0,0,65,0x321d2a),this.add.circle(0,0,58,0xc75747),this.add.text(-18,-18,'I', {fontFamily:'Black Han Sans',fontSize:'40px',color:'#ffe7bb'})]);
  const enemy = this.add.container(width*.73,height*.46); enemy.add([this.add.circle(0,0,78,0x1c2832),this.add.circle(0,0,70,0x71828a),this.add.text(-17,-22,'●', {fontFamily:'sans-serif',fontSize:'52px',color:'#d9eee7'})]);
  this.add.text(width*.5,height*.76,'카드를 적에게 드래그하여 사용', {fontFamily:'Noto Sans KR',fontSize:'14px',color:'#ead6a2'}).setOrigin(.5);
  window.battleVisual = { enemyHit: () => this.tweens.add({targets:enemy,scaleX:.86,scaleY:.86,duration:70,yoyo:true}), playerHit: () => this.tweens.add({targets:hero,x:'-=20',duration:65,yoyo:true,repeat:1}) };
  this.tweens.add({ targets:[hero,enemy], y:'+=9', duration:1600, yoyo:true, repeat:-1, ease:'Sine.inOut' });
  this.scale.on('resize', size=>{ hero.x=size.width*.26;hero.y=size.height*.61;enemy.x=size.width*.73;enemy.y=size.height*.46; });
}}});

function say(text){ $('#message').textContent=text; }
function typeClass(card){ return card.type.toLowerCase(); }
function cardEl(card, index, count, selectable=false){
  const el=document.createElement('article'); el.className=`card ${typeClass(card)} ${battle.canPlay(card)||selectable?'':'unaffordable'}`; el.dataset.uid=card.uid;
  const spread=Math.min(78, 540/Math.max(1,count-1)); const left=(hand.clientWidth-128)/2+(index-(count-1)/2)*spread; const rotate=(index-(count-1)/2)*3;
  el.style.left=`${left}px`;el.style.transform=`rotate(${rotate}deg)`;el.style.zIndex=index;
  el.innerHTML=`<span class="cost">${card.costNow}</span><h3 class="name">${card.name_kr}</h3><span class="type">${card.type} · ${card.rarity}</span><p class="description">${card.description}</p><small class="rarity">${card.name_en||''}</small>`;
  if(selectable){el.classList.add('choice-card');el.style.left='auto';el.style.transform='none';el.addEventListener('click',()=>{battle.select(card);render();});return el;}
  let drag=false;
  el.addEventListener('pointerdown', e=>{if(!battle.canPlay(card))return;drag=true;el.setPointerCapture(e.pointerId);el.classList.add('dragging');});
  el.addEventListener('pointermove',e=>{if(!drag)return;el.style.left=`${e.clientX-el.parentElement.getBoundingClientRect().left-64}px`;el.style.bottom=`${Math.max(0,window.innerHeight-e.clientY-25)}px`;});
  el.addEventListener('pointerup',e=>{if(!drag)return;drag=false;el.releasePointerCapture(e.pointerId);el.classList.remove('dragging');const arena=$('#battle').getBoundingClientRect();if(e.clientY<arena.bottom && e.clientY>arena.top){battle.play(card);say(`${card.name_kr}을(를) 사용했습니다.`);}render();});
  el.addEventListener('click',e=>{if(drag)return;if(battle.canPlay(card)){battle.play(card);say(`${card.name_kr}을(를) 사용했습니다.`);render();}});
  return el;
}
let previous = { player: 80, enemy: 95 };
function render(){
  if(!battle)return; const p=battle.player,e=battle.enemy;
  $('#player-hp').style.width=`${p.hp/p.maxHp*100}%`;$('#enemy-hp').style.width=`${Math.max(0,e.hp/e.maxHp)*100}%`;
  $('#player-stats').textContent=`HP ${p.hp}/${p.maxHp} · 방어 ${p.block} · 힘 ${p.strength}`;
  $('#enemy-intent').textContent=`의도: ${e.intent.type==='attack'?'공격 '+e.intent.amount:'방어 '+e.intent.amount} · HP ${Math.max(0,e.hp)}/${e.maxHp}${e.block?' · 방어 '+e.block:''}`;
  $('#piles').innerHTML=`<span class="pile">에너지 ⚡ ${battle.energy}</span><span class="pile">뽑기 ${battle.drawPile.length}</span><span class="pile">버림 ${battle.discard.length}</span><span class="pile">소멸 ${battle.exhaust.length}</span>`;
  $('#end-turn').disabled=battle.enemyTurn||!!battle.pending||p.hp<=0||e.hp<=0;
  if (e.hp < previous.enemy) window.battleVisual?.enemyHit();
  if (p.hp < previous.player) window.battleVisual?.playerHit();
  previous = { player: p.hp, enemy: e.hp };
  hand.replaceChildren(...battle.hand.map((c,i)=>cardEl(c,i,battle.hand.length)));
  choice.hidden=!battle.pending;
  if(battle.pending){$('#choice-text').textContent=battle.pending.text;choiceCards.replaceChildren(...battle.pending.choices.map((c,i)=>cardEl(c,i,battle.pending.choices.length,true)));}
}
$('#end-turn').addEventListener('click',()=>{battle.endTurn();say('적이 행동합니다…');render();setTimeout(render,650);setTimeout(render,1250);});

try { const cards=await loadCards(); battle=new Battle(cards, say); render(); } catch(error) { say(error.message); console.error(error); }
