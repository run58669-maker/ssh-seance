// mulberry32, written as a pure function over an explicit state so the
// generator can live inside GameState (requirement 6.1, tech.md invariant 1).

/**
 * Advance the generator once.
 * @param state any 32-bit integer; the seed for the first call
 * @returns a float in [0, 1) and the state to pass to the next call
 */
export function next(state: number): [value: number, state: number] {
  const s = (state + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s]
}

/**
 * An integer in [0, n), for shuffles and tie-breaks.
 * @param n a positive integer
 */
export function nextInt(state: number, n: number): [value: number, state: number] {
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError(`nextInt: n must be a positive integer, got ${n}`)
  }
  const [value, s] = next(state)
  return [Math.floor(value * n), s]
}
