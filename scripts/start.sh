#!/bin/sh
set -e
if [ -n "$LITESTREAM_BUCKET" ]; then
  litestream restore -if-db-not-exists -if-replica-exists -config litestream.yml "$DB_PATH"
  exec litestream replicate -config litestream.yml -exec "node dist/server.js"
fi
exec node dist/server.js
