import { AppMark } from '../components/AppMark'
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { Ticket } from '../components/Ticket'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { Lockup, Mark } from '../components/Brand'
import { LINK_HOST } from '../lib/slug'

export type LandingVariant = 'A' | 'B' | 'C'
const KEY = 'doorin.landing.apple'
let current: LandingVariant = 'A'
try { current = (localStorage.getItem(KEY) as LandingVariant) || 'A' } catch { /* ignore */ }
const subs = new Set<() => void>()
export const setLanding = (v: LandingVariant) => { current = v; try { localStorage.setItem(KEY, v) } catch { /* ignore */ } subs.forEach((f) => f()) }
export const useLanding = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => current)

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches


interface Swatch { bg: string; ink: string }
const OX = '#3F000D', PAPER = '#FAF8F4', WHITE = '#FFFFFF', TINT = '#FFD8CC', RED = '#FF4D2E', TEAL_LIGHT = '#3FBFA8'
const BUTTER = '#FFE7A3', MUSTARD = '#F2B705', PINK = '#FF9EC7', PLUM = '#4A1238', NAVY = '#14213D', FOREST = '#12402F'
const PALETTE: Swatch[] = [
  { bg: RED, ink: OX },              // 0  Ticket Red
  { bg: BUTTER, ink: OX },           // 1  Butter
  { bg: FOREST, ink: BUTTER },       // 2  Forest
  { bg: '#A8DAF5', ink: NAVY },      // 3  Sky
  { bg: PLUM, ink: PINK },           // 4  Plum
  { bg: MUSTARD, ink: OX },          // 5  Mustard
  { bg: NAVY, ink: '#FF6A4D' },      // 6  Navy
  { bg: PINK, ink: OX },             // 7  Pink
  { bg: '#0E6E62', ink: BUTTER },    // 8  Teal
  { bg: '#C9B6FF', ink: PLUM },      // 9  Lilac
  { bg: '#4D5B1E', ink: PAPER },     // 10 Olive
  { bg: PAPER, ink: '#C7361A' },     // 11 Cream
  { bg: OX, ink: MUSTARD },          // 12 Oxblood
  { bg: '#FF8A3D', ink: NAVY },      // 13 Tangerine
  { bg: '#BDEBD3', ink: FOREST },    // 14 Mint
]
const codeInk = (ink: string) => ([PAPER, WHITE, TINT, RED, TEAL_LIGHT, BUTTER, MUSTARD, PINK, '#FF6A4D'].includes(ink) ? OX : ink)

function MiniTicket({ s, name, host, topic, place, style, className = '' }: { s: Swatch; name: string; host: string; topic: string; place: string; style?: CSSProperties; className?: string }) {
  const notch = 'radial-gradient(circle 11px at 0 64%, #0000 97%, #000 100%), radial-gradient(circle 11px at 100% 64%, #0000 97%, #000 100%)'
  return (
    <div
      className={`lt flex w-[230px] flex-col rounded-[20px] p-5 ${className || 'relative'}`}
      style={{ background: s.bg, color: s.ink, WebkitMaskImage: notch, WebkitMaskComposite: 'source-in', maskImage: notch, maskComposite: 'intersect', ...style } as CSSProperties}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em] opacity-80">
        <span>From</span>
        <span className="mx-2 h-px flex-1 border-t border-dashed border-current opacity-60" />
        <span>To</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.03em]">{name}</span>
        <span className="text-[26px] font-semibold leading-none tracking-[-0.03em]">{host}</span>
      </div>
      <p className="mt-3 [overflow-wrap:anywhere] text-[13px] font-medium leading-snug opacity-90">{topic}</p>
      <div className="mt-[54px] border-t border-dashed border-current opacity-40" />
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] opacity-80">Your place</p>
          <p className="text-[64px] font-semibold leading-[0.85] tracking-[-0.05em]">{place}</p>
        </div>
        <QRish ink={s.ink} />
      </div>
    </div>
  )
}

function QRish({ ink }: { ink: string }) {
  const cells = [0b1110111, 0b1010100, 0b1110011, 0b0001101, 0b1101011, 0b1011100, 0b1110101]
  return (
    <svg width="46" height="46" viewBox="0 0 7 7" className="rounded-[4px]" style={{ background: '#fff', padding: 4 }} shapeRendering="crispEdges">
      {cells.flatMap((row, y) => Array.from({ length: 7 }, (_, x) => ((row >> (6 - x)) & 1 ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={codeInk(ink)} /> : null)))}
    </svg>
  )
}

