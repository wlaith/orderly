import qrcode from 'qrcode-generator'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { nav } from '../lib/router'


export type ContactType = 'WhatsApp' | 'Signal' | 'Telegram' | 'Phone' | 'Email'
export type TicketStatus = 'waiting' | 'reaching' | 'done' | 'left'

export { PRESETS } from '../theme'
import { type PresetKey } from '../theme'
import { usePresets } from '../accent'
import { T, haptic, reducedMotion } from '../lib/motion'
export type { PresetKey }


export interface TicketProps {
  number: number
  place: number
  waited: string
  requester: { first: string; full: string }
  host: { first: string; full: string; slug: string }
  topic: string
  contact: { type: ContactType; display: string }
  takenAt: { time: string; date: string }
  status?: TicketStatus
  preset?: PresetKey
  movedUp?: boolean
  issueKey?: number
  flipped?: boolean
  onFlippedChange?: (flipped: boolean) => void
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}
const pad3 = (n: number) => String(n).padStart(3, '0')

type Beat = 'print' | 'step' | 'buzz' | 'settle' | 'rejoin'
const BEAT_CLASS: Record<Beat, string> = { print: 'beat-print', step: 'beat-step', buzz: 'beat-buzz', settle: 'beat-settle', rejoin: 'beat-rejoin' }

