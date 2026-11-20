import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contactError, reachUrl } from '../src/contact.js'
import { openDb } from '../src/db.js'
import { blankOldContacts, closeTicket, lineOf, placeOf, takeTicket, ticketByToken, waitingCount } from '../src/queue.js'
import { normalizeSlug, slugError } from '../src/slug.js'

function setup() {
  const db = openDb(':memory:')
  const hostId = Number(db.prepare("insert into hosts (name, slug) values ('Omar', 'omar')").run().lastInsertRowid)
  const take = (name: string) => ticketByToken(db, takeTicket(db, hostId, { name, topic: 'hi', link: null, kind: 'email', contact: `${name}@x.co` }))!
  return { db, hostId, take }
}

test('place is 1 + waiting tickets ahead, and nobody is renumbered', () => {
  const { db, take } = setup()
  const [a, b, c] = [take('a'), take('b'), take('c')]
  assert.deepEqual([a, b, c].map((t) => placeOf(db, t)), [1, 2, 3])
  closeTicket(db, a.id, 'done')
  assert.deepEqual([b, c].map((t) => placeOf(db, t)), [1, 2])
})

test('leaving moves the others up and cannot be done twice', () => {
  const { db, hostId, take } = setup()
  const [a, b, c] = [take('a'), take('b'), take('c')]
  assert.equal(closeTicket(db, b.id, 'left'), true)
  assert.equal(closeTicket(db, b.id, 'done'), false)
  assert.equal(placeOf(db, c), 2)
  assert.equal(waitingCount(db, hostId), 2)
  assert.deepEqual(lineOf(db, hostId).map((t) => t.id), [a.id, c.id])
})

test('lines are per host', () => {
  const { db, take } = setup()
  const other = Number(db.prepare("insert into hosts (name, slug) values ('Lina', 'lina')").run().lastInsertRowid)
  take('a')
  const t = ticketByToken(db, takeTicket(db, other, { name: 'z', topic: 't', link: null, kind: 'phone', contact: '+962791234512' }))!
  assert.equal(placeOf(db, t), 1)
})

test('contacts are blanked 30 days after a ticket closes, not before', () => {
  const { db, take } = setup()
  const a = take('a'), b = take('b'), c = take('c')
  closeTicket(db, a.id, 'done'); closeTicket(db, b.id, 'left')
  db.prepare("update tickets set closed_at = datetime('now', '-31 days') where id = ?").run(a.id)
  assert.equal(blankOldContacts(db), 1)
  const row = (id: number) => db.prepare('select contact from tickets where id = ?').get(id) as { contact: string }
  assert.equal(row(a.id).contact, '')
  assert.notEqual(row(b.id).contact, '')
  assert.notEqual(row(c.id).contact, '')
})

test('slug rules', () => {
  assert.equal(normalizeSlug(' Omar K. '), 'omar-k')
  assert.equal(slugError('ab'), 'Use at least 3 letters or numbers.')
  assert.ok(slugError('login'))
  assert.ok(slugError('t'))
  assert.equal(slugError('omar-k'), null)
})

test('contact checks and reach links', () => {
  assert.ok(contactError('whatsapp', '0791234567'))
  assert.equal(contactError('whatsapp', '+962 79 123 4512'), null)
  assert.ok(contactError('telegram', 'ab'))
  assert.ok(contactError('email', 'nope'))
  assert.equal(reachUrl('whatsapp', '+962 79 123 4512', 'Hi there'), 'https://wa.me/962791234512?text=Hi%20there')
  assert.equal(reachUrl('phone', '+962 79 123 4512', ''), 'tel:+962791234512')
  assert.equal(reachUrl('signal', '+962 79 123 4512', ''), 'https://signal.me/#p/+962791234512')
})
