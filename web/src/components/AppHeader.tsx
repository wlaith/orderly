import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Lockup } from './Brand'
import { Icon, type IconName } from './Icon'
import { useStore } from '../lib/store'

export function Logo({ badge }: { badge?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <a href="/" className="-ml-1 inline-flex min-h-touch items-center rounded-xs px-1 text-current no-underline" aria-label="Orderly home">
        <Lockup />
      </a>
      {badge}
    </span>
  );
}

export function AppHeader({ right, width, badge }: { right?: ReactNode; width?: number; badge?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const apple = true
  const { signedIn, host } = useStore()
  const back = right ?? (signedIn && host ? <a href="/dashboard" className="btn btn-ghost inline-flex min-h-touch items-center px-3 text-[15px] font-medium">Your line</a> : undefined)
  return (
    <header className="app-header sticky top-0 z-50" data-scrolled={scrolled || undefined}>
      <div className="container-app">
        <div className="mx-auto flex h-[var(--header-h)] items-center justify-between gap-4" style={apple && width ? { maxWidth: width } : undefined}>
          <Logo badge={apple ? badge : undefined} />
          {back}
        </div>
      </div>
    </header>
  )
}

export function LineBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="header-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium tabular-nums">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {count} waiting
    </span>
  )
}

export function PlaceChip({ text, tone = 'normal' }: { text: string; tone?: 'normal' | 'active' | 'muted' }) {
  return (
    <span className={`text-[14px] tabular-nums ${tone === 'active' ? 'font-semibold' : 'font-medium'} ${tone === 'muted' ? 'text-secondary' : 'text-ink'}`}>
      {text}
    </span>
  )
}

interface MenuItem { label: string; icon: IconName; onSelect: () => void; tone?: 'danger' }

export function AccountMenu({ name, email, link, onViewPage, onSignOut }: { name: string; email: string; link?: string; onViewPage?: () => void; onSignOut?: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  const items: MenuItem[] = [
    ...(onViewPage ? [{ label: 'View my page', icon: 'eye' as IconName, onSelect: () => { setOpen(false); onViewPage() } }] : []),
    ...(link
      ? [{ label: copied ? 'Copied' : 'Copy link', icon: (copied ? 'check' : 'copy') as IconName, onSelect: async () => {
          try { await navigator.clipboard.writeText(link) } catch { /* may be refused in frames */ }
          setCopied(true); setTimeout(() => setCopied(false), 1600)
        } }]
      : []),
    ...(onSignOut ? [{ label: 'Sign out', icon: 'signout' as IconName, onSelect: () => { setOpen(false); onSignOut() } }] : []),
  ]

  useEffect(() => {
    if (!open) return
    const first = wrap.current?.querySelector<HTMLElement>('[role=menuitem]')
    first?.focus()
    const out = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => {
      const els = Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])
      const i = els.indexOf(document.activeElement as HTMLElement)
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus() }
      if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus() }
      if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus() }
      if (e.key === 'Tab') setOpen(false)
    }
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', key) }
  }, [open])

  return (
    <div ref={wrap} className="relative -mr-1.5">
      <button
        ref={btn}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account, ${name}`}
        className="grid h-11 w-11 place-items-center rounded-full"
      >
        <span className={`avatar grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold transition-shadow ${open ? 'ring-2 ring-accent ring-offset-2 ring-offset-canvas' : ''}`}>{initials}</span>
      </button>
      {open && (
        <div role="menu" aria-label="Account" className="menu-pop fade-in absolute right-0 top-[calc(100%+6px)] w-[260px] overflow-hidden rounded-[14px] bg-white p-1.5 text-ink">
          <div className="px-3 pb-2.5 pt-2">
            <p className="[overflow-wrap:anywhere] text-[15px] font-semibold">{name}</p>
            {email && <p className="[overflow-wrap:anywhere] text-[13px] text-secondary">{email}</p>}
          </div>
          <div className="mx-3 mb-1 h-px bg-line" />
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={it.onSelect}
              className="flex min-h-touch w-full items-center gap-2.5 rounded-[9px] px-3 text-left text-[15px] outline-none hover:bg-ink/[0.05] focus-visible:bg-ink/[0.06]"
            >
              <Icon name={it.icon} size={18} bare />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
