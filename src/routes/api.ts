import { Router, type NextFunction, type Request, type Response } from 'express'
import { KIND_LABEL, contactError, isKind, linkError, normalizeContact, normalizeLink, type Kind } from '../contact.js'
import type { Db } from '../db.js'
import { closeTicket, hostById, hostBySlug, lineOf, markReached, numberOf, placeOf, rejoinTicket, takeTicket, ticketByToken, ticketForHost, waitingCount, type Host, type Ticket } from '../queue.js'
import { rateLimiter } from '../ratelimit.js'
import { clearCookie, hostIdOf, readCookie, startSession } from '../session.js'
import { normalizeSlug, slugError } from '../slug.js'
import { turnstileOk } from '../turnstile.js'
import type { Pending } from './auth.js'

type HostReq = Request & { me: Host }

const ms = (s: string | null) => (s ? Date.parse(s.replace(' ', 'T') + 'Z') : undefined)

function ticketJson(db: Db, t: Ticket) {
  return {
    id: String(t.id), number: numberOf(db, t), name: t.name, topic: t.topic, link: t.link ?? undefined,
    contact: { type: KIND_LABEL[t.contact_kind], value: t.contact_kind === 'telegram' ? `@${t.contact}` : t.contact },
    createdAt: ms(t.created_at), state: t.status === 'waiting' && t.reached_at ? 'reached' : t.status, reachedAt: ms(t.reached_at),
  }
}
const hostJson = (h: Host) => ({ name: h.name, slug: h.slug, topic: h.about, ticketColor: h.ticket_color, ticketInk: h.ticket_ink })

function colour(v: unknown): string | null | undefined {
  if (v === null || v === '') return null
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : undefined
}

