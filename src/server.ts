import { createApp } from './app.js'
import { startCleanup } from './cleanup.js'
import { config } from './config.js'
import { openDb } from './db.js'

const db = openDb(config.dbPath)
startCleanup(db)
const server = createApp(db).listen(config.port, () => console.log(`Orderly listening on ${config.baseUrl} (port ${config.port})`))

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { server.close(() => { db.close(); process.exit(0) }) })
}
