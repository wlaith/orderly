import type { Db } from './db.js'
import { deleteExpiredLoginLinks } from './loginlinks.js'
import { blankOldContacts } from './queue.js'

export function startCleanup(db: Db) {
  const run = () => {
    try {
      const n = blankOldContacts(db)
      if (n) console.log(`cleanup: blanked ${n} old contacts`)
      deleteExpiredLoginLinks(db)
    } catch (err) {
      console.error('cleanup failed', err)
    }
  }
  run()
  return setInterval(run, 60 * 60 * 1000).unref()
}
