# Requirements: SSH Séance

## Glossary

- **Arena:** the rectangular grid, 60 columns by 24 rows inside a one-cell wall.
- **Rider:** a player, human or bot. Each has a head cell, a heading (up, down, left, right) and a trail.
- **Trail:** every cell a living rider's head has occupied this round.
- **Tick:** one engine step. Every living rider moves one cell.
- **Ghost:** what a crashed rider becomes. It has a recorded path and a position in it.
- **Door:** a front end that feeds inputs to the engine and shows frames: the SSH door or the web door.

## Requirement 1: Riding

**User story:** As a player, I want my lightcycle to move and leave a wall behind it, so that the game plays like SSHTron.

1. WHEN a tick runs THE engine SHALL move every living rider's head one cell in its heading and add the new cell to its trail.
2. WHEN a rider's input for the tick is a heading that is not the exact reverse of its current heading THE engine SHALL turn the rider to that heading before moving it.
3. IF a rider's input is the exact reverse of its current heading THEN THE engine SHALL ignore the input.
4. IF a rider's head moves into a wall, any trail cell, or a ghost cell THEN THE engine SHALL mark that rider as crashed in that tick.
5. IF two riders' heads move into the same cell in the same tick THEN THE engine SHALL mark both as crashed.
6. WHEN one or zero riders remain alive THE engine SHALL end the round, record the survivor (if any) as the winner, and start a new round after 3 seconds (30 ticks).

## Requirement 2: Ghosts

**User story:** As a player, I want crashed riders to come back as ghosts, so that every crash changes the arena and the game feels haunted.

1. WHEN a rider crashes THE engine SHALL remove its trail from the arena and create a ghost whose path is the rider's last 20 head cells, oldest first.
2. WHILE a ghost exists THE engine SHALL advance it one cell along its path every tick and loop back to the start of its path after the last cell.
3. THE engine SHALL treat a ghost's current cell and the 4 cells behind it on its path as ghost cells for collisions.
4. IF a rider crashed with fewer than 20 head cells THEN THE engine SHALL use all of them as the ghost's path.
5. WHEN a new round starts THE engine SHALL remove every ghost.

## Requirement 3: Controls

**User story:** As a player, I want the original's keys, so that it feels like SSHTron.

1. WHEN a human presses w, a, s or d THE door SHALL send up, left, down or right for that rider's next tick.
2. WHEN a human presses k, h, j or l THE door SHALL send up, left, down or right for that rider's next tick.
3. WHEN a human presses an arrow key in the web door THE door SHALL send the matching heading.
4. WHEN a human presses q, Escape or Ctrl+C in the SSH door THE door SHALL remove that rider and close the session.
5. IF a human presses several heading keys within one tick THEN THE door SHALL send only the last one.

## Requirement 4: Web door

**User story:** As a judge, I want to click a link and play in my browser, so that I can try the game without installing anything.

1. WHEN the page loads THE web door SHALL start a round with one human rider and three bot riders in a terminal emulator.
2. THE web door SHALL run entirely in the browser with no requests other than the page and its own assets.
3. WHEN the round ends THE web door SHALL show the winner and the round count for the 3 seconds before the next round.
4. THE web door SHALL show a one-line key legend under the arena.

## Requirement 5: SSH door

**User story:** As a terminal user, I want to ssh in and play with other people on the same server, as I could with SSHTron.

1. WHEN a client connects with `ssh -p 2222 <host>` THE SSH door SHALL accept it without a password and add a human rider to the current round, or to the next round if the current one has started.
2. THE SSH door SHALL run one shared game for every connected client and send each client the same frame every tick.
3. WHILE fewer than 2 humans are connected THE SSH door SHALL fill the round to 4 riders with bots.
4. IF a client's terminal is smaller than 62 columns by 27 rows THEN THE SSH door SHALL show a message asking for a larger window instead of the arena.
5. WHEN a client disconnects THE SSH door SHALL treat its rider as crashed.

## Requirement 6: Same game everywhere

**User story:** As the developer, I want the engine to be deterministic, so that a game can be replayed and tested exactly.

1. THE engine SHALL take all randomness (spawn order, bot tie-breaks) from a seeded generator stored in the game state.
2. WHEN the same seed and the same input log are replayed THE engine SHALL produce the same sequence of states.
3. THE ANSI renderer SHALL produce the same string for the same state in Node and in the browser.
