import { loadCards } from './cards.js';
import { Battle } from './engine.js';

const $ = s => document.querySelector(s);
let battle;
const hand = $('#hand'), choice = $('#choice'), choiceCards = $('#choice-cards');

const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'phaser-stage', transparent: true, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: { create() {
  const { width, height } = this.scale;
  const mist = this.add.graphics();
  mist.fillStyle(0x8c9d9b,.12); mist.fillEllipse(width*.25,height*.57,width*.58,height*.25); mist.fillStyle(0xd48852,.12); mist.fillEllipse(width*.76,height*.42,width*.42,height*.38);
  const hero = this.add.container(width*.28,height*.58); hero.add([this.add.circle(0,0,58,0xb84940),this.add.rectangle(0,68,105,92,0x7d3038),this.add.text(-37,-17,'국', {fontFamily:'Black Han Sans',fontSize:'42px',color:'#ffe7bb'})]);
  const enemy = this.add.container(width*.73,height*.42); enemy.add([this.add.circle(0,0,71,0x66717b),this.add.rectangle(0,80,130,110,0x303b49),this.add.text(-42,-19,'철', {fontFamily:'Black Han Sans',fontSize:'45px',color:'#d9eee7'})]);
  this.tweens.add({ targets:[hero,enemy], y:'+=9', duration:1600, yoyo:true, repeat:-1, ease:'Sine.inOut' });
  this.scale.on('resize', size=>{ hero.x=size.width*.28;hero.y=size.height*.58;enemy.x=size.width*.73;enemy.y=size.height*.42; });
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
function render(){
  if(!battle)return; const p=battle.player,e=battle.enemy;
  $('#player-hp').style.width=`${p.hp/p.maxHp*100}%`;$('#enemy-hp').style.width=`${Math.max(0,e.hp/e.maxHp)*100}%`;
  $('#player-stats').textContent=`HP ${p.hp}/${p.maxHp} · 방어 ${p.block} · 힘 ${p.strength}`;
  $('#enemy-intent').textContent=`의도: ${e.intent.type==='attack'?'공격 '+e.intent.amount:'방어 '+e.intent.amount} · HP ${Math.max(0,e.hp)}/${e.maxHp}${e.block?' · 방어 '+e.block:''}`;
  $('#piles').innerHTML=`<span class="pile">에너지 ⚡ ${battle.energy}</span><span class="pile">뽑기 ${battle.drawPile.length}</span><span class="pile">버림 ${battle.discard.length}</span><span class="pile">소멸 ${battle.exhaust.length}</span>`;
  $('#end-turn').disabled=battle.enemyTurn||!!battle.pending||p.hp<=0||e.hp<=0;
  hand.replaceChildren(...battle.hand.map((c,i)=>cardEl(c,i,battle.hand.length)));
  choice.hidden=!battle.pending;
  if(battle.pending){$('#choice-text').textContent=battle.pending.text;choiceCards.replaceChildren(...battle.pending.choices.map((c,i)=>cardEl(c,i,battle.pending.choices.length,true)));}
}
$('#end-turn').addEventListener('click',()=>{battle.endTurn();say('적이 행동합니다…');render();setTimeout(render,650);setTimeout(render,1250);});

try { const cards=await loadCards(); battle=new Battle(cards, say); render(); } catch(error) { say(error.message); console.error(error); }
