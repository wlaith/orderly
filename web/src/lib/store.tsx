import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContactType } from '../components/Ticket'
import { setHostColors } from '../accent'
import { nav, toLogin, useWhere } from './router'


export interface Host {
  name: string
  email: string
  slug: string
  topic: string
  ticketColor?: string | null
  ticketInk?: string | null
}

export type TicketState = 'waiting' | 'reached' | 'done' | 'left'

export interface LineTicket {
  id: string
  number: number
  name: string
  topic: string
  link?: string
  contact: { type: ContactType; value: string }
  createdAt: number
  state: TicketState
  reachedAt?: number
}

type NewTicket = Omit<LineTicket, 'id' | 'number' | 'createdAt' | 'state'>
type Action =
  | { type: 'signOut' }
  | { type: 'take'; ticket: NewTicket; mine: boolean }
  | { type: 'set'; id: string; state: TicketState }

interface Store {
  signedIn: boolean
  pendingName: string | null
  host: Host | null
  tickets: LineTicket[]
  myTicketId: string | null
  dispatch: (a: Action) => void
  line: LineTicket[]
  placeOf: (id: string) => number
  myTicket: LineTicket | null
  now: number
  lastTake: () => Promise<string | undefined> | null
  ready: boolean
  missing: boolean
  reloadMe: () => Promise<void>
  setTicketColors: (c: { color: string | null; ink: string | null }) => void
}

const Ctx = createContext<Store | null>(null)
const POLL_MS = 5000
const tokenKey = (slug: string) => `doorin.ticket.${slug}`
const json = (body: unknown) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const api = async <T,>(url: string, init?: RequestInit): Promise<T | null> => {
  try {
    const res = await fetch(url, init)
    if (res.status === 401) { toLogin(); return null }
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}
const remember = (slug: string, token: string) => { try { localStorage.setItem(tokenKey(slug), token) } catch { /* private mode */ } }
const recall = (slug: string) => { try { return localStorage.getItem(tokenKey(slug)) } catch { return null } }

interface TicketReply { host: { name: string; slug: string; topic: string }; ticket: LineTicket; place: number }

export function StoreProvider({ children }: { children: ReactNode }) {
  const where = useWhere()
  const [ready, setReady] = useState(false)
  const [me, setMe] = useState<Host | null>(null)
  const [pendingName, setPendingName] = useState<string | null>(null)
  const [mine, setMine] = useState<LineTicket[]>([])
  const [viewHost, setViewHost] = useState<Host | null>(null)
  const [waiting, setWaiting] = useState(0)
  const [my, setMy] = useState<{ ticket: LineTicket; place: number; token: string; slug: string } | null>(null)
  const [missing, setMissing] = useState(false)
  const [now, setNow] = useState(Date.now())
  const lastTake = useRef<Promise<string | undefined> | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])

  const reloadMe = useCallback(async () => {
    const r = await api<{ host: Omit<Host, 'email'> | null; pending: { name: string } | null }>('/api/me')
    setMe(r?.host ? { ...r.host, email: '' } : null)
    setPendingName(r?.pending ? r.pending.name : null)
    setReady(true)
  }, [])
  useEffect(() => { void reloadMe() }, [reloadMe])

  const loadTicket = useCallback(async (token: string) => {
    const r = await api<TicketReply>(`/api/t/${encodeURIComponent(token)}`)
    if (!r) return false
    setViewHost({ ...r.host, email: '' })
    setMy({ ticket: r.ticket, place: r.place, token, slug: r.host.slug })
    remember(r.host.slug, token)
    return true
  }, [])

  useEffect(() => {
    nav.slug = me?.slug ?? where.slug ?? viewHost?.slug
    nav.token = my?.token ?? where.token
  }, [me, my, viewHost, where])

  useEffect(() => {
    if (!ready) return
    let alive = true
    const load = async () => {
      if (where.route === 'dashboard') {
        if (!me) return toLogin()
        const r = await api<{ tickets: LineTicket[] }>('/api/line')
        if (alive && r) setMine(r.tickets)
      } else if (where.route === 'host-page' && where.slug) {
        const r = await api<{ host: Omit<Host, 'email'>; waiting: number }>(`/api/hosts/${encodeURIComponent(where.slug)}`)
        if (!alive) return
        setMissing(!r)
        if (r) { setViewHost({ ...r.host, email: '' }); setWaiting(r.waiting) }
        const saved = recall(where.slug)
        if (r && saved) await loadTicket(saved)
      } else if (where.route === 'ticket' && where.token) {
        const ok = await loadTicket(where.token)
        if (alive) setMissing(!ok)
      } else if (where.route === 'make-link' && !me && pendingName === null) {
        toLogin()
      }
    }
    void load()
    const t = setInterval(() => { if (!document.hidden) void load() }, POLL_MS)
    return () => { alive = false; clearInterval(t) }
  }, [ready, where.route, where.slug, where.token, me, pendingName, loadTicket])

  const saveColors = useRef<number | undefined>(undefined)
  const setTicketColors = useCallback((c: { color: string | null; ink: string | null }) => {
    setMe((m) => (m ? { ...m, ticketColor: c.color, ticketInk: c.ink } : m))
    window.clearTimeout(saveColors.current)
    saveColors.current = window.setTimeout(() => { void api('/api/me/ticket-colors', json(c)) }, 400)
  }, [])

  const refreshLine = useCallback(async () => {
    const r = await api<{ tickets: LineTicket[] }>('/api/line')
    if (r) setMine(r.tickets)
  }, [])

  const dispatch = useCallback((a: Action) => {
    if (a.type === 'signOut') {
      setMe(null)
      void fetch('/logout', { method: 'POST' })
    } else if (a.type === 'take') {
      const slug = where.slug
      if (!slug) return
      const { ticket } = a
      lastTake.current = (async () => {
        const r = await api<{ token: string }>(`/api/hosts/${encodeURIComponent(slug)}/tickets`, json({
          topic: ticket.topic, link: ticket.link ?? '', name: ticket.name, kind: ticket.contact.type.toLowerCase(), contact: ticket.contact.value,
        }))
        if (!r) { window.alert('We could not save your ticket. Please try again.'); window.location.reload(); return undefined }
        remember(slug, r.token)
        nav.token = r.token
        await loadTicket(r.token)
        return r.token
      })()
    } else if (a.type === 'set') {
      const t = mine.find((x) => x.id === a.id)
      if (a.state === 'reached' && t && me) {
        openReach(t, me)
        setMine((l) => l.map((x) => (x.id === t.id ? { ...x, state: 'reached', reachedAt: Date.now() } : x)))
        void fetch(`/api/tickets/${t.id}/reached`, { method: 'POST' })
      } else if (a.state === 'done') {
        setMine((l) => l.filter((x) => x.id !== a.id))
        void fetch(`/api/tickets/${a.id}/done`, { method: 'POST' }).then(refreshLine)
      } else if ((a.state === 'left' || a.state === 'waiting') && my) {
        setMy({ ...my, ticket: { ...my.ticket, state: a.state } })
        const path = a.state === 'left' ? 'leave' : 'rejoin'
        void fetch(`/api/t/${encodeURIComponent(my.token)}/${path}`, { method: 'POST' }).then(() => loadTicket(my.token))
      }
    }
  }, [where.slug, mine, me, my, loadTicket, refreshLine])

  const onDashboard = where.route === 'dashboard' || where.route === 'make-link'
  const host = onDashboard ? me : viewHost
  const line = useMemo<LineTicket[]>(
    () => (onDashboard ? mine : Array.from({ length: waiting }, (_, i) => ({ id: `w${i}`, number: i + 1, name: '', topic: '', contact: { type: 'Email' as ContactType, value: '' }, createdAt: 0, state: 'waiting' as const }))),
    [onDashboard, mine, waiting],
  )
  useEffect(() => {
    setHostColors({ paper: host?.ticketColor ?? null, ink: host?.ticketInk ?? null })
  }, [host?.ticketColor, host?.ticketInk])

  const myTicket = my && ((where.route === 'host-page' && my.slug === where.slug) || where.route === 'ticket') ? my.ticket : null
  const placeOf = useCallback((id: string) => (my && my.ticket.id === id ? my.place : line.findIndex((t) => t.id === id) + 1), [my, line])

  const value = useMemo<Store>(() => ({
    signedIn: Boolean(me), pendingName, host, tickets: line, myTicketId: myTicket?.id ?? null, dispatch, line, placeOf, myTicket, now,
    lastTake: () => lastTake.current, ready, missing, reloadMe, setTicketColors,
  }), [me, pendingName, host, line, dispatch, placeOf, myTicket, now, ready, missing, reloadMe, setTicketColors])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('StoreProvider missing')
  return v
}


