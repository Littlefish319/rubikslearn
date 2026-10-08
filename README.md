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
- A beginner-to-CFOP learning path, step-by-step instructions, move notation, and scored knowledge checks.
- A Three.js 3×3 simulator with draggable camera, animated face turns, inverse moves, undo, scramble, and algorithm playback. A 2D cube net is available if WebGL cannot initialize.
- Competitive solve timing: hold Space and release to start, tap or press a key to stop, optional inspection, +2/DNF editing, and trimmed ao5/ao12 averages.
- A searchable algorithm library with case patterns, exact practice setups, bookmarks, and repetition tracking.
- Progress charts and downloadable JSON data backups.

Timer scrambles are random-move practice scrambles, not official random-state competition scrambles. Knowledge checks show understanding, not independent verification that a physical cube was solved. Advanced lessons introduce CFOP training rather than claiming that every F2L, OLL, or PLL case is covered.

## Data and privacy

This version runs entirely in the browser. Solves, lesson completion, goals, algorithm practice, and bookmarks use localStorage. Each browser has its own data. No account, database, API key, or backend is required. Cloud sync and social competition are not implemented. Export data from My progress or Training settings before clearing browser data. The export is an archival JSON file; an import interface is not currently included.

## Validation

```sh
npm test
npm run build
```

The tests exercise cube rotations and inverse algorithms, scramble properties, timing boundaries, penalties, and rolling statistics. Browser checks use the system Chromium executable at `/usr/bin/chromium` when available.

## Project layout

- `src/App.tsx`: application shell, dashboard, navigation, goals, and progress.
- `src/components`: timer, interactive cube, learning path, and algorithm library.
- `src/data`: reviewed lesson and algorithm content.
- `src/lib`: pure cube mechanics and timing/statistics logic.

Fonts are packaged locally. No external font or image service is needed at runtime.
