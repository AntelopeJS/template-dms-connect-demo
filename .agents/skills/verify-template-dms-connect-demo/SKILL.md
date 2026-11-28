---
name: verify-template-dms-connect-demo
description: Check a change to the template-dms-connect-demo repo before pushing it. Gives the scoped command for each kind of change (backend source, the sample databases and their generator, the Docker stack, synced files, dependencies) and names what CI and the merge queue run instead. Use before you commit or push here.
---

# Verify a template-dms-connect-demo change

CI and the merge queue run everything. You run the scoped command for each kind of change your diff touches, then read CI's result on the pull request. This repo is a DMS template: no step here launches the app or clicks through it.

## Setup

Once per checkout: Node from `.nvmrc` (24), pnpm from `packageManager` (10.33.0) through corepack, then:

```sh
pnpm install --frozen-lockfile
```

The Docker rows also need a running Docker daemon with Compose v2 (`docker compose version`).

## What to run for your change

| Change | Command |
| --- | --- |
| Backend source in `src/` | `pnpm run typecheck`, then `pnpm exec oxlint <files>` and `pnpm exec oxfmt --check <files>` |
| A test in `src/` (`*.test.ts`) | `pnpm run build && node --test --test-concurrency=4 dist/<path>.test.js`, the compiled test next to the file you changed. The repo has no test yet |
| `antelope.config.ts`, `scripts/`, `sample-seed/*.mjs`, `sample-mongo/*.js` | `pnpm exec tsc -p tsconfig.config.json --noEmit`, then `pnpm exec oxlint <files>` and `pnpm exec oxfmt --check <files>` |
| The sample data generator (`scripts/generate-sample-db.mjs`, `scripts/sample-db-*.mjs`) | `node scripts/generate-sample-db.mjs`, then `git diff --stat sample-db/`. The output is seeded, so an unchanged generator leaves `sample-db/01-shop.generated.sql` unchanged; commit the new file when you meant to change the data |
| `compose.yaml`, `compose.host.yaml`, `Dockerfile`, `docker/`, `sample-db/`, `sample-mongo/`, `sample-seed/` | `docker compose config --quiet`, then `docker compose build <service>` for each service whose build context you changed (`dms`, `sample-db`, `sample-mongo`, `seed-*`). CI builds none of these images |
| `ci.yml`, `AGENTS.md` Guardrails, `oxlint.config.ts`, `oxfmt.config.ts`, `guardrails.suppressions.json` | `pnpm run sync:check`. `@antelopejs/tooling-configs` writes these: run `pnpm run sync`, never edit them by hand |
| `package.json`, `pnpm-lock.yaml`, an import | `pnpm run knip`; for an `@antelopejs` bump, also `node scripts/check-antelopejs-lock.mjs`, which compares every `@antelopejs` lock entry with npm `latest` |
| `README.md`, other Markdown or YAML outside dot-folders | `pnpm exec oxfmt --check <files>` |
| A skill in `.agents/skills/` | none: oxfmt ignores dot-folders. Keep the `.claude/skills/<name>` symlink to `../../.agents/skills/<name>` |

`pnpm run checks`, `pnpm test` and `pnpm build` run whole suites: leave them to CI.

## Services

No scoped command needs a service. `docker compose up` starts the demo with MongoDB and the sample databases; no check here runs it.

## Left to CI

Read these jobs' results on the pull request. Rerun only the scoped command of a failing one to reproduce it.

- `ci / checks` (`.github/workflows/ci.yml`, shared `ci-node.yml@v2`): `pnpm run checks` (typecheck, lint, format, knip, tests, size, suppressions, sync) on every tier.
- `ci / Test .nvmrc` (same workflow, `test-job: true`): `pnpm test`, which builds and runs every `dist/**/*.test.js`, on every tier.
- Windows legs: the nightly run of `ci.yml`, or a manual run with `nightly` set.
- `verdict`: fails when `ci` or `renovate-sync` failed.

## Done

The change is checked when every row its diff touches passed, with the command and its output shown in your report. A row you could not run, such as a Docker build without a daemon, says why.
