#!/usr/bin/env sh
set -eu

version="v1.4.5"
asset="Chinook_PostgreSql_SerialPKs.sql"
sha256="847361ebbd17aaa18b5423831bf3bfc7ab1f0ad3c62c5bfe4770242bec5ddaf1"
root="$(cd "$(dirname "$0")/.." && pwd)"
target="$root/sample-db/01-chinook.sql"
download="$(mktemp)"
trap 'rm -f "$download"' EXIT

curl -fsSL -o "$download" "https://github.com/lerocha/chinook-database/releases/download/$version/$asset"
echo "$sha256  $download" | sha256sum -c --quiet -
grep -v -E '^(DROP DATABASE IF EXISTS chinook_serial;|CREATE DATABASE chinook_serial;|\\c chinook_serial;)$' "$download" > "$target"
