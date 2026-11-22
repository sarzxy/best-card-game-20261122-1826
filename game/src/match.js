// Match structure and progression: a MATCH is a best-of-three series of
// duels (first to DUELS_TO_WIN_MATCH). Every clash feeds a score; the score
// buys rank titles; and the player's best score, matches won and duels won
// persist between visits in localStorage — the progression system.

import { DUELS_TO_WIN_MATCH, RANKS, SCORE } from './config.js';

const RECORD_KEY = 'aurora-clash-records-v1';

export function newSeries(difficulty) {
  return {
    difficulty,
    duelNumber: 1,
    playerDuels: 0,
    rivalDuels: 0,
    score: 0,
    clashesWon: 0,
    damageDealt: 0,
    damageTaken: 0,
    biggestHit: 0,
    over: false,
    champion: null, // 'player' | 'rival'
  };
}

// Fold one finished clash (the record state.js produced) into the series.
export function scoreClash(series, clash) {
  series.damageDealt += clash.rivalDamage;
  series.damageTaken += clash.playerDamage;
  series.biggestHit = Math.max(series.biggestHit, clash.rivalDamage);
  if (clash.outcome === 'player') series.clashesWon += 1;
  series.score += clash.rivalDamage * SCORE.perDamage
    + (clash.outcome === 'player' ? SCORE.perClashWon : 0);
  return series.score;
}

// Fold one finished duel into the series; returns the duel bonus points.
export function scoreDuel(series, state) {
  const won = state.winner === 'player';
  let bonus = 0;
  if (won) {
    series.playerDuels += 1;
    bonus += SCORE.duelWin + state.player.hp * SCORE.perHpLeft;
  } else {
    series.rivalDuels += 1;
  }
  series.score += bonus;
  if (series.playerDuels >= DUELS_TO_WIN_MATCH) {
    series.over = true;
    series.champion = 'player';
    series.score += SCORE.matchWin;
  } else if (series.rivalDuels >= DUELS_TO_WIN_MATCH) {
    series.over = true;
    series.champion = 'rival';
  }
  series.duelNumber += 1;
  return bonus;
}

// The perfect-duel bonus needs per-duel damage, tracked separately so the
// series totals stay cumulative. Call at duel start and end.
export function duelDamageMark(series, state) {
  return { dealt: series.damageDealt, taken: series.damageTaken };
}

export function perfectDuelBonus(series, mark) {
  return series.damageTaken - mark.taken === 0 ? SCORE.perfectDuel : 0;
}

export function rankForScore(score) {
  let rank = RANKS[0];
  for (const entry of RANKS) if (score >= entry.min) rank = entry;
  return rank;
}

export function nextRank(score) {
  for (const entry of RANKS) if (score < entry.min) return entry;
  return null;
}

// ---- persistent records (best score, crowns, totals) ----
export function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    if (raw) return { bestScore: 0, matchesWon: 0, duelsWon: 0, matchesPlayed: 0, ...JSON.parse(raw) };
  } catch { /* storage unavailable (private mode) — records are a bonus */ }
  return { bestScore: 0, matchesWon: 0, duelsWon: 0, matchesPlayed: 0 };
}

export function saveRecords(records) {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch { /* see loadRecords */ }
}

// Record a finished match; returns the updated records and whether the
// score is a new personal best.
export function recordMatch(series) {
  const records = loadRecords();
  records.matchesPlayed += 1;
  records.duelsWon += series.playerDuels;
  if (series.champion === 'player') records.matchesWon += 1;
  const isBest = series.score > records.bestScore;
  if (isBest) records.bestScore = series.score;
  saveRecords(records);
  return { records, isBest };
}
