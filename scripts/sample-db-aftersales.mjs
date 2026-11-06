import { DAY, NOW } from "./sample-db-calendar.mjs";
import { money } from "./sample-db-catalog.mjs";
import { agents } from "./sample-db-names.mjs";
import { chance, int, pick, weighted } from "./sample-db-random.mjs";
/** @import { Product } from "./sample-db-catalog.mjs" */
/** @import { Customer, Order } from "./sample-db-sales.mjs" */

/**
 * A `returns` row.
 * @typedef {object} OrderReturn
 * @property {number} return_id
 * @property {number} order_id
 * @property {"damaged_in_transit" | "wrong_item" | "not_as_described" | "changed_mind" | "defective"} reason
 * @property {"requested" | "approved" | "received" | "refunded" | "rejected"} status
 * @property {number} refund_amount
 * @property {number} created_at
 */

/**
 * A `support_tickets` row.
 * @typedef {object} Ticket
 * @property {number} ticket_id
 * @property {number} customer_id
 * @property {number} order_id
 * @property {string} subject
 * @property {"low" | "normal" | "high" | "urgent"} priority
 * @property {"open" | "pending" | "resolved" | "closed"} status
 * @property {string | null} assignee
 * @property {number} created_at
 * @property {number | null} resolved_at
 */

/**
 * A `subscriptions` row.
 * @typedef {object} Subscription
 * @property {number} subscription_id
 * @property {number} customer_id
 * @property {number} product_id
 * @property {"monthly" | "bimonthly" | "quarterly"} plan
 * @property {"active" | "paused" | "cancelled"} status
 * @property {number} price_per_delivery
 * @property {number} started_at
 * @property {number | null} next_delivery_at
 * @property {number | null} cancelled_at
 */

/** @type {Array<[OrderReturn["reason"], number]>} */
const reasons = [
  ["damaged_in_transit", 22],
  ["wrong_item", 12],
  ["not_as_described", 16],
  ["changed_mind", 28],
  ["defective", 22],
];

/** @type {Array<[string, number]>} */
const subjects = [
  ["Where is my order", 30],
  ["Package arrived damaged", 10],
  ["Wrong item received", 7],
  ["Refund status", 12],
  ["Machine will not heat water", 6],
  ["Grinder is noisy", 4],
  ["Change my subscription", 10],
  ["Coupon code not working", 9],
  ["Update my shipping address", 8],
  ["Question about roast date", 4],
];

/**
 * Draws how far a return has come by the fixed clock.
 * @param {boolean} isRefunded Whether the order itself was refunded.
 * @param {number} age The days since the return was requested.
 * @returns {OrderReturn["status"]} The return status.
 */
function returnStatus(isRefunded, age) {
  if (isRefunded) return "refunded";
  if (age < 3) return "requested";
  if (age < 7)
    return weighted([
      ["approved", 50],
      ["received", 30],
      ["rejected", 20],
    ]);
  return weighted([
    ["refunded", 55],
    ["received", 15],
    ["rejected", 25],
    ["approved", 5],
  ]);
}

/**
 * Draws the returns: every refunded order and a few delivered ones.
 * @param {Order[]} orders The orders, oldest first.
 * @returns {OrderReturn[]} The returns.
 */
export function buildReturns(orders) {
  /** @type {OrderReturn[]} */
  const returns = [];
  for (const order of orders) {
    const isRefunded = order.status === "refunded";
    if (!isRefunded && !(order.status === "delivered" && chance(0.045)))
      continue;
    const created =
      (order.deliveredAt ?? order.created_at + 4 * DAY) + int(1, 10) * DAY;
    if (created > NOW) continue;
    const status = returnStatus(isRefunded, (NOW - created) / DAY);
    const refund =
      status === "rejected" || status === "requested"
        ? 0
        : isRefunded
          ? order.total_amount
          : money(order.total_amount * (chance(0.6) ? 1 : 0.5));
    returns.push({
      return_id: returns.length + 1,
      order_id: order.order_id,
      reason: weighted(reasons),
      status,
      refund_amount: refund,
      created_at: created,
    });
  }
  return returns;
}

/**
 * Draws how far a ticket has come by the fixed clock.
 * @param {number} age The days since the ticket was opened.
 * @returns {Ticket["status"]} The ticket status.
 */
function ticketStatus(age) {
  if (age < 2)
    return weighted([
      ["open", 60],
      ["pending", 40],
    ]);
  if (age < 10)
    return weighted([
      ["open", 18],
      ["pending", 22],
      ["resolved", 40],
      ["closed", 20],
    ]);
  return weighted([
    ["open", 3],
    ["pending", 4],
    ["resolved", 33],
    ["closed", 60],
  ]);
}

/**
 * Draws the support tickets, most often about refunded orders.
 * @param {Order[]} orders The orders, oldest first.
 * @returns {Ticket[]} The tickets.
 */
export function buildTickets(orders) {
  /** @type {Ticket[]} */
  const tickets = [];
  for (const order of orders) {
    if (
      !chance(
        order.status === "refunded"
          ? 0.55
          : order.status === "cancelled"
            ? 0.1
            : 0.12,
      )
    )
      continue;
    const created =
      order.created_at + int(1, 12) * DAY + int(0, 20) * 3_600_000;
    if (created > NOW) continue;
    const age = (NOW - created) / DAY;
    const status = ticketStatus(age);
    const priority = weighted([
      ["low", 30],
      ["normal", 45],
      ["high", 20],
      ["urgent", 5],
    ]);
    const assignee =
      status === "open" && age < 2 && chance(0.5) ? null : pick(agents);
    const resolvedAt =
      status === "resolved" || status === "closed"
        ? Math.min(created + int(2, 72) * 3_600_000, NOW)
        : null;
    tickets.push({
      ticket_id: tickets.length + 1,
      customer_id: order.customer_id,
      order_id: order.order_id,
      subject: weighted(subjects),
      priority,
      status,
      assignee,
      created_at: created,
      resolved_at: resolvedAt,
    });
  }
  return tickets;
}

/**
 * Draws the bean subscriptions, most often taken by repeat buyers.
 * @param {Customer[]} customers The customers, with their orders.
 * @param {Product[]} products The catalog products.
 * @returns {Subscription[]} The subscriptions.
 */
export function buildSubscriptions(customers, products) {
  /** @type {Subscription[]} */
  const subscriptions = [];
  const beanProducts = products.filter(
    (product) => product.isBeans && product.is_active,
  );
  for (const customer of customers) {
    const own = customer.orders;
    if (own.length === 0 || !chance(own.length > 1 ? 0.2 : 0.06)) continue;
    const product = pick(beanProducts);
    const startedAt = own[0].created_at + int(1, 30) * DAY;
    if (startedAt > NOW) continue;
    const plan = weighted([
      ["monthly", 55],
      ["bimonthly", 25],
      ["quarterly", 20],
    ]);
    const status = weighted([
      ["active", 62],
      ["paused", 14],
      ["cancelled", 24],
    ]);
    const period = plan === "monthly" ? 30 : plan === "bimonthly" ? 60 : 90;
    const cancelledAt =
      status === "cancelled"
        ? Math.min(startedAt + int(1, 6) * period * DAY, NOW)
        : null;
    subscriptions.push({
      subscription_id: subscriptions.length + 1,
      customer_id: customer.customer_id,
      product_id: product.product_id,
      plan,
      status,
      price_per_delivery: money(product.unit_price * 0.9),
      started_at: startedAt,
      next_delivery_at: status === "active" ? NOW + int(1, period) * DAY : null,
      cancelled_at: cancelledAt,
    });
  }
  return subscriptions;
}
