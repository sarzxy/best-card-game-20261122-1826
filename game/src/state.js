// AURORA CLASH rules engine: pure game state and clash resolution.
// No DOM, no timers — main.js drives turns, render.js draws what is here,
// and shots.js stages fixed states for the screenshots.
//
// A match is a sequence of clashes. Each clash both duelists play one card
// face down, then reveal: the higher effective Power deals the difference
// as damage. Every card owns one unique skill, resolved in three beats:
// reveal skills (heals, Sun, a singe), Power skills (the itemised parts),
// and outcome skills (soaks and thorns on a loss; bonus damage, Sun theft
// and feasts on a win). First to 0 life loses.

import {
  ADVANTAGE_BONUS, AEGIS_SOAK, BULWARK_SOAK, CHAIN_CAP, CLASH_HEAT, DIFFICULTIES, DIVEBOMB_BONUS,
  ELEMENTS, ENCORE_BONUS, ENERGY_CAP, ENERGY_GAIN, ENERGY_START, ERUPTION_BONUS, FOCUS_GAIN,
  HAND_SIZE, HEALING_RAIN_HEAL, LONGSHOT_BONUS, MOMENTUM_CAP, PHOTOSYNTHESIS_HEAL, REBIRTH_HEAL,
  REEF_HEAL, REEF_SOAK, ROOT_MEMORY_BONUS, SPARK_BITE_DAMAGE, START_HP, STATIC_SNAP_BONUS,
  STREAK_FOR_SUN, STREAK_SUN, SUNLANCE_BONUS, THORNS_DAMAGE, THUNDERSTOMP_BONUS,
  THUNDERSTOMP_THRESHOLD, TIE_DAMAGE, UNDERTOW_BONUS, VOLATILE_CAP,
} from './config.js';
import { SKILLS, buildDeck } from './cards.js';
import { makeRandom, shuffle } from './random.js';

export const PHASE_PICK = 'pick'; // waiting for the player to choose a card
export const PHASE_OVER = 'over'; // someone reached 0 life

function makeDuelist(deck, hp = START_HP) {
  return {
    hp,
    maxHp: hp,
    energy: ENERGY_START,
    deck,
    hand: [],
    discard: [],
    lastWinElement: null, // element this duelist won their previous clash with
    lastOutcome: null, // 'win' | 'lose' | 'tie' of their previous clash (Encore)
    lastPlayedElement: null, // element of the last card they played (Root Memory)
    clashesWon: 0, // clashes won this duel (Chain Lightning)
    streak: 0, // consecutive clashes won — feeds the Radiance Sun bonus
  };
}

function drawUpTo(duelist, random) {
  while (duelist.hand.length < HAND_SIZE) {
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) return;
      duelist.deck = shuffle(duelist.discard.splice(0), random);
    }
    duelist.hand.push(duelist.deck.pop());
  }
}

// A fresh duel. `seed` decides both decks and every AI whim; `difficulty`
// is a key of DIFFICULTIES and shapes both Sorin's brain and his life total.
export function newMatch(seed, difficulty = 'noon') {
  const random = makeRandom(seed);
  const player = makeDuelist(shuffle(buildDeck(), random));
  const rival = makeDuelist(shuffle(buildDeck(), random), DIFFICULTIES[difficulty].rivalHp);
  drawUpTo(player, random);
  drawUpTo(rival, random);
  return {
    seed,
    difficulty,
    random,
    round: 1,
    phase: PHASE_PICK,
    player,
    rival,
    clash: null, // the last resolved clash, for the arena and the log
    history: [], // elements the player revealed, newest first (the rival reads these)
    log: [], // newest first, capped in pushLog
    winner: null, // 'player' | 'rival' once phase is PHASE_OVER
    focusUsed: false,
  };
}

function pushLog(state, text) {
  state.log.unshift(text);
  if (state.log.length > 7) state.log.length = 7;
}

