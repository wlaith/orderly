import { useEffect, useState } from 'react'

export type Route = 'welcome' | 'make-link' | 'dashboard' | 'host-page' | 'ticket'

export interface Where { route: Route; slug?: string; token?: string }

const parse = (path: string): Where => {
  const p = path.replace(/\/+$/, '') || '/'
  if (p === '/') return { route: 'welcome' }
  if (p === '/new') return { route: 'make-link' }
  if (p === '/dashboard') return { route: 'dashboard' }
  const t = /^\/t\/([^/]+)$/.exec(p)
  if (t) return { route: 'ticket', token: decodeURIComponent(t[1]) }
  return { route: 'host-page', slug: decodeURIComponent(p.slice(1)) }
}

export const nav: { slug?: string; token?: string } = {}

export function useWhere(): Where {
  const [where, setWhere] = useState(() => parse(window.location.pathname))
  useEffect(() => {
    const on = () => {
      setWhere(parse(window.location.pathname))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  return where
}

export const useRoute = () => useWhere().route

const PATH: Record<Route, () => string> = {
  welcome: () => '/',
  'make-link': () => '/new',
  dashboard: () => '/dashboard',
  'host-page': () => `/${nav.slug ?? ''}`,
  ticket: () => `/t/${nav.token ?? ''}`,
}

export function go(r: Route) {
  const path = PATH[r]()
  if (window.location.pathname === path) return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const toLogin = () => window.location.assign('/login')

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
  if (!a || a.target || a.hasAttribute('download') || a.origin !== window.location.origin) return
  if (a.pathname === '/login' || a.pathname.startsWith('/api/') || a.pathname.startsWith('/static/')) return
  if (a.hash && a.pathname === window.location.pathname) return
  e.preventDefault()
  if (a.pathname + a.search !== window.location.pathname + window.location.search) window.history.pushState(null, '', a.pathname + a.search)
  window.dispatchEvent(new PopStateEvent('popstate'))
})
