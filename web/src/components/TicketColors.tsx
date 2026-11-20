import { PRESETS } from '../theme'
import { INK, PAPER, autoInk, contrast } from '../accent'
import { firstName, useStore } from '../lib/store'
import { RouteRow, TicketShell } from './TicketShell'
import { StatusLine } from './StatusLine'

const PAPERS: [string, string][] = [
  ['Ticket Red', PRESETS.a.paper], ['Oxblood', INK], ['Tint', '#FFD8CC'], ['White', '#FFFFFF'], ['Deep Teal', '#0E6E62'],
  ['Graphite', '#1D1D1F'], ['Blue', '#0071E3'], ['Indigo', '#5856D6'], ['Pink', '#E0245E'], ['Green', '#248A3D'], ['Sand', '#EFE6D6'],
]
const INKS: [string, string][] = [['Oxblood', INK], ['Paper', PAPER], ['White', '#FFFFFF'], ['Black', '#1D1D1F']]

const same = (a?: string | null, b?: string | null) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase()

export function TicketColors() {
  const { host, setTicketColors } = useStore()
  if (!host) return null
  const color = host.ticketColor ?? null
  const ink = host.ticketInk ?? null
  const paper = color ?? PRESETS.a.paper
  const text = ink ?? autoInk(paper)
  const readable = contrast(paper, text) >= 4.5
  const custom = color !== null || ink !== null

  return (
    <section aria-labelledby="ticket-colors" className="card mt-6 p-5 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
        <div className="min-w-0">
          <h2 id="ticket-colors" className="text-title-sm">Ticket colours</h2>
          <p className="mt-1 text-body-sm text-secondary">People who open your link get their ticket in these colours.</p>

          <Swatches
            label="Ticket"
            options={PAPERS}
            value={paper}
            onPick={(c) => setTicketColors({ color: same(c, PRESETS.a.paper) ? null : c, ink })}
          />
          <Swatches
            label="Text"
            options={INKS}
            value={ink ?? ''}
            auto={{ on: ink === null, onPick: () => setTicketColors({ color, ink: null }), swatch: autoInk(paper) }}
            onPick={(c) => setTicketColors({ color, ink: c })}
            fallback={text}
          />

          <div className="mt-3 min-h-[20px]">
            {!readable && <StatusLine tone="warning">This text is hard to read on that ticket colour. Try a lighter or darker one.</StatusLine>}
          </div>
          {custom && (
            <button type="button" onClick={() => setTicketColors({ color: null, ink: null })} className="mt-1 min-h-touch text-body-sm font-medium text-link hover:underline">
              Back to Ticket Red
            </button>
          )}
        </div>

        <div aria-hidden="true">
          <TicketShell
            notch={10}
            padding="px-4 pt-4 pb-5"
            stubPadding="px-4 pt-4 pb-4"
            top={
              <>
                <RouteRow />
                <div className="mt-2 flex items-start justify-between gap-2">
                  <p className="display [overflow-wrap:anywhere] text-[26px] leading-[0.9]">You</p>
                  <p className="display [overflow-wrap:anywhere] text-[26px] leading-[0.9]">{firstName(host.name)}</p>
                </div>
                <p className="mt-3 rounded-[var(--r-band)] bg-[var(--t-band)] px-3 py-2 text-[13px] font-medium">{host.topic || 'What it is about'}</p>
              </>
            }
            stub={<p className="display text-[48px] leading-[0.8]">1st</p>}
          />
        </div>
      </div>
    </section>
  )
}

function Swatches({ label, options, value, onPick, auto, fallback }: {
  label: string
  options: [string, string][]
  value: string
  onPick: (hex: string) => void
  auto?: { on: boolean; onPick: () => void; swatch: string }
  fallback?: string
}) {
  const known = options.some(([, c]) => same(c, value)) || auto?.on
  const current = value || fallback || '#000000'
  return (
    <div className="mt-5">
      <p className="mb-1.5 text-body-sm font-medium">{label}</p>
      <div role="radiogroup" aria-label={`${label} colour`} className="-ml-1.5 flex flex-wrap items-center">
        {auto && <Dot name="Automatic, picks what reads best" hex={auto.swatch} on={auto.on} onClick={auto.onPick} auto />}
        {options.map(([n, c]) => <Dot key={n} name={n} hex={c} on={!auto?.on && same(c, value)} onClick={() => onPick(c)} />)}
        <label className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-full" title="Any colour">
          <span
            className="grid h-7 w-7 place-items-center rounded-full"
            style={{
              background: 'conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff3b30)',
              boxShadow: !known ? '0 0 0 2px rgb(var(--c-bg)), 0 0 0 4px rgb(var(--c-ink))' : undefined,
            }}
          >
            {!known && <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: current }} />}
          </span>
          <input
            type="color"
            value={current.toLowerCase()}
            onChange={(e) => onPick(e.target.value.toUpperCase())}
            aria-label={`Any ${label.toLowerCase()} colour`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )
}

function Dot({ name, hex, on, onClick, auto }: { name: string; hex: string; on: boolean; onClick: () => void; auto?: boolean }) {
  const tick = autoInk(hex)
  return (
    <button type="button" role="radio" aria-checked={on} aria-label={name} title={name} onClick={onClick} className="grid h-11 w-11 place-items-center rounded-full">
      <span
        className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold"
        style={{ background: hex, color: tick, boxShadow: on ? '0 0 0 2px rgb(var(--c-bg)), 0 0 0 4px rgb(var(--c-ink))' : 'inset 0 0 0 1px rgba(0,0,0,0.12)' }}
      >
        {auto ? 'A' : on && (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}