export function apiRoutes(db: Db): Router {
  const r = Router()
  const allow = rateLimiter(5, 10 * 60 * 1000)

  const needHost = (req: Request, res: Response, next: NextFunction) => {
    const id = hostIdOf(req)
    const host = id ? hostById(db, id) : undefined
    if (!host) return void res.status(401).json({ error: 'Sign in first.' })
    ;(req as HostReq).me = host
    next()
  }
  const me = (req: Request) => (req as HostReq).me

  r.get('/me', (req, res) => {
    const id = hostIdOf(req)
    const host = id ? hostById(db, id) : undefined
    const pending = readCookie<Pending>(req, 'pending')
    res.json({ host: host ? hostJson(host) : null, pending: !host && pending ? { name: pending.name ?? '' } : null })
  })

  r.get('/slug/:slug', (req, res) => {
    const slug = normalizeSlug(req.params.slug)
    if (slugError(slug)?.startsWith('That one is reserved')) return void res.json({ status: 'reserved' })
    if (!hostBySlug(db, slug)) return void res.json({ status: 'available' })
    res.json({ status: 'taken', alternatives: suggest(db, slug, String(req.query.name ?? '')) })
  })

  r.post('/links', (req, res) => {
    const pending = readCookie<Pending>(req, 'pending')
    if (!pending) return void res.status(401).json({ error: 'Sign in first.' })
    const name = String(req.body.name ?? '').trim(), about = String(req.body.topic ?? '').trim(), slug = normalizeSlug(String(req.body.slug ?? ''))
    const error = !name || name.length > 60 ? 'Add your name (60 characters or fewer).' : about.length > 120 ? 'Use 120 characters or fewer.' : slugError(slug) ?? (hostBySlug(db, slug) ? 'That link is taken.' : null)
    if (error) return void res.status(400).json({ error })
    if (pending.email && db.prepare('select 1 from hosts where email = ?').get(pending.email)) return void res.status(409).json({ error: 'That email already has a link. Sign in instead.' })
    const id = Number(db.prepare('insert into hosts (google_sub, email, name, about, slug) values (?, ?, ?, ?, ?)')
      .run(pending.sub ?? null, pending.email ?? null, name, about, slug).lastInsertRowid)
    clearCookie(res, 'pending')
    startSession(res, id)
    res.json({ ok: true })
  })

  r.post('/me/ticket-colors', needHost, (req, res) => {
    const color = colour(req.body.color), ink = colour(req.body.ink)
    if (color === undefined || ink === undefined) return void res.status(400).json({ error: 'Use a colour like #3F000D.' })
    db.prepare('update hosts set ticket_color = ?, ticket_ink = ? where id = ?').run(color, ink, me(req).id)
    res.json({ host: hostJson({ ...me(req), ticket_color: color, ticket_ink: ink }) })
  })

  r.get('/line', needHost, (req, res) => {
    res.json({ host: hostJson(me(req)), tickets: lineOf(db, me(req).id).map((t) => ticketJson(db, t)) })
  })

  r.post('/tickets/:id/reached', needHost, (req, res) => {
    const t = ticketForHost(db, Number(req.params.id), me(req).id)
    if (t) markReached(db, t.id)
    res.status(204).end()
  })

  r.post('/tickets/:id/done', needHost, (req, res) => {
    const t = ticketForHost(db, Number(req.params.id), me(req).id)
    if (t) closeTicket(db, t.id, 'done')
    res.status(204).end()
  })

  r.get('/hosts/:slug', (req, res) => {
    const host = hostBySlug(db, req.params.slug)
    if (!host) return void res.status(404).json({ error: 'No such line.' })
    res.json({ host: hostJson(host), waiting: waitingCount(db, host.id) })
  })

  r.post('/hosts/:slug/tickets', async (req, res) => {
    const host = hostBySlug(db, req.params.slug)
    if (!host) return void res.status(404).json({ error: 'No such line.' })
    const kind: Kind | null = isKind(req.body.kind) ? req.body.kind : null
    const topic = String(req.body.topic ?? '').trim(), name = String(req.body.name ?? '').trim()
    const link = String(req.body.link ?? ''), contact = String(req.body.contact ?? '')
    const error = !kind ? 'Pick how to be reached.' : !topic || topic.length > 120 ? 'Say what it is about, in 120 characters or fewer.'
      : !name || name.length > 60 ? 'Add your name.' : linkError(link) ?? contactError(kind, contact)
    if (error || !kind) return void res.status(400).json({ error })
    const ip = req.ip ?? 'unknown'
    if (!(await turnstileOk(req.body.turnstile, ip))) return void res.status(400).json({ error: 'We could not check that you are a person. Reload and try again.' })
    if (!allow(ip)) return void res.status(429).json({ error: 'Too many tickets from this connection. Try again in a few minutes.' })
    res.json({ token: takeTicket(db, host.id, { name, topic, link: normalizeLink(link), kind, contact: normalizeContact(kind, contact) }) })
  })

  // The token in the link is the only credential.
  const byToken = (req: Request, res: Response) => {
    const t = ticketByToken(db, String(req.params.token))
    const host = t && hostById(db, t.host_id)
    if (!t || !host) { res.status(404).json({ error: 'No such ticket.' }); return null }
    return { t, host }
  }

  r.get('/t/:token', (req, res) => {
    const f = byToken(req, res)
    if (f) res.json({ host: hostJson(f.host), ticket: ticketJson(db, f.t), place: placeOf(db, f.t), waiting: waitingCount(db, f.host.id) })
  })
  r.post('/t/:token/leave', (req, res) => { const f = byToken(req, res); if (f) { closeTicket(db, f.t.id, 'left'); res.status(204).end() } })
  r.post('/t/:token/rejoin', (req, res) => { const f = byToken(req, res); if (f) { rejoinTicket(db, f.t.id); res.status(204).end() } })

  return r
}

function suggest(db: Db, slug: string, name: string): string[] {
  const parts = name.toLowerCase().split(/\s+/).filter(Boolean)
  const last = parts.length > 1 ? normalizeSlug(parts[parts.length - 1]) : ''
  return [last && `${slug}-${last}`, last && `${slug}-${last[0]}`, `ask-${slug}`, `${slug}-office-hours`, `${slug}2`]
    .filter((c): c is string => Boolean(c) && !slugError(c as string) && !hostBySlug(db, c as string)).slice(0, 2)
}

