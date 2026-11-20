import assert from 'node:assert/strict'
import { test } from 'node:test'
import { openDb } from '../src/db.js'
import { consumeLoginLink, createLoginLink } from '../src/loginlinks.js'

test('a sign-in link works once', () => {
  const db = openDb(':memory:')
  const token = createLoginLink(db, 'host@example.com')
  assert.equal(consumeLoginLink(db, token), 'host@example.com')
  assert.equal(consumeLoginLink(db, token), null)
})

test('a sign-in link expires', () => {
  const db = openDb(':memory:')
  const token = createLoginLink(db, 'host@example.com')
  db.prepare('update login_links set expires_at = ?').run(Math.floor(Date.now() / 1000) - 1)
  assert.equal(consumeLoginLink(db, token), null)
})

test('unknown tokens are rejected', () => {
  assert.equal(consumeLoginLink(openDb(':memory:'), 'not-a-real-token'), null)
})