// Effective Power of `card` for `me` against `foe`'s card, with the reasons
// itemised so the arena can show exactly why a clash went the way it did.
// The Power skills live here; reveal and outcome skills live in resolveClash.
export function effectivePower(card, me, foeCard, foe) {
  const parts = [{ label: 'Power', value: card.power }];
  let total = card.power;
  const add = (label, value) => { total += value; parts.push({ label, value }); };
  if (ELEMENTS[card.element].beats === foeCard.element) {
    add(`${ELEMENTS[card.element].name} beats ${ELEMENTS[foeCard.element].name}`, ADVANTAGE_BONUS);
  }
  if (card.skill === 'encore' && me.lastOutcome === 'lose') add('Encore (lost the last clash)', ENCORE_BONUS);
  if (card.skill === 'momentum') {
    const bonus = Math.min(MOMENTUM_CAP, me.energy);
    if (bonus > 0) add(`Momentum (${me.energy} Sun banked)`, bonus);
  }
  if (card.skill === 'undertow' && me.hp < foe.hp) add('Undertow (behind)', UNDERTOW_BONUS);
  if (card.skill === 'divebomb' && me.hp > foe.hp) add('Divebomb (ahead)', DIVEBOMB_BONUS);
  if (card.skill === 'longshot' && foeCard.cost > card.cost) add('Longshot (cheaper card)', LONGSHOT_BONUS);
  if (card.skill === 'root-memory' && me.lastPlayedElement === 'grove') add('Root Memory (Grove before)', ROOT_MEMORY_BONUS);
  if (card.skill === 'volatile') {
    const bonus = Math.min(VOLATILE_CAP, Math.floor(me.discard.length / 2));
    if (bonus > 0) add(`Volatile (${me.discard.length} in discard)`, bonus);
  }
  return { total, parts };
}

// Bank Sun for a duelist (capped), noting it on the clash when it lands.
function gainSun(duelist, amount, clash, side) {
  const real = Math.min(amount, ENERGY_CAP - duelist.energy);
  duelist.energy += real;
  if (real > 0) clash.notes.push(`${side === 'player' ? 'You gain' : 'Rival gains'} +${real} Sun`);
  return real;
}

// Reveal skills: they fire the moment a card is shown, before Power is
// compared — heals and Sun for the owner, a singe for the Cinder Imp.
function revealSkill(card, me, foe, clash, side) {
  const healedKey = side === 'player' ? 'playerHealed' : 'rivalHealed';
  if (card.skill === 'healing-rain') clash[healedKey] += heal(me, HEALING_RAIN_HEAL, clash, side);
  if (card.skill === 'photosynthesis') {
    clash[healedKey] += heal(me, PHOTOSYNTHESIS_HEAL, clash, side);
    gainSun(me, 1, clash, side);
  }
  if (card.skill === 'splash') gainSun(me, 1, clash, side);
  if (card.skill === 'spark-bite') {
    foe.hp = Math.max(0, foe.hp - SPARK_BITE_DAMAGE);
    if (side === 'player') clash.rivalDamage += SPARK_BITE_DAMAGE;
    else clash.playerDamage += SPARK_BITE_DAMAGE;
    clash.notes.push(`Spark Bite singes for ${SPARK_BITE_DAMAGE}`);
  }
}

// The three soak skills and how much each blunts a lost clash.
const SOAKS = { bulwark: BULWARK_SOAK, 'reef-wall': REEF_SOAK, 'aegis-charge': AEGIS_SOAK };

