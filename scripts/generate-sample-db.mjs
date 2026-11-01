#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Writes `sample-db/01-shop.sql`, the sample database of a coffee brand that sells beans, machines and accessories online.
 * The output is deterministic: a fixed seed, a fixed clock and no network access.
 * Run `node scripts/generate-sample-db.mjs` after changing this file and commit the result.
 */
const SEED = 20261031;
const NOW = Date.UTC(2026, 9, 31, 23, 59, 0);
const FIRST_MONTH = { year: 2025, month: 4 };
const MONTHS = 18;
const TARGET_ORDERS = 3000;
const DAY = 86_400_000;
const target = fileURLToPath(new URL("../sample-db/01-shop.sql", import.meta.url));

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

const random = createRandom(SEED);
const int = (min, max) => min + Math.floor(random() * (max - min + 1));
const chance = (probability) => random() < probability;
const money = (value) => Math.round(value * 100) / 100;

/**
 * Picks one entry of a list of `[value, weight]` pairs.
 * @template T
 * @param {Array<[T, number]>} entries The weighted values.
 * @returns {T} The picked value.
 */
function weighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

const pick = (list) => list[Math.floor(random() * list.length)];

const categories = [
  ["Whole beans", "Single origins and blends, roasted to order"],
  ["Ground coffee", "Ready to brew, ground for the method you use"],
  ["Machines and grinders", "Espresso machines, grinders and kettles"],
  ["Brewing accessories", "Drippers, filters, scales and tools"],
  ["Merchandise", "Mugs, tumblers and bags"],
  ["Gift sets", "Samplers and holiday boxes"],
];

/** Each product: name, category index, price in USD, cost ratio, popularity, rating bias, stock, reorder level, active. */
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

const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Elijah", "Sophia", "Lucas", "Mia", "Mason", "Amelia", "Ethan", "Harper", "Logan", "Evelyn", "James", "Abigail", "Aiden", "Ella", "Jack", "Chloe", "Leo", "Nora", "Hugo", "Lea", "Jonas", "Clara", "Mateo", "Zoe", "Finn", "Ines", "Oscar", "Maya", "Theo", "Elena", "Samuel", "Ruby", "Daniel", "Alice", "Victor"];
const lastNames = ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Martin", "Garcia", "Lee", "Walker", "Hall", "Young", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Dubois", "Peeters", "Janssens", "Muller", "Schmidt", "Rossi", "Silva", "Jansen", "De Vries", "Kowalski"];
const countries = [["US", 38], ["GB", 12], ["DE", 10], ["FR", 9], ["BE", 7], ["NL", 6], ["CA", 6], ["ES", 4], ["IT", 4], ["AU", 4]];
const carriers = [["ups", 34], ["fedex", 26], ["dhl", 24], ["usps", 16]];
const agents = ["Maya Chen", "Luis Ortega", "Priya Nair", "Tom Becker", "Sarah Okafor", "Jonas Weber"];

const monthStart = (index) => Date.UTC(FIRST_MONTH.year, FIRST_MONTH.month + index, 1);
const monthIndexOf = (time) => {
  const date = new Date(time);
  return (date.getUTCFullYear() - FIRST_MONTH.year) * 12 + date.getUTCMonth() - FIRST_MONTH.month;
};

/** Order volume weight of a month: steady growth times a seasonal factor with the November peak. */
const seasonal = [1.0, 0.95, 0.95, 1.0, 1.05, 1.1, 1.0, 1.0, 0.95, 1.05, 2.3, 1.6];
function monthWeight(index) {
  const calendarMonth = (FIRST_MONTH.month + index) % 12;
  return (1 + 0.045 * index) * seasonal[calendarMonth];
}

const weights = Array.from({ length: MONTHS }, (_, index) => monthWeight(index));
const weightSum = weights.reduce((a, b) => a + b, 0);
const monthCounts = weights.map((weight) => Math.round((weight / weightSum) * TARGET_ORDERS));

/** Relative weight of a calendar day inside its month. */
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

