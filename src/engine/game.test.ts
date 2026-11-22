import { describe, expect, it } from 'vitest'
import { newGame, newRound } from './game'
import { type Rider, type Ghost } from './types'

// Canonical corner cells used by spawn.ts.
const CORNER_CELLS = new Set(['1,1', '58,1', '1,22', '58,22'])

function cellKey(c: { x: number; y: number }) {
  return `${c.x},${c.y}`
}

const FOUR_RIDERS: Pick<Rider, 'id' | 'color' | 'isBot'>[] = [
  { id: 'a', color: 1, isBot: false },
  { id: 'b', color: 2, isBot: true },
  { id: 'c', color: 3, isBot: true },
  { id: 'd', color: 4, isBot: true },
]

// ─── newGame ────────────────────────────────────────────────────────────────

describe('newGame', () => {
  it('sets tick=0, round=1, phase=playing', () => {
    const state = newGame(0, FOUR_RIDERS)
    expect(state.tick).toBe(0)
    expect(state.round).toBe(1)
    expect(state.phase).toBe('playing')
  })

  it('starts with no ghosts and no winner', () => {
    const state = newGame(0, FOUR_RIDERS)
    expect(state.ghosts).toHaveLength(0)
    expect(state.winner).toBeNull()
  })

  it('sets intermissionLeft=0', () => {
    const state = newGame(0, FOUR_RIDERS)
    expect(state.intermissionLeft).toBe(0)
  })

  it('sets arena dimensions to 60×24', () => {
    const state = newGame(0, FOUR_RIDERS)
    expect(state.width).toBe(60)
    expect(state.height).toBe(24)
  })

  it('places each rider at a valid corner cell', () => {
    const state = newGame(0, FOUR_RIDERS)
    for (const rider of state.riders) {
      expect(CORNER_CELLS.has(cellKey(rider.head))).toBe(true)
    }
  })

  it('places riders at distinct positions', () => {
    const state = newGame(0, FOUR_RIDERS)
    const keys = state.riders.map((r) => cellKey(r.head))
    expect(new Set(keys).size).toBe(state.riders.length)
  })

  it('every rider starts alive', () => {
    const state = newGame(0, FOUR_RIDERS)
    expect(state.riders.every((r) => r.alive)).toBe(true)
  })

  it('every rider trail contains exactly the head cell', () => {
    const state = newGame(0, FOUR_RIDERS)
    for (const rider of state.riders) {
      expect(rider.trail).toHaveLength(1)
      expect(rider.trail[0]).toEqual(rider.head)
    }
  })

  it('preserves rider id, color, and isBot', () => {
    const state = newGame(42, FOUR_RIDERS)
    const byId = Object.fromEntries(state.riders.map((r) => [r.id, r]))
    expect(byId['a']!.color).toBe(1)
    expect(byId['a']!.isBot).toBe(false)
    expect(byId['b']!.isBot).toBe(true)
  })

  it('is deterministic: same seed → same state', () => {
    const a = newGame(99, FOUR_RIDERS)
    const b = newGame(99, FOUR_RIDERS)
    expect(a.riders.map((r) => cellKey(r.head))).toEqual(b.riders.map((r) => cellKey(r.head)))
  })

  it('advances the rng beyond the seed', () => {
    const seed = 7
    const state = newGame(seed, FOUR_RIDERS)
    // spawn shuffles 4 slots → 3 draws; rng must differ from seed
    expect(state.rng).not.toBe(seed)
  })
})

// ─── newRound ───────────────────────────────────────────────────────────────

describe('newRound', () => {
  /** Build a dirty state: tick advanced, ghosts present, a winner set, riders dead. */
  function dirtyState() {
    const base = newGame(0, FOUR_RIDERS)
    const ghost: Ghost = {
      riderId: 'b',
      color: 2,
      path: [{ x: 10, y: 10 }, { x: 11, y: 10 }],
      pos: 0,
    }
    return {
      ...base,
      tick: 50,
      phase: 'intermission' as const,
      intermissionLeft: 5,
      winner: 'a',
      ghosts: [ghost],
      riders: base.riders.map((r) => ({
        ...r,
        alive: r.id === 'a',
        trail: r.id === 'a' ? [r.head, { x: 5, y: 5 }] : [r.head],
      })),
    }
  }

  it('increments the round counter', () => {
    const state = newRound(dirtyState())
    expect(state.round).toBe(2)
  })

  it('clears all ghosts (Req 2.5)', () => {
    const state = newRound(dirtyState())
    expect(state.ghosts).toHaveLength(0)
  })

  it('resets tick to 0', () => {
    const state = newRound(dirtyState())
    expect(state.tick).toBe(0)
  })

  it('resets phase to playing', () => {
    const state = newRound(dirtyState())
    expect(state.phase).toBe('playing')
  })

  it('resets intermissionLeft to 0', () => {
    const state = newRound(dirtyState())
    expect(state.intermissionLeft).toBe(0)
  })

  it('clears the winner', () => {
    const state = newRound(dirtyState())
    expect(state.winner).toBeNull()
  })

  it('restores every rider to alive=true', () => {
    const state = newRound(dirtyState())
    expect(state.riders.every((r) => r.alive)).toBe(true)
  })

  it('resets every rider trail to [head] only', () => {
    const state = newRound(dirtyState())
    for (const rider of state.riders) {
      expect(rider.trail).toHaveLength(1)
      expect(rider.trail[0]).toEqual(rider.head)
    }
  })

  it('places every rider at a valid corner', () => {
    const state = newRound(dirtyState())
    for (const rider of state.riders) {
      expect(CORNER_CELLS.has(cellKey(rider.head))).toBe(true)
    }
  })

  it('places riders at distinct positions', () => {
    const state = newRound(dirtyState())
    const keys = state.riders.map((r) => cellKey(r.head))
    expect(new Set(keys).size).toBe(state.riders.length)
  })

  it('preserves rider ids across rounds', () => {
    const before = dirtyState()
    const after = newRound(before)
    const beforeIds = before.riders.map((r) => r.id).sort()
    const afterIds = after.riders.map((r) => r.id).sort()
    expect(afterIds).toEqual(beforeIds)
  })

  it('advances the rng (spawn consumes draws)', () => {
    const before = dirtyState()
    const after = newRound(before)
    expect(after.rng).not.toBe(before.rng)
  })
})
