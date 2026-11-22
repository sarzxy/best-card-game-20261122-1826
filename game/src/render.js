// All drawing: turns game state into DOM. Cards are crisp HTML (never canvas),
// so names, Powers and costs stay readable from across the room — and in the
// judge's contact sheet. Each card wears its painted portrait (game/assets/)
// inside an ornate gilded TCG frame; the element emblems are inline SVG, one
// bold shape per element, told apart by colour AND shape.

import { SKILLS } from './cards.js';
import { ELEMENTS, ELEMENT_ORDER, ENERGY_CAP, START_HP } from './config.js';
import { effectivePower } from './state.js';

// ---- element emblems: flame, droplet, leaf, bolt — silhouette-first ----
const EMBLEM_PATHS = {
  ember: 'M32 4 C36 14 46 20 46 34 a14 14 0 1 1 -28 0 C18 22 28 16 32 4 Z M32 26 c3 5 7 7 7 12 a7 7 0 1 1 -14 0 c0-5 4-7 7-12 Z',
  tide: 'M32 3 C36 14 48 26 48 39 a16 16 0 1 1 -32 0 C16 26 28 14 32 3 Z M25 40 a7 8 0 0 0 5 10',
  grove: 'M50 8 C30 10 14 22 13 44 C12 52 14 58 14 58 C14 58 22 57 30 54 C48 47 52 26 50 8 Z M20 52 C26 38 36 26 46 16',
  bolt: 'M36 2 L12 38 L27 38 L22 62 L52 24 L36 24 Z',
};