/** Creates the sorted timestamps of every order. */
function orderTimes() {
  const times = [];
  for (let index = 0; index < MONTHS; index += 1) {
    const start = monthStart(index);
    const days = (monthStart(index + 1) - start) / DAY;
    const dayEntries = Array.from({ length: days }, (_, d) => [start + d * DAY, dayWeight(start + d * DAY)]);
    for (let n = 0; n < monthCounts[index]; n += 1) {
      const day = weighted(dayEntries);
      const hour = weighted([[8, 3], [10, 5], [12, 6], [14, 5], [16, 4], [18, 5], [20, 6], [22, 2]]);
      const time = day + hour * 3_600_000 + int(0, 59) * 60_000 + int(0, 59) * 1000;
      if (time < NOW - 3_600_000) times.push(time);
    }
  }
  return times.sort((a, b) => a - b);
}

const customers = [];
const orderCounts = new Map();

/** Creates a customer who signs up shortly before `time`. */
function newCustomer(time, signupLead) {
  const first = pick(firstNames);
  const last = pick(lastNames);
  const id = customers.length + 1;
  const created = Math.min(time - signupLead, NOW);
  const customer = {
    customer_id: id,
    email: `${first}.${last}${id}@example.com`.toLowerCase().replaceAll(" ", ""),
    full_name: `${first} ${last}`,
    country: weighted(countries),
    segment: weighted([["consumer", 78], ["business", 15], ["wholesale", 7]]),
    created_at: created,
  };
  customers.push(customer);
  orderCounts.set(id, 0);
  return customer;
}

for (let n = 0; n < 40; n += 1) newCustomer(Date.UTC(2025, 3, 1) + n * 3 * DAY, 0);

const productList = productRows.map(([name, categoryIndex, price, costRatio, popularity, bias, stock, reorder, active], index) => ({
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
  popularity,
  bias,
  rating_avg: null,
  isMachine: categoryIndex === 2,
  isGift: categoryIndex === 5,
  isBeans: categoryIndex === 0 || categoryIndex === 1,
}));

/** Weight of a product in a basket placed at `time`. */
function productWeight(product, time) {
  const month = new Date(time).getUTCMonth();
  if (!product.is_active && time > Date.UTC(2026, 2, 1)) return 0;
  let weight = product.popularity;
  if (product.isGift) weight *= month >= 9 ? (month === 10 ? 5 : 3) : 0.6;
  if (product.isMachine && month === 10) weight *= 2.2;
  if (product.name === "Cold brew coarse grind 12 oz" || product.name === "Cold brew bottle") weight *= month >= 4 && month <= 8 ? 1.8 : 0.6;
  return weight;
}

const couponRows = [
  ["WELCOME10", "Welcome offer for new customers", 10, Date.UTC(2025, 3, 1), Date.UTC(2027, 3, 1), true],
  ["SPRING10", "Spring fresh roast", 10, Date.UTC(2025, 3, 15), Date.UTC(2025, 4, 31), false],
  ["SUMMER15", "Summer cold brew", 15, Date.UTC(2025, 5, 15), Date.UTC(2025, 7, 15), false],
  ["BEANS5", "Five percent on whole beans", 5, Date.UTC(2025, 8, 1), Date.UTC(2025, 9, 30), false],
  ["BLACKFRIDAY20", "Black Friday weekend", 20, Date.UTC(2025, 10, 24), Date.UTC(2025, 10, 30), false],
  ["CYBER15", "Cyber Monday", 15, Date.UTC(2025, 11, 1), Date.UTC(2025, 11, 2), false],
  ["HOLIDAY25", "Holiday gift boxes", 25, Date.UTC(2025, 11, 5), Date.UTC(2025, 11, 20), false],
  ["NEWYEAR10", "New year reset", 10, Date.UTC(2026, 0, 2), Date.UTC(2026, 0, 31), false],
  ["SPRING26", "Spring 2026 launch", 12, Date.UTC(2026, 2, 20), Date.UTC(2026, 4, 10), false],
  ["SUMMER26", "Summer 2026 cold brew", 15, Date.UTC(2026, 5, 15), Date.UTC(2026, 7, 15), false],
  ["FRIENDS10", "Referral from a friend", 10, Date.UTC(2025, 6, 1), Date.UTC(2027, 3, 1), true],
  ["FALL26", "Fall harvest roasts", 10, Date.UTC(2026, 8, 20), Date.UTC(2026, 10, 15), true],
  ["BLACKFRIDAY26", "Black Friday weekend 2026", 20, Date.UTC(2026, 10, 23), Date.UTC(2026, 10, 30), true],
].map(([code, description, percent, starts, expires, active], index) => ({
  coupon_id: index + 1, code, description, discount_percent: percent, starts_at: starts, expires_at: expires, is_active: active, times_redeemed: 0,
}));

