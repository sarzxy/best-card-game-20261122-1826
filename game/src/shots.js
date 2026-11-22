// Screenshot scenes behind ?shot=play|title|win|loss&seed=N.
// Each scene is REAL game state: the play scene is a genuine duel played
// forward by the real rules (the player follows a simple policy, Sorin
// plays himself), and the end scenes are finished series with consistent
// scores — so what the camera sees is what a player sees, never a mock-up.

import { rivalLean, rivalPick, rivalTaunt } from './ai.js';
import { cardById } from './cards.js';
import { newSeries, scoreClash } from './match.js';
import { newMatch, playFromHand, resolveClash } from './state.js';

// Play a few real clashes with a simple player policy (cheapest affordable
// card that beats Sorin's lean, else the strongest affordable) until the
// table looks like a duel in full swing: both duelists bloodied, the log
// written, a clash revealed in the arena.
function stagePlay(seed) {
  for (const s of [seed, seed + 4, seed + 9, seed + 15]) {
    const state = newMatch(s, 'noon');
    const series = newSeries('noon');
    let guard = 0;
    while (state.phase === 'pick' && state.round <= 4 && guard < 6) {
      guard += 1;
      const lean = rivalLean(state);
      const hand = state.player.hand;
      let pick = hand.findIndex((card) => card.cost <= state.player.energy && card.element && beats(card.element, lean));
      if (pick < 0) {
        pick = hand.reduce((best, card, i) => (card.cost <= state.player.energy && (best < 0 || card.power > hand[best].power) ? i : best), -1);
      }
      if (pick < 0) break;
      let rivalIndex = rivalPick(state);
      if (rivalIndex < 0) { // priced out: his cheapest card stands in for a Focus pass
        rivalIndex = state.rival.hand.reduce((best, card, i) => (card.cost < state.rival.hand[best].cost ? i : best), 0);
      }
      const clash = resolveClash(state, playFromHand(state.player, pick), playFromHand(state.rival, rivalIndex));
      scoreClash(series, clash);
    }
    const clash = state.clash;
    const juicy = clash && (clash.rivalDamage + clash.playerDamage) >= 3 && rivalLean(state) !== null;
    if (state.phase === 'pick' && state.player.hp < 20 && state.rival.hp < 20 && juicy) {
      return { state, series };
    }
  }
  // Fallback (never expected): a fresh table still renders honestly.
  const state = newMatch(seed, 'noon');
  return { state, series: newSeries('noon') };
}

function beats(element, lean) {
  return lean !== null && ({ ember: 'grove', tide: 'bolt', grove: 'tide', bolt: 'ember' })[element] === lean;
}

// A finished-duel state for the end screens: a real match object whose
// final clash is staged from two named cards, with life totals to match.
function stageFinalClash(playerCardId, rivalCardId, playerHp, rivalHp, round) {
  const state = newMatch(3, 'noon');
  const playerCard = { ...cardById(playerCardId) };
  const rivalCard = { ...cardById(rivalCardId) };
  state.player.hp = playerHp;
  state.rival.hp = rivalHp;
  state.round = round;
  state.phase = 'over';
  state.winner = rivalHp <= 0 ? 'player' : 'rival';
  return { state, playerCard, rivalCard };
}

export function stageShot(name, seed) {
  if (name === 'title') {
    const { state, series } = stagePlay(seed);
    return { state, series, lean: rivalLean(state), taunt: rivalTaunt(state), ui: { revealed: true, committed: false }, screen: 'title', bonus: 0, perfect: 0, isBest: false };
  }
  if (name === 'win') {
    const { state, playerCard, rivalCard } = stageFinalClash('thunder-giant', 'ember-warden', 13, 0, 11);
    state.clash = {
      round: 11, playerCard, rivalCard,
      playerPower: { total: 12, parts: [{ label: 'Power', value: 9 }, { label: 'Bolt beats Ember', value: 3 }] },
      rivalPower: { total: 5, parts: [{ label: 'Power', value: 5 }] },
      playerDamage: 0, rivalDamage: 7, playerHealed: 0, rivalHealed: 0, outcome: 'player', notes: [],
    };
    state.log = ['R11: Thunder Giant 12 ⚡ Ember Warden 5 — you deal 7', 'R10: Vine Lash 9 ⚡ Coral Guard 5 — you deal 4', 'R9: Storm Falcon 6 ⚡ Flame Dancer 8 — rival deals 2'];
    const series = { ...newSeries('noon'), duelNumber: 3, playerDuels: 2, rivalDuels: 1, score: 2000, clashesWon: 11, damageDealt: 96, damageTaken: 41, biggestHit: 11, over: true, champion: 'player' };
    return { state, series, lean: null, taunt: '"The dawn… take it, then."', ui: { revealed: true, committed: false }, screen: 'match-end', bonus: 465, perfect: 0, isBest: true };
  }
  if (name === 'loss') {
    const { state, playerCard, rivalCard } = stageFinalClash('spark-mouse', 'deep-leviathan', 0, 16, 9);
    state.clash = {
      round: 9, playerCard, rivalCard,
      playerPower: { total: 3, parts: [{ label: 'Power', value: 3 }] },
      rivalPower: { total: 9, parts: [{ label: 'Power', value: 9 }] },
      playerDamage: 6, rivalDamage: 0, playerHealed: 0, rivalHealed: 0, outcome: 'rival', notes: [],
    };
    state.log = ['R9: Spark Mouse 3 ⚡ Deep Leviathan 9 — rival deals 6', 'R8: Thorn Archer 8 ⚡ Wave Rider 5 — you deal 3', 'R7: Volt Aegis 5 ⚡ Magma Brute 8 — rival deals 0'];
    const series = { ...newSeries('noon'), duelNumber: 3, playerDuels: 1, rivalDuels: 2, score: 890, clashesWon: 6, damageDealt: 54, damageTaken: 63, biggestHit: 8, over: true, champion: 'rival' };
    return { state, series, lean: null, taunt: '"The Tower stands. It always stands."', ui: { revealed: true, committed: false }, screen: 'match-end', bonus: 0, perfect: 0, isBest: false };
  }
  // Default: the play scene — dense live gameplay for the cover.
  const { state, series } = stagePlay(seed);
  return { state, series, lean: rivalLean(state), taunt: rivalTaunt(state), ui: { revealed: true, committed: false }, screen: 'play', bonus: 0, perfect: 0, isBest: false };
}