function Nav({ onStart, dark }: { onStart: () => void; dark?: boolean }) {
  const link = `rounded-[8px] px-3 py-2 text-[14px] ${dark ? 'text-white/70 hover:text-white' : 'text-secondary hover:text-ink'}`
  return (
    <header className={`relative z-20 ${dark ? 'text-white' : 'text-ink'}`}>
      <div className="container-app grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <a href="/" className="justify-self-start text-current no-underline" aria-label="Orderly home"><Lockup /></a>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }) }} className={link}>How it works</a>
          <a href="#who" onClick={(e) => { e.preventDefault(); document.getElementById('who')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }) }} className={link}>Who it's for</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }) }} className={link}>Questions</a>
        </nav>
        <div className="col-start-3 flex items-center justify-self-end gap-1">
          <button type="button" onClick={onStart} className={`${link} hidden sm:block`}>Sign in</button>
          <button type="button" onClick={onStart} className={`min-h-[40px] rounded-[8px] px-4 text-[14px] font-medium ${dark ? 'bg-white text-ink' : 'bg-ink text-canvas'}`}>Get your link</button>
        </div>
      </div>
    </header>
  )
}

function ClaimForm({ onStart, busy, className = '' }: { onStart: () => void; busy: boolean; className?: string }) {
  const [slug, setSlug] = useState('')
  return (
    <form
      className={`flex w-full max-w-[460px] items-center gap-1 rounded-[14px] bg-white p-1.5 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] ${className}`}
      onSubmit={(e) => { e.preventDefault(); onStart() }}
    >
      <label htmlFor="claim" className="pl-3 text-[17px] text-secondary">{LINK_HOST}</label>
      <input id="claim" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="your-name" autoComplete="off" spellCheck={false} className="min-w-0 flex-1 bg-transparent py-2 text-[17px] text-ink outline-none focus-visible:outline-0 placeholder:text-ink/30" />
      <Button type="submit" busy={busy}>Claim</Button>
    </form>
  )
}


