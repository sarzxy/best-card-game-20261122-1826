// AURORA CLASH — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (index.html plus its ES
// modules — no build step, no network). This program delivers it: it
// copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with buildDossier from the
// vendored make.fun library, byte for byte as the gate rebuilds it.
//
// Run it the way the grader does, or locally with an override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

// The playable game, exactly as authored.
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// The screenshots the judge sees (3–4, first by name is the cover).
const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The dossier: game outline + screenshots, written by the kit's own
// library with the gate's caps, so the bytes match the gate's rebuild.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
