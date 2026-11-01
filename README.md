# AntelopeJS DMS connect demo

This repository is a demo for trying the Connect flow. It starts [AntelopeJS DMS](https://github.com/AntelopeJS/dms) with a sample database that you pick: PostgreSQL, MongoDB, or RethinkDB. All three hold the same data, the orders of a coffee brand that sells beans, machines, and accessories online, so you can compare what the Builder generates from each.

To start your own project, use [`AntelopeJS/template-dms`](https://github.com/AntelopeJS/template-dms) instead. It has the same DMS, Builder, and assistant, with no sample data.

## Pick a sample database

Run one command, then paste the matching connection string into the Builder.

| Sample | Command | Connection string |
| --- | --- | --- |
| PostgreSQL | `docker compose up` | `postgres://dms_reader:dms_reader@sample-db:5432/shop` |
| MongoDB | `docker compose --profile mongodb up` | `mongodb://shop_reader:shop_reader@sample-mongodb:27017/shop?authSource=admin` |
| RethinkDB | `docker compose --profile rethinkdb up` | `rethinkdb://shop_reader:shop_reader@sample-rethinkdb:28015/shop` |

The PostgreSQL sample always starts, because the other two are converted from it when they start. To get all three, pass both profiles: `docker compose --profile mongodb --profile rethinkdb up`. Each account is read-only.

## What the stack runs

`docker compose up` starts three containers. Each profile adds a database and a short-lived seeding container.

| Service | Image | Role |
| --- | --- | --- |
| `dms` | `node:24-bookworm-slim` | The DMS backend and the dashboard on [http://localhost:3001](http://localhost:3001). It loads `@antelopejs/dms`, the Builder (`@antelopejs/dms-builder`), the assistant (`@antelopejs/dms-ai`), and the infrastructure modules they need. Nothing else. |
| `mongo` | `mongo:8` | The DMS's own data: accounts, roles, settings. It is separate from the MongoDB sample. |
| `sample-db` | `postgres:17-alpine` | The PostgreSQL sample, with 12 tables: customers, categories, products, coupons, orders, order items, payments, shipments, returns, reviews, support tickets, and subscriptions. It holds about 3,100 orders from May 2025 to October 2026. Every amount is in US dollars. |
| `sample-mongodb` | `mongo:8` | The MongoDB sample, with the same 12 tables as 12 collections. Profile `mongodb`. |
| `sample-rethinkdb` | `rethinkdb:2.4` | The RethinkDB sample, with the same 12 tables. Profile `rethinkdb`. |
| `seed-mongodb`, `seed-rethinkdb` | built from `sample-nosql/` | Read every table from `sample-db` and write it into the matching sample, then exit. They skip a sample that already holds data. |

The `dms` container mounts this repository. Code that the Builder or the assistant writes lands in your clone, and you can commit it. On Linux, the container writes as user 1000.

The stack uses placeholder secrets such as `jwtSecret: "dev"`, and its ports listen on `127.0.0.1`. The sample databases publish no port, except in [the host setup](#run-the-dms-without-docker), where `compose.host.yaml` publishes the MongoDB and PostgreSQL ports on `127.0.0.1` only. Keep the stack on your own machine.

## Run with Docker

You need Docker with Compose v2 and git.

```bash
git clone https://github.com/AntelopeJS/template-dms-connect-demo.git
cd template-dms-connect-demo
docker compose up
```

The first start downloads the images and the npm packages. Later starts reuse the downloads. The dashboard is ready when the log prints:

```
dms-1  |   ➜  Local:     http://localhost:3001/
```

## Run the DMS without Docker

The sample database still runs in Docker. Only the DMS runs on your machine. You need git, Docker with Compose v2, Node.js 24, and pnpm 10.2.0.

- Node.js 24 is the version in `.nvmrc`.
- pnpm 10.2.0 is the version that `packageManager` in `package.json` pins. Node.js 24 includes corepack, and `corepack enable` makes the `pnpm` command use that version.

Clone the project and install it:

```bash
git clone https://github.com/AntelopeJS/template-dms-connect-demo.git
cd template-dms-connect-demo
corepack enable
pnpm install
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

Open [http://localhost:3001](http://localhost:3001) when the log prints `Local: http://localhost:3001/`, then follow [Connect a sample database](#connect-a-sample-database) with one change. The DMS reaches the sample through your machine, so the host in the connection string is `localhost` instead of `sample-db`:

```
postgres://dms_reader:dms_reader@localhost:5432/shop
```

Press `Ctrl` `C` in each terminal to stop the DMS. To stop the containers, run `docker compose -f compose.yaml -f compose.host.yaml down`.

## Connect a sample database

1. Open [http://localhost:3001](http://localhost:3001). The first visit opens the setup wizard. There are no default credentials, so create the administrator account. The password needs an uppercase letter, a digit, and one of `@$!%*?&`.
2. On **Home**, open the Builder with the hammer icon at the top right.
3. Choose the **Database** tab. The **Connect a database** form opens.
4. Enter `shop` as the name and pick the database type that matches your sample.
5. Paste the connection string from the table above into the **Connection** field, then press **Fill in**.
6. Press **Connect**. The Builder runs four steps, then lists what it found.
7. Choose who maps the tables:
   - **Review it myself** opens the mapping in the Builder. You answer the questions and generate the pages.
   - **Let the assistant finish** hands the job to the assistant, which also adds the statistics pages. It needs a coding agent. See the next section.

The connection changes three places in the repository:

- `antelope.config.ts` gets the `builder-db-shop` driver module and the `builder-db-shop-tables` module.
- `.env` gets `BUILDER_DB_SHOP_URL`. Git ignores `.env`.
- `modules/builder-db-shop-tables/` holds the generated TypeScript: one table definition and one page per mapped table.

## Let the assistant build the pages

The assistant in the dashboard runs a coding agent in this project's folder, Claude Code or Codex, on your own subscription. Open the chat with the sparkle icon in the header, or press `Ctrl` `Shift` `K`. Its settings are under **Modules** > **Assistant**.

**Without Docker.** The assistant runs as you, on your machine, so it uses the logins you already have. You set no token and no API key.

- **Claude Code.** If you are signed in to Claude Code on this machine, the assistant uses that login. If you are not, run `claude` once and sign in. The assistant runs the copy of Claude Code that `@antelopejs/dms-ai` installs, so it needs no `claude` on your `PATH`.
- **Codex.** This project has `@openai/codex` 0.154.0 as a dependency, so you install nothing more. The assistant does not read a `codex login` from your terminal. Open **Assistant** > **Settings** and press **Sign in with ChatGPT** once. The sign-in is stored in `~/.config/dms-ai` and serves every DMS project on your machine.

**With Docker.** The assistant runs inside the container, which has none of your logins. Give the container one of these before `docker compose up`:

- **Claude Code with your Claude subscription.** On your machine, run `claude setup-token` and put the token in a `.env` file next to `compose.yaml`:

  ```bash
  CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
  ```

- **Codex with your ChatGPT plan.** Open **Assistant** > **Settings** and press **Sign in with ChatGPT**. The page that OpenAI sends you back to does not load, because the assistant is in the container. Copy its address from the address bar and press **Paste the return address**.
- **An Anthropic API key**, if you prefer one. Put `ANTHROPIC_API_KEY=sk-ant-...` in the same `.env` file.

The assistant starts in Safe mode, where it changes the project only through the Builder, and in Plan only, where it proposes a plan and waits for you to approve it. On the sample, it maps the tables, writes the table pages, and adds statistics pages.

## Generated pages start read-only

A mapped table gets list, detail, and export routes, and no create, edit, or delete route, until you switch on **Rows can be edited** for it. The sample connects as `dms_reader`, a role with `SELECT` only.

## Start over

To return to an empty DMS and fresh sample databases, stop the stack and delete its volumes, then undo the generated changes. Pass the same `--profile` flags that you started with:

```bash
docker compose down -v
git checkout -- antelope.config.ts
rm -rf modules .env
```

If you ran the DMS on your machine, stop it and run `docker compose -f compose.yaml -f compose.host.yaml down -v` instead of `docker compose down -v`.

## Files

| Path | Content |
| --- | --- |
| `compose.yaml` | The services, the `mongodb` and `rethinkdb` profiles, and the volumes. |
| `compose.host.yaml` | Publishes the ports of `mongo` and `sample-db` on `127.0.0.1`, for running the DMS on your machine. |
| `Dockerfile` | The `dms` image: Node 24 and pnpm 10.2.0. |
| `docker/start.sh` | Installs the dependencies, starts the backend, waits until its API answers, then starts the dashboard. |
| `antelope.config.ts` | The DMS modules and their configuration. |
| `src/` | This project's own module: the Home page. |
| `sample-db/` | The image of the PostgreSQL sample, its SQL, and a read-only role. |
| `sample-mongo/` | The image of the MongoDB sample and the script that creates its read-only account. |
| `sample-nosql/` | The seeding script. It reads the tables from `sample-db` and writes them into the MongoDB or RethinkDB sample. The RethinkDB script writes every numeric `_id` column as a string, because the Builder declares relation columns as strings, and it creates the read-only account. |
| `scripts/generate-sample-db.mjs` | Writes `sample-db/01-shop.sql`. The data is generated with a fixed seed, so every run produces the same file. |

## Sample data

The sample data is invented. `scripts/generate-sample-db.mjs` generates `sample-db/01-shop.sql` and needs no network. Run `node scripts/generate-sample-db.mjs` after you change the script and commit the new SQL file. The MongoDB and RethinkDB samples hold the same rows, copied by `sample-nosql/seed.mjs` from the PostgreSQL sample.

## Licence

[Apache-2.0](LICENSE)
