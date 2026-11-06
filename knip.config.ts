import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  /** The DMS assistant runs the `codex` binary this package installs; no source file imports it. */
  ignoreDependencies: ["@openai/codex"],
});
