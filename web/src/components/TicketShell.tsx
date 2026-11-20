import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { usePresets } from '../accent'
import { Route } from './Ticket'

type Tone = 'accent' | 'paper'

const cut = (r: number, at: string) => `radial-gradient(circle ${r}px at ${at}, #0000 97%, #000 100%)`
export function cuts(r: number, at: string[]): CSSProperties {
  const img = at.map((a) => cut(r, a)).join(', ')
  const rep = (v: string) => at.map(() => v).join(', ')
  return { WebkitMaskImage: img, WebkitMaskComposite: rep('source-in'), maskImage: img, maskComposite: rep('intersect') } as CSSProperties
}

function useTone(tone: Tone): CSSProperties {
  const pr = usePresets().a
  return tone === 'accent'
    ? ({ ['--paper' as string]: pr.paper, ['--t-ink' as string]: pr.ink, ['--t-band' as string]: pr.band, ['--t-pill' as string]: pr.pill } as CSSProperties)
    : ({ ['--paper' as string]: '#FFFFFF', ['--t-ink' as string]: '#3F000D', ['--t-band' as string]: 'rgba(63,0,13,0.05)', ['--t-pill' as string]: '#FFD8CC' } as CSSProperties)
}

function useSpan<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
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
  }, [])
  return ref
}

export function RouteRow({ from, to, marching = false }: { from?: string; to?: string; marching?: boolean }) {
  return (
    <div className="t-label flex items-center gap-2 opacity-90">
      <span>{from ?? 'From'}</span>
      <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-current" aria-hidden="true" />
      <Route marching={marching} />
      <span className={`route-end relative h-2 w-2 shrink-0 rounded-full bg-current ${marching ? 'is-live' : ''}`} aria-hidden="true" />
      <span>{to ?? 'To'}</span>
    </div>
  )
}

export function TicketShell({ top, stub, tone = 'accent', notch = 12, className = '', padding = 'px-6 pt-5 pb-6', stubPadding = 'px-6 pt-5 pb-6', label }: {
  top: ReactNode; stub?: ReactNode; tone?: Tone; notch?: number; className?: string; padding?: string; stubPadding?: string; label?: string
}) {
  const ref = useSpan<HTMLElement>()
  return (
    <div className={`ticket-tilt-static ${className}`}>
      <article ref={ref} aria-label={label} data-preset={tone === 'accent' ? 'a' : 'paper'} className="relative text-[var(--t-ink)]" style={useTone(tone)}>
        <div className={`ticket-paper ticket-top relative rounded-t-[var(--r-ticket)] ${padding} ${stub ? '' : 'rounded-b-[var(--r-ticket)]'}`} style={stub ? cuts(notch, ['left bottom', 'right bottom']) : undefined}>
          {top}
          {stub && (
            <div aria-hidden="true" className="absolute bottom-0 h-[2px] translate-y-1/2 opacity-50 [background-image:radial-gradient(circle,currentColor_1px,transparent_1.3px)] [background-size:7px_2px]" style={{ left: notch + 8, right: notch + 8 }} />
          )}
        </div>
        {stub && (
          <div className={`ticket-paper ticket-stub rounded-b-[var(--r-ticket)] ${stubPadding}`} style={cuts(notch, ['left top', 'right top'])}>
            {stub}
          </div>
        )}
      </article>
    </div>
  )
}

export function TicketRow({ stub, children, tone = 'paper', notch = 9, stubWidth = 76, className = '' }: {
  stub: ReactNode; children: ReactNode; tone?: Tone; notch?: number; stubWidth?: number; className?: string
}) {
  return (
    <div className={`ticket-tilt-static ${className}`}>
      <article className="relative grid text-[var(--t-ink)]" style={{ ...useTone(tone), gridTemplateColumns: `${stubWidth}px minmax(0,1fr)` }} data-preset={tone === 'accent' ? 'a' : 'paper'}>
        <div className="ticket-paper ticket-row-stub relative flex items-center justify-center rounded-l-[var(--r-card)] py-4" style={cuts(notch, ['right top', 'right bottom'])}>
          {stub}
          <div aria-hidden="true" className="absolute right-0 w-[2px] translate-x-1/2 opacity-40 [background-image:radial-gradient(circle,currentColor_1px,transparent_1.3px)] [background-size:2px_7px]" style={{ top: notch + 6, bottom: notch + 6 }} />
        </div>
        <div className="ticket-paper ticket-row-body rounded-r-[var(--r-card)]" style={cuts(notch, ['left top', 'left bottom'])}>
          {children}
        </div>
      </article>
    </div>
  )
}
