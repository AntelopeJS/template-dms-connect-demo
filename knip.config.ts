import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  /**
   * The DMS assistant runs the `codex` binary this package installs, and the DMS connect check loads the `@antelopejs/mongodb`, `@antelopejs/mysql`, `@antelopejs/postgres` and `@antelopejs/rethinkdb` drivers from the project to connect the samples; no source file imports them.
   * The `sample-seed` seed installs its database drivers in its own container; `mongodb`, `mysql2` and the type packages give lint its types here.
   */
  ignoreDependencies: [
    "@antelopejs/mongodb",
    "@antelopejs/mysql",
    "@antelopejs/postgres",
    "@antelopejs/rethinkdb",
    "@openai/codex",
    "@types/pg",
    "@types/rethinkdb",
    "mongodb",
    "mysql2",
  ],
});
