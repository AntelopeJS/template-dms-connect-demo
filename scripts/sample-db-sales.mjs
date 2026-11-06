import { DAY, NOW, orderTimes } from "./sample-db-calendar.mjs";
import { money } from "./sample-db-catalog.mjs";
import { firstNames, lastNames } from "./sample-db-names.mjs";
import { chance, int, pick, weighted } from "./sample-db-random.mjs";
/** @import { Catalog, Coupon, Product } from "./sample-db-catalog.mjs" */

/**
 * A `customers` row, plus the orders the customer placed, oldest first.
 * @typedef {object} Customer
 * @property {number} customer_id
 * @property {string} email
 * @property {string} full_name
 * @property {string} country
 * @property {"consumer" | "business" | "wholesale"} segment
 * @property {number} created_at
 * @property {Order[]} orders
 */

/** @typedef {"pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded"} OrderStatus */

/**
 * An `orders` row, plus its lines and the time its shipment arrived.
 * @typedef {object} Order
 * @property {number} order_id
 * @property {number} customer_id
 * @property {number | null} coupon_id
 * @property {OrderStatus} status
 * @property {"web" | "marketplace" | "retail"} channel
 * @property {number} subtotal_amount
 * @property {number} discount_amount
 * @property {number} shipping_amount
 * @property {number} total_amount
 * @property {number} created_at
 * @property {OrderItem[]} items
 * @property {number | null} deliveredAt
 */

/**
 * An `order_items` row, plus the product it sells.
 * @typedef {object} OrderItem
 * @property {number} order_item_id
 * @property {number} order_id
 * @property {number} product_id
 * @property {number} quantity
 * @property {number} unit_price
 * @property {number} line_total
 * @property {Product} product
 */

/**
 * A `payments` row.
 * @typedef {object} Payment
 * @property {number} payment_id
 * @property {number} order_id
 * @property {"card" | "paypal" | "apple_pay" | "bank_transfer"} method
 * @property {"pending" | "captured" | "failed" | "refunded"} status
 * @property {number} amount
 * @property {number | null} paid_at
 * @property {number} created_at
 */

/**
 * A `shipments` row.
 * @typedef {object} Shipment
 * @property {number} shipment_id
 * @property {number} order_id
 * @property {"ups" | "fedex" | "dhl" | "usps"} carrier
 * @property {string} tracking_number
 * @property {"in_transit" | "delayed" | "delivered"} status
 * @property {number} shipped_at
 * @property {number | null} delivered_at
 * @property {number} delay_days
 */

/**
 * The customers and every table their orders fill.
 * @typedef {object} Sales
 * @property {Customer[]} customers
 * @property {Order[]} orders
 * @property {OrderItem[]} orderItems
 * @property {Payment[]} payments
 * @property {Shipment[]} shipments
 */

/** @type {Array<[string, number]>} */
const countries = [
  ["US", 38],
  ["GB", 12],
  ["DE", 10],
  ["FR", 9],
  ["BE", 7],
  ["NL", 6],
  ["CA", 6],
  ["ES", 4],
  ["IT", 4],
  ["AU", 4],
];

/** @type {Array<[Shipment["carrier"], number]>} */
const carriers = [
  ["ups", 34],
  ["fedex", 26],
  ["dhl", 24],
  ["usps", 16],
];

/** @type {Record<OrderStatus, Payment["status"]>} */
const paymentStatuses = {
  pending: "pending",
  paid: "captured",
  shipped: "captured",
  delivered: "captured",
  cancelled: "failed",
  refunded: "refunded",
};

/**
 * Creates a customer who signs up shortly before `time`.
 * @param {Customer[]} customers The customers so far, which the new one joins.
 * @param {number} time The time of the customer's first order.
 * @param {number} signupLead How long before `time` the customer signs up.
 * @returns {Customer} The new customer.
 */
function newCustomer(customers, time, signupLead) {
  const first = pick(firstNames);
  const last = pick(lastNames);
  const id = customers.length + 1;
  const created = Math.min(time - signupLead, NOW);
  /** @type {Customer} */
  const customer = {
    customer_id: id,
    email: `${first}.${last}${id}@example.com`.toLowerCase().replace(/ /g, ""),
    full_name: `${first} ${last}`,
    country: weighted(countries),
    segment: weighted([
      ["consumer", 78],
      ["business", 15],
      ["wholesale", 7],
    ]),
    created_at: created,
    orders: [],
  };
  customers.push(customer);
  return customer;
}

