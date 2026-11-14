import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  /**
   * The DMS assistant runs the `codex` binary this package installs, and the DMS builder loads the `mongodb`, `mysql2`, `pg` and `rethinkdb-ts` clients from the project to connect the samples; no source file imports them.
   * The `sample-seed` seed installs its database drivers in its own container; the type packages give lint their types here.
   */
  ignoreDependencies: [
    "@openai/codex",
    "@types/pg",
    "@types/rethinkdb",
    "mongodb",
    "mysql2",
    "pg",
    "rethinkdb-ts",
  ],
});
