# SSH Séance

A resurrection of [SSHTron](https://github.com/zachlatta/sshtron) (2016, Go, MIT), the multiplayer Tron lightcycle game you play over `ssh`, rewritten from scratch in TypeScript for Kiroween 2026.

Same engine, two doors:

- **SSH door:** `npm start`, then `ssh -p 2222 localhost`.
- **Web door:** play in the browser against bots (link coming).

Crash and you come back as a ghost that replays your last seconds. The living have to steer around you.

Status: spec written (`.kiro/specs/seance/`); project skeleton, engine types and the seeded generator are in. The game itself is not playable yet.

## Develop

```
npm install
npm test          # Vitest + fast-check
npm run typecheck
npm run lint      # includes the module-boundary rules from .kiro/steering/tech.md
```

## Who built what

| Part | Written by |
|---|---|
| Steering, requirements, design, tasks (`.kiro/`) | Claude |
| Task 1.1 skeleton (package.json, tsconfig, Vitest, ESLint boundaries) | Claude, not run in Kiro |
| Task 2.1 `src/engine/types.ts` | Claude, not run in Kiro |
| Task 2.2 `src/engine/rng.ts` and its tests | Claude, not run in Kiro |

Tasks run in Kiro will be added here with their execution ids as they happen.

This is a clean-room rewrite; no code from the original is used. MIT licensed.
