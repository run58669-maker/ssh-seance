// Spawn points and rider initialisation for a new round (requirement 6.1).
// All randomness comes from the seeded mulberry32 rng; no Math.random().

import { nextInt } from './rng'
import { ARENA_HEIGHT, ARENA_WIDTH, type Cell, type Dir, type Rider } from './types'

// One cell inside the wall on every side.
const X_MIN = 1
const X_MAX = ARENA_WIDTH - 2  // 58
const Y_MIN = 1
const Y_MAX = ARENA_HEIGHT - 2 // 22

/** The four corner spawn points, each facing toward the arena centre. */
const SPAWN_POINTS: ReadonlyArray<{ cell: Cell; dir: Dir }> = [
  { cell: { x: X_MIN, y: Y_MIN }, dir: 'right' }, // top-left  → face right (toward centre)
  { cell: { x: X_MAX, y: Y_MIN }, dir: 'left'  }, // top-right → face left
  { cell: { x: X_MIN, y: Y_MAX }, dir: 'right' }, // bot-left  → face right
  { cell: { x: X_MAX, y: Y_MAX }, dir: 'left'  }, // bot-right → face left
]

/** Minimal description of a rider before it is placed on the arena. */
export interface RiderSpec {
  id: string
  color: number
  isBot: boolean
}

/**
 * Shuffle `arr` in-place using Fisher-Yates with the seeded rng.
 * Returns the final rng state.
 */
function seededShuffle<T>(arr: T[], rngState: number): number {
  let state = rngState
  for (let i = arr.length - 1; i > 0; i--) {
    const [j, next] = nextInt(state, i + 1)
    state = next
    // swap
    const tmp = arr[i]
    arr[i] = arr[j]!
    arr[j] = tmp!
  }
  return state
}

/**
 * Assign shuffled corner spawn points to `specs` and return fully-initialised
 * `Rider` objects together with the updated rng state.
 *
 * @param specs  1–4 rider descriptions; excess specs beyond 4 are ignored.
 * @param rngState  current mulberry32 state from `GameState.rng`
 */
export function spawnRiders(
  specs: RiderSpec[],
  rngState: number,
): { riders: Rider[]; rng: number } {
  // Mutable copy of spawn slots so we can shuffle it.
  const slots = SPAWN_POINTS.map((p) => ({ ...p }))
  const rng = seededShuffle(slots, rngState)

  const riders: Rider[] = specs.slice(0, 4).map((spec, i) => {
    const { cell, dir } = slots[i]!
    const head: Cell = { ...cell }
    return {
      id: spec.id,
      color: spec.color,
      isBot: spec.isBot,
      head,
      dir,
      alive: true,
      trail: [head],
    }
  })

  return { riders, rng }
}
