---
inclusion: always
---

# Product: SSH Séance

SSH Séance resurrects SSHTron (zachlatta/sshtron, 2016, Go, MIT): a multiplayer Tron lightcycle game you play by typing `ssh` into a terminal. The original code has not been maintained since 2023 and needs a Go toolchain and a server to run.

This is a clean-room rewrite in TypeScript. No Go code is copied; the original is a design reference only.

One game engine, two front doors:

1. **SSH door.** `npm start` runs a local SSH server. `ssh -p 2222 localhost` drops you into the arena, as in the original.
2. **Web door.** The same engine runs in the browser and draws into a terminal emulator. A judge clicks a link and plays against bots, with no install and no SSH.

The Halloween twist: a rider who crashes does not vanish. They come back as a ghost that replays their own last seconds of movement, over and over, and the living must steer around it. That is the séance.

## In scope

- One round of 2 to 4 riders on a fixed grid, humans and bots mixed.
- WASD and vim keys (hjkl). Arrow keys also work in the web door.
- Ghost replay of a crashed rider's recent path.
- Simple bots so one human can always play.
- Score: last rider alive wins the round; the round restarts.

## Out of scope

- A public SSH server on the internet (cost and operations).
- Accounts, persistent leaderboards, chat.
- Sound.
