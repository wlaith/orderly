import { nav } from '../lib/router'
import { useEffect, useRef, useState } from 'react'
import { AppHeader, PlaceChip } from '../components/AppHeader'
import { Button } from '../components/Button'
import { StatusLine } from '../components/StatusLine'
import { usePresets } from '../accent'
import { Icon } from '../components/Icon'
import { PRESETS, Ticket, ordinal, type PresetKey, type TicketProps, type TicketStatus } from '../components/Ticket'
import { THEME } from '../theme'
import { withViewTransition } from '../lib/motion'
import type { MouseEvent } from 'react'


export interface YoureInLineProps {
  ticket: Omit<TicketProps, 'preset' | 'issueKey' | 'movedUp' | 'status'>
  status: TicketStatus
  movedUp?: boolean
  stale?: boolean
  issueKey?: number
  onLeave?: () => void
  onUndoLeave?: () => void
}

const STORAGE_KEY = `doorin.ticketPreset.${THEME}`

export function YoureInLine({ ticket, status, movedUp, stale, issueKey, onLeave, onUndoLeave }: YoureInLineProps) {
  const presets = usePresets()
  const [preset, setPreset] = useState<PresetKey>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as PresetKey | null
      return v && v in PRESETS ? v : 'a'
    } catch {
      return 'a'
    }
  })
  const choose = (p: PresetKey, e?: MouseEvent) => {
    if (p === preset) return
    const tk = document.querySelector<HTMLElement>('.tk-flipper')?.getBoundingClientRect()
    const origin = e && tk ? { x: e.clientX - tk.left, y: e.clientY - tk.top } : undefined
    withViewTransition(() => setPreset(p), { origin, kind: 'paper' })
    try {
      localStorage.setItem(STORAGE_KEY, p)
    } catch {
      /* per-viewer convenience only */
    }
  }

  useEffect(() => {
    const prev = document.documentElement.style.background
    document.documentElement.style.background = 'rgb(var(--c-bg))'
    return () => {
      document.documentElement.style.background = prev
    }
  }, [])

  const [announce, setAnnounce] = useState('')
  const lastPlace = useRef(ticket.place)
  const lastStatus = useRef(status)
  useEffect(() => {
    if (ticket.place < lastPlace.current) setAnnounce(`You moved up. You're ${ordinal(ticket.place)} in line.`)
    if (status !== lastStatus.current) {
      if (status === 'reaching') setAnnounce(`${ticket.host.first} is reaching out on ${ticket.contact.type}.`)
      if (status === 'done') setAnnounce(`${ticket.host.first} closed your ticket.`)
    }
    lastPlace.current = ticket.place
    lastStatus.current = status
  }, [ticket.place, status, ticket.host.first, ticket.contact.type])

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${nav.token ?? ''}`)
    } catch {
      /* clipboard can be refused; still confirm the intent visually below */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reachLine =
    status === 'reaching'
      ? `${ticket.host.first} is reaching out on ${ticket.contact.type} now. Check your messages.`
      : status === 'done'
        ? `${ticket.host.first} closed your ticket. Thanks for waiting.`
        : `${ticket.host.first} will message you on ${ticket.contact.type}. Keep this link to check your place.`

  return (
    <div className="flex min-h-dvh flex-col bg-surface-warm">
      <AppHeader
        width={380}
        right={
          <PlaceChip
            text={status === 'reaching' ? 'Reaching you now' : status === 'done' ? 'Done' : status === 'left' ? 'Left the line' : ticket.place === 1 ? "You're next" : `You're ${ordinal(ticket.place)}`}
            tone={status === 'reaching' ? 'active' : status === 'done' || status === 'left' ? 'muted' : 'normal'}
          />
        }
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <main className="container-app flex flex-1 flex-col items-center py-8 sm:py-14">
        <h1 className="sr-only">Your ticket</h1>

        <Ticket {...ticket} status={status} movedUp={movedUp} preset={preset} issueKey={issueKey} />

        <div className="mt-8 w-full max-w-[380px] space-y-6">
          <p className="text-center text-body-sm text-secondary [text-wrap:balance]">
            {status === 'left' ? 'You left the line.' : reachLine}
          </p>

          {stale && (
            <div className="flex justify-center">
              <StatusLine tone="info">Last updated 30 s ago, retrying…</StatusLine>
            </div>
          )}

          {/* Ticket colour */}
          <div role="radiogroup" aria-label="Ticket colour" className="flex items-center justify-center gap-1">
            {(Object.keys(presets) as PresetKey[]).map((k) => {
              const on = k === preset
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={presets[k].name}
                  onClick={(e) => choose(k, e)}
                  className="group grid h-11 w-11 place-items-center rounded-full"
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full transition-transform duration-200 group-hover:scale-110 ${on ? 'scale-110' : ''}`}
                    style={{ background: presets[k].paper, boxShadow: on ? '0 0 0 2px rgb(var(--c-bg)), 0 0 0 4px rgb(var(--c-ink))' : 'inset 0 0 0 1px rgb(var(--c-line))', borderRadius: 'var(--r-chip)' }}
                  >
                    {on && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8.5l3.2 3L13 4.5" stroke={presets[k].ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
            <span className="ml-2 w-14 text-body-sm text-secondary" aria-hidden="true">
              {presets[preset].name}
            </span>
          </div>

          {/* P3 */}
          {status !== 'done' && (
            <div className="flex flex-col items-center gap-1">
              {status === 'left' ? (
                <Button variant="quiet" onClick={onUndoLeave}>
                  <Icon name="undo" />
                  Undo, get back in line
                </Button>
              ) : (
                <>
                  <Button variant="quiet" onClick={copy} aria-live="polite">
                    <Icon name={copied ? 'check' : 'copy'} />
                    {copied ? 'Copied' : 'Copy ticket link'}
                  </Button>
                  <Button variant="ghost" className="text-secondary" onClick={onLeave}>
                    <Icon name="signout" />
                    Leave the line
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
