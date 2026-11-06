import { int, weighted } from "./sample-db-random.mjs";

/** The fixed clock: the shop is generated as it stands at this instant. */
export const NOW = Date.UTC(2026, 9, 31, 23, 59, 0);
/** One day, in milliseconds. */
export const DAY = 86_400_000;
const FIRST_MONTH = { year: 2025, month: 4 };
const MONTHS = 18;
const TARGET_ORDERS = 3000;

/**
 * Returns the first instant of a month of sales.
 * @param {number} index The month, counted from the first month of sales.
 * @returns {number} Its first day, in epoch milliseconds.
 */
const monthStart = (index) =>
  Date.UTC(FIRST_MONTH.year, FIRST_MONTH.month + index, 1);

/** The seasonal factor of each calendar month from January, with the November peak. */
const seasonal = [
  1.0, 0.95, 0.95, 1.0, 1.05, 1.1, 1.0, 1.0, 0.95, 1.05, 2.3, 1.6,
];

/**
 * Order volume weight of a month: steady growth times its seasonal factor.
 * @param {number} index The month, counted from the first month of sales.
 * @returns {number} The weight.
 */
function monthWeight(index) {
  const calendarMonth = (FIRST_MONTH.month + index) % 12;
  return (1 + 0.045 * index) * seasonal[calendarMonth];
}

const weights = Array.from({ length: MONTHS }, (_, index) =>
  monthWeight(index),
);
const weightSum = weights.reduce((a, b) => a + b, 0);
const monthCounts = weights.map((weight) =>
  Math.round((weight / weightSum) * TARGET_ORDERS),
);

/**
 * Relative weight of a calendar day inside its month.
 * @param {number} time The start of the day, in epoch milliseconds.
 * @returns {number} The weight.
 */
function dayWeight(time) {
  const date = new Date(time);
  const weekday = date.getUTCDay();
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  let weight = weekday === 0 || weekday === 6 ? 0.85 : 1;
  if (month === 10 && day >= 24) weight *= 1.5;
  if (month === 10 && day === 28) weight *= 3;
  if (month === 11 && day === 1) weight *= 2.5;
  if (month === 11 && day <= 15) weight *= 1.2;
  return weight;
}

/**
 * Creates the sorted timestamps of every order.
 * @returns {number[]} The timestamps, in epoch milliseconds.
 */
export function orderTimes() {
  /** @type {number[]} */
  const times = [];
  for (let index = 0; index < MONTHS; index += 1) {
    const start = monthStart(index);
    const days = (monthStart(index + 1) - start) / DAY;
    /** @type {Array<[number, number]>} */
    const dayEntries = Array.from({ length: days }, (_, d) => [
      start + d * DAY,
      dayWeight(start + d * DAY),
    ]);
    for (let n = 0; n < monthCounts[index]; n += 1) {
      const day = weighted(dayEntries);
      const hour = weighted([
        [8, 3],
        [10, 5],
        [12, 6],
        [14, 5],
        [16, 4],
        [18, 5],
        [20, 6],
        [22, 2],
      ]);
      const time =
        day + hour * 3_600_000 + int(0, 59) * 60_000 + int(0, 59) * 1000;
      if (time < NOW - 3_600_000) times.push(time);
    }
  }
  return times.sort((a, b) => a - b);
}
