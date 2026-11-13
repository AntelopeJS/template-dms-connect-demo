import { readFile } from "node:fs/promises";
import pg from "pg";
import { MongoClient } from "mongodb";
import mysql from "mysql2/promise";
import rethinkdb from "rethinkdb";

const target = process.argv[2];
const database = "shop";
const batchSize = 1000;

const integerTypes = new Set([20, 21, 23]);

pg.types.setTypeParser(20, Number);
pg.types.setTypeParser(1700, Number);

/**
 * @typedef {{ rows: Record<string, unknown>[], primaryKey: string[], integerKeys: string[] }} ShopTable
 * The rows of a table, its primary key columns, and its integer columns whose name ends in `_id`.
 */

/**
 * Reads every table of the shop PostgreSQL database as rows of plain objects.
 * @param {pg.Client} client A connected PostgreSQL client.
 * @returns {Promise<Map<string, ShopTable>>} Each table by name.
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
    const { rows, fields } = await client.query(`SELECT * FROM public.${name}`);
    result.set(name, {
      rows,
      primaryKey: keys.map((key) => String(key.column_name)),
      integerKeys: fields
        .filter(
          (field) =>
            field.name.endsWith("_id") && integerTypes.has(field.dataTypeID),
        )
        .map((field) => field.name),
    });
  }
  return result;
}

/**
 * Copies the shop tables into collections of the sample MongoDB and creates nothing else.
 * @param {Map<string, ShopTable>} shop The tables read from PostgreSQL.
 */
async function seedMongo(shop) {
  const client = new MongoClient(process.env.TARGET_URL);
  await client.connect();
  try {
    const db = client.db(database);
    if ((await db.listCollections({ name: "customers" }).toArray()).length > 0)
      return console.log("mongodb: already seeded");
    for (const [name, { rows }] of shop) {
      for (let i = 0; i < rows.length; i += batchSize)
        await db.collection(name).insertMany(rows.slice(i, i + batchSize));
      console.log(`mongodb: ${name} ${rows.length}`);
    }
  } finally {
    await client.close();
  }
}

/**
 * Rewrites the integer key columns of a row as strings, the way RethinkDB stores ids.
 * @param {object} row A row read from PostgreSQL.
 * @param {string[]} integerKeys The integer columns of the row's table whose name ends in `_id`.
 * @returns {object} The row with each of those columns as a string, and null kept as null.
 */
function withStringKeys(row, integerKeys) {
  return Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      integerKeys.includes(column) && value !== null ? String(value) : value,
    ]),
  );
}

/**
 * Copies the shop tables into tables of the sample RethinkDB and gives the read-only account its grant.
 * @param {Map<string, ShopTable>} shop The tables read from PostgreSQL.
 */
async function seedRethink(shop) {
  const r = rethinkdb;
  const connection = await r.connect({
    host: process.env.TARGET_HOST,
    port: 28015,
  });
  try {
    const databases = await r.dbList().run(connection);
    if (databases.includes(database))
      return console.log("rethinkdb: already seeded");
    await r.dbCreate(database).run(connection);
    await Promise.all(
      [...shop].map(async ([name, { rows, primaryKey, integerKeys }]) => {
        const options =
          primaryKey.length === 1 ? { primaryKey: primaryKey[0] } : {};
        await r.db(database).tableCreate(name, options).run(connection);
        for (let i = 0; i < rows.length; i += batchSize)
          await r
            .db(database)
            .table(name)
            .insert(
              rows
                .slice(i, i + batchSize)
                .map((row) => withStringKeys(row, integerKeys)),
            )
            .run(connection);
        console.log(`rethinkdb: ${name} ${rows.length}`);
      }),
    );
    await r
      .db("rethinkdb")
      .table("users")
      .insert({ id: "shop_reader", password: "shop_reader" })
      .run(connection);
    await r.db(database).grant("shop_reader", { read: true }).run(connection);
  } finally {
    await connection.close();
  }
}

/**
 * Creates the shop tables of `mysql-schema.sql` in the sample MySQL or MariaDB, copies the rows into them, then grants the read-only account.
 * The grant comes last, so a sample that has it is complete, and a run that stopped before it starts over.
 * @param {Map<string, ShopTable>} shop The tables read from PostgreSQL.
 */
async function seedMysql(shop) {
  const connection = await mysql.createConnection({
    uri: process.env.TARGET_URL,
    timezone: "Z",
    multipleStatements: true,
  });
  try {
    const [grants] = await connection.query(
      "SELECT 1 FROM information_schema.SCHEMA_PRIVILEGES WHERE GRANTEE = ? AND TABLE_SCHEMA = ?",
      ["'shop_reader'@'%'", database],
    );
    if (grants.length > 0) return console.log(`${target}: already seeded`);
    await connection.query(
      await readFile(new URL("mysql-schema.sql", import.meta.url), "utf8"),
    );
    await connection.query("SET time_zone = '+00:00', foreign_key_checks = 0");
    for (const [name, { rows }] of shop) {
      const columns = Object.keys(rows[0] ?? {});
      for (let i = 0; i < rows.length; i += batchSize)
        await connection.query(
          `INSERT INTO \`${name}\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES ?`,
          [
            rows
              .slice(i, i + batchSize)
              .map((row) => columns.map((column) => row[column])),
          ],
        );
      console.log(`${target}: ${name} ${rows.length}`);
    }
    await connection.query(
      `CREATE USER IF NOT EXISTS 'shop_reader'@'%' IDENTIFIED BY 'shop_reader';
       GRANT SELECT ON ${database}.* TO 'shop_reader'@'%'`,
    );
  } finally {
    await connection.end();
  }
}

const seeders = {
  mongodb: seedMongo,
  rethinkdb: seedRethink,
  mysql: seedMysql,
  mariadb: seedMysql,
};
if (!Object.hasOwn(seeders, target))
  throw new Error(
    `Unknown target "${target}". Use ${Object.keys(seeders).join(", ")}.`,
  );

const source = new pg.Client({ connectionString: process.env.PG_URL });
await source.connect();
const shop = await readShop(source);
await source.end();
await seeders[target](shop);
