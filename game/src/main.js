// AURORA CLASH — game flow: menus, the match series, pauses and screens.
// state.js holds the duel rules, ai.js holds Sorin, match.js holds the
// series/score/records, render.js draws, anim.js adds the juice, audio.js
// the sound. This file only conducts — every button and key lands here.

import { rivalLean, rivalPick, rivalFocusIndex, rivalTaunt } from './ai.js';
import { confettiBurst, dealIn, flipArenaCards, floatNumber, shakeLoser } from './anim.js';
import { isMuted, sfx, toggleMute } from './audio.js';
import { CATALOGUE } from './cards.js';
import { ELEMENTS, SCORE } from './config.js';
import { attachKeyboard } from './input.js';
import {
  duelDamageMark, loadRecords, newSeries, nextRank, perfectDuelBonus,
  rankForScore, recordMatch, scoreClash, scoreDuel,
} from './match.js';
import { freshSeed } from './random.js';
import {
  renderArena, renderBars, renderCollection, renderHand, renderHint,
  renderLog, renderRecords, renderRivalHand, renderScoreboard, renderTaunt,
  renderTitleFan, renderWheel,
} from './render.js';
import { stageShot } from './shots.js';
import {
  PHASE_OVER, PHASE_PICK, anyAffordable, applyFocus, focusCard, newMatch,
  playFromHand, resolveClash,
} from './state.js';

const $ = (id) => document.getElementById(id);
const OVERLAYS = ['title-screen', 'howto-screen', 'collection-screen', 'pause-screen', 'duel-screen', 'end-screen'];

let difficulty = 'noon';
let series = null; // the best-of-three match (match.js)
let state = null; // the current duel (state.js)
let duelMark = null; // damage totals when this duel began (perfect-duel bonus)
let selected = null;
let lean = null;
let busy = false;
let paused = false;
const ui = { revealed: false, committed: false };

function hideOverlays() {
  for (const id of OVERLAYS) $(id).classList.add('hidden');
}

function renderAll() {
  renderBars(state);
  renderRivalHand(state);
  renderHand(state, selected, onPick);
  renderArena(state, ui);
  renderLog(state);
  renderHint(lean);
  renderScoreboard(series, state);
  updateActions();
}

function renderRecordsPanel() {
  const records = loadRecords();
  renderRecords(records, rankForScore(records.bestScore), nextRank(records.bestScore));
}

function updateActions() {
  const clashBtn = $('btn-clash');
  const card = selected === null ? null : state.player.hand[selected];
  const canClash = !busy && !paused && state.phase === PHASE_PICK && card !== null && card.cost <= state.player.energy;
  clashBtn.disabled = !canClash;
  $('btn-focus').disabled = busy || paused || state.phase !== PHASE_PICK || selected === null;
  const tip = $('arena-tip');
  if (state.phase === PHASE_OVER) tip.textContent = 'The duel is decided!';
  else if (paused) tip.textContent = 'Paused — Esc to resume';
  else if (busy) tip.textContent = 'Revealing…';
  else if (card === null) tip.textContent = anyAffordable(state.player)
    ? 'Pick a card from your hand'
    : 'No card you can afford — Focus a card for +1 Sun (F)';
  else if (card.cost > state.player.energy) tip.textContent = `${card.name} costs ${card.cost} Sun — you have ${state.player.energy}. Focus it or pick another.`;
  else {
    const counter = lean !== null && ELEMENTS[card.element].beats === lean
      ? ` — and ${ELEMENTS[card.element].name} beats Sorin's ${ELEMENTS[lean].name} lean! +3`
      : '';
    tip.textContent = `${card.name}: ${card.power} Power, ${card.cost} Sun${counter}. Hit CLASH!`;
  }
}

// ---- match / duel flow ----
function startSeries() {
  series = newSeries(difficulty);
  startDuel();
}

function startDuel() {
  state = newMatch(freshSeed(), difficulty);
  duelMark = duelDamageMark(series, state);
  selected = null;
  busy = false;
  paused = false;
  ui.revealed = false;
  ui.committed = false;
  lean = rivalLean(state);
  hideOverlays();
  renderAll();
  renderTaunt(rivalTaunt(state));
  dealIn();
  sfx.deal();
}

function endDuel() {
  const perfect = state.winner === 'player' ? perfectDuelBonus(series, duelMark) : 0;
  series.score += perfect;
  const bonus = scoreDuel(series, state) + perfect;
  renderAll();
  if (series.over) {
    const { records, isBest } = recordMatch(series);
    renderRecordsPanel();
    showMatchEnd(bonus, perfect, isBest, records);
  } else {
    showDuelEnd(bonus, perfect);
  }
}

