import { Icon, IconTile, CONTACT_ICON } from '../components/Icon'

import { useEffect, useRef, useState } from 'react'
import { AccountMenu, AppHeader, LineBadge } from '../components/AppHeader'
import { TicketRow, TicketShell } from '../components/TicketShell'

import { CopyButton, ShareButton } from '../components/CopyButton'

import { StatusLine } from '../components/StatusLine'
import { TicketColors } from '../components/TicketColors'
import { LINK_HOST } from '../lib/slug'
import { withViewTransition, haptic } from '../lib/motion'
import { firstName, maskContact, useStore, waitedText, type LineTicket } from '../lib/store'

export function Dashboard({ justCreated, onViewPage, onSignOut }: { justCreated: boolean; onViewPage: () => void; onSignOut: () => void }) {
  const { host, line, tickets, dispatch, now } = useStore()
  const [pendingDone, setPendingDone] = useState<{ id: string; name: string; until: number } | null>(null)
  const [shareNote, setShareNote] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  if (!host) return null
  const url = `${window.location.origin}/${host.slug}`

  const visible = line.filter((t) => t.id !== pendingDone?.id)
  const waiting = visible.length

  const done = (t: LineTicket) => {
    const el = document.querySelector<HTMLElement>(`[data-tid="${t.id}"]`)
    if (el) el.style.viewTransitionName = 'tk-leaving'
    haptic(14)
    withViewTransition(() => {
      if (pendingDone) dispatch({ type: 'set', id: pendingDone.id, state: 'done' })
      window.clearTimeout(timer.current)
      setPendingDone({ id: t.id, name: firstName(t.name), until: Date.now() + 5000 })
      timer.current = window.setTimeout(() => {
        dispatch({ type: 'set', id: t.id, state: 'done' })
        setPendingDone(null)
      }, 5000)
    }, { kind: 'line' })
  }
  const undo = () => {
    window.clearTimeout(timer.current)
    withViewTransition(() => setPendingDone(null), { kind: 'line' })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader
        width={760}
        badge={<LineBadge count={line.length} />}
        right={
          <AccountMenu name={host.name} email={host.email} link={url} onViewPage={onViewPage} onSignOut={onSignOut} />
        }
      />

      <main className="container-app flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-[760px]">
          {/* Title + count */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h1 className="text-poster text-ink">Your line</h1>
            <p className="pb-1.5 text-[17px] text-secondary" aria-live="polite">
              {waiting === 0 ? 'No one waiting' : `${waiting} ${waiting === 1 ? 'person' : 'people'} waiting`}
            </p>
          </div>

          {/* Link */}
          <section aria-label="Your link" className="card link-bar mt-6 p-2 pl-5">
            <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 [overflow-wrap:anywhere] text-[19px] font-medium tracking-[-0.2px]">
                <span className="text-secondary">{LINK_HOST}</span>
                {host.slug}
              </p>
              <div className="flex shrink-0 gap-2 pr-1">
                <CopyButton text={url} />
                <ShareButton url={url} title={`Get in ${firstName(host.name)}'s line`} onFallback={() => setShareNote(true)} />
              </div>
            </div>
          </section>
          <div className="mt-3 min-h-[20px] text-body-sm">
            {shareNote ? (
              <StatusLine tone="success">Link copied. Paste it wherever people usually message you.</StatusLine>
            ) : justCreated && tickets.length === 0 ? (
              <StatusLine tone="success">Your link is ready. Share it, and new tickets show up here.</StatusLine>
            ) : null}
          </div>

          {/* Undo bar sits where the closed ticket was */}
          {pendingDone && <UndoBar name={pendingDone.name} until={pendingDone.until} onUndo={undo} />}

          {/* Line */}
          {waiting === 0 && !pendingDone ? (
            <EmptyLine url={url} slug={host.slug} onShared={() => setShareNote(true)} hostFirst={firstName(host.name)} />
          ) : (
            <ol className="mt-6 space-y-3" aria-label="People in line, oldest first">
              {visible.map((t, i) =>
                i === 0 ? (
                  <NextUp key={t.id} t={t} now={now} onReach={() => dispatch({ type: 'set', id: t.id, state: 'reached' })} onDone={() => done(t)} />
                ) : (
                  <Row key={t.id} t={t} place={i + 1} now={now} />
                ),
              )}
            </ol>
          )}

          <TicketColors />
        </div>
      </main>
    </div>
  );
}

const vt = (id: string) => (`tk-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`)
const seenAt = new Map<string, number>()
const fresh = (t: LineTicket) => {
  if (!seenAt.has(t.id)) seenAt.set(t.id, Date.now())
  return Date.now() - seenAt.get(t.id)! < 700
}

function NextUp({ t, now, onReach, onDone }: { t: LineTicket; now: number; onReach: () => void; onDone: () => void }) {
  const reached = t.state === 'reached'
  const [note, setNote] = useState(false)
  return (
    <li className={`${fresh(t) ? 'row-in' : ''} list-none`} data-tid={t.id} style={{ viewTransitionName: vt(t.id) }}>
      <TicketShell
        label={`Next up, ticket ${String(t.number).padStart(3, '0')}`}
        top={
          <>
            <div className="t-label flex items-center justify-between opacity-90">
              <span>Next, No. {String(t.number).padStart(3, '0')}</span>
              <span className="tabular-nums">Waited {waitedText(t.createdAt, now)}</span>
            </div>
            <p className="display mt-4 text-[30px] leading-[1] [text-wrap:balance]">{t.topic}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm opacity-85">
              <span className="font-semibold">{t.name}</span>
              {t.link && (
                <a href={t.link} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:no-underline">{t.link.replace(/^https?:\/\//, '')}</a>
              )}
              <span>{t.contact.type} {maskContact(t.contact.type, t.contact.value)}</span>
            </p>
          </>
        }
        stub={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => { onReach(); setNote(true) }} className="tk-btn tk-btn-solid">
                <Icon name={CONTACT_ICON[t.contact.type]} size={18} bare />
                {reached ? `Reach again on ${t.contact.type}` : `Reach on ${t.contact.type}`}
              </button>
              <button type="button" onClick={onDone} className="tk-btn tk-btn-ghost">
                <Icon name="circleCheck" size={18} bare />
                Done
              </button>
              {reached && (
                <span className="pop ml-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--t-pill)] px-3 py-1 text-[13px] font-medium">
                  <Icon name="check" size={13} bare />
                  Reached {waitedText(t.reachedAt ?? now, now) === 'just now' ? 'just now' : `${waitedText(t.reachedAt ?? now, now)} ago`}
                </span>
              )}
            </div>
            {note && (
              <p className="fade-in mt-3 text-[13px] opacity-85" role="status">
                {t.contact.type} opens with {firstName(t.name)}'s {t.contact.type === 'Email' ? 'address' : 'number'} and a short hello. {firstName(t.name)}'s ticket now says you're reaching out.
              </p>
            )}
          </>
        }
        stubPadding="px-6 pt-5 pb-5"
      />
    </li>
  );
}

