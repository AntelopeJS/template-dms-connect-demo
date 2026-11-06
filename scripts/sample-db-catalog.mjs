import { DAY } from "./sample-db-calendar.mjs";

/**
 * A `categories` row.
 * @typedef {object} Category
 * @property {number} category_id
 * @property {string} name
 * @property {string} description
 */

/**
 * A `products` row, plus the traits that weigh baskets and reviews.
 * @typedef {object} Product
 * @property {number} product_id
 * @property {number} category_id
 * @property {string} sku
 * @property {string} name
 * @property {number} unit_price
 * @property {number} unit_cost
 * @property {number} stock_quantity
 * @property {number} reorder_level
 * @property {boolean} is_active
 * @property {number} created_at
 * @property {number | null} rating_avg Set once the reviews exist.
 * @property {number} popularity
 * @property {number} bias The chance of shifting a review by one star, signed by the direction.
 * @property {boolean} isMachine
 * @property {boolean} isGift
 * @property {boolean} isBeans
 */

/**
 * A `coupons` row.
 * @typedef {object} Coupon
 * @property {number} coupon_id
 * @property {string} code
 * @property {string} description
 * @property {number} discount_percent
 * @property {number} starts_at
 * @property {number} expires_at
 * @property {boolean} is_active
 * @property {number} times_redeemed Counted while the orders are placed.
 */

/**
 * What the shop sells.
 * @typedef {object} Catalog
 * @property {Category[]} categories
 * @property {Product[]} products
 * @property {Coupon[]} coupons
 */

/**
 * Rounds an amount to whole cents.
 * @param {number} value The amount, in USD.
 * @returns {number} The rounded amount.
 */
export const money = (value) => Math.round(value * 100) / 100;

/** @type {Array<[name: string, description: string]>} */
const categoryRows = [
  ["Whole beans", "Single origins and blends, roasted to order"],
  ["Ground coffee", "Ready to brew, ground for the method you use"],
  ["Machines and grinders", "Espresso machines, grinders and kettles"],
  ["Brewing accessories", "Drippers, filters, scales and tools"],
  ["Merchandise", "Mugs, tumblers and bags"],
  ["Gift sets", "Samplers and holiday boxes"],
];

/**
 * The products, in catalog order. Prices are in USD.
 * @type {Array<[
 *   name: string,
 *   categoryIndex: number,
 *   price: number,
 *   costRatio: number,
 *   popularity: number,
 *   ratingBias: number,
 *   stock: number,
 *   reorderLevel: number,
 *   active: boolean,
 * ]>}
 */
const productRows = [
  ["Ethiopia Yirgacheffe 12 oz", 0, 18.5, 0.42, 9, 0.3, 240, 60, true],
  ["Colombia Huila 12 oz", 0, 17.0, 0.42, 10, 0.1, 310, 60, true],
  ["Guatemala Antigua 12 oz", 0, 16.5, 0.43, 6, 0, 180, 60, true],
  ["Kenya AA 12 oz", 0, 19.5, 0.44, 7, 0.35, 14, 60, true],
  ["Brazil Santos 12 oz", 0, 14.0, 0.4, 8, -0.1, 420, 80, true],
  ["Sumatra Mandheling 12 oz", 0, 16.0, 0.42, 5, 0, 150, 50, true],
  ["House Blend 12 oz", 0, 13.5, 0.38, 16, 0.05, 520, 100, true],
  ["Espresso Roast 12 oz", 0, 14.5, 0.38, 14, 0.15, 460, 100, true],
  ["Decaf Swiss Water 12 oz", 0, 16.5, 0.45, 4, -0.2, 22, 40, true],
  ["Costa Rica Tarrazu 12 oz", 0, 17.5, 0.43, 5, 0.1, 130, 50, true],
  ["Honduras Marcala 12 oz", 0, 15.0, 0.41, 3, -0.05, 0, 40, false],
  ["Rwanda Bourbon 12 oz", 0, 18.0, 0.44, 4, 0.25, 0, 40, true],
  ["House Blend ground 12 oz", 1, 13.5, 0.4, 7, -0.1, 260, 60, true],
  ["Espresso ground 12 oz", 1, 14.5, 0.4, 6, -0.1, 200, 60, true],
  ["Decaf ground 12 oz", 1, 16.0, 0.46, 2, -0.3, 90, 30, true],
  ["Dark roast ground 12 oz", 1, 14.0, 0.4, 4, -0.15, 140, 50, true],
  ["Cold brew coarse grind 12 oz", 1, 15.0, 0.41, 5, 0.05, 170, 50, true],
  ["Home espresso machine", 2, 449.0, 0.58, 3, -0.2, 3, 10, true],
  ["Compact espresso machine", 2, 299.0, 0.57, 4, 0, 36, 10, true],
  ["Pro espresso machine", 2, 899.0, 0.6, 1.2, -0.45, 12, 5, true],
  ["Burr grinder", 2, 129.0, 0.52, 6, 0.1, 64, 15, true],
  ["Hand grinder", 2, 79.0, 0.5, 5, -0.55, 0, 20, true],
  ["Electric kettle", 2, 69.0, 0.5, 4, 0.05, 48, 15, true],
  ["Moka pot", 2, 39.0, 0.48, 2, 0, 0, 15, false],
  ["Pour-over dripper", 3, 28.0, 0.45, 6, 0.2, 110, 30, true],
  ["Paper filters 100 count", 3, 9.0, 0.35, 12, 0.1, 380, 100, true],
  ["Digital coffee scale", 3, 45.0, 0.5, 4, 0.05, 52, 15, true],
  ["Milk frother", 3, 25.0, 0.45, 5, -0.1, 75, 20, true],
  ["Cleaning tablets", 3, 12.0, 0.3, 5, 0, 140, 40, true],
  ["Cold brew bottle", 3, 32.0, 0.45, 3, 0.1, 60, 20, true],
  ["Espresso tamper", 3, 29.0, 0.45, 3, 0.15, 4, 15, true],
  ["Knock box", 3, 24.0, 0.45, 2, 0, 33, 10, true],
  ["Ceramic mug", 4, 16.0, 0.35, 8, 0.2, 210, 50, true],
  ["Travel tumbler", 4, 29.0, 0.4, 5, 0.1, 85, 25, true],
  ["Canvas tote bag", 4, 18.0, 0.3, 3, 0.05, 120, 30, true],
  ["Sampler gift box", 5, 42.0, 0.45, 5, 0.3, 70, 25, true],
  ["Tasting set", 5, 36.0, 0.45, 3, 0.2, 55, 20, true],
  ["Holiday gift box", 5, 55.0, 0.45, 2, 0.25, 11, 30, true],
];

