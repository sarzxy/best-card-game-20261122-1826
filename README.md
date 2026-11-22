# AURORA CLASH — Duel of the Four Lights

An original card duel that plays offline in a desktop browser from static
files. You are the Dawnkeeper; across the table sits **Sorin of the Pale
Tower**, an AI duelist who studies your habits — and honestly telegraphs
his own.

## The game

Each round both duelists play one card face down, then reveal together.
Higher **Power** deals the difference + 2 as damage. Four lights counter
in a wheel — **Ember ▸ Grove ▸ Tide ▸ Bolt ▸ Ember** — and playing the
winning light is worth +3 Power. Cards cost **Sun** energy, which grows
by 1 each round (bank up to 5); a card you cannot afford can be **Focused**
— discarded for +1 Sun and a fresh draw.

**24 original cards** (six per light) carry six abilities that combine:
**Guard** (soak 4), **Pierce** (ignore Guard), **Drain** (heal on a hit),
**Mend** (heal on reveal), **Surge** (+2 Power while behind) and **Echo**
(+2 if that light won your last clash). Win two clashes in a row and
**Radiance** feeds you +1 Sun. First duelist to 0 life loses the duel;
a match is a **best-of-three series** of duels.

## Features

- **Full menu flow** — title screen with a live exhibition table behind
  it, how-to-play screen, a browsable 24-card collection, pause menu
  (Esc), between-duel screen, and a match-end screen with a full score
  breakdown, then rematch or back to title.
- **Three difficulties** — Dawn (gentle), Noon (fair), Dusk (ruthless):
  they change Sorin's life, how hard he counters your recent cards, and
  how much he improvises.
- **A readable AI opponent** — Sorin counts the elements you revealed in
  your last three clashes and leans into their counter; the game shows
  you his lean every round ("Sorin leans EMBER — counter with Grove"),
  and his taunts track the table: ahead, behind, hurt, or match point.
- **Score & progression** — damage, won clashes, duel wins, life left and
  flawless-duel bonuses all score; ranks run from Spark Novice to Aurora
  Sovereign, and your best score, matches won and duels won persist in
  localStorage between visits.
- **Juice** — cards slide, flip and snap; the loser shakes; damage and
  healing float in big numbers; the VS medal pops; a match win rains dawn
  confetti. Synthesised WebAudio sound (deal, flip, hit, heal, win/lose
  motifs) with a mute toggle — no audio files, no network.
- **Keyboard & mouse** — click, or 1–5 to pick, Enter to clash, F to
  focus, Esc to pause, M for sound, R for a new match, P for title.

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output directory and writes
  `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html` + `game/style.css` — the page and its dawn-sky look.
- `game/src/` — one job per file: `config.js` (tuning, wheel, scoring),
  `cards.js` (the 24-card catalogue), `state.js` (duel rules engine),
  `ai.js` (Sorin: picks, lean, taunts), `match.js` (series, score, ranks,
  records), `render.js` (all DOM drawing, SVG emblems and creatures),
  `anim.js` (flips, shakes, floats, confetti), `audio.js` (synth sound),
  `input.js` (keyboard), `shots.js` (deterministic screenshot scenes),
  `main.js` (flow: menus, turns, pause, screens).
- `screenshots/` — real renders of the game in a browser: live gameplay,
  title, victory and defeat.

## Play it locally

```
node serve.ts        # then open http://localhost:8080
```

MIT licensed — see `LICENSE`.
