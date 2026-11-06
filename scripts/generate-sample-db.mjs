#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "./sample-db-catalog.mjs";
import { buildSales } from "./sample-db-sales.mjs";
import { renderSql } from "./sample-db-sql.mjs";
import { buildReviews, rateProducts } from "./sample-db-reviews.mjs";
import {
  buildReturns,
  buildSubscriptions,
  buildTickets,
} from "./sample-db-aftersales.mjs";

/**
 * Writes `sample-db/01-shop.generated.sql`, the sample database of a coffee brand that sells beans, machines and accessories online.
 * The output is deterministic: a fixed seed, a fixed clock and no network access.
 * Run `node scripts/generate-sample-db.mjs` after changing it or a `scripts/sample-db-*.mjs` module, and commit the result.
 */
const target = fileURLToPath(
  new URL("../sample-db/01-shop.generated.sql", import.meta.url),
);

const catalog = buildCatalog();
const sales = buildSales(catalog);
const returns = buildReturns(sales.orders);
const reviews = buildReviews(sales.orders);
rateProducts(catalog.products, reviews);
const tickets = buildTickets(sales.orders);
const subscriptions = buildSubscriptions(sales.customers, catalog.products);

writeFileSync(
  target,
  renderSql({ ...catalog, ...sales, returns, reviews, tickets, subscriptions }),
);
