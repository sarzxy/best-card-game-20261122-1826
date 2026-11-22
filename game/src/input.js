// Keyboard controls. The mouse does everything too (cards are buttons by
// click), but a duel should be playable one-handed:
//   1–5  select the card in that hand slot
//   Enter / Space  clash with the selected card
//   F    focus: discard the selected card for +1 Sun
//   M    sound on/off
//   R    new match (from anywhere; on the title screen it starts the game)
//   P    back to the title screen
//   Esc  pause / resume

export function attachKeyboard(handlers) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Escape') handlers.pause();
    else if (key >= '1' && key <= '5') handlers.pick(Number(key) - 1);
    else if (key === 'Enter' || key === ' ') { event.preventDefault(); handlers.clash(); }
    else if (key === 'f' || key === 'F') handlers.focus();
    else if (key === 'm' || key === 'M') handlers.mute();
    else if (key === 'r' || key === 'R') handlers.restart();
    else if (key === 'p' || key === 'P') handlers.title();
  });
}
