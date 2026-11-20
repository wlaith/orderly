import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { Ticket, type PresetKey, type TicketStatus } from '../components/Ticket'
import { usePresets } from '../accent'
import { go } from '../lib/router'
import { T, reducedMotion, setSlow, useSlow, withViewTransition } from '../lib/motion'


type Id = 'print' | 'light' | 'step' | 'next' | 'reach' | 'flip' | 'paper' | 'leave' | 'done' | 'handoff'

const MOMENTS: { id: Id; title: string; says: string; how: string; spec: string; action?: string }[] = [
  { id: 'print', title: 'Print', says: 'You have a ticket.', how: 'It feeds out of a slot in three short pulls and settles, then the QR develops corner to corner. It feels issued, not loaded.', spec: '1.25 s · 3 pulls + settle · QR at 0.8 s', action: 'Print a ticket' },
  { id: 'light', title: 'Light and press', says: 'This is a thing you hold.', how: 'A soft light follows your pointer across the paper and the card tilts with it. Press and it sinks slightly, like card stock. On touch you get the press.', spec: 'tilt ±6° · soft-light sheen · press 98%' },
  { id: 'step', title: 'Moved up', says: 'The line moved, and you with it.', how: 'The ticket steps forward, the numbers roll over, the band catches the light and your place pops.', spec: '760 ms · lift 16 px · spring back', action: 'Move up one' },
  { id: 'next', title: "You're next", says: 'Get ready.', how: 'A slow float, 5 px up and down. It reads as ready without a red badge or a sound.', spec: '3.6 s loop · stops on any other state', action: 'Make me next' },
  { id: 'reach', title: 'Reaching you', says: 'Check your phone now.', how: 'A phone-style buzz now and then, every few seconds, while a pulse runs from the host to you along the route and the host’s dot ripples. Android phones get a real vibration.', spec: '680 ms buzz every 4 s, 1.5 s pulse loop', action: 'Host reaches out' },
  { id: 'flip', title: 'Flip for the QR', says: 'Take it to another phone.', how: 'Tap the QR and the ticket turns over to a big code. Back or Esc turns it back, and focus follows the turn.', spec: '860 ms spring · QR scales in at 260 ms', action: 'Flip the ticket' },
  { id: 'paper', title: 'Paper colour', says: 'Your choice landed.', how: 'The new paper wipes out from the swatch you tapped instead of fading, so the change has a source.', spec: '640 ms circle wipe · View Transitions', action: 'Change colour' },
  { id: 'leave', title: 'Leave and undo', says: 'You’re out, and you can come back.', how: 'The colour drains and the ticket steps back out of line, then a LEFT stamp. Undo brings it back up with a small hop.', spec: '620 ms out · 640 ms back', action: 'Leave / undo' },
  { id: 'done', title: 'Done', says: 'That’s finished.', how: 'The perforation unzips, the stub drops off its corner, the pass lifts as the weight goes, the space closes and the DONE stamp lands with a small thud.', spec: '240 ms zip · 780 ms tear · 820 ms settle', action: 'Close the ticket' },
  { id: 'handoff', title: 'Hand-off (host side)', says: 'On to the next person.', how: 'On Your line, Done slides the ticket out to the right and the next one grows from its row into Next up. Undo morphs it back.', spec: '560 ms out · 520 ms morph', action: 'Open Your line' },
]

const SAMPLE = {
  number: 12,
  waited: '6 min',
  requester: { first: 'Lina', full: 'Lina Khoury' },
  host: { first: 'Omar', full: 'Omar Haddad', slug: 'omar-haddad' },
  topic: 'Review my CV before Sunday’s interview',
  contact: { type: 'WhatsApp' as const, display: '+962 79 ••• 4512' },
  takenAt: { time: '10:42 AM', date: 'Fri 20 Nov' },
}

