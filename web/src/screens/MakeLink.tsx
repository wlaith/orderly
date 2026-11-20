import { Icon } from '../components/Icon'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AccountMenu, AppHeader } from '../components/AppHeader'

import { Button } from '../components/Button'
import { InlineField, InlineText, type InlineTextHandle } from '../components/InlineField'
import { StatusLine } from '../components/StatusLine'
import { HostCard } from '../components/HostCard'
import { checkSlug, createLink, type Availability } from '../lib/mockApi'
import { LINK_HOST, SLUG_MIN, finalizeSlug, normalizeSlug, slugFromName } from '../lib/slug'


export interface MakeLinkProps {
  host: { name: string; email: string }
  initialSlug?: string
  initialTopic?: string
  saveMode?: 'ok' | 'fail' | 'hang'
  autoSubmit?: boolean
  onCreated?: (host: { slug: string; name: string; topic: string }) => void
  onSignOut?: () => void
}

type Check = { state: 'idle' } | { state: 'checking' } | ({ state: 'done' } & Availability)
type Save = 'idle' | 'saving' | 'failed' | 'saved'

const TOPIC_MAX = 80

export function MakeLink({ host, initialSlug, initialTopic = '', saveMode = 'ok', autoSubmit, onCreated, onSignOut }: MakeLinkProps) {
  const [name, setName] = useState(host.name)
  const [topic, setTopic] = useState(initialTopic)
  const [slug, setSlug] = useState(() => normalizeSlug(initialSlug ?? slugFromName(host.name)).slug)
  const [fixNote, setFixNote] = useState<string | null>(() => fixMessage(initialSlug))
  const [check, setCheck] = useState<Check>({ state: 'idle' })
  const [save, setSave] = useState<Save>('idle')

  const slugRef = useRef<HTMLInputElement>(null)
  const topicRef = useRef<InlineTextHandle>(null)
  const ids = { slug: useId(), notes: useId(), reason: useId() }

  useEffect(() => {
    const s = finalizeSlug(slug)
    if (s.length < SLUG_MIN) {
      setCheck({ state: 'idle' })
      return
    }
    setCheck({ state: 'checking' })
    let alive = true
    const t = setTimeout(async () => {
      const res = await checkSlug(s, name)
      if (alive) setCheck({ state: 'done', ...res })
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  function onSlugInput(raw: string) {
    const res = normalizeSlug(raw)
    setSlug(res.slug)
    setFixNote(res.changed ? fixMessage(raw) : null)
    if (save === 'failed' || save === 'saved') setSave('idle')
  }

  function pickAlternative(alt: string) {
    setSlug(alt)
    setFixNote(null)
    slugRef.current?.focus()
  }

  const finalSlug = finalizeSlug(slug)
  const available = check.state === 'done' && check.status === 'available'
  const taken = check.state === 'done' && check.status === 'taken'
  const reserved = check.state === 'done' && check.status === 'reserved'
  const tooShort = finalSlug.length < SLUG_MIN

  const reason = !name.trim()
    ? 'Add your name to continue.'
    : tooShort || taken || reserved
      ? 'Pick an available link to continue.'
      : !available
        ? `Checking ${LINK_HOST}${finalSlug}…`
        : !topic.trim()
          ? 'Say what people can ask you about to continue.'
          : undefined

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault()
    if (save === 'saving' || reason) return
    setSave('saving')
    try {
      await createLink({ slug: finalSlug, name: name.trim(), topic: topic.trim() }, { fail: saveMode === 'fail', hang: saveMode === 'hang' })
      setSave('saved')
      setTimeout(() => onCreated?.({ slug: finalSlug, name: name.trim(), topic: topic.trim() }), 900)
    } catch {
      setSave('failed')
    }
  }

  useEffect(() => {
    if (!autoSubmit) return
    const t = setTimeout(() => onSubmit(), 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit])

  const firstName = name.trim().split(/\s+/)[0] || ''

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader
        right={
          <AccountMenu name={name.trim() || host.name} email={host.email} onSignOut={onSignOut} />
        }
      />

      {/* Content sits on the optical centre of the viewport on desktop, top-aligned on phones */}
      <main className="container-app flex flex-1 items-start py-10 sm:py-16 lg:items-center lg:pb-28 lg:pt-14">
        <h1 className="sr-only">Make your link</h1>

        <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 xl:gap-24">
          {/* ── The sentence ── */}
          <form onSubmit={onSubmit} noValidate className="min-w-0 max-w-[600px]">
            <div className="text-poster text-ink">
              Hi{' '}
              <InlineField
                label="Your name"
                value={name}
                onChange={setName}
                placeholder="your name"
                autoComplete="name"
                invalid={!name.trim()}
                suffix="."
              />{' '}
              People line up for you at{' '}
              <InlineField
                ref={slugRef}
                id={ids.slug}
                label="Your link"
                status={slugStatusText(check, tooShort)}
                trailing={<SlugIcon check={check} tooShort={tooShort} />}
                prefix={LINK_HOST}
                textCase="normal-case"
                value={slug}
                onChange={onSlugInput}
                placeholder="your-name"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                inputMode="url"
                invalid={taken || reserved}
                describedBy={ids.notes}
              />{' '}
              to ask about
              <InlineText
                ref={topicRef}
                label="What you help with"
                value={topic}
                onChange={setTopic}
                maxLength={TOPIC_MAX}
                placeholder="career advice, code reviews…"
              />
            </div>

            {/* Only what needs saying, right under the sentence */}
            <div id={ids.notes} className="mt-6 space-y-3 empty:hidden" aria-live="polite">
              {tooShort && <StatusLine tone="warning" live="off">Links need at least {SLUG_MIN} characters: letters, numbers or hyphens.</StatusLine>}
              {reserved && <StatusLine tone="warning" live="off">“{finalSlug}” is a word Orderly uses itself. Edit your link.</StatusLine>}
              {taken && <StatusLine tone="warning" live="off">{LINK_HOST}{finalSlug} is taken. Edit it, or use one of these:</StatusLine>}
              {taken && check.alternatives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {check.alternatives.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => pickAlternative(alt)}
                      className="chip min-h-touch px-4 text-button transition-colors"
                    >
                      <span className="sr-only">Use {LINK_HOST}</span>
                      {alt}
                    </button>
                  ))}
                </div>
              )}
              {fixNote && <p className="text-body-sm text-secondary">{fixNote}</p>}
              {topic.length >= TOPIC_MAX * 0.8 && (
                <p className={`text-body-sm tabular-nums ${topic.length >= TOPIC_MAX ? 'text-danger' : 'text-secondary'}`}>
                  {TOPIC_MAX - topic.length} characters left
                </p>
              )}
            </div>

            <div className="mt-10 sm:mt-12">
              <Button
                type="submit"
                size="lg"
                busy={save === 'saving'}
                disabled={!!reason}
                aria-describedby={ids.reason}
                className="group w-full max-w-full sm:w-auto"
              >
                <Icon name="link" />
                Claim {LINK_HOST}
                {finalSlug || 'your-name'}{' '}
                <span aria-hidden="true" className="inline-block transition-transform duration-200 group-enabled:group-hover:translate-x-0.5">
                  →
                </span>
              </Button>
              <div className="mt-3 min-h-[20px] text-body-sm [text-wrap:pretty]" id={ids.reason} aria-live="polite">
                {save === 'failed' ? (
                  <StatusLine tone="warning" live="off">
                    We couldn't save your link. Check your connection and try again.
                  </StatusLine>
                ) : save === 'saved' ? (
                  <StatusLine tone="success" live="off">
                    It's yours. Opening your line…
                  </StatusLine>
                ) : (
                  <p className="text-secondary">{reason ?? "Next you'll see your line. It's empty until you share the link."}</p>
                )}
              </div>
            </div>
          </form>

          {/* ── What people will see ── */}
          <aside aria-label="Preview of your page" className="w-full max-w-[400px] lg:max-w-none">
            <PreviewCard name={name} firstName={firstName} topic={topic} />
          </aside>
        </div>
      </main>
    </div>
  );
}


