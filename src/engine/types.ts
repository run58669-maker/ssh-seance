// Data model for the engine (design.md, "Data model").

export type Dir = 'up' | 'down' | 'left' | 'right'

/** A cell inside the arena: x in 0..59, y in 0..23. */
export interface Cell {
  x: number
  y: number
}

export interface Rider {
  id: string
  /** ANSI 256 color index. */
  color: number
  head: Cell
  dir: Dir
  alive: boolean
  /** Every cell the head has occupied this round, oldest first, including the head. */
  trail: Cell[]
  isBot: boolean
}

/** What a crashed rider becomes (requirement 2). */
export interface Ghost {
  riderId: string
  color: number
  /** The rider's last head cells, oldest first (at most 20). */
  path: Cell[]
  /** Index into `path` of the ghost's current cell. */
  pos: number
}

export interface GameState {
  width: 60
  height: 24
  tick: number
  round: number
  riders: Rider[]
  ghosts: Ghost[]
  phase: 'playing' | 'intermission'
  /** Ticks until the next round starts. */
  intermissionLeft: number
  winner: string | null
  /** mulberry32 state (see rng.ts). */
  rng: number
}

/** Heading for each rider this tick; a missing entry keeps the current heading. */
export type Inputs = Record<string, Dir | undefined>

export const ARENA_WIDTH = 60
export const ARENA_HEIGHT = 24
