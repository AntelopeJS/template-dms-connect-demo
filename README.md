<img data-illustration src="./.github/readme/demo.svg" width="100%" alt="Five sample engines, PostgreSQL, MongoDB, RethinkDB, MySQL and MariaDB, then the coffee shop's 12 tables appear one by one as back office pages: customers, products, orders, order items, payments, shipments, returns, reviews, coupons, categories, tickets and subscriptions. Caption: Sample data. Real back office.">

<div align="center">

# AntelopeJS DMS connect demo

**Try the Connect flow on a sample PostgreSQL, MySQL, MariaDB, MongoDB or RethinkDB database, and watch the assistant generate the back office.**

[AntelopeJS DMS](https://github.com/AntelopeJS/dms) · [Docs](https://dms.antelopejs.com/docs) · [Discord](https://discord.gg/g4pFt6eXqu)

<a href="https://github.com/AntelopeJS/dms"><img data-illustration alt="Star AntelopeJS DMS" src="https://img.shields.io/github/stars/AntelopeJS/dms?label=Star%20AntelopeJS%20DMS&style=for-the-badge&labelColor=000000&color=000000&logo=github"></a> <a href="https://discord.gg/g4pFt6eXqu"><img data-illustration alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a>

</div>

This demo starts [AntelopeJS DMS](https://github.com/AntelopeJS/dms) next to a sample database: the online orders of a coffee brand, in 12 tables. The same data exists in PostgreSQL, MySQL, MariaDB, MongoDB and RethinkDB, so you can compare what the assistant generates from each.

Starting your own project instead? Use [`template-dms`](https://github.com/AntelopeJS/template-dms).

## Quick start

<img data-illustration src="./.github/readme/quickstart.svg" width="100%" alt="A terminal types npx @antelopejs/core project init demo --template dms-connect-demo, then cd demo and docker compose up. The DMS reports ready and points to the onboarding link. Caption: Two commands. One back office.">

You need git, Node.js 24 and Docker with Compose v2.

```bash
npx @antelopejs/core project init my-demo --template dms-connect-demo
cd my-demo
docker compose up
```

Then [create the administrator and connect a sample database](#connect-a-sample-database).

## Pick a sample database

Run one command, then paste its connection string into the assistant.

**PostgreSQL**, with `docker compose up`:

```
postgres://dms_reader:dms_reader@sample-db:5432/shop
```

**MySQL**, with `docker compose --profile mysql up`:

```
mysql://shop_reader:shop_reader@sample-mysql:3306/shop
```

**MariaDB**, with `docker compose --profile mariadb up`:

```
mysql://shop_reader:shop_reader@sample-mariadb:3306/shop
```

**MongoDB**, with `docker compose --profile mongodb up`:

```
mongodb://shop_reader:shop_reader@sample-mongodb:27017/shop?authSource=admin
```

**RethinkDB**, with `docker compose --profile rethinkdb up`:

```
rethinkdb://shop_reader:shop_reader@sample-rethinkdb:28015/shop
```

The PostgreSQL sample always starts, because the others are copied from it. To get several, pass several profiles, such as `docker compose --profile mysql --profile mongodb up`. Each account is read-only.

## Connect a sample database

1. Open the onboarding address that the backend prints at start. With Docker, it is in the `dms` log. Without Docker, it is in the `pnpm dev` terminal:

   ```
   [DMS] No owner exists yet. To create it, open http://localhost:3001/onboarding?token=...
   ```

   The address opens the setup wizard. There are no default credentials, so create the administrator account there. The password needs an uppercase letter, a digit, and one of `@$!%*?&`. If you set `DMS_SETUP_TOKEN`, the log shows `<DMS_SETUP_TOKEN>` in place of the token, and you use your own value.

2. Press **Open the dashboard**. The assistant's window opens. Press **Get started**.
3. Choose Claude or Codex and connect it. The assistant runs on your own subscription.
   - **Claude** asks you to run `claude setup-token` in a terminal on your machine and paste the token it prints. It needs the Claude Code CLI on that machine.
   - **Codex** signs in with your ChatGPT account through **Continue with ChatGPT**. With Docker, the page that ChatGPT sends you back to does not load. Open **DMS running on another machine?**, then paste that page's address.
4. Choose **Start from an existing database**. Pick the engine of your sample and paste the connection string from the list above into **Connection URL**.
5. Press **Connect and analyse**. The window checks the connection, reads the schema, then lists the tables and the screens it proposes.
6. Untick what you don't need, then choose **Build directly**, or **Generate a first mockup** to review the screens before they are built.

The window opens on its own until you finish it. Later, open it with **Assistant** at the bottom left.

The connection changes three places in the repository:

- `antelope.config.ts` gets the `builder-db-shop` driver module and the `builder-db-shop-tables` module, and the `dms` module records the connection.
- `.env` gets `BUILDER_DB_SHOP_URL`. Git ignores `.env`.
- `modules/builder-db-shop-tables/` holds the generated TypeScript: one table definition and one page per mapped table.

## Generated pages start read-only

A mapped table gets list, detail, and export routes, and no create, edit, or delete route, until you ask the assistant to let its rows be edited. The sample connects as `dms_reader`, a role with `SELECT` only.

## The assistant

The assistant runs a coding agent in this project's folder, Claude Code or Codex. Open its chat with `Ctrl` `Shift` `K`. Its settings are under **Modules** > **Assistant**. It starts in Safe mode, where it changes the project only through the builder.

The window stores the login under `~/.config`. With Docker, that folder is in the `home` volume, so the login survives a restart. To skip that step, for example in CI, put `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) in a `.env` file next to `compose.yaml`. It overrides the stored login.

<a href="https://github.com/AntelopeJS/dms"><img data-illustration src="./.github/readme/star-strip.svg" width="100%" alt="Liked the demo? A star helps other developers find AntelopeJS DMS."></a>

## More

<details>
<summary><b>What the stack runs</b></summary>

### What the stack runs

`docker compose up` starts three containers. Each profile adds a database and a short-lived seeding container.

| Service                                                        | Image                     | Role                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dms`                                                          | `node:24-bookworm-slim`   | The DMS backend and the dashboard on [http://localhost:3001](http://localhost:3001). It loads `@antelopejs/dms`, which brings the builder, the MCP server and the mockups in development, the AI assistant and its onboarding (`@antelopejs/dms-assistant`), and the infrastructure modules they need. Nothing else. |
| `mongo`                                                        | `mongo:8`                 | The DMS's own data: accounts, roles, settings. It is separate from the MongoDB sample.                                                                                                                                                                                                                               |
| `sample-db`                                                    | `postgres:17-alpine`      | The PostgreSQL sample, with 12 tables: customers, categories, products, coupons, orders, order items, payments, shipments, returns, reviews, support tickets, and subscriptions. It holds about 3,100 orders from May 2025 to October 2026. Every amount is in US dollars.                                           |
| `sample-mongodb`                                               | `mongo:8`                 | The MongoDB sample, with the same 12 tables as 12 collections. Profile `mongodb`.                                                                                                                                                                                                                                    |
| `sample-rethinkdb`                                             | `rethinkdb:2.4`           | The RethinkDB sample, with the same 12 tables. Profile `rethinkdb`.                                                                                                                                                                                                                                                  |
| `sample-mysql`                                                 | `mysql:8.4`               | The MySQL sample, with the same 12 tables, their keys and their foreign keys. Profile `mysql`.                                                                                                                                                                                                                       |
| `sample-mariadb`                                               | `mariadb:11.8`            | The MariaDB sample, with the same 12 tables as MySQL. Profile `mariadb`.                                                                                                                                                                                                                                             |
| `seed-mongodb`, `seed-rethinkdb`, `seed-mysql`, `seed-mariadb` | built from `sample-seed/` | Read every table from `sample-db` and write it into the matching sample, then exit. They skip a sample that already holds data.                                                                                                                                                                                      |

The `dms` container mounts this repository. Code that the assistant writes lands in your project, and you can commit it. On Linux, the container writes as user 1000.

The stack uses placeholder secrets such as `jwtSecret: "dev"`, and its ports listen on `127.0.0.1`. The sample databases publish no port, except in [the host setup](#run-the-dms-without-docker), where `compose.host.yaml` publishes the ports of the MongoDB of the DMS and of every sample on `127.0.0.1` only. Keep the stack on your own machine.

</details>

<details>
<summary><b>Run the DMS without Docker</b></summary>

### Run the DMS without Docker

The sample database still runs in Docker. Only the DMS runs on your machine. You need git, Docker with Compose v2, Node.js 24, and pnpm 10.33.0.

- Node.js 24 is the version in `.nvmrc`.
- pnpm 10.33.0 is the version that `packageManager` in `package.json` pins. Node.js 24 includes corepack, and `corepack enable` makes the `pnpm` command use that version.

Create the project. The command installs its packages:

```bash
corepack enable
npx @antelopejs/core project init my-demo --template dms-connect-demo
cd my-demo
```

Start the MongoDB of the DMS and the PostgreSQL sample. `compose.host.yaml` publishes their ports on `127.0.0.1`, which the default stack does not:

```bash
docker compose -f compose.yaml -f compose.host.yaml up -d --wait mongo sample-db
```

If port 27017 or 5432 is taken on your machine, set `MONGO_PORT` or `SAMPLE_DB_PORT` to a free port in that command. Then start the backend with `MONGODB_URL=mongodb://localhost:<MONGO_PORT> pnpm dev`, and use the same port in the connection string below.

Run the backend and the dashboard in two terminals. In the first terminal, start the backend:

```bash
pnpm dev
```

Wait until the log prints `Constructed modules`. In the second terminal, start the dashboard:

```bash
pnpm frontend:dev
```

Open [http://localhost:3001](http://localhost:3001) when the log prints `Local: http://localhost:3001/`, then follow [Connect a sample database](#connect-a-sample-database) with one change. The DMS reaches the sample through your machine, so the connection string uses `localhost` and the published port:

```
postgres://dms_reader:dms_reader@localhost:5432/shop
```

To use another sample, add its profile and service to the `up` command, for example `docker compose -f compose.yaml -f compose.host.yaml --profile mongodb up -d --wait mongo sample-mongodb seed-mongodb`. Its connection string on your machine is:

| Sample    | Connection string                                                         | Port variable           |
| --------- | ------------------------------------------------------------------------- | ----------------------- |
| MongoDB   | `mongodb://shop_reader:shop_reader@localhost:27018/shop?authSource=admin` | `SAMPLE_MONGODB_PORT`   |
| RethinkDB | `rethinkdb://shop_reader:shop_reader@localhost:28015/shop`                | `SAMPLE_RETHINKDB_PORT` |
| MySQL     | `mysql://shop_reader:shop_reader@localhost:3306/shop`                     | `SAMPLE_MYSQL_PORT`     |
| MariaDB   | `mysql://shop_reader:shop_reader@localhost:3307/shop`                     | `SAMPLE_MARIADB_PORT`   |

Press `Ctrl` `C` in each terminal to stop the DMS. To stop the containers, run `docker compose -f compose.yaml -f compose.host.yaml down`.

</details>

<details>
<summary><b>Start over</b></summary>

### Start over

To return to an empty DMS and fresh sample databases, stop the stack and delete its volumes, then undo the generated changes. Pass the same `--profile` flags that you started with:

```bash
docker compose down -v
git checkout -- antelope.config.ts
rm -rf modules .env
```

If you ran the DMS on your machine, stop it and run `docker compose -f compose.yaml -f compose.host.yaml down -v` instead of `docker compose down -v`.

</details>

<details>
<summary><b>Files and sample data</b></summary>

### Files

| Path                             | Content                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compose.yaml`                   | The services, the `mysql`, `mariadb`, `mongodb` and `rethinkdb` profiles, and the volumes.                                                                                                                                                                                                                                                                                                    |
| `compose.host.yaml`              | Publishes the ports of `mongo` and of every sample database on `127.0.0.1`, for running the DMS on your machine.                                                                                                                                                                                                                                                                              |
| `Dockerfile`                     | The `dms` image: Node 24 and pnpm 10.33.0.                                                                                                                                                                                                                                                                                                                                                    |
| `docker/start.sh`                | Installs the dependencies, starts the backend, waits until its API answers, then starts the dashboard.                                                                                                                                                                                                                                                                                        |
| `antelope.config.ts`             | The DMS modules and their configuration.                                                                                                                                                                                                                                                                                                                                                      |
| `src/`                           | This project's own module: the Home page.                                                                                                                                                                                                                                                                                                                                                     |
| `sample-db/`                     | The image of the PostgreSQL sample, its SQL, and a read-only role.                                                                                                                                                                                                                                                                                                                            |
| `sample-mongo/`                  | The image of the MongoDB sample and the script that creates its read-only account.                                                                                                                                                                                                                                                                                                            |
| `sample-seed/`                   | The seeding script. It reads the tables from `sample-db` and writes them into the MySQL, MariaDB, MongoDB or RethinkDB sample. `mysql-schema.sql` declares the MySQL and MariaDB tables. The RethinkDB script writes every numeric `_id` column as a string, because the Builder declares relation columns as strings. The MySQL, MariaDB and RethinkDB scripts create the read-only account. |
| `scripts/generate-sample-db.mjs` | Writes `sample-db/01-shop.generated.sql`. The data is generated with a fixed seed, so every run produces the same file.                                                                                                                                                                                                                                                                       |

### Sample data

The sample data is invented. `scripts/generate-sample-db.mjs` generates `sample-db/01-shop.generated.sql` and needs no network. Run `node scripts/generate-sample-db.mjs` after you change it or one of the `scripts/sample-db-*.mjs` modules, and commit the new SQL file. The MySQL, MariaDB, MongoDB and RethinkDB samples hold the same rows, copied by `sample-seed/seed.mjs` from the PostgreSQL sample.

</details>

## Licence

[Apache-2.0](LICENSE)