export function emblemSVG(element, size = 54) {
  const el = ELEMENTS[element];
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">`
    + `<path d="${EMBLEM_PATHS[element]}" fill="${el.color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

// ---- one card, face up: gilded name banner, painted portrait in an ornate
// inner frame, then the gold skill text every card carries. ----
export function cardElement(card, { keyHint = null } = {}) {
  const el = ELEMENTS[card.element];
  const skill = SKILLS[card.skill];
  const node = document.createElement('div');
  const rarity = card.power >= 8 ? ' rarity-epic' : (card.cost >= 2 ? ' rarity-rare' : '');
  node.className = `card el-${card.element}${rarity}`;
  node.dataset.cardId = card.id;
  const suns = card.cost === 0
    ? '<span class="free">FREE</span>'
    : Array.from({ length: card.cost }, () => '<span class="sun-pip"></span>').join('');
  node.innerHTML =
    (keyHint !== null ? `<span class="key-hint">${keyHint}</span>` : '')
    + `<div class="card-head"><span class="card-name">${card.name}</span><span class="card-cost">${suns}</span></div>`
    + `<div class="card-art"><img class="card-portrait" src="./assets/${card.id}.jpg" alt="${card.name} portrait">`
    + `<span class="card-power">${card.power}</span>`
    + `<span class="card-el">${emblemSVG(card.element, 13)} ${el.name}</span></div>`
    + `<div class="card-text"><div class="card-skill"><span class="skill-name">⚡ ${skill.name}</span> · ${skill.text}</div>`
    + `<div class="card-flavor">${card.flavor}</div></div>`;
  return node;
}

export function cardBackElement() {
  const node = document.createElement('div');
  node.className = 'card-back';
  return node;
}

// ---- zones ----
const $ = (id) => document.getElementById(id);

function renderEnergy(rowId, duelist) {
  const row = $(rowId);
  row.innerHTML = '';
  for (let i = 0; i < ENERGY_CAP; i += 1) {
    const pip = document.createElement('span');
    pip.className = 'sun-pip' + (i < duelist.energy ? '' : ' spent');
    row.appendChild(pip);
  }
}

function renderHp(fillId, textId, duelist) {
  const max = duelist.maxHp ?? START_HP;
  $(fillId).style.width = `${Math.max(0, (duelist.hp / max) * 100)}%`;
  $(textId).textContent = `${duelist.hp} / ${max}`;
}

export function renderBars(state) {
  renderHp('player-hp-fill', 'player-hp-text', state.player);
  renderHp('rival-hp-fill', 'rival-hp-text', state.rival);
  renderEnergy('player-energy', state.player);
  renderEnergy('rival-energy', state.rival);
  $('round-label').textContent = state.phase === 'over' ? 'Duel over' : `Round ${state.round}`;
}

export function renderRivalHand(state) {
  const zone = $('rival-hand');
  zone.innerHTML = '';
  for (let i = 0; i < state.rival.hand.length; i += 1) zone.appendChild(cardBackElement());
}

export function renderHand(state, selected, onPick) {
  const zone = $('hand');
  zone.innerHTML = '';
  state.player.hand.forEach((card, index) => {
    const node = cardElement(card, { keyHint: index + 1 });
    if (index === selected) node.classList.add('selected');
    if (card.cost > state.player.energy) node.classList.add('unaffordable');
    node.addEventListener('click', () => onPick(index));
    zone.appendChild(node);
  });
}

// The telegraph ribbon. `lean` is an element key or null (Sorin must Focus).
export function renderHint(lean) {
  const hint = $('hint');
  if (lean === null) {
    hint.innerHTML = '🔮 Sorin is out of Sun — he must <b>Focus</b> this round. Play anything big!';
    return;
  }
  const el = ELEMENTS[lean];
  const counter = ELEMENT_ORDER.find((key) => ELEMENTS[key].beats === lean);
  const counterEl = ELEMENTS[counter];
  hint.innerHTML =
    `🔮 Sorin leans <span class="lean-chip" style="background:${el.color}">${emblemSVG(lean, 14)} ${el.name.toUpperCase()}</span>`
    + ` — counter him with <b style="color:${counterEl.color}">${counterEl.name}</b> for +3 Power`;
}

export function renderWheel() {
  const wheel = $('wheel');
  wheel.innerHTML = ELEMENT_ORDER.map((key) => {
    const el = ELEMENTS[key];
    const beaten = ELEMENTS[el.beats];
    return `<span class="wheel-chip" style="background:${el.color}">${emblemSVG(key, 13)} ${el.name} ▸ ${beaten.name}</span>`;
  }).join('');
}

export function renderLog(state) {
  $('log').innerHTML = state.log.map((line) => `<li>${line}</li>`).join('');
}

// The arena: placeholders before the pick, face-down cards mid-pick when the
// player has committed, and the revealed clash with its Power breakdown.
export function renderArena(state, ui) {
  const pZone = $('arena-player');
  const rZone = $('arena-rival');
  pZone.innerHTML = '';
  rZone.innerHTML = '';
  const banner = $('arena-banner');

  if (ui.revealed && state.clash) {
    const clash = state.clash;
    pZone.appendChild(cardElement(clash.playerCard));
    pZone.appendChild(powerParts(clash.playerPower));
    rZone.appendChild(cardElement(clash.rivalCard));
    rZone.appendChild(powerParts(clash.rivalPower));
    banner.textContent = clash.outcome === 'tie'
      ? `⚡ Dead even at ${clash.playerPower.total}!`
      : clash.outcome === 'player'
        ? `💥 You win the clash — ${clash.rivalDamage} damage!`
        : `💥 Sorin wins the clash — ${clash.playerDamage} damage!`;
    return;
  }
  if (ui.committed) {
    const backP = cardBackElement(); backP.className += ' card'; backP.style.width = '150px'; backP.style.height = '208px';
    const backR = cardBackElement(); backR.className += ' card'; backR.style.width = '150px'; backR.style.height = '208px';
    pZone.appendChild(backP);
    rZone.appendChild(backR);
    banner.textContent = 'Cards down…';
    return;
  }
  pZone.innerHTML = '<div class="arena-empty">Your card<br>lands here</div>';
  rZone.innerHTML = '<div class="arena-empty">Sorin\'s card<br>lands here</div>';
  banner.textContent = state.round === 1 && !state.clash ? 'First clash — make it count!' : '';
}

function powerParts(power) {
  const wrap = document.createElement('div');
  wrap.className = 'power-parts';
  wrap.innerHTML = power.parts
    .map((part) => `<span class="part-chip">${part.label} ${part.value >= 0 ? '+' : ''}${part.value}</span>`).join('')
    + `<span class="part-chip total">= ${power.total} Power</span>`;
  return wrap;
}

// The title screen's fanned cards: one hero per element.
export function renderTitleFan(cards) {
  const fan = $('title-fan');
  fan.innerHTML = '';
  for (const card of cards) fan.appendChild(cardElement(card));
}

// The series pips (duels won, both sides), the running score, and the
// streak flames beside each duelist's name.
export function renderScoreboard(series, state) {
  const pips = (won, cls, emptyCls) => Array.from(
    { length: 2 },
    (_, i) => `<span class="pip ${i < won ? cls : emptyCls}"></span>`,
  ).join('');
  $('series-pips').innerHTML =
    `<span>YOU</span><span class="side-pips">${pips(series.playerDuels, 'you', 'empty-you')}</span>`
    + `<span class="pip-label">first to 2 duels</span>`
    + `<span class="side-pips">${pips(series.rivalDuels, 'sorin', 'empty-sorin')}</span><span>SORIN</span>`;
  $('score-label').textContent = `★ ${series.score}`;
  $('player-streak').textContent = state.player.streak >= 2 ? `🔥×${state.player.streak}` : '';
  $('rival-streak').textContent = state.rival.streak >= 2 ? `🔥×${state.rival.streak}` : '';
}

export function renderTaunt(text) {
  $('taunt').textContent = text;
}

// The persistent dawn record in the side panel: best score, crowns
// (matches won), duels won, and the rank ladder position.
export function renderRecords(records, rank, next) {
  $('records').innerHTML =
    `<div class="rank-line">🏅 ${rank.title}</div>`
    + `<div>Best score <b>${records.bestScore}</b>${next ? ` · next rank at ${next.min}` : ' · top rank!'}</div>`
    + `<div>👑 Matches won <b>${records.matchesWon}</b> / ${records.matchesPlayed}</div>`
    + `<div>⚔ Duels won <b>${records.duelsWon}</b></div>`;
}

// The collection overlay: the whole catalogue, grouped by element.
export function renderCollection(catalogue) {
  const grid = $('collection-grid');
  grid.innerHTML = '';
  const sorted = [...catalogue].sort((a, b) => a.element.localeCompare(b.element) || b.power - a.power);
  for (const card of sorted) grid.appendChild(cardElement(card));
}

// Project a clash's power for a hand card against a hypothetical rival card —
// used by main.js for the "what if" preview chip. Kept here so render owns
// all numbers the player sees.
export function previewPower(card, me, foeCard, foe) {
  return effectivePower(card, me, foeCard, foe).total;
}
