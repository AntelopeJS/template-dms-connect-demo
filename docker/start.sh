#!/usr/bin/env sh
set -eu

pnpm install --frozen-lockfile
rm -f .antelope/dev.json

./node_modules/.bin/ajs project run -w &
backend=$!
trap 'kill "$backend" 2>/dev/null; exit 0' INT TERM

backend_ready() {
  node -e 'fetch("http://127.0.0.1:5010/").then((r) => process.exit(r.status === 503 ? 1 : 0), () => process.exit(1))'
}

until [ -f .antelope/dev.json ] && backend_ready; do
  kill -0 "$backend" 2>/dev/null || exit 1
  sleep 1
done

./node_modules/.bin/ajs dms dev &
frontend=$!
trap 'kill "$backend" "$frontend" 2>/dev/null; exit 0' INT TERM
wait "$frontend"
