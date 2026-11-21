import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const lock = readFileSync(
  new URL("../pnpm-lock.yaml", import.meta.url),
  "utf8",
);
const entries = new Set(
  Array.from(
    lock.matchAll(/^ {2}'?(@antelopejs\/[a-z0-9-]+@\d[^':(]*)/gm),
    (match) => String(match[1]),
  ),
);

const stale = [];
for (const entry of Array.from(entries).sort((a, b) => a.localeCompare(b))) {
  const at = entry.lastIndexOf("@");
  const name = entry.slice(0, at);
  const version = entry.slice(at + 1);
  const latest = execFileSync("npm", ["view", name, "version"], {
    encoding: "utf8",
  }).trim();
  if (latest !== version) {
    stale.push(`${name}: lockfile ${version}, npm latest ${latest}`);
  } else if (process.argv.includes("--list")) {
    console.log(entry);
  }
}

if (stale.length > 0) {
  console.error(stale.join("\n"));
  process.exit(1);
}
