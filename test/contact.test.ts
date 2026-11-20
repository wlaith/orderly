import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contactError, reachUrl } from '../src/contact.js'

test('email contacts reject URL characters that could add mail headers', () => {
  assert.equal(contactError('email', 'omar@example.com'), null)
  assert.ok(contactError('email', 'omar@example.com?bcc=evil@example.com'))
  assert.ok(contactError('email', 'omar@example.com&subject=x'))
  assert.ok(contactError('email', 'omar@example.com#x'))
  assert.ok(contactError('email', 'omar@example.com%0Abcc'))
})

test('mailto links encode the address', () => {
  assert.ok(reachUrl('email', 'omar@example.com', 'Hi').startsWith('mailto:omar%40example.com?'))
})

test('login error codes map to fixed messages', async () => {
  const { createApp } = await import('../src/app.js')
  const { openDb } = await import('../src/db.js')
  const server = createApp(openDb(':memory:')).listen(0)
  const { port } = server.address() as { port: number }
  try {
    const page = await (await fetch(`http://127.0.0.1:${port}/login?error=${encodeURIComponent('Call 0800 scam now')}`)).text()
    assert.ok(!page.includes('Call 0800 scam now'))
    const ok = await (await fetch(`http://127.0.0.1:${port}/login?error=link`)).text()
    assert.ok(ok.includes('That sign-in link has expired'))
  } finally {
    server.close()
  }
})