/**
 * Picks who places an order at `time`: mostly a repeat buyer once the shop has some, otherwise a new customer.
 * @param {Customer[]} customers The customers so far.
 * @param {number} time The time of the order.
 * @returns {Customer} The buyer.
 */
function chooseCustomer(customers, time) {
  const repeatPool = customers.filter(
    (customer) => customer.created_at < time - DAY,
  );
  if (repeatPool.length > 30 && chance(0.46)) {
    const heavy = repeatPool.filter((candidate) => candidate.orders.length > 0);
    return chance(0.8) && heavy.length > 0 ? pick(heavy) : pick(repeatPool);
  }
  return newCustomer(customers, time, int(1, 6) * 3_600_000);
}

/**
 * Weight of a product in a basket placed at `time`.
 * @param {Product} product The product.
 * @param {number} time The time of the order.
 * @returns {number} The weight, 0 when the product is off sale.
 */
function productWeight(product, time) {
  const month = new Date(time).getUTCMonth();
  if (!product.is_active && time > Date.UTC(2026, 2, 1)) return 0;
  let weight = product.popularity;
  if (product.isGift) weight *= month >= 9 ? (month === 10 ? 5 : 3) : 0.6;
  if (product.isMachine && month === 10) weight *= 2.2;
  if (
    product.name === "Cold brew coarse grind 12 oz" ||
    product.name === "Cold brew bottle"
  )
    weight *= month >= 4 && month <= 8 ? 1.8 : 0.6;
  return weight;
}

/**
 * Draws the lines of one basket, each product at most once.
 * @param {Product[]} products The catalog products.
 * @param {Customer} customer The buyer.
 * @param {number} time The time of the order.
 * @returns {Array<[product: Product, quantity: number]>} The lines, in basket order.
 */
function drawBasket(products, customer, time) {
  const lineCount = weighted([
    [1, 45],
    [2, 30],
    [3, 17],
    [4, 8],
  ]);
  /** @type {Array<[Product, number]>} */
  const entries = [];
  for (const product of products) {
    const weight = productWeight(product, time);
    if (weight > 0) entries.push([product, weight]);
  }
  /** @type {Set<Product>} */
  const chosen = new Set();
  /** @type {Array<[Product, number]>} */
  const lines = [];
  for (let line = 0; line < lineCount; line += 1) {
    const product = weighted(entries);
    if (chosen.has(product)) continue;
    chosen.add(product);
    const bulk = customer.segment !== "consumer" && product.isBeans;
    const quantity = bulk
      ? int(3, 12)
      : weighted([
          [1, 78],
          [2, 16],
          [3, 6],
        ]);
    lines.push([product, quantity]);
  }
  return lines;
}

/**
 * Picks a coupon valid at `time`, or null.
 * @param {Coupon[]} coupons The catalog coupons, the welcome offer first.
 * @param {number} time The time of the order.
 * @param {boolean} isNewCustomer Whether this is the buyer's first order.
 * @returns {Coupon | null} The coupon applied to the order.
 */
function couponFor(coupons, time, isNewCustomer) {
  const valid = coupons.filter(
    (coupon) =>
      coupon.starts_at <= time &&
      coupon.expires_at >= time &&
      coupon.code !== "WELCOME10",
  );
  if (isNewCustomer && chance(0.3)) return coupons[0];
  if (valid.length > 0 && chance(0.38)) return pick(valid);
  return null;
}

/**
 * Draws how far an order placed at `time` has come by the fixed clock.
 * @param {number} time The time of the order.
 * @returns {OrderStatus} The order status.
 */
function orderStatus(time) {
  const age = (NOW - time) / DAY;
  if (chance(0.04)) return "cancelled";
  if (age > 20 && chance(0.037)) return "refunded";
  if (age < 1.5) return chance(0.55) ? "pending" : "paid";
  if (age < 4) return chance(0.3) ? "paid" : "shipped";
  if (age < 8) return chance(0.45) ? "shipped" : "delivered";
  return "delivered";
}

/**
 * Draws the payment of an order.
 * @param {Order} order The order.
 * @param {number} paymentId The id of the new payment.
 * @returns {Payment} The payment.
 */
function buildPayment(order, paymentId) {
  const time = order.created_at;
  const method =
    order.channel === "retail"
      ? "card"
      : weighted([
          ["card", 58],
          ["paypal", 22],
          ["apple_pay", 12],
          ["bank_transfer", 8],
        ]);
  const status = paymentStatuses[order.status];
  const paidAt =
    status === "captured" || status === "refunded"
      ? time + int(1, 20) * 60_000
      : null;
  return {
    payment_id: paymentId,
    order_id: order.order_id,
    method,
    status,
    amount: order.total_amount,
    paid_at: paidAt,
    created_at: time,
  };
}