/** Picks a coupon valid at `time`, or null. */
function couponFor(time, isNewCustomer) {
  const valid = couponRows.filter((coupon) => coupon.starts_at <= time && coupon.expires_at >= time && coupon.code !== "WELCOME10");
  if (isNewCustomer && chance(0.3)) return couponRows[0];
  if (valid.length > 0 && chance(0.38)) return pick(valid);
  return null;
}

const orders = [];
const orderItems = [];
const payments = [];
const shipments = [];
const returns = [];
const ordersByCustomer = new Map();

for (const time of orderTimes()) {
  const repeatPool = customers.filter((customer) => customer.created_at < time - DAY);
  const returning = repeatPool.length > 30 && chance(0.46);
  let customer;
  let isNew = false;
  if (returning) {
    const heavy = repeatPool.filter((candidate) => orderCounts.get(candidate.customer_id) > 0);
    customer = chance(0.8) && heavy.length > 0 ? pick(heavy) : pick(repeatPool);
  } else {
    customer = newCustomer(time, int(1, 6) * 3_600_000);
    isNew = true;
  }
  if (orderCounts.get(customer.customer_id) === 0) isNew = true;
  orderCounts.set(customer.customer_id, orderCounts.get(customer.customer_id) + 1);

  const orderId = orders.length + 1;
  const channel = weighted([["web", 62], ["marketplace", 23], ["retail", 15]]);
  const lineCount = weighted([[1, 45], [2, 30], [3, 17], [4, 8]]);
  const entries = productList.map((product) => [product, productWeight(product, time)]).filter(([, weight]) => weight > 0);
  const chosen = new Set();
  let subtotal = 0;
  for (let line = 0; line < lineCount; line += 1) {
    const product = weighted(entries);
    if (chosen.has(product.product_id)) continue;
    chosen.add(product.product_id);
    const bulk = customer.segment !== "consumer" && product.isBeans;
    const quantity = bulk ? int(3, 12) : weighted([[1, 78], [2, 16], [3, 6]]);
    const lineTotal = money(quantity * product.unit_price);
    subtotal += lineTotal;
    orderItems.push({ order_item_id: orderItems.length + 1, order_id: orderId, product_id: product.product_id, quantity, unit_price: product.unit_price, line_total: lineTotal });
  }
  subtotal = money(subtotal);
  const coupon = channel === "retail" ? null : couponFor(time, isNew);
  const discount = coupon ? money((subtotal * coupon.discount_percent) / 100) : 0;
  if (coupon) coupon.times_redeemed += 1;
  const shipping = channel === "retail" || subtotal - discount >= 50 ? 0 : 5.95;
  const total = money(subtotal - discount + shipping);

  const age = (NOW - time) / DAY;
  let status;
  if (chance(0.04)) status = "cancelled";
  else if (age > 20 && chance(0.037)) status = "refunded";
  else if (age < 1.5) status = chance(0.55) ? "pending" : "paid";
  else if (age < 4) status = chance(0.3) ? "paid" : "shipped";
  else if (age < 8) status = chance(0.45) ? "shipped" : "delivered";
  else status = "delivered";

  const order = { order_id: orderId, customer_id: customer.customer_id, coupon_id: coupon ? coupon.coupon_id : null, status, channel, subtotal_amount: subtotal, discount_amount: discount, shipping_amount: shipping, total_amount: total, created_at: time };
  orders.push(order);
  (ordersByCustomer.get(customer.customer_id) ?? ordersByCustomer.set(customer.customer_id, []).get(customer.customer_id)).push(order);

  const method = channel === "retail" ? "card" : weighted([["card", 58], ["paypal", 22], ["apple_pay", 12], ["bank_transfer", 8]]);
  let paymentStatus = "captured";
  if (status === "pending") paymentStatus = "pending";
  else if (status === "cancelled") paymentStatus = "failed";
  else if (status === "refunded") paymentStatus = "refunded";
  const paidAt = paymentStatus === "captured" || paymentStatus === "refunded" ? time + int(1, 20) * 60_000 : null;
  payments.push({ payment_id: payments.length + 1, order_id: orderId, method, status: paymentStatus, amount: total, paid_at: paidAt, created_at: time });

  if (status === "shipped" || status === "delivered" || status === "refunded") {
    const shippedAt = time + int(4, 40) * 3_600_000;
    const carrier = weighted(carriers);
    const transitDays = int(2, 6);
    const late = chance(carrier === "usps" ? 0.2 : 0.1);
    const delayDays = late ? int(1, 6) : 0;
    const arrival = shippedAt + (transitDays + delayDays) * DAY;
    let shipmentStatus;
    let deliveredAt = null;
    if (arrival <= NOW) {
      shipmentStatus = "delivered";
      deliveredAt = arrival;
    } else {
      shipmentStatus = late && shippedAt + transitDays * DAY < NOW ? "delayed" : "in_transit";
    }
    if (status === "delivered" && deliveredAt === null) {
      shipmentStatus = "delivered";
      deliveredAt = Math.min(arrival, NOW);
    }
    shipments.push({ shipment_id: shipments.length + 1, order_id: orderId, carrier, tracking_number: `${carrier.toUpperCase()}${String(int(10 ** 9, 10 ** 10 - 1))}`, status: shipmentStatus, shipped_at: Math.min(shippedAt, NOW), delivered_at: deliveredAt, delay_days: shipmentStatus === "in_transit" ? 0 : delayDays });
    order.deliveredAt = deliveredAt;
  }
}