export function Ticket({
  number,
  place,
  waited,
  requester,
  host,
  topic,
  contact,
  takenAt,
  status = 'waiting',
  preset = 'a',
  movedUp,
  issueKey = 0,
  flipped: flippedProp,
  onFlippedChange,
}: TicketProps) {
  const pr = usePresets()[preset]
  const inactive = status === 'done' || status === 'left'
  const ahead = Math.max(0, place - 1)
  const link = `${window.location.origin}/t/${nav.token ?? ''}`

  const [beat, setBeat] = useState<Beat | null>(status === 'done' ? null : 'print')
  const beatT = useRef<number | undefined>(undefined)
  const busyUntil = useRef(0)
  const play = (b: Beat, ms: number) => {
    const wait = Math.max(0, busyUntil.current - Date.now())
    const go = () => {
      window.clearTimeout(beatT.current)
      setBeat(null)
      requestAnimationFrame(() => setBeat(b))
      beatT.current = window.setTimeout(() => setBeat(null), T(ms) + 40)
    }
    if (b === 'print') busyUntil.current = Date.now() + T(ms)
    if (wait && b !== 'print') window.setTimeout(go, wait)
    else go()
  }
  useEffect(() => {
    if (status !== 'done') {
      play('print', 1250)
      haptic(8)
    }
    return () => window.clearTimeout(beatT.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueKey])
  useEffect(() => {
    if (movedUp) {
      play('step', 760)
      haptic(12)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movedUp, place])

  const [stub, setStub] = useState<'attached' | 'tearing' | 'gone'>('attached')
  const [collapse, setCollapse] = useState(0)
  const stubRef = useRef<HTMLDivElement>(null)
  const prevStatus = useRef(status)
  const artRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = artRef.current
    if (!el) return
    const set = () => {
      const top = el.querySelector<HTMLElement>('.ticket-top')
      el.style.setProperty('--tk-h', `${el.offsetHeight}px`)
      el.style.setProperty('--tk-top', `${top?.offsetHeight ?? 0}px`)
    }
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [issueKey])
  useEffect(() => {
    const was = prevStatus.current
    prevStatus.current = status
    if (status !== 'done') {
      setStub('attached')
      setCollapse(0)
    }
    if (status === 'reaching' && was !== 'reaching') play('buzz', 680)
    if (was === 'left' && status === 'waiting') play('rejoin', 640)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])
  useEffect(() => {
    if (status !== 'done') return
    setStub('tearing')
    const h = stubRef.current?.offsetHeight ?? 0
    const end = window.setTimeout(() => {
      setStub('gone')
      if (!reducedMotion()) setCollapse(h)
      play('settle', 820)
      window.setTimeout(() => haptic(22), T(300))
    }, T(1020))
    return () => window.clearTimeout(end)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])
  useEffect(() => {
    if (status !== 'reaching') return
    const buzz = () => haptic([18, 70, 18])
    buzz()
    const id = window.setInterval(buzz, 4000)
    return () => window.clearInterval(id)
  }, [status])

  const [flipSelf, setFlipSelf] = useState(false)
  const flipped = (flippedProp ?? flipSelf)
  const setFlipped = (f: boolean) => {
    if (flippedProp === undefined) setFlipSelf(f)
    onFlippedChange?.(f)
  }
  const qrBtn = useRef<HTMLButtonElement>(null)
  const backBtn = useRef<HTMLButtonElement>(null)
  const firstFlip = useRef(true)
  useEffect(() => {
    if (firstFlip.current) {
      firstFlip.current = false
      return
    }
    haptic(10)
    const t = window.setTimeout(() => (flipped ? backBtn : qrBtn).current?.focus({ preventScroll: true }), T(420))
    return () => window.clearTimeout(t)
  }, [flipped])

  const flipRef = useRef<HTMLDivElement>(null)
  const handle = useHandle(flipRef, artRef, flipped)
  const notch = 14

  const pill =
    status === 'reaching'
      ? { text: 'Reaching you', live: true }
      : status === 'done'
        ? { text: 'Done' }
        : status === 'left'
          ? { text: 'Left' }
          : movedUp
            ? { text: 'Moved up' }
            : ahead === 0
              ? { text: "You're next" }
              : { text: 'In line' }

  return (
    <div className="tk-stage ticket-perspective relative w-full max-w-[380px]" data-printing={beat === 'print' || undefined} {...handle.handlers}>
      {beat === 'print' && <span className="tk-slot" aria-hidden="true" />}
      <div className={`tk-motion ${beat ? BEAT_CLASS[beat] : ''}`} data-status={status}>
        {/* The view-transition name sits here, not on the flipper: it would flatten the flip's 3D */}
        <div className="tk-idle" style={{ viewTransitionName: 'doorin-ticket' }} data-next={status === 'waiting' && ahead === 0 && !movedUp ? '' : undefined}>
          <div
            ref={flipRef}
            className="tk-flipper relative"
            data-flipped={flipped || undefined}
            style={
              {
                ['--paper' as string]: pr.paper,
                ['--t-ink' as string]: pr.ink,
                ['--t-band' as string]: pr.band,
                ['--t-band-ink' as string]: pr.bandInk,
                ['--t-pill' as string]: pr.pill,
                ['--t-pill-ink' as string]: pr.pillInk,
                ['--t-code' as string]: pr.code,
                ['--t-code-ink' as string]: pr.codeInk,
                ['--code-pad' as string]: pr.code === 'transparent' ? '0px' : '10px 12px',
              } as CSSProperties
            }
          >
            <article
              ref={artRef}
              data-preset={preset}
              key={issueKey}
              inert={flipped || undefined}
              aria-label={`Ticket ${pad3(number)} in ${host.first}'s line`}
              className="tk-front ticket-tilt relative text-[var(--t-ink)]"
            >
              {/* ───────── Large part: the pass ───────── */}
              <div
                className={`ticket-paper ticket-top relative rounded-t-[var(--r-ticket)] px-5 pb-6 pt-5 sm:px-6 ${stub === 'gone' ? 'rounded-b-[var(--r-ticket)]' : ''}`}
                style={stub === 'gone' ? undefined : maskStyle([cut(notch, 'left bottom'), cut(notch, 'right bottom')])}
              >
                {/* Route */}
                <div className="t-label flex items-center gap-2">
                  <span>From</span>
                  <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-current" aria-hidden="true" />
                  <Route marching={status === 'reaching'} />
                  <span className={`route-end relative h-2 w-2 shrink-0 rounded-full bg-current ${status === 'reaching' ? 'is-live' : ''}`} aria-hidden="true" />
                  <span>To</span>
                </div>

                {/* You → Host */}
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                  <div className="min-w-0">
                    <p className="display [overflow-wrap:anywhere] text-[length:var(--t-name,min(44px,11.5vw))] leading-[0.86]">{requester.first}</p>
                    <p className="mt-1.5 [overflow-wrap:anywhere] text-[13px] leading-tight opacity-80">{requester.full}</p>
                  </div>
                  <div className="flex flex-col items-center pt-1 text-center">
                    <span className="font-mono text-[12px] leading-none tabular-nums">{ahead === 0 ? 'none ahead' : `${ahead} ahead`}</span>
                    <span
                      key={pill.text}
                      className={`pill-pop mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--r-chip)] bg-[var(--t-pill)] px-2.5 py-1 text-[12px] font-medium leading-none text-[var(--t-pill-ink)] transition-colors duration-500`}
                    >
                      {pill.live && (
                        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--t-pill-ink)] opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--t-pill-ink)]" />
                        </span>
                      )}
                      {pill.text}
                    </span>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="display [overflow-wrap:anywhere] text-[length:var(--t-name,min(44px,11.5vw))] leading-[0.86]">{host.first}</p>
                    <p className="mt-1.5 [overflow-wrap:anywhere] text-[13px] leading-tight opacity-80">{host.full}</p>
                  </div>
                </div>

                {/* Taken · Contact */}
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="display text-[22px] leading-none">{takenAt.time}</p>
                    <p className="t-label mt-1 !normal-case opacity-80">Taken {takenAt.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="display text-[22px] leading-none">{contact.type}</p>
                    <p className="mt-1 font-mono text-[12px] tabular-nums opacity-80">{contact.display}</p>
                  </div>
                </div>

                {/* Band */}
                <dl className="tk-band relative mt-5 grid grid-cols-4 gap-2 overflow-hidden rounded-[var(--r-band)] bg-[var(--t-band)] px-4 py-3 text-[var(--t-band-ink)] transition-colors duration-500">
                  <BandCell label="Place" value={<Roll value={ordinal(place)} />} />
                  <BandCell label="Ahead" value={<Roll value={String(ahead)} />} />
                  <BandCell label="Waited" value={waited} />
                  <BandCell label="Ticket" value={pad3(number)} />
                </dl>

                {/* About */}
                <div className="mt-5">
                  <p className="t-label opacity-80">About</p>
                  <p className="mt-1 text-[17px] font-medium leading-snug tracking-[-0.2px]">{topic}</p>
                </div>

                {/* Stamp */}
                {inactive && (stub === 'gone' || status === 'left') && (
                  <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center" aria-hidden="true">
                    <span className="stamp display rounded-[var(--r-field)] border-[5px] border-current px-5 pb-1 pt-2 text-[64px] leading-none">
                      {status === 'done' ? 'Done' : 'Left'}
                    </span>
                  </div>
                )}

                {stub !== 'gone' && (
                  <div
                    aria-hidden="true"
                    className={`tk-perf absolute bottom-0 h-[2px] translate-y-1/2 [background-image:radial-gradient(circle,currentColor_1px,transparent_1.3px)] [background-size:7px_2px] opacity-60 ${stub === 'tearing' ? 'perf-zip' : ''}`}
                    style={{ left: notch + 8, right: notch + 8 }}
                  />
                )}
              </div>

              {/* ───────── Small part: the stub ───────── */}
              {stub !== 'gone' && (
                <div
                  ref={stubRef}
                  className={`ticket-paper ticket-stub relative rounded-b-[var(--r-ticket)] px-5 pb-5 pt-5 sm:px-6 ${stub === 'tearing' ? 'stub-tear' : ''}`}
                  style={maskStyle([cut(notch, 'left top'), cut(notch, 'right top')])}
                >
                  <>
                    <div className="flex items-end justify-between gap-4">
                      {/* Place in line: the largest thing on the screen */}
                      <div className="min-w-0">
                        <p className="t-label opacity-80">Your place</p>
                        <p className="tk-place display mt-1 whitespace-nowrap text-[length:var(--t-place,min(104px,26vw))] leading-[0.78]" aria-label={`${ordinal(place)} in line`}>
                          <Roll value={ordinal(place)} />
                        </p>
                      </div>
                      <button
                        ref={qrBtn}
                        type="button"
                        className="tk-qr-btn group relative shrink-0 rounded-[10px]"
                        aria-label="Show a bigger QR code"
                        onClick={() => setFlipped(true)}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <QRCode value={link} />
                        <span className="tk-qr-hint" aria-hidden="true">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M7 1h4v4M5 11H1V7M11 1 7.2 4.8M1 11l3.8-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-4 rounded-[var(--r-band)] bg-[var(--t-band)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="t-label opacity-80">Booked with</p>
                        <p className="display mt-1 [overflow-wrap:anywhere] text-[length:var(--stub-name,26px)] leading-[1.1]">{host.full}</p>
                      </div>
                      <p className="shrink-0 pb-0.5 font-mono text-[12px] tabular-nums opacity-80">No. {pad3(number)}</p>
                    </div>
                  </>
                </div>
              )}
              {/* Where the stub was: closes up gently instead of jumping */}
              {stub === 'gone' && collapse > 0 && (
                <div className="tk-collapse" aria-hidden="true" style={{ ['--h' as string]: `${collapse}px` } as CSSProperties} onAnimationEnd={() => setCollapse(0)} />
              )}
            </article>

            {/* ───────── The back: a big QR to open the ticket on another phone ───────── */}
            <div
              className="tk-back ticket-paper absolute inset-0 flex flex-col items-center justify-center rounded-[var(--r-ticket)] px-6 py-6 text-center text-[var(--t-ink)]"
              inert={!flipped || undefined}
              aria-hidden={!flipped}
              onKeyDown={(e) => e.key === 'Escape' && setFlipped(false)}
            >
              <p className="t-label opacity-80">Ticket No. {pad3(number)}</p>
              <div className="tk-back-qr mt-4">
                <QRCode value={link} size="big" />
              </div>
              <p className="display mt-6 text-[28px] leading-[1.05]">Open it on another phone</p>
              <p className="mt-2 max-w-[270px] text-[14px] leading-snug opacity-85 [text-wrap:balance]">
                Scan to keep your place on the phone where you'll see {host.first}'s message.
              </p>
              <p className="mt-3 font-mono text-[12px] opacity-70">
                {link.replace(/^https?:\/\//, '')}
              </p>
              <button ref={backBtn} type="button" className="tk-btn tk-btn-ghost mt-6" onClick={() => setFlipped(false)} onPointerDown={(e) => e.stopPropagation()}>
                Back to ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useHandle(flipRef: React.RefObject<HTMLDivElement | null>, artRef: React.RefObject<HTMLElement | null>, flipped: boolean) {
  const s = useRef({ rx: 0, ry: 0, pressed: false })
  const fine = typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches && !reducedMotion()
  const compose = () => {
    const el = flipRef.current
    if (!el) return
    const { rx, ry, pressed } = s.current
    const k = flipped ? -1 : 1
    el.style.transform =
      rx || ry || flipped || pressed
        ? `perspective(1100px) rotateX(${(rx * k).toFixed(2)}deg) rotateY(${(ry + (flipped ? 180 : 0)).toFixed(2)}deg) scale(${pressed ? 0.982 : 1})`
        : ''
  }
  const first = useRef(true)
  useEffect(() => {
    const el = flipRef.current
    if (!el) return
    if (first.current) {
      first.current = false
      compose()
      return
    }
    el.dataset.flipping = ''
    compose()
    const t = window.setTimeout(() => delete el.dataset.flipping, T(900))
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped])
  const sheen = (e: PointerEvent<HTMLDivElement>, on: boolean) => {
    const a = artRef.current
    if (!a) return
    const b = a.getBoundingClientRect()
    a.style.setProperty('--mx', `${e.clientX - b.left}px`)
    a.style.setProperty('--my', `${e.clientY - b.top}px`)
    a.style.setProperty('--sheen', on ? '1' : '0')
  }
  return {
    handlers: {
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        if (!fine) return
        const b = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - b.left) / b.width - 0.5
        const py = (e.clientY - b.top) / b.height - 0.5
        s.current.rx = -py * 5
        s.current.ry = px * 6
        compose()
        sheen(e, true)
      },
      onPointerLeave: (e: PointerEvent<HTMLDivElement>) => {
        s.current = { rx: 0, ry: 0, pressed: false }
        compose()
        sheen(e, false)
      },
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        if (reducedMotion() || e.button !== 0) return
        s.current.pressed = true
        compose()
        sheen(e, true)
      },
      onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
        s.current.pressed = false
        compose()
        if (!fine) sheen(e, false)
      },
      onPointerCancel: (e: PointerEvent<HTMLDivElement>) => {
        s.current.pressed = false
        compose()
        sheen(e, false)
      },
    },
  };
}

function BandCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="t-label opacity-80">{label}</dt>
      <dd className="display mt-0.5 whitespace-nowrap text-[length:var(--t-band-val,26px)] leading-none">{value}</dd>
    </div>
  )
}

function Roll({ value }: { value: string }) {
  const [prev, setPrev] = useState<string | null>(null)
  const last = useRef(value)
  useEffect(() => {
    if (last.current !== value) {
      setPrev(last.current)
      last.current = value
      const t = setTimeout(() => setPrev(null), 600)
      return () => clearTimeout(t)
    }
  }, [value])
  return (
    <span className="relative inline-block overflow-hidden align-bottom tabular-nums">
      {prev !== null && (
        <span className="roll-out absolute inset-x-0 top-0" aria-hidden="true">
          {prev}
        </span>
      )}
      <span key={value} className={`inline-block ${prev !== null ? 'roll-in' : ''}`}>
        {value}
      </span>
    </span>
  )
}

export function Route({ marching }: { marching: boolean }) {
  return (
    <span className="relative flex h-5 min-w-0 flex-1 items-center" aria-hidden="true">
      <span className="h-[1.5px] w-full bg-current opacity-70" />
      {/* While the host is reaching you, a pulse travels from them (right) to you (left) */}
      {marching && <span className="route-pulse" />}
    </span>
  )
}


function QRCode({ value, size }: { value: string; size?: 'big' }) {
  const q = qrcode(0, 'M')
  q.addData(value)
  q.make()
  const n = q.getModuleCount()
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
  return (
    <div className={`tk-qr shrink-0 bg-[var(--t-code)] ${size === 'big' ? 'rounded-[16px] p-3' : 'rounded-[10px] p-[7px]'}`} role="img" aria-label="QR code for your ticket link">
      <svg className={`block ${size === 'big' ? 'h-[clamp(150px,48vw,196px)] w-[clamp(150px,48vw,196px)]' : 'h-[clamp(68px,21vw,88px)] w-[clamp(68px,21vw,88px)]'}`} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true">
        <path d={d} fill="var(--t-code-ink)" />
      </svg>
    </div>
  )
}


const cut = (r: number, at: string) => `radial-gradient(circle ${r}px at ${at}, #0000 97%, #000 100%)`
function maskStyle(images: string[]): CSSProperties {
  const image = images.join(', ')
  const n = images.length
  const rep = (v: string) => Array(n).fill(v).join(', ')
  return {
    WebkitMaskImage: image,
    WebkitMaskComposite: rep('source-in'),
    maskImage: image,
    maskComposite: rep('intersect'),
  } as CSSProperties
}
