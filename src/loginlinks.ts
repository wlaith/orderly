import type { Db } from './db.js'
import { hashToken, newToken } from './queue.js'

const FIFTEEN_MIN = 15 * 60
const now = () => Math.floor(Date.now() / 1000)

export function createLoginLink(db: Db, email: string): string {
  const token = newToken()
  db.prepare('insert into login_links (token_hash, email, expires_at) values (?, ?, ?)').run(hashToken(token), email, now() + FIFTEEN_MIN)
  return token
}

export function consumeLoginLink(db: Db, token: string): string | null {
  const hash = hashToken(token)
  const row = db.prepare('select email, expires_at, used_at from login_links where token_hash = ?').get(hash) as { email: string; expires_at: number; used_at: number | null } | undefined
  if (!row || row.used_at !== null || row.expires_at < now()) return null
  const claimed = db.prepare('update login_links set used_at = ? where token_hash = ? and used_at is null').run(now(), hash)
  return claimed.changes > 0 ? row.email : null
}

export const deleteExpiredLoginLinks = (db: Db) =>
  db.prepare('delete from login_links where expires_at < ?').run(now() - FIFTEEN_MIN).changes