const productById = new Map(productList.map((product) => [product.product_id, product]));
const itemsByOrder = new Map();
for (const item of orderItems) (itemsByOrder.get(item.order_id) ?? itemsByOrder.set(item.order_id, []).get(item.order_id)).push(item);

const reasons = [["damaged_in_transit", 22], ["wrong_item", 12], ["not_as_described", 16], ["changed_mind", 28], ["defective", 22]];
for (const order of orders) {
  const isRefunded = order.status === "refunded";
  if (!isRefunded && !(order.status === "delivered" && chance(0.045))) continue;
  const created = (order.deliveredAt ?? order.created_at + 4 * DAY) + int(1, 10) * DAY;
  if (created > NOW) continue;
  const age = (NOW - created) / DAY;
  let status;
  if (isRefunded) status = "refunded";
  else if (age < 3) status = "requested";
  else if (age < 7) status = weighted([["approved", 50], ["received", 30], ["rejected", 20]]);
  else status = weighted([["refunded", 55], ["received", 15], ["rejected", 25], ["approved", 5]]);
  const refund = status === "rejected" || status === "requested" ? 0 : isRefunded ? order.total_amount : money(order.total_amount * (chance(0.6) ? 1 : 0.5));
  returns.push({ return_id: returns.length + 1, order_id: order.order_id, reason: weighted(reasons), status, refund_amount: refund, created_at: created });
}

const reviewTitles = {
  5: ["Best coffee I have bought", "Worth every dollar", "Arrived fresh and smells amazing", "Does exactly what I hoped"],
  4: ["Very good", "Solid choice", "Happy with it", "Great, small nitpicks"],
  3: ["It is fine", "Average", "Okay for the price"],
  2: ["Not what I expected", "Disappointing", "Could be better"],
  1: ["Stopped working", "Would not buy again", "Poor quality"],
};
const reviewBodies = {
  5: ["Smooth, balanced and consistent every morning.", "Delivery was quick and the packaging was great.", "I have already ordered it again."],
  4: ["Good value and easy to use.", "Tastes great, shipping took a little long.", "Would recommend with a small caveat."],
  3: ["Does the job but nothing special.", "Some days great, some days flat."],
  2: ["Quality did not match the price.", "Needed a lot of tweaking to get a decent result."],
  1: ["Broke after a few weeks.", "Support was slow and the product was faulty."],
};
const reviews = [];
const reviewed = new Set();
for (const order of orders) {
  if (order.status !== "delivered") continue;
  const customerId = order.customer_id;
  for (const item of itemsByOrder.get(order.order_id) ?? []) {
    const key = `${customerId}:${item.product_id}`;
    if (reviewed.has(key) || !chance(0.26)) continue;
    const created = (order.deliveredAt ?? order.created_at + 5 * DAY) + int(2, 25) * DAY;
    if (created > NOW) continue;
    reviewed.add(key);
    const product = productById.get(item.product_id);
    const base = weighted([[5, 56], [4, 26], [3, 9], [2, 5], [1, 4]]);
    const shifted = base + (random() < Math.abs(product.bias) ? Math.sign(product.bias) : 0);
    const rating = Math.min(5, Math.max(1, shifted));
    reviews.push({ review_id: reviews.length + 1, product_id: item.product_id, customer_id: customerId, rating, title: pick(reviewTitles[rating]), body: pick(reviewBodies[rating]), created_at: created });
  }
}
for (const product of productList) {
  const own = reviews.filter((review) => review.product_id === product.product_id);
  product.rating_avg = own.length > 0 ? Math.round((own.reduce((sum, review) => sum + review.rating, 0) / own.length) * 100) / 100 : null;
}

