import { createHash, randomBytes } from 'node:crypto'
import type { Db } from './db.js'
import type { Kind } from './contact.js'

export interface Host { id: number; google_sub: string | null; name: string; about: string; slug: string; ticket_color: string | null; ticket_ink: string | null }
export interface Ticket {
  id: number; host_id: number; name: string; topic: string; link: string | null
  contact_kind: Kind; contact: string; status: 'waiting' | 'done' | 'left'
  reached_at: string | null; created_at: string; closed_at: string | null
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest()
export const newToken = () => randomBytes(24).toString('base64url')

export const hostBySlug = (db: Db, slug: string) => db.prepare('select * from hosts where slug = ?').get(slug) as Host | undefined
export const hostById = (db: Db, id: number) => db.prepare('select * from hosts where id = ?').get(id) as Host | undefined

// Never renumber: place = 1 + waiting tickets with a smaller id.
export function placeOf(db: Db, t: Pick<Ticket, 'id' | 'host_id'>): number {
  const row = db.prepare("select count(*) as n from tickets where host_id = ? and status = 'waiting' and id < ?").get(t.host_id, t.id) as { n: number }
  return row.n + 1
}

export function waitingCount(db: Db, hostId: number): number {
  return (db.prepare("select count(*) as n from tickets where host_id = ? and status = 'waiting'").get(hostId) as { n: number }).n
}

export const lineOf = (db: Db, hostId: number) =>
  db.prepare("select * from tickets where host_id = ? and status = 'waiting' order by id").all(hostId) as Ticket[]

export function takeTicket(db: Db, hostId: number, f: { name: string; topic: string; link: string | null; kind: Kind; contact: string }): string {
  const token = newToken()
  db.prepare('insert into tickets (host_id, token_hash, name, topic, link, contact_kind, contact) values (?, ?, ?, ?, ?, ?, ?)')
    .run(hostId, hashToken(token), f.name, f.topic, f.link, f.kind, f.contact)
  return token
}

export const ticketByToken = (db: Db, token: string) =>
  db.prepare('select * from tickets where token_hash = ?').get(hashToken(token)) as Ticket | undefined

export const ticketForHost = (db: Db, id: number, hostId: number) =>
  db.prepare('select * from tickets where id = ? and host_id = ?').get(id, hostId) as Ticket | undefined

export function markReached(db: Db, id: number) {
  db.prepare("update tickets set reached_at = datetime('now') where id = ? and status = 'waiting'").run(id)
}

export function closeTicket(db: Db, id: number, status: 'done' | 'left'): boolean {
  return db.prepare("update tickets set status = ?, closed_at = datetime('now') where id = ? and status = 'waiting'").run(status, id).changes > 0
}

export function blankOldContacts(db: Db): number {
  return db.prepare("update tickets set contact = '', name = '' where closed_at < datetime('now', '-30 days') and contact != ''").run().changes
}

export function rejoinTicket(db: Db, id: number): boolean {
  return db.prepare("update tickets set status = 'waiting', closed_at = null where id = ? and status = 'left'").run(id).changes > 0
}

export const numberOf = (db: Db, t: Pick<Ticket, 'id' | 'host_id'>) =>
  (db.prepare('select count(*) as n from tickets where host_id = ? and id <= ?').get(t.host_id, t.id) as { n: number }).n
