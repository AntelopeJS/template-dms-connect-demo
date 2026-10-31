# AntelopeJS DMS light template

Connect a database to [AntelopeJS DMS](https://github.com/AntelopeJS/dms) and get its back office as TypeScript in this repository. One command starts the DMS and a PostgreSQL database already filled with sample data, so you can try the flow without a database of your own.

## What the stack runs

`docker compose up` starts three containers:

| Service | Image | Role |
| --- | --- | --- |
| `dms` | `node:24-bookworm-slim` | The DMS backend and the dashboard on [http://localhost:3001](http://localhost:3001). It loads `@antelopejs/dms`, the Builder (`@antelopejs/dms-builder`), the assistant (`@antelopejs/dms-ai`), and the infrastructure modules they need. Nothing else. |
| `mongo` | `mongo:8` | The DMS's own data: accounts, roles, settings. |
| `sample-db` | `postgres:17-alpine` | The database you connect: [Chinook](https://github.com/lerocha/chinook-database), the sample data of a music store. It has 11 tables, among them customers, employees, invoices from 2021 to 2025, and 3,503 tracks. |

The `dms` container mounts this repository. Code that the Builder or the assistant writes lands in your clone, and you can commit it.

## Start the stack

You need Docker with Compose v2 and git.

```bash
git clone https://github.com/AntelopeJS/template-dms-light.git
cd template-dms-light
docker compose up
```

The first start downloads the images and the npm packages. On our machine it took 116 seconds from `docker compose up` to a working dashboard. Later starts reuse the downloads. The dashboard is ready when the log prints:

```
dms-1  |   ➜  Local:     http://localhost:3001/
```

## Connect the sample database

1. Open [http://localhost:3001](http://localhost:3001). The first visit opens the setup wizard. There are no default credentials, so create the administrator account. The password needs an uppercase letter, a digit, and one of `@$!%*?&`.
2. On **Home**, open the Builder with the hammer icon at the top right.
3. Choose the **Database** tab. The **Connect a database** form opens.
4. Enter `chinook` as the name and keep **PostgreSQL** as the database type.
5. Paste this URL into the **Connection** field, then press **Fill in**:

   ```
   postgres://dms_reader:dms_reader@sample-db:5432/chinook
   ```

6. Press **Connect**. Four steps complete in about 15 seconds, and the Builder shows `11 tables: 9 pages, 1 for statistics, 5 questions`.
7. Choose who maps the tables:
   - **Review it myself** opens the mapping in the Builder. You answer the questions and generate the pages.
   - **Let the assistant finish** hands the job to the assistant, which also adds the statistics pages. It needs a coding agent. See the next section.

The connection changes three places in the repository:

- `antelope.config.ts` gets the `builder-db-chinook` driver module and the `builder-db-chinook-tables` module.
- `.env` gets `BUILDER_DB_CHINOOK_URL`. Git ignores `.env`.
- `modules/builder-db-chinook-tables/` holds the generated TypeScript: one table definition and one page per mapped table.

## Let the assistant build the pages

The assistant runs Claude Code inside the `dms` container, with your credentials. Put one of these in a `.env` file next to `compose.yaml` before `docker compose up`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or a token from `claude setup-token`
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
```

The assistant starts in Safe mode, where it changes the project only through the Builder, and in Plan only, where it proposes a plan and waits for you to approve it. In our run it took about 11 minutes to map the 11 tables and write 9 table pages and 2 statistics pages, **Music Overview** and **Sales Overview**.

dms-ai can also run Codex on a ChatGPT plan: sign in from **Assistant** > **Settings**. We tested this template with Claude Code only.

## Limits

- The Builder connects PostgreSQL, MongoDB, and RethinkDB. This template's sample database is PostgreSQL. MySQL is not supported.
- Generated pages are read-only by default. A mapped table gets list, detail, and export routes, and no create, edit, or delete route, until you switch on **Rows can be edited** for it. The table pages still show **New entry**, **Edit**, and **Delete**, and those actions fail with "Not Found" because the routes do not exist. The connection itself can write whatever the database account can write. The sample connects as `dms_reader`, a role with `SELECT` only. Connect your own database with the same kind of account.
- Pages on a connected database do not refresh when its rows change. Reload the page to see new rows.
- Generated dashboards need Claude Code or Codex. Without one, **Review it myself** still generates the table pages.
- The assistant can write a statistics page that does not render. In our run, **Sales Overview** answered "Error 500". A plain "Fix it" message did not help, and two follow-up messages that named the cause fixed the data shape of its charts. Open each page it creates.
- This stack is for development. The Builder and the assistant run only in development mode, and `antelope.config.ts` uses placeholder secrets such as `jwtSecret: "dev"`. The ports listen on `127.0.0.1` only. Do not expose them.
- On Linux, the container writes to your clone as user 1000.
- We tested on Linux with Docker 29 and Compose 5.6.
- If the first page after a cold start shows "Failed to fetch dynamically imported module", reload the page once.

## Start over

To return to an empty DMS and a fresh sample database, stop the stack and delete its volumes, then undo the generated changes:

```bash
docker compose down -v
git checkout -- antelope.config.ts
rm -rf modules .env
```

## Files

| Path | Content |
| --- | --- |
| `compose.yaml` | The three services and their volumes. |
| `Dockerfile` | The `dms` image: Node 24 and pnpm 10.2.0. |
| `docker/start.sh` | Installs the dependencies, starts the backend, waits until its API answers, then starts the dashboard. |
| `antelope.config.ts` | The DMS modules and their configuration. |
| `src/` | This project's own module: the Home page. |
| `sample-db/` | The image of the sample database, its SQL, and a read-only role. |
| `scripts/fetch-sample-db.sh` | Downloads Chinook 1.4.5, checks its SHA-256, and writes `sample-db/01-chinook.sql`. |

## Sample data licence

The sample data is the [Chinook Database](https://github.com/lerocha/chinook-database) 1.4.5, copyright 2008-2024 Luis Rocha, under the MIT licence in [`sample-db/LICENSE-chinook.md`](sample-db/LICENSE-chinook.md). `sample-db/01-chinook.sql` is the release file `Chinook_PostgreSql_SerialPKs.sql` without its `DROP DATABASE`, `CREATE DATABASE`, and `\c` lines, so the tables load into the `chinook` database that the container creates.

## Licence

[Apache-2.0](LICENSE)
