import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  /**
   * The DMS assistant runs the `codex` binary this package installs; no source file imports it.
   * The `sample-nosql` seed installs its database drivers in its own container; these give lint their types here.
   */
  ignoreDependencies: [
    "@openai/codex",
    "@types/pg",
    "@types/rethinkdb",
    "mongodb",
  ],
});
