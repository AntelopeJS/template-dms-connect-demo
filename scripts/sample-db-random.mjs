const SEED = 20261031;

/**
 * Builds a seeded pseudo-random generator (mulberry32).
 * @param {number} seed The seed.
 * @returns {() => number} A function returning numbers in [0, 1).
 */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The one seeded stream every sample table draws from, returning numbers in [0, 1).
 * Each draw advances it, so the tables repeat only when they are drawn in the same order.
 */
export const random = createRandom(SEED);

/**
 * Draws a whole number.
 * @param {number} min The smallest value.
 * @param {number} max The largest value, included.
 * @returns {number} The drawn number.
 */
export const int = (min, max) => min + Math.floor(random() * (max - min + 1));

/**
 * Draws whether an event happens.
 * @param {number} probability The chance of `true`, in [0, 1].
 * @returns {boolean} Whether the event happens.
 */
export const chance = (probability) => random() < probability;

/**
 * Picks one entry of a list of `[value, weight]` pairs.
 * @template const T
 * @param {ReadonlyArray<readonly [T, number]>} entries The weighted values.
 * @returns {T} The picked value.
 */
export function weighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

/**
 * Picks one entry of a list, each equally likely.
 * @template T
 * @param {readonly T[]} list The entries.
 * @returns {T} The picked entry.
 */
export const pick = (list) => list[Math.floor(random() * list.length)];
