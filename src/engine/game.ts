// Game initialisation helpers (requirements 1.6, 2.5).
// newGame – build a fresh GameState from a seed.
// newRound – start the next round from an existing state.

import { spawnRiders, type RiderSpec } from './spawn'
import { type GameState, type Rider } from './types'

/**
 * Build a brand-new GameState.
 *
 * @param seed    Initial mulberry32 seed; stored as `rng` and consumed by spawn.
 * @param riders  Identity/style descriptors for each rider (1–4).
 */
export function newGame(
  seed: number,
  riders: Pick<Rider, 'id' | 'color' | 'isBot'>[],
): GameState {
  const specs: RiderSpec[] = riders.map(({ id, color, isBot }) => ({ id, color, isBot }))
  const { riders: spawned, rng } = spawnRiders(specs, seed)

  return {
    width: 60,
    height: 24,
    tick: 0,
    round: 1,
    riders: spawned,
    ghosts: [],
    phase: 'playing',
    intermissionLeft: 0,
    winner: null,
    rng,
  }
}

/**
 * Advance to the next round from `state`.
 *
 * - Increments `round`.
 * - Clears all ghosts (Req 2.5).
 * - Re-spawns every rider alive at a fresh corner position.
 * - Resets tick, phase, intermissionLeft, and winner.
 * - The rng is taken from `state.rng` and advanced by spawn.
 */
export function newRound(state: GameState): GameState {
  const specs: RiderSpec[] = state.riders.map(({ id, color, isBot }) => ({ id, color, isBot }))
  const { riders: spawned, rng } = spawnRiders(specs, state.rng)

  return {
    ...state,
    tick: 0,
    round: state.round + 1,
    riders: spawned,
    ghosts: [],           // Req 2.5: clear every ghost on new round
    phase: 'playing',
    intermissionLeft: 0,
    winner: null,
    rng,
  }
}