/**
 * The coupons, in catalog order.
 * @type {Array<[
 *   code: string,
 *   description: string,
 *   discountPercent: number,
 *   startsAt: number,
 *   expiresAt: number,
 *   active: boolean,
 * ]>}
 */
const couponRows = [
  [
    "WELCOME10",
    "Welcome offer for new customers",
    10,
    Date.UTC(2025, 3, 1),
    Date.UTC(2027, 3, 1),
    true,
  ],
  [
    "SPRING10",
    "Spring fresh roast",
    10,
    Date.UTC(2025, 3, 15),
    Date.UTC(2025, 4, 31),
    false,
  ],
  [
    "SUMMER15",
    "Summer cold brew",
    15,
    Date.UTC(2025, 5, 15),
    Date.UTC(2025, 7, 15),
    false,
  ],
  [
    "BEANS5",
    "Five percent on whole beans",
    5,
    Date.UTC(2025, 8, 1),
    Date.UTC(2025, 9, 30),
    false,
  ],
  [
    "BLACKFRIDAY20",
    "Black Friday weekend",
    20,
    Date.UTC(2025, 10, 24),
    Date.UTC(2025, 10, 30),
    false,
  ],
  [
    "CYBER15",
    "Cyber Monday",
    15,
    Date.UTC(2025, 11, 1),
    Date.UTC(2025, 11, 2),
    false,
  ],
  [
    "HOLIDAY25",
    "Holiday gift boxes",
    25,
    Date.UTC(2025, 11, 5),
    Date.UTC(2025, 11, 20),
    false,
  ],
  [
    "NEWYEAR10",
    "New year reset",
    10,
    Date.UTC(2026, 0, 2),
    Date.UTC(2026, 0, 31),
    false,
  ],
  [
    "SPRING26",
    "Spring 2026 launch",
    12,
    Date.UTC(2026, 2, 20),
    Date.UTC(2026, 4, 10),
    false,
  ],
  [
    "SUMMER26",
    "Summer 2026 cold brew",
    15,
    Date.UTC(2026, 5, 15),
    Date.UTC(2026, 7, 15),
    false,
  ],
  [
    "FRIENDS10",
    "Referral from a friend",
    10,
    Date.UTC(2025, 6, 1),
    Date.UTC(2027, 3, 1),
    true,
  ],
  [
    "FALL26",
    "Fall harvest roasts",
    10,
    Date.UTC(2026, 8, 20),
    Date.UTC(2026, 10, 15),
    true,
  ],
  [
    "BLACKFRIDAY26",
    "Black Friday weekend 2026",
    20,
    Date.UTC(2026, 10, 23),
    Date.UTC(2026, 10, 30),
    true,
  ],
];

/**
 * Builds the categories, products and coupons, with no coupon redeemed and no product rated yet.
 * @returns {Catalog} The catalog.
 */
export function buildCatalog() {
  const categories = categoryRows.map(([name, description], index) => ({
    category_id: index + 1,
    name,
    description,
  }));
  const products = productRows.map(
    (
      [
        name,
        categoryIndex,
        price,
        costRatio,
        popularity,
        bias,
        stock,
        reorder,
        active,
      ],
      index,
    ) => ({
      product_id: index + 1,
      category_id: categoryIndex + 1,
      sku: `SKU-${String(1001 + index)}`,
      name,
      unit_price: price,
      unit_cost: money(price * costRatio),
      stock_quantity: stock,
      reorder_level: reorder,
      is_active: active,
      created_at: Date.UTC(2025, 2, 1) + index * DAY,
      rating_avg: null,
      popularity,
      bias,
      isMachine: categoryIndex === 2,
      isGift: categoryIndex === 5,
      isBeans: categoryIndex === 0 || categoryIndex === 1,
    }),
  );
  const coupons = couponRows.map(
    ([code, description, percent, starts, expires, active], index) => ({
      coupon_id: index + 1,
      code,
      description,
      discount_percent: percent,
      starts_at: starts,
      expires_at: expires,
      is_active: active,
      times_redeemed: 0,
    }),
  );
  return { categories, products, coupons };
}