function Row({ t, place, now }: { t: LineTicket; place: number; now: number }) {
  return (
    <li className={`${fresh(t) ? 'row-in' : ''} list-none`} data-tid={t.id} style={{ viewTransitionName: vt(t.id) }}>
      <TicketRow
        stub={<span className="display text-[22px] leading-none opacity-50" aria-label={`${place} in line, ticket ${t.number}`}>{String(t.number).padStart(3, '0')}</span>}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[16px] font-medium leading-snug">{t.topic}</p>
            <p className="mt-1 flex min-w-0 items-center gap-x-4 text-body-sm text-secondary">
              <span className="shrink-0">{t.name}</span>
              {t.link && (
                <a href={t.link} target="_blank" rel="noreferrer" className="min-w-0 [overflow-wrap:anywhere] underline underline-offset-2 hover:no-underline">{t.link.replace(/^https?:\/\//, '')}</a>
              )}
            </p>
          </div>
          <div className="text-right text-body-sm leading-snug text-secondary">
            <p className="tabular-nums">{waitedText(t.createdAt, now)}</p>
            <p>{t.contact.type}</p>
          </div>
        </div>
      </TicketRow>
    </li>
  );
}

function UndoBar({ name, until, onUndo }: { name: string; until: number; onUndo: () => void }) {
  const [left, setLeft] = useState(Math.ceil((until - Date.now()) / 1000))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000))), 250)
    return () => clearInterval(t)
  }, [until])
  return (
    <div style={{ viewTransitionName: 'undo-bar' }} className="undo-toast row-in mt-6 flex items-center justify-between gap-3 rounded-[var(--r-card)] bg-strong px-5 py-3 text-on-strong" role="status">
      <p className="text-[15px]">Closed {name}'s ticket.</p>
      <button type="button" onClick={onUndo} className="undo-btn inline-flex min-h-touch items-center gap-2 rounded-[var(--r-btn)] bg-accent px-4 text-[15px] font-medium text-on-accent hover:bg-accent-deep">
        <Icon name="undo" size={16} bare />
        Undo
        <span className="tabular-nums opacity-70">{left}</span>
      </button>
    </div>
  );
}

function EmptyLine({ url, slug, hostFirst, onShared }: { url: string; slug: string; hostFirst: string; onShared: () => void }) {
  return (
    <div className="panel fade-in mt-8 flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-5"><IconTile name="people" size={56} /></span>
      <p className="display text-[44px] leading-none">No one in line</p>
      <p className="mt-3 max-w-[380px] text-[16px] text-secondary [text-wrap:balance]">
        Share your link where people usually message you. Tickets show up here, oldest first.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <CopyButton text={url} variant="primary" label={`Copy ${LINK_HOST}${slug}`} />
        <ShareButton url={url} title={`Get in ${hostFirst}'s line`} onFallback={onShared} />
      </div>
    </div>
  );
}