const subjects = [
  ["Where is my order", 30], ["Package arrived damaged", 10], ["Wrong item received", 7], ["Refund status", 12], ["Machine will not heat water", 6], ["Grinder is noisy", 4], ["Change my subscription", 10], ["Coupon code not working", 9], ["Update my shipping address", 8], ["Question about roast date", 4],
];
const tickets = [];
for (const order of orders) {
  if (!chance(order.status === "refunded" ? 0.55 : order.status === "cancelled" ? 0.1 : 0.12)) continue;
  const created = order.created_at + int(1, 12) * DAY + int(0, 20) * 3_600_000;
  if (created > NOW) continue;
  const age = (NOW - created) / DAY;
  const status = age < 2 ? weighted([["open", 60], ["pending", 40]]) : age < 10 ? weighted([["open", 18], ["pending", 22], ["resolved", 40], ["closed", 20]]) : weighted([["open", 3], ["pending", 4], ["resolved", 33], ["closed", 60]]);
  const priority = weighted([["low", 30], ["normal", 45], ["high", 20], ["urgent", 5]]);
  const assignee = status === "open" && age < 2 && chance(0.5) ? null : pick(agents);
  const resolvedAt = status === "resolved" || status === "closed" ? Math.min(created + int(2, 72) * 3_600_000, NOW) : null;
  tickets.push({ ticket_id: tickets.length + 1, customer_id: order.customer_id, order_id: order.order_id, subject: weighted(subjects), priority, status, assignee, created_at: created, resolved_at: resolvedAt });
}

const subscriptions = [];
const beanProducts = productList.filter((product) => product.isBeans && product.is_active);
const subscribers = new Set();
for (const customer of customers) {
  const own = ordersByCustomer.get(customer.customer_id) ?? [];
  if (own.length === 0 || subscribers.has(customer.customer_id) || !chance(own.length > 1 ? 0.2 : 0.06)) continue;
  subscribers.add(customer.customer_id);
  const product = pick(beanProducts);
  const startedAt = own[0].created_at + int(1, 30) * DAY;
  if (startedAt > NOW) continue;
  const plan = weighted([["monthly", 55], ["bimonthly", 25], ["quarterly", 20]]);
  const status = weighted([["active", 62], ["paused", 14], ["cancelled", 24]]);
  const period = plan === "monthly" ? 30 : plan === "bimonthly" ? 60 : 90;
  const cancelledAt = status === "cancelled" ? Math.min(startedAt + int(1, 6) * period * DAY, NOW) : null;
  subscriptions.push({ subscription_id: subscriptions.length + 1, customer_id: customer.customer_id, product_id: product.product_id, plan, status, price_per_delivery: money(product.unit_price * 0.9), started_at: startedAt, next_delivery_at: status === "active" ? NOW + int(1, period) * DAY : null, cancelled_at: cancelledAt });
}