const digits = (s: string) => s.replace(/\D/g, '')
export function reachUrl(t: LineTicket, host: Host): string {
  const hello = `Hi ${firstName(t.name)}, it's ${firstName(host.name)}. I'm ready for you (${t.topic}).`
  const text = encodeURIComponent(hello)
  const v = t.contact.value
  switch (t.contact.type) {
    case 'WhatsApp': return `https://wa.me/${digits(v)}?text=${text}`
    case 'Signal': return `https://signal.me/#p/+${digits(v)}`
    case 'Telegram': return `https://t.me/${encodeURIComponent(v.replace(/^@/, ''))}`
    case 'Phone': return `tel:+${digits(v)}`
    case 'Email': return `mailto:${encodeURIComponent(v)}?subject=${encodeURIComponent('Your turn')}&body=${text}`
  }
}

function openReach(t: LineTicket, host: Host) {
  const url = reachUrl(t, host)
  if (url.startsWith('tel:') || url.startsWith('mailto:')) window.location.href = url
  else window.open(url, '_blank', 'noopener')
}


export function waitedText(createdAt: number, now = Date.now()) {
  const m = Math.floor((now - createdAt) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return `${h} h ${m % 60} min`
}

export function maskContact(type: ContactType, v: string) {
  if (type === 'Email' || type === 'Telegram') return v
  const digits = v.replace(/[^\d+]/g, '')
  if (digits.length < 7) return v
  const m = v.trim().match(/^(\+\d{1,3})\s*(\d)/)
  return m ? `${m[1]} ${m[2]}… ${digits.slice(-2)}` : `${digits.slice(0, 4)}… ${digits.slice(-2)}`
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] || ''
