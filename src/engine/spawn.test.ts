import { describe, expect, it } from 'vitest'
import { spawnRiders, type RiderSpec } from './spawn'

// Four rider specs used across tests.
const FOUR_SPECS: RiderSpec[] = [
  { id: 'a', color: 1, isBot: false },
  { id: 'b', color: 2, isBot: true },
  { id: 'c', color: 3, isBot: true },
  { id: 'd', color: 4, isBot: true },
]

/** Canonical set of corner cells (order-independent). */
const CORNER_CELLS = new Set([
  '1,1', '58,1', '1,22', '58,22',
])

function cellKey(c: { x: number; y: number }) {
  return `${c.x},${c.y}`
}

describe('spawnRiders', () => {
  it('places each rider on a distinct corner cell', () => {
    const { riders } = spawnRiders(FOUR_SPECS, 0)
    const keys = riders.map((r) => cellKey(r.head))
    // All four canonical corners covered.
    expect(new Set(keys)).toEqual(CORNER_CELLS)
  })

  it('gives every rider alive=true', () => {
    const { riders } = spawnRiders(FOUR_SPECS, 0)
    expect(riders.every((r) => r.alive)).toBe(true)
  })

  it('trail of each rider contains exactly the head cell', () => {
    const { riders } = spawnRiders(FOUR_SPECS, 0)
    for (const r of riders) {
      expect(r.trail).toHaveLength(1)
      expect(r.trail[0]).toEqual(r.head)
    }
  })

  it('heading at each corner faces inward', () => {
    const { riders } = spawnRiders(FOUR_SPECS, 0)
    for (const r of riders) {
      const { x, y, } = r.head
      if (x === 1 && y === 1)  expect(r.dir).toBe('right')  // top-left
      if (x === 58 && y === 1) expect(r.dir).toBe('left')   // top-right
      if (x === 1 && y === 22) expect(r.dir).toBe('right')  // bot-left
      if (x === 58 && y === 22)expect(r.dir).toBe('left')   // bot-right
    }
  })

  it('is deterministic: same seed → same ordering', () => {
    const { riders: a } = spawnRiders(FOUR_SPECS, 12345)
    const { riders: b } = spawnRiders(FOUR_SPECS, 12345)
    expect(a.map((r) => cellKey(r.head))).toEqual(b.map((r) => cellKey(r.head)))
  })

  it('different seeds produce different orderings (at least once in a small sample)', () => {
    const orderings = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const { riders } = spawnRiders(FOUR_SPECS, seed)
      orderings.add(riders.map((r) => cellKey(r.head)).join('|'))
    }
    // A seeded shuffle over 4 elements has 24 permutations; 20 seeds must yield > 1.
    expect(orderings.size).toBeGreaterThan(1)
  })

  it('works for fewer than 4 riders', () => {
    const specs: RiderSpec[] = [
      { id: 'x', color: 10, isBot: false },
      { id: 'y', color: 20, isBot: true },
    ]
    const { riders } = spawnRiders(specs, 99)
    expect(riders).toHaveLength(2)
    // Both must land on valid corners.
    for (const r of riders) {
      expect(CORNER_CELLS.has(cellKey(r.head))).toBe(true)
    }
    // No duplicates.
    expect(new Set(riders.map((r) => cellKey(r.head))).size).toBe(2)
  })

  it('returns an updated rng state (not the same as input for 4 elements)', () => {
    const seed = 7
    const { rng } = spawnRiders(FOUR_SPECS, seed)
    // Fisher-Yates over 4 elements does 3 draws, so rng must have advanced.
    expect(rng).not.toBe(seed)
  })

  it('ids, colors, isBot are preserved from specs', () => {
    const { riders } = spawnRiders(FOUR_SPECS, 0)
    const byId = Object.fromEntries(riders.map((r) => [r.id, r]))
    expect(byId['a']!.color).toBe(1)
    expect(byId['a']!.isBot).toBe(false)
    expect(byId['b']!.color).toBe(2)
    expect(byId['b']!.isBot).toBe(true)
  })
})
