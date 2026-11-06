import { DAY, NOW } from "./sample-db-calendar.mjs";
import { chance, int, pick, random, weighted } from "./sample-db-random.mjs";
/** @import { Product } from "./sample-db-catalog.mjs" */
/** @import { Order } from "./sample-db-sales.mjs" */

/** @typedef {1 | 2 | 3 | 4 | 5} Rating */

/**
 * A `reviews` row.
 * @typedef {object} Review
 * @property {number} review_id
 * @property {number} product_id
 * @property {number} customer_id
 * @property {Rating} rating
 * @property {string} title
 * @property {string} body
 * @property {number} created_at
 */

/** @type {Record<Rating, string[]>} */
const reviewTitles = {
  5: [
    "Best coffee I have bought",
    "Worth every dollar",
    "Arrived fresh and smells amazing",
    "Does exactly what I hoped",
  ],
  4: ["Very good", "Solid choice", "Happy with it", "Great, small nitpicks"],
  3: ["It is fine", "Average", "Okay for the price"],
  2: ["Not what I expected", "Disappointing", "Could be better"],
  1: ["Stopped working", "Would not buy again", "Poor quality"],
};

/** @type {Record<Rating, string[]>} */
const reviewBodies = {
  5: [
    "Smooth, balanced and consistent every morning.",
    "Delivery was quick and the packaging was great.",
    "I have already ordered it again.",
  ],
  4: [
    "Good value and easy to use.",
    "Tastes great, shipping took a little long.",
    "Would recommend with a small caveat.",
  ],
  3: ["Does the job but nothing special.", "Some days great, some days flat."],
  2: [
    "Quality did not match the price.",
    "Needed a lot of tweaking to get a decent result.",
  ],
  1: [
    "Broke after a few weeks.",
    "Support was slow and the product was faulty.",
  ],
};

/**
 * Clamps a whole number of stars into the range `reviews.rating` allows.
 * @param {number} stars The stars, a whole number.
 * @returns {Rating} The rating.
 */
function clampRating(stars) {
  if (stars === 2 || stars === 3 || stars === 4) return stars;
  return stars < 2 ? 1 : 5;
}

/**
 * Draws the reviews: some delivered order lines get one, once per customer and product.
 * @param {Order[]} orders The orders, oldest first.
 * @returns {Review[]} The reviews.
 */
export function buildReviews(orders) {
  /** @type {Review[]} */
  const reviews = [];
  /** @type {Set<string>} */
  const reviewed = new Set();
  for (const order of orders) {
    if (order.status !== "delivered") continue;
    const customerId = order.customer_id;
    for (const item of order.items) {
      const key = `${customerId}:${item.product_id}`;
      if (reviewed.has(key) || !chance(0.26)) continue;
      const created =
        (order.deliveredAt ?? order.created_at + 5 * DAY) + int(2, 25) * DAY;
      if (created > NOW) continue;
      reviewed.add(key);
      const { bias } = item.product;
      const base = weighted([
        [5, 56],
        [4, 26],
        [3, 9],
        [2, 5],
        [1, 4],
      ]);
      const rating = clampRating(
        base + (random() < Math.abs(bias) ? Math.sign(bias) : 0),
      );
      reviews.push({
        review_id: reviews.length + 1,
        product_id: item.product_id,
        customer_id: customerId,
        rating,
        title: pick(reviewTitles[rating]),
        body: pick(reviewBodies[rating]),
        created_at: created,
      });
    }
  }
  return reviews;
}

/**
 * Sets each product's `rating_avg` to the mean of its reviews, rounded to cents, or null with none.
 * @param {Product[]} products The catalog products.
 * @param {Review[]} reviews The reviews.
 */
export function rateProducts(products, reviews) {
  for (const product of products) {
    const own = reviews.filter(
      (review) => review.product_id === product.product_id,
    );
    product.rating_avg =
      own.length > 0
        ? Math.round(
            (own.reduce((sum, review) => sum + review.rating, 0) / own.length) *
              100,
          ) / 100
        : null;
  }
}
