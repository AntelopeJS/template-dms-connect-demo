import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const read = (name) =>
  readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

const assistant = /"dms-assistant":\s*\{[^}]*?version:\s*"([^"]+)"/s.exec(
  read("antelope.config.ts"),
)?.[1];
const pinned = /"@openai\/codex":\s*"([^"]+)"/.exec(read("package.json"))?.[1];
if (assistant === undefined || pinned === undefined) {
  console.error(
    "antelope.config.ts has no dms-assistant version or package.json no @openai/codex",
  );
  process.exit(1);
}

const wanted = execFileSync(
  "npm",
  [
    "view",
    `@antelopejs/dms-assistant@${assistant}`,
    "peerDependencies.@openai/codex",
  ],
  { encoding: "utf8" },
).trim();

if (pinned !== wanted) {
  console.error(
    `@openai/codex is pinned to ${pinned} but @antelopejs/dms-assistant@${assistant} peers on ${wanted}`,
  );
  process.exit(1);
}