function showDuelEnd(bonus, perfect) {
  const won = state.winner === 'player';
  $('duel-art').textContent = won ? '🏆' : '🦉';
  $('duel-title').textContent = won ? 'DUEL WON!' : 'DUEL LOST';
  $('duel-title').classList.toggle('won', won);
  $('duel-line').textContent = won
    ? `Sorin staggers — duel ${series.duelNumber - 1} is yours. ${series.rivalDuels >= 1 ? 'The series is level: the next duel takes the dawn!' : 'One more duel wins the match.'}`
    : `The Pale Tower takes duel ${series.duelNumber - 1}. ${series.playerDuels >= 1 ? 'The series is level: the next duel takes the dawn!' : 'Win the next two duels or the dawn is his.'}`;
  $('duel-stats').innerHTML =
    `<span class="stat">⚔ Duels — you ${series.playerDuels} · Sorin ${series.rivalDuels}</span>`
    + `<span class="stat">💥 ${series.damageDealt} damage this match</span>`
    + (perfect > 0 ? `<span class="stat">✨ Flawless duel! +${perfect}</span>` : '')
    + `<span class="stat">★ Score ${series.score}</span>`;
  $('btn-next-duel').textContent = series.playerDuels + series.rivalDuels >= 2 ? '▶  THE DECIDING DUEL' : '▶  NEXT DUEL';
  $('duel-screen').classList.remove('hidden');
  if (won) sfx.win(); else sfx.lose();
}

function showMatchEnd(bonus, perfect, isBest, records) {
  const won = series.champion === 'player';
  $('end-title').textContent = won ? 'DAWN TAKEN!' : 'THE TOWER STANDS';
  $('end-title').classList.toggle('won', won);
  $('end-art').textContent = won ? '🌅' : '🌇';
  $('end-line').textContent = won
    ? `The aurora crowns you, Dawnkeeper — the series is yours ${series.playerDuels}–${series.rivalDuels}.`
    : `Sorin keeps the dawn, ${series.rivalDuels}–${series.playerDuels}. The wheel turns; challenge him again.`;
  $('end-stats').innerHTML =
    `<span class="stat">👑 Duels ${series.playerDuels}–${series.rivalDuels}</span>`
    + `<span class="stat">💥 ${series.damageDealt} damage dealt</span>`
    + `<span class="stat">🌟 Biggest hit ${series.biggestHit}</span>`
    + `<span class="stat">🏅 ${rankForScore(series.score).title}</span>`;
  const damagePts = series.damageDealt * SCORE.perDamage;
  const clashPts = series.clashesWon * SCORE.perClashWon;
  const matchPts = won ? SCORE.matchWin : 0;
  const duelPts = series.score - damagePts - clashPts - matchPts;
  $('end-breakdown').innerHTML =
    `<div class="row"><span>Damage dealt (${series.damageDealt} × ${SCORE.perDamage})</span><b>${damagePts}</b></div>`
    + `<div class="row"><span>Clashes won (${series.clashesWon} × ${SCORE.perClashWon})</span><b>${clashPts}</b></div>`
    + `<div class="row"><span>Duel wins, life left${perfect > 0 ? ', flawless bonus' : ''}</span><b>${duelPts}</b></div>`
    + (won ? `<div class="row"><span>Match champion bonus</span><b>${matchPts}</b></div>` : '')
    + `<div class="row total"><span>FINAL SCORE</span><b>★ ${series.score}</b></div>`
    + (isBest ? '<div class="new-best">🎉 New personal best!</div>' : `<div>Best score so far: ${records.bestScore}</div>`);
  $('end-screen').classList.remove('hidden');
  if (won) { sfx.win(); confettiBurst(); } else sfx.lose();
}

// ---- turn actions ----
function onPick(index) {
  if (busy || paused || !state || state.phase !== PHASE_PICK) return;
  if (index >= state.player.hand.length) return;
  selected = selected === index ? null : index;
  sfx.pick();
  renderAll();
}

function onFocus() {
  if (busy || paused || !state || state.phase !== PHASE_PICK || selected === null) return;
  applyFocus(state, selected);
  selected = null;
  sfx.focus();
  renderAll();
}

