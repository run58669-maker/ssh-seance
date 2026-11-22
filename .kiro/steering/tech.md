---
inclusion: always
---

# Tech rules

- TypeScript, strict mode, Node 22. Vite for the web door, Vitest and fast-check for tests, Playwright for the web door end to end.
- `ssh2` (npm) for the SSH door. `@xterm/xterm` for the terminal in the web door.

## Module boundaries

| Module | May import | Must not import |
|---|---|---|
| `src/engine/` | nothing outside `src/engine/` | `src/render`, `src/ssh`, `src/web`, any Node or DOM API |
| `src/render/` | `src/engine/` | `src/ssh`, `src/web`, Node or DOM APIs |
| `src/bots/` | `src/engine/` | `src/render`, `src/ssh`, `src/web` |
| `src/ssh/` | engine, render, bots, `ssh2`, Node | `src/web` |
| `src/web/` | engine, render, bots, xterm | `src/ssh`, Node APIs |

## Invariants

1. The engine is a pure function of (state, inputs for this tick) to next state. No clocks, no `Math.random`: randomness comes from a seeded generator held in the state.
2. The same seed and the same input log produce the same game, byte for byte, in Node and in the browser.
3. Both doors render through the same `render/ansi.ts`; neither door draws the arena any other way.
4. A tick is 100 ms in both doors.
