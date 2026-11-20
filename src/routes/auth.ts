import { Router, type Response } from 'express'
import * as arctic from 'arctic'
import { config } from '../config.js'
import type { Db } from '../db.js'
import { sendSignInLink } from '../email.js'
import { consumeLoginLink, createLoginLink } from '../loginlinks.js'
import { rateLimiter } from '../ratelimit.js'
import { clearCookie, hostIdOf, readCookie, setCookie, startSession } from '../session.js'
import { normalizeSlug } from '../slug.js'
import { contactError } from '../contact.js'
import { loginPage } from '../views/auth.js'

const TEN_MIN = 600
const TEN_MIN_MS = 10 * 60 * 1000
export interface Pending { sub?: string; email?: string; name?: string }
export interface Identity { sub?: string; email?: string; name?: string }

const google = () => new arctic.Google(config.googleId, config.googleSecret, `${config.baseUrl}/auth/callback`)

export function authRoutes(db: Db): Router {
  const r = Router()
  const emailByIp = rateLimiter(5, TEN_MIN_MS)
  const emailByAddress = rateLimiter(3, TEN_MIN_MS)

  r.get('/login', (req, res) => {
    if (hostIdOf(req)) return res.redirect('/dashboard')
    res.send(loginPage({
      error: typeof req.query.error === 'string' ? req.query.error : undefined,
      sent: req.query.sent === '1',
    }))
  })

  r.post('/logout', (_req, res) => { clearCookie(res, 'session'); res.redirect('/') })

  r.get('/login/google', (req, res) => {
    if (!config.googleId) return res.redirect('/login?error=Google sign-in is not set up here.')
    const state = arctic.generateState(), verifier = arctic.generateCodeVerifier()
    setCookie(res, 'oauth', { state, verifier, link: req.query.link === '1' }, TEN_MIN)
    res.redirect(google().createAuthorizationURL(state, verifier, ['openid', 'profile', 'email']).toString())
  })

  r.get('/auth/callback', async (req, res) => {
    const saved = readCookie<{ state: string; verifier: string; link: boolean }>(req, 'oauth')
    clearCookie(res, 'oauth')
    if (!saved || saved.state !== req.query.state || typeof req.query.code !== 'string') return res.redirect('/login?error=Google sign-in did not finish. Try again.')
    try {
      const tokens = await google().validateAuthorizationCode(req.query.code, saved.verifier)
      const claims = arctic.decodeIdToken(tokens.idToken()) as { sub: string; name?: string; email?: string; email_verified?: boolean }
      const me = hostIdOf(req)
      if (saved.link && me) {
        db.prepare('update hosts set google_sub = ? where id = ? and google_sub is null').run(claims.sub, me)
        return res.redirect('/dashboard')
      }
      signIn(db, res, { sub: claims.sub, name: claims.name, email: claims.email_verified === true ? claims.email : undefined })
    } catch (err) {
      console.error('google callback failed', err)
      res.redirect('/login?error=Google sign-in did not finish. Try again.')
    }
  })

  r.post('/login/email', async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const problem = contactError('email', email)
    if (problem) return res.redirect(`/login?error=${encodeURIComponent(problem)}`)
    if (!emailByIp(req.ip ?? 'unknown') || !emailByAddress(email)) {
      return res.redirect(`/login?error=${encodeURIComponent('Too many sign-in emails. Try again in a few minutes.')}`)
    }
    try {
      const token = createLoginLink(db, email)
      await sendSignInLink(email, `${config.baseUrl}/auth/email?token=${encodeURIComponent(token)}`)
      res.redirect('/login?sent=1')
    } catch (err) {
      console.error('sign-in email failed', err)
      res.redirect(`/login?error=${encodeURIComponent('We could not send the email. Try again later.')}`)
    }
  })

  r.get('/auth/email', (req, res) => {
    const email = typeof req.query.token === 'string' ? consumeLoginLink(db, req.query.token) : null
    if (!email) return res.redirect('/login?error=That sign-in link has expired or was already used. Ask for a new one.')
    signIn(db, res, { email })
  })

  r.post('/login/dev', (req, res) => {
    if (!config.devLogin) return res.status(404).end()
    const name = String(req.body?.name ?? '').trim().slice(0, 60) || 'Dev Host'
    signIn(db, res, { sub: `dev:${normalizeSlug(name)}`, name })
  })

  return r
}

/** A known identity signs in; a new one waits in a signed cookie until they pick a link on /new. */
function signIn(db: Db, res: Response, who: Identity) {
  const bySub = who.sub ? db.prepare('select id from hosts where google_sub = ?').get(who.sub) as { id: number } | undefined : undefined
  const byEmail = bySub || !who.email ? undefined : db.prepare('select id from hosts where email = ?').get(who.email) as { id: number } | undefined
  const host = bySub ?? byEmail
  if (host) { startSession(res, host.id); return res.redirect('/dashboard') }
  setCookie(res, 'pending', { sub: who.sub, email: who.email, name: who.name } satisfies Pending, TEN_MIN * 3)
  res.redirect('/new')
}
