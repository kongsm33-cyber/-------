const status = (turns = 0) => ({ vulnerable: turns, weak: 0, strength: 0, dexterity: 0, frail: 0 });
const make = (card) => ({ ...card, uid: crypto.randomUUID(), costNow: card.cost, bonus: 0, upgraded: false, ethereal: card.keywords.includes('휘발성') });
const wound = (name) => ({ id: name, uid: crypto.randomUUID(), name_kr: name === 'burn' ? '화상' : name === 'dazed' ? '어지러움' : '부상', type: 'Status', rarity: 'Status', cost: 1, costNow: 1, description: '사용할 수 없는 상태 이상 카드입니다.', keywords: [] });

export class Battle {
  constructor(cards, notify) { this.cards = cards; this.byId = Object.fromEntries(cards.map(c => [c.id, c])); this.notify = notify; this.reset(); }
  reset() {
    const starter = ['strike_r','strike_r','strike_r','strike_r','strike_r','defend_r','defend_r','defend_r','defend_r','bash'];
    const showcase = this.cards.filter(c => c.rarity !== 'Starter');
    this.drawPile = [...starter.map(id => make(this.byId[id])), ...showcase.map(make)].sort(() => Math.random() - .5);
    this.hand=[]; this.discard=[]; this.exhaust=[]; this.powers=[]; this.player={ hp:80,maxHp:80,block:0, ...status() };
    this.enemy={ hp:95,maxHp:95,block:0, ...status(), intent:{type:'attack',amount:12} }; this.energy=3; this.turn=0; this.noDraw=false; this.pending=null; this.enemyTurn=false; this.startTurn();
  }
  startTurn() { this.turn++; this.player.block = this.hasPower('barricade') ? this.player.block : 0; this.energy=3+(this.hasPower('berserk')?1:0); this.noDraw=false; this.applyPowerStart(); this.draw(5); this.rollIntent(); this.notify('당신의 차례입니다. 적의 의도를 확인하세요.'); }
  hasPower(id) { return this.powers.some(c=>c.id===id); }
  draw(n) { if(this.noDraw) return; for(let i=0;i<n;i++){ if(!this.drawPile.length){ this.drawPile=this.discard.splice(0).sort(()=>Math.random()-.5); } const card=this.drawPile.pop(); if(!card) break; this.hand.push(card); if(['wound','burn','dazed'].includes(card.id)) this.onStatusDraw(); } }
  onStatusDraw(){ if(this.hasPower('evolve')) this.draw(this.powerValue('evolve',1)); if(this.hasPower('fire_breathing')) this.damageEnemy(this.powerValue('fire_breathing',6)); }
  powerValue(id, normal) { const c=this.powers.find(x=>x.id===id); return c?.upgraded ? Number(c.upgraded_description.match(/(\d+)/)?.[1]) || normal : normal; }
  gainBlock(n){ n+=this.player.dexterity; if(this.player.frail) n=Math.floor(n*.75); this.player.block+=Math.max(0,n); if(this.hasPower('juggernaut')) this.damageEnemy(this.powerValue('juggernaut',5)); }
  damageEnemy(n, hits=1){ for(let i=0;i<hits;i++){ let dmg=Math.max(0,n); if(this.enemy.vulnerable) dmg=Math.floor(dmg*1.5); const blocked=Math.min(this.enemy.block,dmg); this.enemy.block-=blocked; this.enemy.hp-=dmg-blocked; } }
  loseHp(n){ const blocked=Math.min(this.player.block,n); this.player.block-=blocked; const loss=n-blocked; this.player.hp=Math.max(0,this.player.hp-loss); if(loss){ this.hand.forEach(c=>{if(c.id==='blood_for_blood') c.costNow=Math.max(0,Number(c.costNow)-1);}); if(this.hasPower('rupture')) this.player.strength+=this.powerValue('rupture',1); } }
  canPlay(card){ const cost=this.hasPower('corruption')&&card.type==='Skill'?0:card.costNow; return !this.enemyTurn && !this.pending && card.type!=='Status' && (cost==='X' ? this.energy>0 : this.energy>=cost) && !(card.id==='clash' && this.hand.some(c=>c.type!=='Attack')); }
  play(card){ if(!this.canPlay(card)) return this.notify('지금은 이 카드를 사용할 수 없습니다.'); const i=this.hand.indexOf(card); this.hand.splice(i,1); const actual=this.hasPower('corruption')&&card.type==='Skill'?0:card.costNow; const cost=actual==='X'?this.energy:actual; this.energy-=cost; if(card.type==='Attack'&&this.rage)this.gainBlock(this.rage); this.resolve(card, cost); if(this.hasPower('corruption')&&card.type==='Skill'&&!this.exhaust.includes(card))this.exhaustCard(card); if(this.enemy.hp<=0) this.notify('전투 승리! 새로고침하면 다시 시작합니다.'); }
  resolve(card, x=0) {
    const base = (n) => card.upgraded ? Number(card.upgraded_description.match(/(\d+)/)?.[1]) || n : n;
    const hit=(n,h=1)=>this.damageEnemy(n+this.player.strength+card.bonus,h), block=n=>this.gainBlock(n), draw=n=>this.draw(n), add=(id,where='discard')=>this[where].push(id==='wound'||id==='burn'||id==='dazed'?wound(id):make(this.byId[id]));
    const exhaust=()=>this.exhaustCard(card), discard=()=>this.discard.push(card);
    const choose=(filter, text, cb)=>{ const choices=this.hand.filter(filter); if(!choices.length) return cb(null); this.pending={text,choices,cb}; };
    const id=card.id;
    if(card.type==='Power'){ this.powers.push(card); this.powerOnPlay(card); return; }
    switch(id){
      case 'strike_r': hit(base(6)); break; case 'defend_r': block(base(5)); break; case 'bash': hit(base(8)); this.enemy.vulnerable=base(2); break;
      case 'anger': hit(base(6)); add('anger'); break; case 'armaments': block(5); if(card.upgraded)this.hand.forEach(c=>this.upgrade(c)); else choose(c=>c!==card,'강화할 카드 선택',c=>{if(c)this.upgrade(c);}); break;
      case 'body_slam': hit(this.player.block-this.player.strength); break; case 'clash': hit(base(14)); break; case 'cleave': hit(base(8)); break;
      case 'clothesline': hit(base(12)); this.enemy.weak=base(2); break; case 'flex': this.player.strength+=base(2); this.flex=(this.flex||0)+base(2); break;
      case 'havoc': {const c=this.drawPile.pop(); if(c){this.hand.push(c); this.play(c); this.exhaustCard(c);} } break;
      case 'headbutt': hit(base(9)); choose(c=>this.discard.includes(c),'버린 카드 선택',c=>{if(c){this.discard.splice(this.discard.indexOf(c),1);this.drawPile.push(c);}}); break;
      case 'heavy_blade': hit(14+this.player.strength*(card.upgraded?4:2)-this.player.strength); break; case 'iron_wave': block(base(5)); hit(base(5)); break;
      case 'perfected_strike': hit(6+this.allCards().filter(c=>c.name_kr.includes('타격')).length*base(2)); break; case 'pommel_strike': hit(base(9));draw(card.upgraded?2:1);break;
      case 'shrug_it_off':block(base(8));draw(1);break; case 'sword_boomerang':hit(3,card.upgraded?4:3);break; case 'twin_strike':hit(base(5),2);break;
      case 'true_grit':block(base(7));choose(c=>c!==card,'소멸할 카드 선택',c=>{if(c)this.exhaustCard(c);});break; case 'warcry':draw(card.upgraded?2:1);choose(c=>c!==card,'덱 맨 위에 놓을 카드 선택',c=>{if(c){this.hand.splice(this.hand.indexOf(c),1);this.drawPile.push(c);}});exhaust();return;
      case 'wild_strike':hit(base(12));add('wound','drawPile');break; case 'battle_trance':draw(card.upgraded?4:3);this.noDraw=true;break;
      case 'blood_for_blood':hit(base(18));break; case 'bloodletting':this.loseHp(3);this.energy+=base(2);break; case 'burning_pact':choose(c=>c!==card,'소멸할 카드 선택',c=>{if(c){this.exhaustCard(c);draw(card.upgraded?3:2);}});break;
      case 'carnage':hit(base(20));break; case 'disarm':this.enemy.strength-=base(2);exhaust();return; case 'dropkick':hit(base(5));if(this.enemy.vulnerable){this.energy++;draw(1);}break;
      case 'dual_wield':choose(c=>c!==card&&(c.type==='Attack'||c.type==='Power'),'복사할 카드 선택',c=>{if(c)for(let i=0;i<(card.upgraded?2:1);i++)this.hand.push({...c,uid:crypto.randomUUID()});});break;
      case 'entrench':this.player.block*=2;break; case 'flame_barrier':block(base(12));this.flame=base(4);break; case 'ghostly_armor':block(base(10));break;
      case 'hemokinesis':this.loseHp(2);hit(base(15));break; case 'infernal_blade':{const c=make(this.cards.filter(x=>x.type==='Attack')[Math.floor(Math.random()*this.cards.filter(x=>x.type==='Attack').length)]);c.costNow=0;this.hand.push(c);exhaust();return;}
      case 'inflame':this.player.strength+=base(2);break; case 'intimidate':this.enemy.weak=base(1);exhaust();return; case 'metallicize':break;
      case 'power_through':add('wound','hand');add('wound','hand');block(base(15));break; case 'rage':this.rage=base(3);break; case 'rampage':hit(base(8));card.bonus+=base(5);break;
      case 'reckless_charge':hit(base(7));add('dazed','drawPile');break; case 'searing_blow':hit(base(12));break; case 'second_wind':{const cs=this.hand.filter(c=>c.type!=='Attack');cs.forEach(c=>this.exhaustCard(c));block(cs.length*base(5));}break;
      case 'seeing_red':this.energy+=2;exhaust();return; case 'sentinel':block(base(5));break; case 'sever_soul':this.hand.filter(c=>c.type!=='Attack').forEach(c=>this.exhaustCard(c));hit(base(16));break;
      case 'shockwave':this.enemy.weak=this.enemy.vulnerable=base(3);exhaust();return; case 'spot_weakness':if(this.enemy.intent.type==='attack')this.player.strength+=base(3);break;
      case 'uppercut':hit(base(13));this.enemy.weak=this.enemy.vulnerable=base(1);break; case 'whirlwind':hit(5,x);break;
      case 'bludgeon':hit(base(32));break; case 'exhume':choose(c=>this.exhaust.includes(c),'소멸 더미에서 카드 선택',c=>{if(c){this.exhaust.splice(this.exhaust.indexOf(c),1);this.hand.push(c);}});exhaust();return;
      case 'feed':hit(base(10));if(this.enemy.hp<=0){this.player.maxHp+=base(3);this.player.hp+=base(3);}exhaust();return; case 'fiend_fire':{const cs=[...this.hand];cs.forEach(c=>this.exhaustCard(c));hit(cs.length*base(7));exhaust();return;}
      case 'immolate':hit(base(21));add('burn');break; case 'impervious':block(base(30));exhaust();return; case 'limit_break':this.player.strength*=2;if(!card.upgraded){exhaust();return;}break;
      case 'offering':this.loseHp(6);this.energy+=2;draw(card.upgraded?5:3);exhaust();return; case 'reaper':{const before=this.enemy.hp;hit(base(4));this.player.hp=Math.min(this.player.maxHp,this.player.hp+Math.max(0,before-this.enemy.hp));exhaust();return;}
    }
    if(card.ethereal) exhaust(); else discard();
  }
  powerOnPlay(card){ if(card.id==='berserk')this.player.vulnerable=card.upgraded?1:2; }
  exhaustCard(card){ const i=this.hand.indexOf(card);if(i>=0)this.hand.splice(i,1);this.exhaust.push(card); if(card.id==='sentinel')this.energy+=card.upgraded?3:2; if(this.hasPower('dark_embrace'))this.draw(1);if(this.hasPower('feel_no_pain'))this.gainBlock(this.powerValue('feel_no_pain',3)); }
  upgrade(c){c.upgraded=true;c.costNow=c.upgraded_cost;c.description=c.upgraded_description;}
  allCards(){return [...this.drawPile,...this.hand,...this.discard,...this.exhaust];}
  select(card){const p=this.pending;if(!p||!p.choices.includes(card))return;this.pending=null;p.cb(card);}
  endTurn(){ if(this.enemyTurn||this.pending)return; this.enemyTurn=true; this.hand.filter(c=>c.ethereal).forEach(c=>this.exhaustCard(c)); this.discard.push(...this.hand.splice(0)); this.applyPowerEnd(); setTimeout(()=>this.enemyAct(),600); }
  applyPowerEnd(){ if(this.hasPower('metallicize'))this.gainBlock(this.powerValue('metallicize',3));if(this.hasPower('combust')){this.loseHp(1);this.damageEnemy(this.powerValue('combust',5));}if(this.flex){this.player.strength-=this.flex;this.flex=0;} }
  enemyAct(){ let n=this.enemy.intent.amount+this.enemy.strength;if(this.enemy.weak)n=Math.floor(n*.75);if(this.enemy.intent.type==='attack'){this.loseHp(n);if(this.flame)this.damageEnemy(this.flame);}else this.enemy.block+=n;this.player.vulnerable=Math.max(0,this.player.vulnerable-1);this.enemy.vulnerable=Math.max(0,this.enemy.vulnerable-1);this.enemy.weak=Math.max(0,this.enemy.weak-1);this.enemyTurn=false;if(this.player.hp<=0)this.notify('패배했습니다. 새로고침하여 다시 시작하세요.');else this.startTurn(); }
  applyPowerStart(){ if(this.hasPower('demon_form'))this.player.strength+=this.powerValue('demon_form',2); }
  rollIntent(){ this.enemy.intent=Math.random()<.72?{type:'attack',amount:8+Math.floor(Math.random()*7)}:{type:'block',amount:8}; }
}
