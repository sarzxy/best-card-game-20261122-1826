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

**24 original cards** (six per light), each with a painted portrait and
its **own unique skill** — no two cards share one. Skills resolve in
three beats: on reveal (heals, Sun, a singe), as Power (comeback,
momentum and memory bonuses), and on the outcome (soaks and thorns on a
loss; bonus damage, Sun theft and feasts on a win). Win two clashes in
a row and **Radiance** feeds you +1 Sun. First duelist to 0 life loses
the duel; a match is a **best-of-three series** of duels.

| Card | Light | Power | Sun | Skill |
|---|---|---|---|---|
| Cinder Imp | Ember | 3 | 0 | **Spark Bite** — On reveal, singe the rival for 1 damage. |
| Flame Dancer | Ember | 5 | 1 | **Encore** — +3 Power if you lost the previous clash. |
| Phoenix Chick | Ember | 4 | 1 | **Rebirth** — If this loses the clash, heal 3. |
| Ember Warden | Ember | 5 | 2 | **Bulwark** — On a loss, soak 5 damage. |
| Solar Flare | Ember | 6 | 2 | **Sunlance** — Damage ignores soaks, and +1 damage on a win. |
| Magma Brute | Ember | 8 | 3 | **Eruption** — +2 damage when you win the clash. |
| Puddle Sprite | Tide | 3 | 0 | **Splash** — On reveal, gain +1 Sun. |
| Wave Rider | Tide | 5 | 1 | **Momentum** — +1 Power per Sun banked (max +3). |
| Mist Healer | Tide | 3 | 1 | **Healing Rain** — On reveal, heal 3. |
| Coral Guard | Tide | 5 | 2 | **Reef Wall** — On a loss, soak 4 damage and heal 1. |
| Riptide | Tide | 6 | 2 | **Undertow** — +3 Power while your life is lower. |
| Deep Leviathan | Tide | 9 | 3 | **Feast of the Deep** — On a win, heal 1 per 3 damage dealt. |
| Sprout Pup | Grove | 3 | 0 | **Good Boy** — On a win, gain +1 Sun. |
| Thorn Archer | Grove | 5 | 1 | **Longshot** — +2 Power if the rival's card costs more Sun. |
| Bloom Dryad | Grove | 4 | 1 | **Photosynthesis** — On reveal, heal 1 and gain +1 Sun. |
| Bramble Wall | Grove | 4 | 2 | **Thorns** — On a loss, the winner takes 2 damage. |
| Vine Lash | Grove | 6 | 2 | **Constrict** — On a win, the rival loses 1 Sun. |
| Elder Treant | Grove | 8 | 3 | **Root Memory** — Your previous card was Grove: +2 Power. |
| Spark Mouse | Bolt | 3 | 0 | **Static Snap** — On a tie, the rival takes +1 extra damage. |
| Static Imp | Bolt | 4 | 1 | **Volatile** — +1 Power per 2 cards in your discard (max +3). |
| Storm Falcon | Bolt | 6 | 1 | **Divebomb** — +3 Power while your life is higher. |
| Volt Aegis | Bolt | 5 | 2 | **Aegis Charge** — On a loss, soak 3 damage and gain +1 Sun. |
| Chain Lightning | Bolt | 7 | 2 | **Chain Lightning** — On a win, +1 damage per clash you already won (max +3). |
| Thunder Giant | Bolt | 9 | 3 | **Thunderstomp** — On a win, +3 damage if the rival is at 8 life or less. |

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
  `cards.js` (the 24-card catalogue and its 24 skills), `state.js` (duel
  rules engine), `ai.js` (Sorin: picks, lean, taunts), `match.js`
  (series, score, ranks, records), `render.js` (all DOM drawing, SVG
  emblems, the gilded TCG card frames), `anim.js` (flips, shakes,
  floats, confetti), `audio.js` (synth sound), `input.js` (keyboard),
  `shots.js` (deterministic screenshot scenes), `main.js` (flow: menus,
  turns, pause, screens).
- `game/assets/` — the 24 painted card portraits (JPEG, one per card).
- `screenshots/` — real renders of the game in a browser: live gameplay,
  title, victory and defeat.

## Play it locally

```
node serve.ts        # then open http://localhost:8080
```

MIT licensed — see `LICENSE`.