export function MotionLab() {
  const presets = usePresets()
  const keys = Object.keys(presets) as PresetKey[]
  const [place, setPlace] = useState(4)
  const [status, setStatus] = useState<TicketStatus>('waiting')
  const [movedUp, setMovedUp] = useState(false)
  const [issueKey, setIssueKey] = useState(0)
  const [preset, setPreset] = useState<PresetKey>('a')
  const [flipped, setFlipped] = useState(false)
  const [active, setActive] = useState<Id | null>('print')
  const [playing, setPlaying] = useState(false)
  const slow = useSlow()
  const timers = useRef<number[]>([])
  const muT = useRef<number | undefined>(undefined)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    setSlow(1)
  }, [])

  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms))
  const stop = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPlaying(false)
  }

  const fresh = () => {
    setStatus('waiting')
    setFlipped(false)
    setMovedUp(false)
    setIssueKey((k) => k + 1)
  }
  const moveUp = (to?: number) => {
    setStatus('waiting')
    setFlipped(false)
    setPlace((p) => (to ?? (p <= 1 ? 4 : p - 1)))
    setMovedUp(true)
    window.clearTimeout(muT.current)
    muT.current = window.setTimeout(() => setMovedUp(false), T(2400))
  }
  const paper = (originFromEl?: HTMLElement | null) => {
    const tk = document.querySelector<HTMLElement>('.tk-flipper')?.getBoundingClientRect()
    const o = originFromEl?.getBoundingClientRect()
    const origin = tk ? (o ? { x: o.left + o.width / 2 - tk.left, y: o.top + o.height / 2 - tk.top } : { x: tk.width, y: tk.height }) : undefined
    const next = keys[(keys.indexOf(preset) + 1) % keys.length]
    withViewTransition(() => setPreset(next), { origin, kind: 'paper' })
  }

  const run = (id: Id, el?: HTMLElement | null) => {
    setActive(id)
    switch (id) {
      case 'print':
        fresh()
        break
      case 'light':
        stage.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        break
      case 'step':
        if (status === 'done' || status === 'left') fresh()
        moveUp(place <= 1 ? 4 : undefined)
        break
      case 'next':
        if (status === 'done' || status === 'left') fresh()
        moveUp(place === 1 ? 2 : 1)
        if (place === 1) later(T(900), () => moveUp(1))
        break
      case 'reach':
        setFlipped(false)
        if (status === 'reaching') {
          setStatus('waiting')
          later(T(120), () => setStatus('reaching'))
        } else setStatus('reaching')
        break
      case 'flip':
        if (status === 'done') fresh()
        setFlipped((f) => !f)
        break
      case 'paper':
        setFlipped(false)
        paper(el)
        break
      case 'leave':
        setFlipped(false)
        if (status === 'done') fresh()
        setStatus((s) => (s === 'left' ? 'waiting' : 'left'))
        break
      case 'done':
        setFlipped(false)
        if (status === 'done') {
          fresh()
          later(T(1500), () => setStatus('done'))
        } else setStatus('done')
        break
      case 'handoff':
        go('dashboard')
        break
    }
  }

  const playAll = () => {
    stop()
    setPlaying(true)
    setPlace(4)
    setPreset('a')
    let t = 0
    const at = (ms: number, f: () => void) => later(T((t += ms)), f)
    at(0, () => run('print'))
    at(1700, () => run('step'))
    at(1400, () => run('step'))
    at(1400, () => run('next'))
    at(2600, () => run('reach'))
    at(3000, () => run('flip'))
    at(2400, () => run('flip'))
    at(1400, () => run('paper'))
    at(1600, () => run('done'))
    at(2600, () => {
      setActive(null)
      setPlaying(false)
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader width={1100} />
      <main className="container-app flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-[1100px]">
          <p className="t-label text-secondary">Ticket · interaction design</p>
          <h1 className="text-poster mt-2 text-ink">Ticket motion</h1>
          <p className="mt-3 max-w-[620px] text-[17px] text-secondary [text-wrap:pretty]">
            Ten moments in a ticket's life. Each one tells the visitor what changed before they read a word, then gets out of the way. Every one runs on the real ticket.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button onClick={playing ? stop : playAll}>
              <Icon name={playing ? 'xmark' : 'play'} />
              {playing ? 'Stop' : 'Play the whole story'}
            </Button>
            <button
              type="button"
              role="switch"
              aria-checked={slow > 1}
              onClick={() => setSlow(slow > 1 ? 1 : 4)}
              className="inline-flex min-h-touch items-center gap-3 rounded-[var(--r-btn)] px-3 text-[15px] text-ink hover:bg-ink/5"
            >
              <span className={`relative h-[26px] w-[44px] rounded-full transition-colors ${slow > 1 ? 'bg-accent' : 'bg-ink/15'}`} aria-hidden="true">
                <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200 ${slow > 1 ? 'left-[21px]' : 'left-[3px]'}`} />
              </span>
              Slow motion ×4
            </button>
            <Button
              variant="ghost"
              className="text-secondary"
              onClick={() => {
                stop()
                setPlace(4)
                setPreset('a')
                setActive('print')
                fresh()
              }}
            >
              <Icon name="undo" />
              Reset
            </Button>
          </div>
          {reducedMotion() && (
            <p className="mt-3 text-body-sm text-secondary" role="note">
              Your device asks for reduced motion, so the states change here without travelling. That's the behaviour in the product too.
            </p>
          )}

          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[440px_minmax(0,1fr)]">
            {/* Stage */}
            <div ref={stage} className="lg:sticky lg:top-24">
              <div className="flex min-h-[720px] flex-col items-center justify-start rounded-[28px] bg-surface-warm px-6 pb-10 pt-12">
                <Ticket
                  {...SAMPLE}
                  place={place}
                  status={status}
                  movedUp={movedUp}
                  preset={preset}
                  issueKey={issueKey}
                  flipped={flipped}
                  onFlippedChange={(f) => {
                    setFlipped(f)
                    setActive('flip')
                  }}
                />
              </div>
              <p className="mt-3 text-center text-body-sm text-secondary" aria-live="polite">
                {active ? MOMENTS.find((m) => m.id === active)!.title : 'Pick a moment'} · hover, press or tap the QR to try it by hand
              </p>
            </div>

            {/* Moments */}
            <ol className="space-y-3">
              {MOMENTS.map((m, i) => {
                const on = active === m.id
                return (
                  <li key={m.id} className={`card relative rounded-[var(--r-card)] p-5 transition-shadow sm:p-6 ${on ? 'motion-on' : ''}`}>
                    <div className="flex items-start gap-4">
                      <span className="display w-7 shrink-0 pt-0.5 text-[22px] leading-none tabular-nums text-ink/35">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h2 className="text-[19px] font-semibold tracking-[-0.2px] text-ink">{m.title}</h2>
                          <p className="font-mono text-[12px] text-secondary">{m.spec}</p>
                        </div>
                        <p className="mt-1 text-[15px] font-medium text-ink/80">“{m.says}”</p>
                        <p className="mt-2 text-[15px] leading-relaxed text-secondary [text-wrap:pretty]">{m.how}</p>
                        {m.action ? (
                          <Button variant="quiet" className="mt-4" onClick={(e) => run(m.id, e.currentTarget)}>
                            <Icon name={m.id === 'handoff' ? 'arrowRight' : 'play'} />
                            {m.id === 'leave' && status === 'left' ? 'Undo, back in line' : m.action}
                          </Button>
                        ) : (
                          <p className="mt-4 inline-flex items-center gap-2 text-[14px] text-secondary">
                            <Icon name="hand" />
                            Try it on the ticket
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
