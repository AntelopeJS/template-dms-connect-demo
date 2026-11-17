#!/usr/bin/env sh
set -eu

uid=$(stat -c %u /app)
gid=$(stat -c %g /app)
if [ "$uid" = 0 ]; then
  uid=$(id -u node)
  gid=$(id -g node)
fi

[ "$(id -g node)" = "$gid" ] || groupmod -o -g "$gid" node
[ "$(id -u node)" = "$uid" ] || usermod -o -u "$uid" node

for dir in /app/node_modules /app/.antelope /home/node; do
  [ "$(stat -c %u:%g "$dir")" = "$uid:$gid" ] || chown -R node:node "$dir"
done

exec setpriv --reuid=node --regid=node --init-groups "$@"
