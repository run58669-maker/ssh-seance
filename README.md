# SSH Séance

A resurrection of [SSHTron](https://github.com/zachlatta/sshtron) (2016, Go, MIT), the multiplayer Tron lightcycle game you play over `ssh`, rewritten from scratch in TypeScript for Kiroween 2026.

Same engine, two doors:

- **SSH door:** `npm start`, then `ssh -p 2222 localhost`.
- **Web door:** play in the browser against bots (link coming).

Crash and you come back as a ghost that replays your last seconds. The living have to steer around you.

Status: spec written (`.kiro/specs/seance/`), code not started.

This is a clean-room rewrite; no code from the original is used. MIT licensed.
