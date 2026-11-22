// Synthesised sound: every effect is a few oscillators, no audio files,
// so the game stays fully offline. Sounds are short, bright and musical —
// a dealt card ticks, a reveal flips with a rising chirp, a hit thumps,
// a heal chimes, and the win screen gets a little dawn arpeggio.

let ctx = null;
let muted = false;

function ac() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.12, slideTo = null) {
  const a = ac();
  if (!a || muted) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  const t0 = a.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  deal() { tone(660, 0, 0.07, 'triangle', 0.08); tone(880, 0.05, 0.07, 'triangle', 0.06); },
  pick() { tone(520, 0, 0.06, 'square', 0.05); },
  flip() { tone(300, 0, 0.16, 'sawtooth', 0.05, 900); },
  hit(big) { tone(big ? 130 : 180, 0, 0.22, 'square', 0.14, 60); tone(90, 0, 0.25, 'sine', 0.16, 45); },
  tie() { tone(440, 0, 0.12, 'square', 0.08); tone(415, 0.1, 0.16, 'square', 0.08); },
  heal() { tone(523, 0, 0.12, 'sine', 0.09); tone(659, 0.09, 0.12, 'sine', 0.09); tone(784, 0.18, 0.18, 'sine', 0.09); },
  focus() { tone(392, 0, 0.1, 'triangle', 0.08, 523); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.11, 0.24, 'triangle', 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.14, 0.26, 'triangle', 0.1)); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