function fixMessage(raw?: string): string | null {
  if (!raw) return null
  const res = normalizeSlug(raw)
  if (!res.changed) return null
  if (res.removed) return `Links use lowercase letters, numbers and hyphens, so we left out “${res.removed}”.`
  return 'Spaces become hyphens in links.'
}

function slugStatusText(check: Check, tooShort: boolean) {
  if (tooShort) return 'too short'
  if (check.state !== 'done') return 'checking'
  if (check.status === 'available') return 'available'
  return check.status === 'reserved' ? 'reserved' : 'taken'
}

function SlugIcon({ check, tooShort }: { check: Check; tooShort: boolean }) {
  const box = 'ml-[0.16em] inline-flex h-[0.46em] w-[0.46em] shrink-0 items-center justify-center self-center rounded-full'
  if (tooShort || (check.state === 'done' && check.status !== 'available'))
    return (
      <span aria-hidden="true" className={`${box} bg-danger-fill text-on-accent`}>
        <svg viewBox="0 0 16 16" className="h-[64%] w-[64%]" fill="none">
          <path d="M8 3.5v5.5M8 12.2v.3" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </span>
    )
  if (check.state === 'done' && check.status === 'available')
    return (
      <span aria-hidden="true" className={`${box} pop bg-strong text-strong-accent`} title="Available">
        <svg viewBox="0 0 16 16" className="h-[64%] w-[64%]" fill="none">
          <path d="M3.5 8.5l3 3L12.5 5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  return (
    <span aria-hidden="true" className={`${box} text-ink/40`}>
      <svg viewBox="0 0 16 16" className="h-full w-full animate-spin" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.4" />
        <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function PreviewCard({ name, firstName, topic }: { name: string; firstName: string; topic: string }) {
  return (
    <figure className="m-0">
      <p className="sr-only">
        Preview: {name.trim() || 'Your name'}, taking questions about {topic.trim() || 'anything'}. No one is waiting yet. People see a Take a ticket button.
      </p>
      <div aria-hidden="true">
        <HostCard
          name={name}
          topic={topic}
          flash
          footer={
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="t-label opacity-80">Your place</p>
                  <p className="display mt-1 text-[44px] leading-[0.85]">1st</p>
                </div>
                <p className="pb-1 text-right text-body-sm font-medium opacity-90">No one waiting</p>
              </div>
              {/* Outlined, pointer-less: reads as a preview, never competes with Claim */}
              <div className="display mt-4 flex h-11 cursor-default select-none items-center justify-center rounded-[var(--r-btn-lg)] text-[19px] shadow-[inset_0_0_0_2px_currentColor]">
                Take a ticket
              </div>
              <p className="mt-3 text-[13px] leading-[1.4] opacity-80 [text-wrap:balance]">{firstName || 'They'} will see your contact details to reach you.</p>
            </>
          }
        />
      </div>
      <figcaption className="mt-4 text-center text-body-sm text-secondary">This is what people see at your link.</figcaption>
    </figure>
  )
}
