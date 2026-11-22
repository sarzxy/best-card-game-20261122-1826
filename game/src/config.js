// AURORA CLASH — tuning constants and the element wheel.
// Every number the rules use lives here so the balance can be read at a glance.

// Both duelists start with this much life; reduce the rival to 0 to win.
// 20 keeps a duel near ten clashes — long enough for a comeback, short
// enough that a match finishes in minutes.
export const START_HP = 20;
// Cards each duelist holds. A played card is replaced by a draw after the clash.
export const HAND_SIZE = 5;
// Sun energy: you gain GAIN each round, may bank up to CAP, and pay card costs from it.
export const ENERGY_START = 1;
export const ENERGY_GAIN = 1;
export const ENERGY_CAP = 5;
// Discarding a card to Focus buys this much energy (the always-available move).
export const FOCUS_GAIN = 1;

// The four lights. Each beats the next one around the wheel:
// EMBER scorches GROVE, GROVE drinks TIDE, TIDE grounds BOLT, BOLT ignites EMBER.
export const ELEMENTS = {
  ember: { name: 'Ember', beats: 'grove', color: '#e8483f', soft: '#ffb3a0', ink: '#5f130d' },
  tide: { name: 'Tide', beats: 'bolt', color: '#2478d8', soft: '#a8d4ff', ink: '#0d2c52' },
  grove: { name: 'Grove', beats: 'tide', color: '#2f9e4f', soft: '#b2ecc0', ink: '#0f3d1e' },
  bolt: { name: 'Bolt', beats: 'ember', color: '#e8a812', soft: '#ffe9a3', ink: '#57400a' },
};
export const ELEMENT_ORDER = ['ember', 'tide', 'grove', 'bolt'];

// Power bonus when your element beats the rival's element.
export const ADVANTAGE_BONUS = 3;
// Base bite of every won clash, on top of the Power difference — a won
// clash always hurts, so duels move and comebacks stay possible.
export const CLASH_HEAT = 2;
// A Guard card soaks this much of the damage it would take.
export const GUARD_SOAK = 4;
// Ability magnitudes, named so state.js reads like the rules on the title screen.
export const DRAIN_HEAL = 2;
export const MEND_HEAL = 3;
export const SURGE_BONUS = 2;
export const ECHO_BONUS = 2;
// On an exact power tie both duelists take this much spark damage.
export const TIE_DAMAGE = 1;

// Win this many clashes in a row and the aurora itself feeds you Sun.
export const STREAK_FOR_SUN = 2;
export const STREAK_SUN = 1;

// ---- match structure: a duel is one game; a MATCH is a series of duels.
export const DUELS_TO_WIN_MATCH = 2; // best of three

// ---- difficulty: how sharp Sorin plays. noise is added whim on his card
// scores, counter is how hard he leans into countering your habits, and
// secondPickChance is how often he takes his second-best card instead.
export const DIFFICULTIES = {
  dawn: { label: '🌅 Dawn · gentle', noise: 7, counter: 0.5, secondPickChance: 0.45, rivalHp: 16 },
  noon: { label: '☀ Noon · fair', noise: 3, counter: 1, secondPickChance: 0.25, rivalHp: 20 },
  dusk: { label: '🌇 Dusk · ruthless', noise: 1, counter: 2.4, secondPickChance: 0.08, rivalHp: 20 },
};
export const DEFAULT_DIFFICULTY = 'noon';

// ---- scoring: the number the end screen breaks down and the records keep.
export const SCORE = {
  perDamage: 10,
  perClashWon: 25,
  perHpLeft: 15,
  duelWin: 150,
  matchWin: 300,
  perfectDuel: 200, // win a duel without taking damage
};

// Rank titles by lifetime best score — the progression ladder.
export const RANKS = [
  { min: 0, title: 'Spark Novice' },
  { min: 400, title: 'Dawn Apprentice' },
  { min: 800, title: 'Light Tactician' },
  { min: 1200, title: 'Dawnkeeper' },
  { min: 1800, title: 'Aurora Strategist' },
  { min: 2600, title: 'Aurora Sovereign' },
];

// The table is laid out for a desktop window of this size; screenshots use it too.
export const VIEW = { width: 1280, height: 800 };
