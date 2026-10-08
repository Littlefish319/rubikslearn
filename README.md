# Cubiq

A responsive speedcubing training app, from the first turn to deliberate CFOP practice.

## Run locally

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Vite listens on port 3000. For a production bundle, run `npm run build`; `npm run preview` serves that bundle.

## What's included

- A dashboard with real learning progress, goals, practice streaks, and a daily three-solve challenge.
- A default 14-lesson CFOP competition path: direct cross, paired F2L, OLL, PLL, and deliberate speed training. Thirteen optional basics lessons preserve earlier progress.
- Focused lessons with a visible goal, the four CFOP stages, named steps and a total step count, verified practice cases, and scored knowledge checks.
- Solve your own cube: enter all six faces using the color picker, check for missing stickers or physically impossible positions, and follow the verified route with slow Next move controls, previous/reset, or autoplay. The preview uses your actual entered stickers. Standard grip: yellow top, green front, orange right.
- A Three.js 3×3 simulator with standard bright sticker colors and prepared cases. Manual next/previous moves take 2 seconds per quarter-turn and 2.8 seconds per half-turn, including when the device requests reduced motion. Automatic playback has a separate speed control. A 2D cube net is available if WebGL cannot initialize.
- Competitive solve timing: hold Space and release to start, tap or press a key to stop, optional inspection, +2/DNF editing, and trimmed ao5/ao12 averages.
- All 21 PLL cases, the complete two-look OLL/PLL bridge, recognition diagrams with side stickers, exact practice setups, bookmarks, and repetition tracking.
- Progress charts and downloadable JSON data backups.

Timer scrambles are random-move practice scrambles, not official random-state competition scrambles. Knowledge checks show understanding, not independent verification that a physical cube was solved. The F2L lessons teach verified pairing examples rather than all 41 cases. The OLL library covers the two-look bridge; the full 57-case progression links to further references. The PLL library covers all 21 cases.

The cube solver uses a bidirectional search to prove the fewest turns for positions within four turns of solved. Other positions use Kociemba's two-phase method with a 22-turn search limit; these routes are short but are not guaranteed to use the absolute fewest turns or be the fastest for a human. Half-turns count as one turn. The search runs in a cancellable Web Worker and verifies its result against a second cube model before coaching begins. Competition lessons teach CFOP independently of these computer-generated routes.

## Data and privacy

This version runs entirely in the browser. Solves, entered cube stickers, lesson completion, goals, algorithm practice, and bookmarks use localStorage. Each browser has its own data. No account, database, API key, or backend is required. Cloud sync and social competition are not implemented. Export data from My progress or Training settings before clearing browser data. The export is an archival JSON file; an import interface is not currently included.

## Validation

```sh
npm test
npm run build
npm run test:browser
```

The tests exercise cube rotations, cube-entry orientation, impossible piece states, optimal nearby solutions, general scramble solving, instructional F2L geometry, OLL/PLL coverage, and timing statistics. Browser tests check actual slow-turn timing and intermediate frames, all six manually entered faces matching the preview, a full worker-generated solve, persistent sticker input, mobile layout, and the named lesson plan. They use `/usr/bin/chromium` when available; otherwise install Chromium with `npx playwright install chromium`, or set `CHROMIUM_PATH` to a compatible browser executable.

## Project layout

- `src/App.tsx`: application shell, dashboard, navigation, goals, and progress.
- `src/components`: timer, interactive cube, learning path, and algorithm library.
- `src/data`: reviewed lesson and algorithm content.
- `src/lib`: pure cube mechanics and timing/statistics logic.
- `src/workers/solver.worker.ts`: cube search without blocking the interface.
- `src/vendor/cubejs`: the MIT-licensed model and solver from cubejs 1.3.2, with only module wrappers adapted to ES modules. Attribution is included in `LICENSE` and the published `/licenses/cubejs.txt`. Vendoring these two modules avoids the upstream package's unrelated npm dependency.

Fonts are packaged locally. No external font or image service is needed at runtime.
