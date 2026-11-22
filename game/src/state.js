// AURORA CLASH rules engine: pure game state and clash resolution.
// No DOM, no timers — main.js drives turns, render.js draws what is here,
// and shots.js stages fixed states for the screenshots.
//
// A match is a sequence of clashes. Each clash both duelists play one card
// face down, then reveal: the higher effective Power deals the difference
// as damage. Element advantage, Surge and Echo raise Power; Guard soaks
// damage; Pierce ignores Guard; Drain and Mend heal. First to 0 life loses.

import {
  ADVANTAGE_BONUS, CLASH_HEAT, DIFFICULTIES, DRAIN_HEAL, ECHO_BONUS, ELEMENTS, ENERGY_CAP, ENERGY_GAIN,
  ENERGY_START, FOCUS_GAIN, GUARD_SOAK, HAND_SIZE, MEND_HEAL, START_HP,
  STREAK_FOR_SUN, STREAK_SUN, SURGE_BONUS, TIE_DAMAGE,
} from './config.js';
import { buildDeck } from './cards.js';
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
    lastWinElement: null, // element this duelist won their previous clash with (Echo)
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
export function effectivePower(card, me, foeCard, foe) {
  const parts = [{ label: 'Power', value: card.power }];
  let total = card.power;
  if (ELEMENTS[card.element].beats === foeCard.element) {
    total += ADVANTAGE_BONUS;
    parts.push({ label: `${ELEMENTS[card.element].name} beats ${ELEMENTS[foeCard.element].name}`, value: ADVANTAGE_BONUS });
  }
  if (card.ability === 'surge' && me.hp < foe.hp) {
    total += SURGE_BONUS;
    parts.push({ label: 'Surge (behind)', value: SURGE_BONUS });
  }
  if (card.ability === 'echo' && me.lastWinElement === card.element) {
    total += ECHO_BONUS;
    parts.push({ label: 'Echo (same light won)', value: ECHO_BONUS });
  }
  return { total, parts };
}

// Resolve one clash: `playerCard` and `rivalCard` are already out of hand and
// paid for. Mutates state, returns the clash record the arena animates.
export function resolveClash(state, playerCard, rivalCard) {
  const p = state.player;
  const r = state.rival;
  const pPow = effectivePower(playerCard, p, rivalCard, r);
  const rPow = effectivePower(rivalCard, r, playerCard, p);
  const clash = {
    round: state.round,
    playerCard, rivalCard,
    playerPower: pPow, rivalPower: rPow,
    playerDamage: 0, rivalDamage: 0,
    playerHealed: 0, rivalHealed: 0,
    outcome: 'tie',
    notes: [],
  };
  // Mend heals on reveal, win or lose.
  if (playerCard.ability === 'mend') clash.playerHealed += heal(p, MEND_HEAL, clash, 'player');
  if (rivalCard.ability === 'mend') clash.rivalHealed += heal(r, MEND_HEAL, clash, 'rival');

  if (pPow.total !== rPow.total) {
    const playerWon = pPow.total > rPow.total;
    const winner = playerWon ? p : r;
    const loser = playerWon ? r : p;
    const winCard = playerWon ? playerCard : rivalCard;
    const loseCard = playerWon ? rivalCard : playerCard;
    let damage = Math.abs(pPow.total - rPow.total) + CLASH_HEAT;
    if (loseCard.ability === 'guard' && winCard.ability !== 'pierce') {
      const soaked = Math.min(GUARD_SOAK, damage);
      damage -= soaked;
      clash.notes.push(`Guard soaked ${soaked}`);
    } else if (loseCard.ability === 'guard' && winCard.ability === 'pierce') {
      clash.notes.push('Pierce cut through Guard');
    }
    loser.hp = Math.max(0, loser.hp - damage);
    if (playerWon) clash.rivalDamage = damage; else clash.playerDamage = damage;
    clash.outcome = playerWon ? 'player' : 'rival';
    winner.lastWinElement = winCard.element;
    loser.lastWinElement = null;
    winner.streak += 1;
    loser.streak = 0;
    if (winner.streak > 0 && winner.streak % STREAK_FOR_SUN === 0) {
      clash.notes.push(`Radiance! ${playerWon ? 'Your' : "Sorin's"} ${winner.streak}-win streak feeds +${STREAK_SUN} Sun`);
      clash.streakSun = playerWon ? 'player' : 'rival';
    }
    if (winCard.ability === 'drain' && damage > 0) {
      if (playerWon) clash.playerHealed += heal(p, DRAIN_HEAL, clash, 'player');
      else clash.rivalHealed += heal(r, DRAIN_HEAL, clash, 'rival');
    }
  } else {
    p.hp = Math.max(0, p.hp - TIE_DAMAGE);
    r.hp = Math.max(0, r.hp - TIE_DAMAGE);
    clash.playerDamage = TIE_DAMAGE;
    clash.rivalDamage = TIE_DAMAGE;
    clash.notes.push('Dead even — sparks bite both duelists');
    p.lastWinElement = null;
    r.lastWinElement = null;
    p.streak = 0;
    r.streak = 0;
  }

  p.discard.push(playerCard);
  r.discard.push(rivalCard);
  state.history.unshift(playerCard.element);
  state.clash = clash;
  pushLog(state, describeClash(clash));
  finishRound(state);
  return clash;
}

function heal(duelist, amount, clash, side) {
  const real = Math.min(amount, START_HP - duelist.hp);
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