const ddl = `-- Generated by scripts/generate-sample-db.mjs. Do not edit by hand.
-- A direct-to-consumer coffee brand. Every amount is in US dollars (USD).

CREATE TABLE customers (
  customer_id integer PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  country char(2) NOT NULL,
  segment text NOT NULL CHECK (segment IN ('consumer', 'business', 'wholesale')),
  created_at timestamptz NOT NULL
);

CREATE TABLE categories (
  category_id integer PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL
);

CREATE TABLE products (
  product_id integer PRIMARY KEY,
  category_id integer NOT NULL REFERENCES categories (category_id),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  unit_cost numeric(10, 2) NOT NULL CHECK (unit_cost >= 0),
  stock_quantity integer NOT NULL CHECK (stock_quantity >= 0),
  reorder_level integer NOT NULL CHECK (reorder_level >= 0),
  rating_avg numeric(3, 2) CHECK (rating_avg BETWEEN 1 AND 5),
  is_active boolean NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE coupons (
  coupon_id integer PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL,
  times_redeemed integer NOT NULL CHECK (times_redeemed >= 0)
);

CREATE TABLE orders (
  order_id integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (customer_id),
  coupon_id integer REFERENCES coupons (coupon_id),
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  channel text NOT NULL CHECK (channel IN ('web', 'marketplace', 'retail')),
  subtotal_amount numeric(10, 2) NOT NULL,
  discount_amount numeric(10, 2) NOT NULL,
  shipping_amount numeric(10, 2) NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE order_items (
  order_item_id integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (order_id),
  product_id integer NOT NULL REFERENCES products (product_id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL,
  line_total numeric(10, 2) NOT NULL
);

CREATE TABLE payments (
  payment_id integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (order_id),
  method text NOT NULL CHECK (method IN ('card', 'paypal', 'apple_pay', 'bank_transfer')),
  status text NOT NULL CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
  amount numeric(10, 2) NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE shipments (
  shipment_id integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (order_id),
  carrier text NOT NULL CHECK (carrier IN ('ups', 'fedex', 'dhl', 'usps')),
  tracking_number text NOT NULL,
  status text NOT NULL CHECK (status IN ('in_transit', 'delayed', 'delivered')),
  shipped_at timestamptz NOT NULL,
  delivered_at timestamptz,
  delay_days integer NOT NULL CHECK (delay_days >= 0)
);

CREATE TABLE returns (
  return_id integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (order_id),
  reason text NOT NULL CHECK (reason IN ('damaged_in_transit', 'wrong_item', 'not_as_described', 'changed_mind', 'defective')),
  status text NOT NULL CHECK (status IN ('requested', 'approved', 'received', 'refunded', 'rejected')),
  refund_amount numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE reviews (
  review_id integer PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products (product_id),
  customer_id integer NOT NULL REFERENCES customers (customer_id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE support_tickets (
  ticket_id integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (customer_id),
  order_id integer REFERENCES orders (order_id),
  subject text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  assignee text,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz
);

CREATE TABLE subscriptions (
  subscription_id integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (customer_id),
  product_id integer NOT NULL REFERENCES products (product_id),
  plan text NOT NULL CHECK (plan IN ('monthly', 'bimonthly', 'quarterly')),
  status text NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')),
  price_per_delivery numeric(10, 2) NOT NULL,
  started_at timestamptz NOT NULL,
  next_delivery_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX orders_customer_id_idx ON orders (customer_id);
CREATE INDEX orders_created_at_idx ON orders (created_at);
CREATE INDEX order_items_order_id_idx ON order_items (order_id);
CREATE INDEX order_items_product_id_idx ON order_items (product_id);
CREATE INDEX payments_order_id_idx ON payments (order_id);
CREATE INDEX shipments_order_id_idx ON shipments (order_id);
CREATE INDEX returns_order_id_idx ON returns (order_id);
CREATE INDEX reviews_product_id_idx ON reviews (product_id);
CREATE INDEX support_tickets_customer_id_idx ON support_tickets (customer_id);
CREATE INDEX subscriptions_customer_id_idx ON subscriptions (customer_id);

COMMENT ON TABLE customers IS 'Customers';
COMMENT ON TABLE categories IS 'Categories';
COMMENT ON TABLE products IS 'Products';
COMMENT ON TABLE coupons IS 'Coupons';
COMMENT ON TABLE orders IS 'Orders';
COMMENT ON TABLE order_items IS 'Order items';
COMMENT ON TABLE payments IS 'Payments';
COMMENT ON TABLE shipments IS 'Shipments';
COMMENT ON TABLE returns IS 'Returns';
COMMENT ON TABLE reviews IS 'Reviews';
COMMENT ON TABLE support_tickets IS 'Support tickets';
COMMENT ON TABLE subscriptions IS 'Subscriptions';

COMMENT ON COLUMN products.unit_price IS 'Price (USD)';
COMMENT ON COLUMN products.unit_cost IS 'Cost (USD)';
COMMENT ON COLUMN orders.subtotal_amount IS 'Subtotal (USD)';
COMMENT ON COLUMN orders.discount_amount IS 'Discount (USD)';
COMMENT ON COLUMN orders.shipping_amount IS 'Shipping (USD)';
COMMENT ON COLUMN orders.total_amount IS 'Total (USD)';
COMMENT ON COLUMN order_items.unit_price IS 'Unit price (USD)';
COMMENT ON COLUMN order_items.line_total IS 'Line total (USD)';
COMMENT ON COLUMN payments.amount IS 'Amount (USD)';
COMMENT ON COLUMN returns.refund_amount IS 'Refund (USD)';
COMMENT ON COLUMN subscriptions.price_per_delivery IS 'Price per delivery (USD)';
COMMENT ON COLUMN coupons.discount_percent IS 'Discount (percent)';
`;

