import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { next, nextInt } from './rng'

/** Run the generator `count` times from `seed` and collect the values. */
function sequence(seed: number, count: number): number[] {
  const out: number[] = []
  let state = seed
  for (let i = 0; i < count; i++) {
    const [value, s] = next(state)
    out.push(value)
    state = s
  }
  return out
}

describe('rng.next (mulberry32)', () => {
  // Expected values come from the usual closure form of mulberry32
  // (a |= 0; a = a + 0x6D2B79F5 | 0; ...), run separately in Node.
  it.each([
    [0, [0.26642920868471265, 0.0003297457005828619, 0.2232720274478197, 0.1462021479383111, 0.46732782293111086]],
    [42, [0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693, 0.17481389874592423]],
    [-1, [0.8964226141106337, 0.189478256739676, 0.7156526781618595, 0.9440599093213677, 0.8452364315744489]],
  ])('seed %i gives the fixed sequence', (seed, expected) => {
    expect(sequence(seed, 5)).toEqual(expected)
  })

  it('is pure: the same state always gives the same value and state', () => {
    fc.assert(
      fc.property(fc.integer({ min: -(2 ** 31), max: 2 ** 31 - 1 }), (seed) => {
        expect(next(seed)).toEqual(next(seed))
      }),
    )
  })

  it('returns values in [0, 1) and a 32-bit integer state', () => {
    fc.assert(
      fc.property(fc.integer({ min: -(2 ** 31), max: 2 ** 31 - 1 }), (seed) => {
        const [value, state] = next(seed)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
        expect(Number.isInteger(state)).toBe(true)
        expect(state | 0).toBe(state)
      }),
    )
  })
})

describe('rng.nextInt', () => {
  it('returns an integer in [0, n) and advances like next', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1, max: 1000 }), (seed, n) => {
        const [value, state] = nextInt(seed, n)
        expect(Number.isInteger(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(n)
        expect(state).toBe(next(seed)[1])
      }),
    )
  })

  it.each([0, -3, 2.5, Number.NaN])('rejects n = %s', (n) => {
    expect(() => nextInt(1, n)).toThrow(RangeError)
  })
})
