// A tiny seeded random source (mulberry32). A match is fully decided by its seed,
// which is what lets the screenshot scenes in shots.js render the same frame
// every time, and lets a player retry a duel that went badly.

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In-place Fisher-Yates shuffle driven by a makeRandom stream.
export function shuffle(list, random) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

// A random seed for a fresh match (never used by the screenshot scenes).
export function freshSeed() {
  return Math.floor(Math.random() * 0x7fffffff) + 1;
}