// Resolve one clash: `playerCard` and `rivalCard` are already out of hand and
// paid for. Mutates state, returns the clash record the arena animates.
export function resolveClash(state, playerCard, rivalCard) {
  const p = state.player;
  const r = state.rival;
  const clash = {
    round: state.round,
    playerCard, rivalCard,
    playerPower: null, rivalPower: null,
    playerDamage: 0, rivalDamage: 0,
    playerHealed: 0, rivalHealed: 0,
    outcome: 'tie',
    notes: [],
  };
  revealSkill(playerCard, p, r, clash, 'player');
  revealSkill(rivalCard, r, p, clash, 'rival');

  const pPow = effectivePower(playerCard, p, rivalCard, r);
  const rPow = effectivePower(rivalCard, r, playerCard, p);
  clash.playerPower = pPow;
  clash.rivalPower = rPow;

  if (pPow.total !== rPow.total) {
    const playerWon = pPow.total > rPow.total;
    const winner = playerWon ? p : r;
    const loser = playerWon ? r : p;
    const winCard = playerWon ? playerCard : rivalCard;
    const loseCard = playerWon ? rivalCard : playerCard;
    const winSide = playerWon ? 'player' : 'rival';
    const loseSide = playerWon ? 'rival' : 'player';
    let damage = Math.abs(pPow.total - rPow.total) + CLASH_HEAT;
    // Soak skills blunt the loss — unless the winner carries a Sunlance.
    if (SOAKS[loseCard.skill] && winCard.skill !== 'sunlance') {
      const soaked = Math.min(SOAKS[loseCard.skill], damage);
      damage -= soaked;
      clash.notes.push(`${SKILLS[loseCard.skill].name} soaked ${soaked}`);
    } else if (SOAKS[loseCard.skill] && winCard.skill === 'sunlance') {
      clash.notes.push('Sunlance pierced the soak');
    }
    // Winner skills pile extra damage onto the blow.
    if (winCard.skill === 'eruption') { damage += ERUPTION_BONUS; clash.notes.push(`Eruption +${ERUPTION_BONUS} damage`); }
    if (winCard.skill === 'sunlance') { damage += SUNLANCE_BONUS; clash.notes.push(`Sunlance +${SUNLANCE_BONUS} damage`); }
    if (winCard.skill === 'thunderstomp' && loser.hp <= THUNDERSTOMP_THRESHOLD) {
      damage += THUNDERSTOMP_BONUS;
      clash.notes.push(`Thunderstomp +${THUNDERSTOMP_BONUS} damage`);
    }
    if (winCard.skill === 'chain') {
      const extra = Math.min(CHAIN_CAP, winner.clashesWon);
      if (extra > 0) { damage += extra; clash.notes.push(`Chain Lightning +${extra} damage`); }
    }
    loser.hp = Math.max(0, loser.hp - damage);
    if (playerWon) clash.rivalDamage += damage; else clash.playerDamage += damage;
    clash.outcome = playerWon ? 'player' : 'rival';
    // Loser skills answer back: rebirth and reef healing, an aegis refund,
    // and thorns that bite the winner.
    if (loseCard.skill === 'rebirth' || loseCard.skill === 'reef-wall') {
      const amount = loseCard.skill === 'rebirth' ? REBIRTH_HEAL : REEF_HEAL;
      const healed = heal(loser, amount, clash, loseSide);
      if (playerWon) clash.rivalHealed += healed; else clash.playerHealed += healed;
    }
    if (loseCard.skill === 'aegis-charge') gainSun(loser, 1, clash, loseSide);
    if (loseCard.skill === 'thorns') {
      winner.hp = Math.max(0, winner.hp - THORNS_DAMAGE);
      if (playerWon) clash.playerDamage += THORNS_DAMAGE; else clash.rivalDamage += THORNS_DAMAGE;
      clash.notes.push(`Thorns bite the winner for ${THORNS_DAMAGE}`);
    }
    // Winner skills feed on the win: stolen Sun, a good boy's prize, a feast.
    if (winCard.skill === 'constrict') {
      const drained = Math.min(1, loser.energy);
      loser.energy -= drained;
      if (drained > 0) clash.notes.push('Constrict drains 1 Sun');
    }
    if (winCard.skill === 'good-boy') gainSun(winner, 1, clash, winSide);
    if (winCard.skill === 'feast-deep' && damage > 0) {
      const healed = heal(winner, Math.floor(damage / 3), clash, winSide);
      if (playerWon) clash.playerHealed += healed; else clash.rivalHealed += healed;
    }
    winner.lastWinElement = winCard.element;
    loser.lastWinElement = null;
    winner.streak += 1;
    loser.streak = 0;
    winner.clashesWon += 1;
    winner.lastOutcome = 'win';
    loser.lastOutcome = 'lose';
    if (winner.streak > 0 && winner.streak % STREAK_FOR_SUN === 0) {
      clash.notes.push(`Radiance! ${playerWon ? 'Your' : "Sorin's"} ${winner.streak}-win streak feeds +${STREAK_SUN} Sun`);
      clash.streakSun = playerWon ? 'player' : 'rival';
    }
  } else {
    let pDmg = TIE_DAMAGE;
    let rDmg = TIE_DAMAGE;
    if (playerCard.skill === 'static-snap') { rDmg += STATIC_SNAP_BONUS; clash.notes.push('Static Snap zaps Sorin'); }
    if (rivalCard.skill === 'static-snap') { pDmg += STATIC_SNAP_BONUS; clash.notes.push('Static Snap zaps you'); }
    p.hp = Math.max(0, p.hp - pDmg);
    r.hp = Math.max(0, r.hp - rDmg);
    clash.playerDamage += pDmg;
    clash.rivalDamage += rDmg;
    clash.notes.push('Dead even — sparks bite both duelists');
    p.lastWinElement = null;
    r.lastWinElement = null;
    p.streak = 0;
    r.streak = 0;
    p.lastOutcome = 'tie';
    r.lastOutcome = 'tie';
  }

  p.lastPlayedElement = playerCard.element;
  r.lastPlayedElement = rivalCard.element;
  p.discard.push(playerCard);
  r.discard.push(rivalCard);
  state.history.unshift(playerCard.element);
  state.clash = clash;
  pushLog(state, describeClash(clash));
  finishRound(state);
  return clash;
}