function onClash() {
  if (busy || paused || !state || state.phase !== PHASE_PICK || selected === null) return;
  const card = state.player.hand[selected];
  if (!card || card.cost > state.player.energy) return;
  busy = true;

  // Sorin commits: he focuses (repeatedly if needed) when his hand is
  // priced out of his Sun, exactly as the player may.
  let rivalIndex = rivalPick(state);
  for (let tries = 0; rivalIndex === -1 && tries < 6; tries += 1) {
    focusCard(state, 'rival', rivalFocusIndex(state));
    rivalIndex = rivalPick(state);
  }
  const playerCard = playFromHand(state.player, selected);
  const rivalCard = playFromHand(state.rival, rivalIndex);
  selected = null;
  ui.committed = true;
  ui.revealed = false;
  renderAll();
  sfx.flip();

  setTimeout(() => {
    const clash = resolveClash(state, playerCard, rivalCard);
    scoreClash(series, clash);
    ui.committed = false;
    ui.revealed = true;
    renderAll();
    flipArenaCards();
    shakeLoser(clash.outcome);
    if (clash.outcome === 'tie') sfx.tie();
    else sfx.hit(Math.max(clash.playerDamage, clash.rivalDamage) >= 6);
    if (clash.rivalDamage > 0) floatNumber('rival-zone', `-${clash.rivalDamage}`, 'dmg');
    if (clash.playerDamage > 0) floatNumber('player-zone', `-${clash.playerDamage}`, 'dmg');
    if (clash.playerHealed > 0) floatNumber('player-zone', `+${clash.playerHealed}`, 'heal');
    if (clash.rivalHealed > 0) floatNumber('rival-zone', `+${clash.rivalHealed}`, 'heal');
    if (clash.playerHealed > 0 || clash.rivalHealed > 0) sfx.heal();
    busy = false;
    if (state.phase === PHASE_OVER) setTimeout(endDuel, 1400);
    else {
      lean = rivalLean(state);
      renderAll();
      renderTaunt(rivalTaunt(state));
    }
  }, 620);
}

// ---- pause / menus ----
function togglePause() {
  if (!state || state.phase === PHASE_OVER || busy) return;
  if (!$('title-screen').classList.contains('hidden')) return;
  paused = !paused;
  $('pause-screen').classList.toggle('hidden', !paused);
  if (paused) $('pause-sub').textContent = `Duel ${series.duelNumber} · Round ${state.round} · Score ★ ${series.score} — Sorin waits, politely furious.`;
  updateActions();
}

function showTitle() {
  hideOverlays();
  paused = false;
  $('title-screen').classList.remove('hidden');
  renderRecordsPanel();
}

// ---- wiring ----
function boot() {
  renderWheel();
  renderTitleFan(['magma-brute', 'deep-leviathan', 'elder-treant', 'thunder-giant']
    .map((id) => CATALOGUE.find((card) => card.id === id)));
  renderCollection(CATALOGUE);
  renderRecordsPanel();

  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    document.body.classList.add('shot');
    const staged = stageShot(shot, Number(params.get('seed') ?? 1));
    series = staged.series;
    state = staged.state;
    lean = staged.lean;
    ui.revealed = staged.ui.revealed;
    ui.committed = staged.ui.committed;
    hideOverlays();
    renderAll();
    renderTaunt(staged.taunt);
    if (staged.screen === 'title') $('title-screen').classList.remove('hidden');
    if (staged.screen === 'duel-end') showDuelEnd(staged.bonus, staged.perfect);
    if (staged.screen === 'match-end') showMatchEnd(staged.bonus, staged.perfect, staged.isBest, loadRecords());
    return;
  }

  // A live exhibition duel sits behind the title screen, mid-table.
  series = newSeries(difficulty);
  state = newMatch(freshSeed(), difficulty);
  duelMark = duelDamageMark(series, state);
  lean = rivalLean(state);
  renderAll();
  renderTaunt(rivalTaunt(state));

  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      difficulty = btn.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach((b) => b.classList.toggle('selected', b === btn));
      series = newSeries(difficulty);
      state = newMatch(freshSeed(), difficulty);
      duelMark = duelDamageMark(series, state);
      lean = rivalLean(state);
      renderAll();
      renderTaunt(rivalTaunt(state));
      sfx.pick();
    });
  });
  $('btn-play').addEventListener('click', startSeries);
  $('btn-howto').addEventListener('click', () => $('howto-screen').classList.remove('hidden'));
  $('btn-collection').addEventListener('click', () => $('collection-screen').classList.remove('hidden'));
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => $(btn.dataset.close).classList.add('hidden'));
  });
  $('btn-clash').addEventListener('click', onClash);
  $('btn-focus').addEventListener('click', onFocus);
  $('btn-pause').addEventListener('click', togglePause);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-pause-howto').addEventListener('click', () => $('howto-screen').classList.remove('hidden'));
  $('btn-pause-restart').addEventListener('click', startSeries);
  $('btn-quit').addEventListener('click', showTitle);
  $('btn-next-duel').addEventListener('click', startDuel);
  $('btn-again').addEventListener('click', startSeries);
  $('btn-end-title-screen').addEventListener('click', showTitle);
  $('btn-restart').addEventListener('click', startSeries);
  $('btn-sound').addEventListener('click', () => {
    toggleMute();
    $('btn-sound').textContent = isMuted() ? '♪ Muted' : '♪ Sound';
  });
  attachKeyboard({
    pick: onPick,
    clash: onClash,
    focus: onFocus,
    mute: () => $('btn-sound').click(),
    restart: startSeries,
    title: showTitle,
    pause: togglePause,
  });
}

boot();
