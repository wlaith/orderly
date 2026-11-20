import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { createApp } from '../src/app.js'
import { config } from '../src/config.js'
import { openDb } from '../src/db.js'

config.devLogin = true

test('host makes a link, visitor takes a ticket, host finishes it', async () => {
  const server = createApp(openDb(':memory:')).listen(0)
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const post = (path: string, body: object = {}, cookie = '') =>
    fetch(base + path, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) })
  const cookiesOf = (res: Response) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
  try {
    const login = await fetch(`${base}/login/dev`, { method: 'POST', redirect: 'manual', body: new URLSearchParams({ name: 'Omar Khalil' }) })
    assert.equal(login.headers.get('location'), '/new')
    const pending = cookiesOf(login)
    assert.equal(((await (await fetch(`${base}/api/slug/omar`)).json()) as { status: string }).status, 'available')
    const made = await post('/api/links', { name: 'Omar Khalil', topic: 'career advice', slug: 'omar' }, pending)
    assert.equal(made.status, 200)
    const host = cookiesOf(made).split('; ').find((c) => c.startsWith('session='))!
    assert.equal(((await (await fetch(`${base}/api/slug/omar`)).json()) as { status: string }).status, 'taken')

    assert.equal((await post('/api/hosts/omar/tickets', { topic: '', name: '', kind: 'email', contact: 'x' })).status, 400)
    const taken = await post('/api/hosts/omar/tickets', { topic: 'Review my CV', name: 'Lina', kind: 'whatsapp', contact: '+962 79 123 4512' })
    const { token } = (await taken.json()) as { token: string }
    const mine = async () => (await (await fetch(`${base}/api/t/${token}`)).json()) as { place: number; ticket: { state: string } }
    assert.deepEqual([(await mine()).place, (await mine()).ticket.state], [1, 'waiting'])

    const line = (await (await fetch(`${base}/api/line`, { headers: { cookie: host } })).json()) as { tickets: { id: string; topic: string }[] }
    assert.equal(line.tickets[0].topic, 'Review my CV')
    const id = line.tickets[0].id
    assert.equal((await post(`/api/tickets/${id}/reached`, {}, host)).status, 204)

    assert.equal((await mine()).ticket.state, 'reached')
    await post(`/api/tickets/${id}/done`, {}, host)
    assert.equal((await mine()).ticket.state, 'done')
    const after = (await (await fetch(`${base}/api/line`, { headers: { cookie: host } })).json()) as { tickets: unknown[] }
    assert.equal(after.tickets.length, 0)

    assert.equal((await post('/api/me/ticket-colors', { color: 'red', ink: null }, host)).status, 400)
    assert.equal((await post('/api/me/ticket-colors', { color: '#0071e3', ink: '#ffffff' }, host)).status, 200)
    const page = (await (await fetch(`${base}/api/hosts/omar`)).json()) as { host: { ticketColor: string; ticketInk: string } }
    assert.deepEqual([page.host.ticketColor, page.host.ticketInk], ['#0071E3', '#FFFFFF'])
    const held = (await (await fetch(`${base}/api/t/${token}`)).json()) as { host: { ticketColor: string } }
    assert.equal(held.host.ticketColor, '#0071E3')
    await post('/api/me/ticket-colors', { color: null, ink: null }, host)
    assert.equal(((await (await fetch(`${base}/api/hosts/omar`)).json()) as { host: { ticketColor: null } }).host.ticketColor, null)

    assert.equal((await post('/api/me/ticket-colors', { color: '#000000', ink: null })).status, 401)
    assert.equal((await fetch(`${base}/api/line`)).status, 401)
    assert.equal((await fetch(`${base}/healthz`)).status, 200)
  } finally {
    server.close()
  }
})