function heal(duelist, amount, clash, side) {
  const real = Math.min(amount, duelist.maxHp - duelist.hp);
  duelist.hp += real;
  if (real > 0) clash.notes.push(`${side === 'player' ? 'You heal' : 'Rival heals'} ${real}`);
  return real;
}

function describeClash(clash) {
  const p = `${clash.playerCard.name} ${clash.playerPower.total}`;
  const r = `${clash.rivalCard.name} ${clash.rivalPower.total}`;
  if (clash.outcome === 'tie') return `R${clash.round}: ${p} ⚡ ${r} — tie, both take ${TIE_DAMAGE}`;
  const dmg = clash.outcome === 'player' ? clash.rivalDamage : clash.playerDamage;
  return `R${clash.round}: ${p} ⚡ ${r} — ${clash.outcome === 'player' ? 'you deal' : 'rival deals'} ${dmg}`;
}

// After a clash: check for a winner, else bank energy and refill hands.
function finishRound(state) {
  const p = state.player;
  const r = state.rival;
  if (p.hp <= 0 || r.hp <= 0) {
    state.phase = PHASE_OVER;
    state.winner = p.hp === r.hp ? (state.clash.playerPower.total >= state.clash.rivalPower.total ? 'player' : 'rival') : (p.hp > 0 ? 'player' : 'rival');
    return;
  }
  state.round += 1;
  for (const d of [p, r]) {
    d.energy = Math.min(ENERGY_CAP, d.energy + ENERGY_GAIN);
    drawUpTo(d, state.random);
  }
  // Radiance: a duelist on a streak converts it into banked Sun.
  if (state.clash && state.clash.streakSun) {
    const d = state.clash.streakSun === 'player' ? p : r;
    d.energy = Math.min(ENERGY_CAP, d.energy + STREAK_SUN);
  }
}

// Can the player afford at least one card in hand?
export function anyAffordable(duelist) {
  return duelist.hand.some((card) => card.cost <= duelist.energy);
}

// Focus: discard a card from hand to gain energy, then draw a replacement.
// Always legal while picking, and repeatable — a duelist whose whole hand
// is priced out focuses until something is affordable (energy caps at 5,
// the dearest card costs 3, so this always terminates).
export function focusCard(state, who, handIndex) {
  const d = state[who];
  const [card] = d.hand.splice(handIndex, 1);
  d.discard.push(card);
  d.energy = Math.min(ENERGY_CAP, d.energy + FOCUS_GAIN);
  pushLog(state, `${who === 'player' ? 'You focus' : 'Sorin focuses'}: ${card.name} becomes +${FOCUS_GAIN} Sun`);
  drawUpTo(d, state.random);
  return card;
}

export function applyFocus(state, handIndex) {
  return focusCard(state, 'player', handIndex);
}

// Pay for and remove a card from a duelist's hand; returns the card.
export function playFromHand(duelist, handIndex) {
  const card = duelist.hand[handIndex];
  duelist.energy -= card.cost;
  duelist.hand.splice(handIndex, 1);
  return card;
}
