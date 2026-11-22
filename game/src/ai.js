// The rival duelist, SORIN OF THE PALE TOWER: a readable opponent.
// He plays the card that scores best against what you have been doing —
// he counts the elements you played in the last three clashes and leans
// into their counter — but he is not a machine: a little noise, a soft
// spot for finishing blows, and a habit of hiding behind his soaks when hurt.
//
// His intention is honestly telegraphed. Before each clash the game asks
// Sorin what he is *leaning* toward (the element of his most likely pick),
// shows it to the player as a hint, and his real pick is drawn from that
// same leaning most of the time — read the hint, counter it, and you will
// beat him; ignore it and he will farm you.

import { DIFFICULTIES, ELEMENTS } from './config.js';
import { effectivePower } from './state.js';

// Score one candidate card for Sorin against the player's recent habits.
// The difficulty dial scales how hard he counters and how much he improvises.
function scoreCard(state, card, recentPlayerElements) {
  const rival = state.rival;
  const player = state.player;
  const dial = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.noon;
  let score = card.power * 2 - card.cost * 3;
  // Element counter-play: how often would this element beat what you play?
  for (const el of recentPlayerElements) {
    if (ELEMENTS[card.element].beats === el) score += 4 * dial.counter;
    if (ELEMENTS[el].beats === card.element) score -= 3 * dial.counter;
  }
  // Skill set-ups he can read off the table: a comeback Encore, an Undertow
  // while behind, a Divebomb while ahead, a banked-Sun Momentum.
  if (card.skill === 'encore' && rival.lastOutcome === 'lose') score += 5;
  if (card.skill === 'undertow' && rival.hp < player.hp) score += 5;
  if (card.skill === 'divebomb' && rival.hp > player.hp) score += 5;
  if (card.skill === 'momentum') score += Math.min(3, rival.energy);
  if (card.skill === 'root-memory' && rival.lastPlayedElement === 'grove') score += 4;
  // Hurt Sorin values his soaks and heals; healthy Sorin saves them.
  if ((card.skill === 'bulwark' || card.skill === 'reef-wall' || card.skill === 'aegis-charge'
    || card.skill === 'healing-rain' || card.skill === 'rebirth') && rival.hp <= 10) score += 5;
  if (card.skill === 'feast-deep' && rival.hp <= 12) score += 2;
  // A Thunderstomp finisher is never wasted on a healthy duelist.
  if (card.skill === 'thunderstomp' && player.hp <= 8) score += 4;
  // A finishing blow is never wasted.
  if (card.power >= player.hp + 6 && card.cost <= rival.energy) score += 6;
  // Don't burn the whole sun on a weak card early.
  if (state.round <= 2 && card.cost >= 3 && card.power < 8) score -= 4;
  return score + state.random() * dial.noise; // a human amount of whim
}

// Rank Sorin's affordable cards (or Focus, when he cannot afford any).
function rankPlays(state, recentPlayerElements) {
  const rival = state.rival;
  return rival.hand
    .map((card, index) => ({ card, index, score: scoreCard(state, card, recentPlayerElements) }))
    .filter((play) => play.card.cost <= rival.energy)
    .sort((a, b) => b.score - a.score);
}

// The elements the player revealed in the last three clashes, newest first.
export function recentPlayerElements(state) {
  const out = [];
  // The log only keeps text; track history on the state instead.
  for (const entry of state.history ?? []) out.push(entry);
  return out.slice(0, 3);
}

// What Sorin is leaning toward this round: the element of his likeliest
// pick. Returned before the player commits, and shown as the hint.
export function rivalLean(state) {
  const ranked = rankPlays(state, recentPlayerElements(state));
  if (ranked.length === 0) return null; // he must Focus — the hint says so
  return ranked[0].card.element;
}

// Sorin's actual pick: usually his best-scoring card, sometimes the
// second — which is why the lean is a strong hint, never a promise.
// Returns a hand index, or -1 when he must Focus (discard for energy).
export function rivalPick(state) {
  const ranked = rankPlays(state, recentPlayerElements(state));
  if (ranked.length === 0) return -1;
  const dial = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.noon;
  if (ranked.length > 1 && state.random() < dial.secondPickChance) return ranked[1].index;
  return ranked[0].index;
}

// Sorin's voice: a short line that reflects the table — ahead, behind,
// hurt, or one clash from the end. Shown under his portrait each round,
// so his strategy has a face: he taunts when farming you and goes quiet
// when he is the one being farmed.
const TAUNTS = {
  ahead: ['"Your light flickers, Dawnkeeper."', '"The Tower has seen a thousand dawns. Yours is dim."', '"Come. Feed my streak."'],
  behind: ['"Luck. Nothing but luck."', '"The sun climbs for me too…"', '"I have buried better duelists than you."'],
  hurt: ['"You dare scratch the Pale Tower?"', '"Enough. No more mercy."'],
  even: ['"A fair sky. Let us ruin it."', '"Show me a light worth fearing."', '"The wheel turns. So shall you."'],
  matchPoint: ['"One clash from your sunrise. Shame it sets here."', '"Kneel, and the dawn may spare you."'],
};

export function rivalTaunt(state) {
  const p = state.player;
  const r = state.rival;
  const pool = p.hp <= 5 || r.hp <= 5 ? TAUNTS.matchPoint
    : r.hp <= 9 ? TAUNTS.hurt
      : r.hp - p.hp >= 6 ? TAUNTS.ahead
        : p.hp - r.hp >= 6 ? TAUNTS.behind
          : TAUNTS.even;
  return pool[Math.floor(state.random() * pool.length)];
}

// When Sorin must Focus he throws away his weakest card.
export function rivalFocusIndex(state) {
  let worst = 0;
  state.rival.hand.forEach((card, index) => {
    if (card.power < state.rival.hand[worst].power) worst = index;
  });
  return worst;
}
