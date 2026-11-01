import pg from "pg";
import { MongoClient } from "mongodb";
import rethinkdb from "rethinkdb";

const target = process.argv[2];
const database = "shop";
const batchSize = 1000;

pg.types.setTypeParser(20, Number);
pg.types.setTypeParser(1700, Number);

/**
 * Reads every table of the shop PostgreSQL database as rows of plain objects.
 * @param {pg.Client} client A connected PostgreSQL client.
 * @returns {Promise<Map<string, { rows: object[], primaryKey: string[] }>>} The rows and primary key columns of each table.
 */
async function readShop(client) {
  const { rows: tables } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
  );
  const result = new Map();
  for (const { table_name: name } of tables) {
    const { rows: keys } = await client.query(
      `SELECT a.attname AS column_name
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
       WHERE i.indrelid = $1::regclass AND i.indisprimary
       ORDER BY array_position(i.indkey, a.attnum)`,
      [`public.${name}`],
    );
    const { rows } = await client.query(`SELECT * FROM public.${name}`);
    result.set(name, { rows, primaryKey: keys.map((key) => key.column_name) });
  }
  return result;
}

/**
 * Copies the shop tables into collections of the sample MongoDB and creates nothing else.
 * @param {Map<string, { rows: object[], primaryKey: string[] }>} shop The tables read from PostgreSQL.
 */
async function seedMongo(shop) {
  const client = new MongoClient(process.env.TARGET_URL);
  await client.connect();
  try {
    const db = client.db(database);
    if ((await db.listCollections({ name: "customers" }).toArray()).length > 0) return console.log("mongodb: already seeded");
    for (const [name, { rows }] of shop) {
      for (let i = 0; i < rows.length; i += batchSize) await db.collection(name).insertMany(rows.slice(i, i + batchSize));
      console.log(`mongodb: ${name} ${rows.length}`);
    }
  } finally {
    await client.close();
  }
}

/**
 * Rewrites the numeric key columns of a row as strings, the way RethinkDB stores ids.
 * @param {object} row A row read from PostgreSQL.
 * @returns {object} The row with every numeric column whose name ends in `_id` as a string.
 */
function withStringKeys(row) {
  return Object.fromEntries(Object.entries(row).map(([column, value]) => [column, typeof value === "number" && column.endsWith("_id") ? String(value) : value]));
}

/**
 * Copies the shop tables into tables of the sample RethinkDB and gives the read-only account its grant.
 * @param {Map<string, { rows: object[], primaryKey: string[] }>} shop The tables read from PostgreSQL.
 */
async function seedRethink(shop) {
  const r = rethinkdb;
  const connection = await r.connect({ host: process.env.TARGET_HOST, port: 28015 });
  try {
    const databases = await r.dbList().run(connection);
    if (databases.includes(database)) return console.log("rethinkdb: already seeded");
    await r.dbCreate(database).run(connection);
    for (const [name, { rows, primaryKey }] of shop) {
      const options = primaryKey.length === 1 ? { primaryKey: primaryKey[0] } : {};
      await r.db(database).tableCreate(name, options).run(connection);
      for (let i = 0; i < rows.length; i += batchSize) await r.db(database).table(name).insert(rows.slice(i, i + batchSize).map(withStringKeys)).run(connection);
      console.log(`rethinkdb: ${name} ${rows.length}`);
    }
    await r.db("rethinkdb").table("users").insert({ id: "shop_reader", password: "shop_reader" }).run(connection);
    await r.db(database).grant("shop_reader", { read: true }).run(connection);
  } finally {
    await connection.close();
  }
}

const seeders = { mongodb: seedMongo, rethinkdb: seedRethink };
if (!(target in seeders)) throw new Error(`Unknown target "${target}". Use mongodb or rethinkdb.`);

const source = new pg.Client({ connectionString: process.env.PG_URL });
await source.connect();
const shop = await readShop(source);
await source.end();
await seeders[target](shop);