function HeroFan({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  const [open, setOpen] = useState(reduced())
  useEffect(() => { const t = setTimeout(() => setOpen(true), 120); return () => clearTimeout(t) }, [])
  const fan = [
    { s: PALETTE[3], n: 'Emily', h: 'Marcus', t: 'Feedback on my thesis outline', p: '5th' },
    { s: PALETTE[4], n: 'Kenji', h: 'Omar', t: 'Is this offer fair?', p: '3rd' },
    { s: PALETTE[1], n: 'Tyler', h: 'Leen', t: 'Logo review before launch', p: '2nd' },
    { s: PALETTE[0], n: 'Jessica', h: 'Omar', t: 'Mock interview for a frontend role', p: '1st' },
    { s: PALETTE[2], n: 'Priya', h: 'Ryan', t: 'Portfolio review, 10 minutes', p: '2nd' },
    { s: PALETTE[7], n: 'Ziad', h: 'Kate', t: 'Pitch deck, slide 4', p: '4th' },
    { s: PALETTE[6], n: 'Josh', h: 'Mei', t: 'Career switch to design', p: '6th' },
  ]
  const mid = (fan.length - 1) / 2
  return (
    <section className="relative overflow-hidden">
      <div className="container-app flex flex-col items-center pt-10 text-center sm:pt-14">
        {/* Always two lines: see .hero-two-line in index.css */}
        <h1 className="hero-two-line font-semibold leading-[1.02] tracking-[-0.045em] text-ink">
          <span className="block whitespace-nowrap">Skip the DMs.</span>
          <span className="block whitespace-nowrap">
            Everyone gets a <Mark className="ml-[0.14em] mr-[0.12em] inline-block h-[0.78em] w-auto align-[-0.04em] text-accent" />ticket.
          </span>
        </h1>
        <p className="mt-5 max-w-[520px] text-[18px] leading-[1.5] text-secondary [text-wrap:pretty]">
          One link for everyone who wants a minute of your time. They always see their place, and you reach them in the app they chose.
        </p>
        <ClaimForm onStart={onStart} busy={busy} className="mt-8" />
        <button
          type="button"
          onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' })}
          className="group mt-3 inline-flex min-h-touch items-center gap-1.5 rounded-[8px] px-3 text-[15px] font-medium text-ink"
        >
          <span className="underline-offset-4 group-hover:underline">See how it works</span>
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-y-0.5">↓</span>
        </button>
      </div>
      <div className="lt-fan-wrap relative mx-auto mt-12 h-[300px] max-w-[1200px] sm:h-[380px]" aria-hidden="true">
        {fan.map((f, i) => {
          const d = i - mid
          const rot = open ? d * 9 : 0
          const x = open ? d * 150 : 0
          const y = open ? Math.abs(d) * Math.abs(d) * 14 + (d === 0 ? -26 : 0) : 80
          return (
            <MiniTicket
              key={i}
              s={f.s}
              name={f.n}
              host={f.h}
              topic={f.t}
              place={f.p}
              className="lt-fan absolute left-1/2 top-6 shadow-none"
              style={{ transform: `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg)`, zIndex: 10 - Math.abs(d), ['--d' as string]: `${Math.abs(d) * 60}ms` } as CSSProperties}
            />
          )
        })}
      </div>
    </section>
  )
}

function HeroClaim({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  const cards = [
    { s: PALETTE[10], title: 'Career advice', host: 'Omar Haddad', line: ['Jessica', 'Ahmad', 'Tyler'], rot: -6, x: 10, y: 10 },
    { s: PALETTE[14], title: 'Office hours', host: 'Dr. Rachel Kim', line: ['Mei', 'Chris', 'Priya', 'Dana'], rot: 4, x: 300, y: -20 },
    { s: PALETTE[12], title: 'Portfolio reviews', host: 'Jordan Lee', line: ['Noor', 'Kevin'], rot: 3, x: 40, y: 270 },
    { s: PALETTE[11], title: 'Pitch feedback', host: 'Sam Carter', line: ['Ethan'], rot: -4, x: 330, y: 250 },
  ]
  return (
    <section className="relative overflow-hidden">
      <div className="container-app grid grid-cols-1 items-center gap-12 pb-10 pt-12 lg:grid-cols-[minmax(0,520px)_1fr] lg:pt-20">
        <div>
          <h1 className="text-[clamp(40px,5.4vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink [text-wrap:balance]">Your time, in a line. Not in your DMs.</h1>
          <p className="mt-5 max-w-[460px] text-[18px] leading-[1.5] text-secondary">Share one link. People take a ticket in seconds and see their place. You reach each one in the app they chose.</p>
          <ClaimForm onStart={onStart} busy={busy} className="mt-8" />
          <p className="mt-3 text-[13px] text-secondary">Takes a minute. People in your line don't need an account.</p>
        </div>
        <div className="relative hidden h-[520px] lg:block" aria-hidden="true">
          {cards.map((c, i) => (
            <div
              key={i}
              className="lt-card absolute flex w-[250px] flex-col rounded-[22px] p-5"
              style={{ background: c.s.bg, color: c.s.ink, transform: `rotate(${c.rot}deg)`, left: c.x, top: c.y, zIndex: i } as CSSProperties}
            >
              <p className="text-[34px] font-semibold leading-[0.95] tracking-[-0.04em]">{c.title}</p>
              <p className="mt-2 text-[13px] font-medium opacity-80">with {c.host}</p>
              <ol className="mt-8 space-y-1.5 rounded-[14px] bg-white p-3 text-[14px] text-ink">
                {c.line.slice(0, 3).map((n, j) => (
                  <li key={n} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="w-8 font-semibold tabular-nums text-secondary">{['1st', '2nd', '3rd'][j]}</span>{n}</span>
                    {j === 0 && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">Next</span>}
                  </li>
                ))}
                {c.line.length > 3 && <li className="text-[12px] text-secondary">+{c.line.length - 3} more</li>}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FLIP_SETS: [string, string, string, string][] = [
  ['Skip', 'the', 'DMs', '!'],
  ['Get', 'in', 'line', '→'],
  ['Your', 'time', 'one', 'link'],
]
function HeroFlip({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  const [k, setK] = useState(0)
  useEffect(() => { if (reduced()) return; const t = setInterval(() => setK((v) => v + 1), 2600); return () => clearInterval(t) }, [])
  const tiles: { s: Swatch; rot: number; align: string; turn: boolean }[] = [
    { s: PALETTE[1], rot: -1.2, align: 'items-start justify-start', turn: true },
    { s: PALETTE[3], rot: 1.5, align: 'items-start justify-end', turn: false },
    { s: PALETTE[5], rot: 0.8, align: 'items-end justify-end', turn: true },
    { s: PALETTE[14], rot: -1, align: 'items-end justify-start', turn: false },
  ]
  return (
    <section className="relative overflow-hidden bg-strong text-white">
      <Nav onStart={onStart} dark />
      <div className="container-app grid grid-cols-1 items-center gap-12 pb-20 pt-8 lg:grid-cols-[1fr_minmax(0,460px)] lg:pt-14">
        <div className="mx-auto grid w-full max-w-[520px] grid-cols-2 gap-3 [perspective:1200px]" aria-hidden="true">
          {tiles.map((t, i) => {
            const set = FLIP_SETS[k % FLIP_SETS.length]
            const prev = FLIP_SETS[(k + FLIP_SETS.length - 1) % FLIP_SETS.length]
            return (
              <div key={i} className="relative aspect-[4/5]" style={{ transform: `rotate(${t.rot}deg)` }}>
                <div className="flip-card absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `rotateY(${k * 180}deg)`, transitionDelay: `${i * 90}ms` }}>
                  {[0, 1].map((face) => (
                    <div key={face} className={`absolute inset-0 flex rounded-[22px] p-5 [backface-visibility:hidden] ${t.align}`} style={{ background: t.s.bg, color: t.s.ink, transform: face ? 'rotateY(180deg)' : undefined }}>
                      <span className={`text-[clamp(44px,7vw,92px)] font-semibold leading-[0.85] tracking-[-0.05em] ${t.turn ? '[writing-mode:vertical-rl] rotate-180' : ''}`}>
                        {(face === (k % 2) ? set : prev)[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div>
          <h1 className="text-[clamp(38px,4.6vw,60px)] font-semibold leading-[1.02] tracking-[-0.045em] [text-wrap:balance]">A line for your time. One link to share.</h1>
          <p className="mt-5 text-[18px] leading-[1.5] text-white/70">People take a ticket in seconds and always see their place. You reach them in WhatsApp, Telegram, Signal, a call or email — whatever they chose.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <button type="button" onClick={onStart} disabled={busy} className="inline-flex min-h-[52px] items-center gap-2.5 rounded-[8px] bg-accent px-6 text-[17px] font-medium text-on-accent disabled:opacity-60"><Icon name="person" bare />Get your link</button>
            <button type="button" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' })} className="min-h-[52px] rounded-[8px] px-5 text-[17px] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] hover:text-white">How it works</button>
          </div>
        </div>
      </div>
    </section>
  )
}


function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.45 })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return [ref, seen] as const
}

function ClaimArt({ seen }: { seen: boolean }) {
  const slug = 'omar-haddad'
  const [n, setN] = useState(reduced() ? slug.length : 0)
  useEffect(() => {
    if (!seen || n >= slug.length) return
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 450 : 70)
    return () => clearTimeout(t)
  }, [seen, n])
  const done = n >= slug.length
  return (
    <div className="w-full max-w-[300px]">
      <div className={`flex items-center rounded-[14px] bg-white px-4 py-3.5 text-[15px] transition-shadow duration-300 ${done ? 'shadow-[0_0_0_2px_rgb(var(--c-success)),0_10px_30px_rgba(0,0,0,0.08)]' : 'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_10px_30px_rgba(0,0,0,0.06)]'}`}>
        <span className="text-secondary">{LINK_HOST}</span>
        <span className="font-medium text-ink">{slug.slice(0, n)}</span>
        {!done && <span className="ml-px inline-block h-[18px] w-[1.5px] animate-pulse bg-ink" aria-hidden="true" />}
        <Icon name="circleCheck" size={18} className={`ml-auto text-success transition-all duration-300 ${done ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
      </div>
      <p className={`mt-3 flex items-center gap-1.5 pl-1 text-[13px] font-medium text-success transition-opacity duration-300 ${done ? 'opacity-100' : 'opacity-0'}`}>It's yours</p>
    </div>
  )
}

function TicketArt({ seen }: { seen: boolean }) {
  const [place, setPlace] = useState(3)
  useEffect(() => {
    if (!seen || reduced()) return
    const t = setTimeout(() => setPlace(2), 3200)
    return () => clearTimeout(t)
  }, [seen])
  if (!seen) return null
  return (
    <div className="how-ticket w-[380px] shrink-0">
      <Ticket
        number={12}
        place={place}
        movedUp={place === 2}
        waited="4 min"
        requester={{ first: 'Emily', full: 'Emily Parker' }}
        host={{ first: 'Omar', full: 'Omar Haddad', slug: 'omar-haddad' }}
        topic="Mock interview for a frontend role"
        contact={{ type: 'WhatsApp', display: '+1 415 ••• 2290' }}
        takenAt={{ time: '10:42 AM', date: 'Fri 20 Nov' }}
      />
    </div>
  )
}

function ReachArt({ seen }: { seen: boolean }) {
  const rows = [
    { name: 'Emily Parker', topic: 'Mock interview', app: 'WhatsApp' },
    { name: 'Kenji Tanaka', topic: 'Logo review', app: 'Telegram' },
    { name: 'Ryan Brooks', topic: 'Is this offer fair?', app: 'Signal' },
  ]
  return (
    <ol className="w-full max-w-[320px] space-y-2">
      {rows.map((r, i) => (
        <li
          key={r.name}
          className={`how-row flex items-center gap-3 rounded-[16px] bg-white p-2.5 pr-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] ${i > 0 ? 'opacity-70' : ''}`}
          style={{ transitionDelay: `${i * 90}ms`, ...(seen ? {} : { opacity: 0, transform: 'translateY(12px)' }) }}
        >
          <AppMark app={r.app} size={40} />
          <div className="min-w-0 flex-1">
            <p className="[overflow-wrap:anywhere] text-[15px] font-semibold leading-tight text-ink">{r.name}</p>
            <p className="[overflow-wrap:anywhere] text-[13px] leading-tight text-secondary">{r.topic}</p>
          </div>
          {i === 0
            ? <span className="rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-canvas">Reach</span>
            : <span className="text-[13px] font-semibold tabular-nums text-secondary">{['', '2nd', '3rd'][i]}</span>}
        </li>
      ))}
    </ol>
  )
}

function HowCard({ title, body, art, stage = '', live = false }: { title: string; body: string; art: (seen: boolean) => ReactNode; stage?: string; live?: boolean }) {
  const [ref, seen] = useSeen<HTMLDivElement>()
  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.12)]">
      <div ref={ref} className={`how-stage relative m-2 flex h-[360px] items-center justify-center overflow-hidden rounded-[22px] px-6 ${stage}`} aria-hidden={live ? undefined : true}>
        {art(seen)}
      </div>
      <div className="px-7 pb-7 pt-5">
        <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
        <p className="mt-2 text-[15px] leading-[1.5] text-secondary [text-wrap:pretty]">{body}</p>
      </div>
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="container-app scroll-mt-6 py-20 sm:py-28">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="max-w-[560px] text-[clamp(32px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">A line, not a calendar.</h2>
        <p className="max-w-[380px] text-[17px] leading-[1.5] text-secondary md:pb-1.5">No slots to manage, no back-and-forth. Whoever asked first is helped first.</p>
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <HowCard
          title="Claim your link"
          body="Your name and what people can ask you about. That is the whole setup."
          art={(seen) => <ClaimArt seen={seen} />}
        />
        <HowCard
          title="People take a ticket"
          body="Four quick questions. They see their place right away, and it updates as the line moves."
          stage="how-stage-ticket"
          live
          art={(seen) => <TicketArt seen={seen} />}
        />
        <HowCard
          title="Reach them where they are"
          body="Next up is always on top. One tap opens their chat in the app they picked. Done moves the line."
          art={(seen) => <ReachArt seen={seen} />}
        />
      </div>
    </section>
  )
}

function WhoFor() {
  const who: { s: Swatch; t: string; d: string }[] = [
    { s: PALETTE[5], t: 'Mentors', d: 'Career questions, CV and portfolio reviews.' },
    { s: PALETTE[9], t: 'Creators', d: 'Answer your audience in order, not by who shouts loudest.' },
    { s: PALETTE[8], t: 'Teachers', d: 'Office hours that don’t live in fifty threads.' },
    { s: PALETTE[13], t: 'Founders', d: 'Feedback calls, investor intros, open office hours.' },
  ]
  return (
    <section id="who" className="scroll-mt-6 bg-white py-20 sm:py-28">
      <div className="container-app">
        <h2 className="max-w-[640px] text-[clamp(32px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">For anyone people ask for a minute.</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {who.map((w, i) => (
            <div key={w.t} className="lt-card flex min-h-[180px] flex-col justify-between gap-8 rounded-[22px] p-6 sm:aspect-[4/5] sm:min-h-0" style={{ background: w.s.bg, color: w.s.ink, transform: `rotate(${[-1.5, 1, -0.5, 1.5][i]}deg)` }}>
              <p className="text-[34px] font-semibold leading-[0.95] tracking-[-0.045em] sm:text-[40px]">{w.t}</p>
              <p className="text-[15px] font-medium leading-[1.4] opacity-90">{w.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const qs = [
    ['Do people need an account?', 'No. Only you sign in. People in your line just fill in four fields and keep their ticket link.'],
    ['How do I reach people?', 'Each person picks WhatsApp, Telegram, Signal, phone or email. Reach opens that app with their details. Orderly never messages anyone for you.'],
    ['What does it cost?', 'It’s free while in beta.'],
    ['Can people see who else is in line?', 'No. They see their place and how many are ahead, never names or contacts.'],
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="container-app scroll-mt-6 py-20 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,680px)] lg:gap-16">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="text-[clamp(32px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">Questions</h2>
        </div>
        <ul className="space-y-3">
          {qs.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <li key={q} className={`faq-item rounded-[20px] bg-white ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-[64px] w-full items-center justify-between gap-6 rounded-[20px] px-6 py-4 text-left text-[18px] font-medium tracking-[-0.01em] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {q}
                    <span className="faq-icon relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full" aria-hidden="true">
                      <span className="absolute h-[1.5px] w-3 rounded-full bg-current" />
                      <span className="faq-icon-v absolute h-3 w-[1.5px] rounded-full bg-current" />
                    </span>
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq-panel" inert={!isOpen || undefined}>
                  <div className="overflow-hidden">
                    <p className="max-w-[560px] px-6 pb-6 text-[16px] leading-[1.6] text-secondary [text-wrap:pretty]">{a}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function FinalCta({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <footer className="container-app pb-16">
      <div className="ft-ticket grid text-ink md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ft-pass relative bg-white px-8 py-14 sm:px-12 sm:py-16">
          <h2 className="max-w-[560px] text-[clamp(32px,4.4vw,56px)] font-semibold leading-[1.02] tracking-[-0.045em] [text-wrap:balance]">Your line is one link away.</h2>
          <p className="mt-4 max-w-[440px] text-[17px] leading-[1.5] text-secondary">Set it up in a minute. Share it wherever people usually message you.</p>
          <button type="button" onClick={onStart} disabled={busy} className="mt-8 inline-flex min-h-[52px] items-center gap-2.5 rounded-[8px] bg-ink px-6 text-[17px] font-medium text-canvas disabled:opacity-60">
            <Icon name="person" bare />Get your link
          </button>
          <div className="ft-perf" aria-hidden="true" />
        </div>
        <div className="ft-stub flex flex-col justify-between gap-10 bg-white px-8 py-10 sm:px-10">
          <a href="/" className="self-start text-ink no-underline" aria-label="Orderly home"><Lockup className="[--logo-size:20px]" /></a>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="t-label text-secondary">Your link</p>
              <p className="mt-1 [overflow-wrap:anywhere] text-[15px]"><span className="text-secondary">{LINK_HOST}</span><span className="font-medium">your-name</span></p>
            </div>
            <QRish ink={OX} />
          </div>
        </div>
      </div>
    </footer>
  )
}


export function Landing({ onSignedIn }: { onSignedIn: () => void }) {
  const v = useLanding()
  const [busy, setBusy] = useState(false)
  const start = () => { if (busy) return; setBusy(true); setTimeout(onSignedIn, 900) }
  useEffect(() => { window.scrollTo(0, 0) }, [v])
  return (
    <div className="landing min-h-dvh bg-canvas">
      {v !== 'C' && <Nav onStart={start} />}
      <main>
        {v === 'A' && <HeroFan onStart={start} busy={busy} />}
        {v === 'B' && <HeroClaim onStart={start} busy={busy} />}
        {v === 'C' && <HeroFlip onStart={start} busy={busy} />}
        <HowItWorks />
        <WhoFor />
        <Faq />
        <FinalCta onStart={start} busy={busy} />
      </main>
    </div>
  )
}