/**
 * Draws the shipment of an order that left the warehouse.
 * @param {Order} order The order.
 * @param {number} shipmentId The id of the new shipment.
 * @returns {Shipment} The shipment.
 */
function buildShipment(order, shipmentId) {
  const shippedAt = order.created_at + int(4, 40) * 3_600_000;
  const carrier = weighted(carriers);
  const transitDays = int(2, 6);
  const late = chance(carrier === "usps" ? 0.2 : 0.1);
  const delayDays = late ? int(1, 6) : 0;
  const arrival = shippedAt + (transitDays + delayDays) * DAY;
  /** @type {Shipment["status"]} */
  let status;
  /** @type {number | null} */
  let deliveredAt = null;
  if (arrival <= NOW) {
    status = "delivered";
    deliveredAt = arrival;
  } else {
    status =
      late && shippedAt + transitDays * DAY < NOW ? "delayed" : "in_transit";
  }
  if (order.status === "delivered" && deliveredAt === null) {
    status = "delivered";
    deliveredAt = Math.min(arrival, NOW);
  }
  return {
    shipment_id: shipmentId,
    order_id: order.order_id,
    carrier,
    tracking_number: `${carrier.toUpperCase()}${String(int(10 ** 9, 10 ** 10 - 1))}`,
    status,
    shipped_at: Math.min(shippedAt, NOW),
    delivered_at: deliveredAt,
    delay_days: status === "in_transit" ? 0 : delayDays,
  };
}

/**
 * Places one order at `time`, with its lines, payment and shipment.
 * @param {Sales} sales The tables so far, which the order joins.
 * @param {Catalog} catalog The catalog, whose coupons count their redemptions.
 * @param {number} time The time of the order.
 */
function placeOrder(sales, catalog, time) {
  const customer = chooseCustomer(sales.customers, time);
  const isNew = customer.orders.length === 0;
  const orderId = sales.orders.length + 1;
  const channel = weighted([
    ["web", 62],
    ["marketplace", 23],
    ["retail", 15],
  ]);
  const items = drawBasket(catalog.products, customer, time).map(
    ([product, quantity], index) => ({
      order_item_id: sales.orderItems.length + index + 1,
      order_id: orderId,
      product_id: product.product_id,
      quantity,
      unit_price: product.unit_price,
      line_total: money(quantity * product.unit_price),
      product,
    }),
  );
  sales.orderItems.push(...items);
  const subtotal = money(items.reduce((sum, item) => sum + item.line_total, 0));
  const coupon =
    channel === "retail" ? null : couponFor(catalog.coupons, time, isNew);
  const discount = coupon
    ? money((subtotal * coupon.discount_percent) / 100)
    : 0;
  if (coupon) coupon.times_redeemed += 1;
  const shipping = channel === "retail" || subtotal - discount >= 50 ? 0 : 5.95;
  const status = orderStatus(time);
  /** @type {Order} */
  const order = {
    order_id: orderId,
    customer_id: customer.customer_id,
    coupon_id: coupon ? coupon.coupon_id : null,
    status,
    channel,
    subtotal_amount: subtotal,
    discount_amount: discount,
    shipping_amount: shipping,
    total_amount: money(subtotal - discount + shipping),
    created_at: time,
    items,
    deliveredAt: null,
  };
  sales.orders.push(order);
  customer.orders.push(order);
  sales.payments.push(buildPayment(order, sales.payments.length + 1));
  if (status === "shipped" || status === "delivered" || status === "refunded") {
    const shipment = buildShipment(order, sales.shipments.length + 1);
    sales.shipments.push(shipment);
    order.deliveredAt = shipment.delivered_at;
  }
}

/**
 * Draws the customers and every order they place over the months of sales.
 * @param {Catalog} catalog The catalog, whose coupons count their redemptions.
 * @returns {Sales} The customers, orders, order lines, payments and shipments.
 */
export function buildSales(catalog) {
  /** @type {Sales} */
  const sales = {
    customers: [],
    orders: [],
    orderItems: [],
    payments: [],
    shipments: [],
  };
  for (let n = 0; n < 40; n += 1)
    newCustomer(sales.customers, Date.UTC(2025, 3, 1) + n * 3 * DAY, 0);
  for (const time of orderTimes()) placeOrder(sales, catalog, time);
  return sales;
}
