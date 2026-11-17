#!/usr/bin/env sh
set -eu

node_writes_app() {
  setpriv --reuid="$(id -u node)" --regid="$(id -g node)" --clear-groups \
    sh -c 'probe=$(mktemp -p /app .write-probe.XXXXXX) && rm -f "$probe"' 2>/dev/null
}

uid=$(stat -c %u /app)
gid=$(stat -c %g /app)
if [ "$uid" = 0 ] && node_writes_app; then
  uid=$(id -u node)
  gid=$(id -g node)
fi

[ "$(id -g node)" = "$gid" ] || groupmod -o -g "$gid" node
[ "$(id -u node)" = "$uid" ] || usermod -o -u "$uid" node

for dir in /app/node_modules /app/.antelope /home/node; do
  [ "$(stat -c %u:%g "$dir")" = "$uid:$gid" ] || chown -R node:node "$dir"
done

exec setpriv --reuid=node --regid=node --init-groups "$@"
