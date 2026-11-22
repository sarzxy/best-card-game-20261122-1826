// Juice: the small motions that make a clash feel physical.
// Cards flip in on reveal, the loser shakes, damage and healing float up
// in big numbers, the VS medal pops, and a win rains confetti. Everything
// here is cosmetic — state.js has already decided the result — and the
// screenshot scenes switch it all off with body.shot.

const $ = (id) => document.getElementById(id);

export function flipArenaCards() {
  document.querySelectorAll('#arena .card').forEach((node) => {
    node.classList.remove('revealing');
    void node.offsetWidth; // restart the animation
    node.classList.add('revealing');
  });
}

export function shakeLoser(outcome) {
  const zone = outcome === 'player' ? $('arena-rival') : outcome === 'rival' ? $('arena-player') : null;
  if (zone) {
    const card = zone.querySelector('.card');
    if (card) card.classList.add('shake');
  } else {
    document.querySelectorAll('#arena .card').forEach((node) => node.classList.add('shake'));
  }
  const medal = $('vs-medal');
  medal.classList.remove('clashed');
  void medal.offsetWidth;
  medal.classList.add('clashed');
}

// A big floating number over a duelist zone ("-6" damage, "+3" healing).
export function floatNumber(zoneId, text, kind) {
  const zone = $(zoneId);
  if (!zone) return;
  const node = document.createElement('div');
  node.className = `float-num ${kind}`;
  node.textContent = text;
  const rect = zone.getBoundingClientRect();
  const host = document.body.getBoundingClientRect();
  node.style.left = `${rect.left - host.left + rect.width / 2 - 20}px`;
  node.style.top = `${rect.top - host.top + 6}px`;
  document.getElementById('app').appendChild(node);
  setTimeout(() => node.remove(), 1250);
}

const CONFETTI_COLORS = ['#e8483f', '#2478d8', '#2f9e4f', '#e8a812', '#ff7a59', '#7b4dff'];

// A burst of dawn confetti over the end screen (wins only).
export function confettiBurst(count = 46) {
  const app = $('app');
  for (let i = 0; i < count; i += 1) {
    const bit = document.createElement('div');
    bit.className = 'confetti';
    bit.style.left = `${8 + Math.random() * 84}%`;
    bit.style.top = `${Math.random() * 12}%`;
    bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    bit.style.animationDelay = `${Math.random() * 0.5}s`;
    bit.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
    app.appendChild(bit);
    setTimeout(() => bit.remove(), 2600);
  }
}

// Deal-in: stagger the hand's cards when a match (re)starts.
export function dealIn() {
  document.querySelectorAll('#hand .card').forEach((node, i) => {
    node.classList.add('dealt');
    node.style.animationDelay = `${i * 70}ms`;
  });
}
