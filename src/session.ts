import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Request, Response } from 'express'
import { config } from './config.js'

const mac = (body: string) => createHmac('sha256', config.sessionSecret).update(body).digest('base64url')

export function sign(data: object, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url')
  return `${body}.${mac(body)}`
}

export function verify<T>(token: string | undefined): (T & { exp: number }) | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const want = Buffer.from(mac(body))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    return data.exp > Date.now() / 1000 ? data : null
  } catch {
    return null
  }
}

export function readCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function setCookie(res: Response, name: string, data: object, ttlSeconds: number) {
  const flags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}${config.production ? '; Secure' : ''}`
  res.append('Set-Cookie', `${name}=${encodeURIComponent(sign(data, ttlSeconds))}; ${flags}`)
}

export function clearCookie(res: Response, name: string) {
  res.append('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

export const readCookie = <T>(req: Request, name: string) => verify<T>(readCookies(req)[name])

const THIRTY_DAYS = 60 * 60 * 24 * 30
export const startSession = (res: Response, hostId: number) => setCookie(res, 'session', { h: hostId }, THIRTY_DAYS)
export const hostIdOf = (req: Request) => readCookie<{ h: number }>(req, 'session')?.h ?? null