const iso = (time) => (time === null ? "\\N" : new Date(time).toISOString().replace("T", " ").replace("Z", "+00"));
const cell = (value) => {
  if (value === null || value === undefined) return "\\N";
  if (typeof value === "boolean") return value ? "t" : "f";
  const text = String(value);
  if (/[\t\n\\]/.test(text)) throw new Error(`Unsafe COPY value: ${text}`);
  return text;
};

/**
 * Renders one table as a COPY block.
 * @param {string} table The table name.
 * @param {string[]} columns The column names, in order.
 * @param {object[]} rows The rows.
 * @param {string[]} timeColumns The columns holding epoch milliseconds.
 * @returns {string} The COPY statement with its data.
 */
function copyBlock(table, columns, rows, timeColumns = []) {
  const lines = rows.map((row) => columns.map((column) => (timeColumns.includes(column) ? iso(row[column]) : cell(row[column]))).join("\t"));
  return `COPY ${table} (${columns.join(", ")}) FROM stdin;\n${lines.join("\n")}\n\\.\n`;
}

const body = [
  copyBlock("categories", ["category_id", "name", "description"], categories.map(([name, description], index) => ({ category_id: index + 1, name, description }))),
  copyBlock("customers", ["customer_id", "email", "full_name", "country", "segment", "created_at"], customers, ["created_at"]),
  copyBlock("products", ["product_id", "category_id", "sku", "name", "unit_price", "unit_cost", "stock_quantity", "reorder_level", "rating_avg", "is_active", "created_at"], productList, ["created_at"]),
  copyBlock("coupons", ["coupon_id", "code", "description", "discount_percent", "starts_at", "expires_at", "is_active", "times_redeemed"], couponRows, ["starts_at", "expires_at"]),
  copyBlock("orders", ["order_id", "customer_id", "coupon_id", "status", "channel", "subtotal_amount", "discount_amount", "shipping_amount", "total_amount", "created_at"], orders, ["created_at"]),
  copyBlock("order_items", ["order_item_id", "order_id", "product_id", "quantity", "unit_price", "line_total"], orderItems),
  copyBlock("payments", ["payment_id", "order_id", "method", "status", "amount", "paid_at", "created_at"], payments, ["paid_at", "created_at"]),
  copyBlock("shipments", ["shipment_id", "order_id", "carrier", "tracking_number", "status", "shipped_at", "delivered_at", "delay_days"], shipments, ["shipped_at", "delivered_at"]),
  copyBlock("returns", ["return_id", "order_id", "reason", "status", "refund_amount", "created_at"], returns, ["created_at"]),
  copyBlock("reviews", ["review_id", "product_id", "customer_id", "rating", "title", "body", "created_at"], reviews, ["created_at"]),
  copyBlock("support_tickets", ["ticket_id", "customer_id", "order_id", "subject", "priority", "status", "assignee", "created_at", "resolved_at"], tickets, ["created_at", "resolved_at"]),
  copyBlock("subscriptions", ["subscription_id", "customer_id", "product_id", "plan", "status", "price_per_delivery", "started_at", "next_delivery_at", "cancelled_at"], subscriptions, ["started_at", "next_delivery_at", "cancelled_at"])
].join("\n");

writeFileSync(target, `${ddl}\n${body}`);
