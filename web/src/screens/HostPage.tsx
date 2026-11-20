import { Icon } from '../components/Icon'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { AppHeader, PlaceChip } from '../components/AppHeader'
import { Button } from '../components/Button'
import { ContactPicker, validateContact } from '../components/ContactPicker'
import { HostCard } from '../components/HostCard'
import { TextField } from '../components/TextField'
import { ordinal, type ContactType } from '../components/Ticket'
import { firstName, useStore } from '../lib/store'

const TOPIC_MAX = 120

export function HostPage({ onTaken, onSeeTicket }: { onTaken: () => void; onSeeTicket: () => void }) {
  const { host, line, myTicket, placeOf, dispatch } = useStore()
  const [topic, setTopic] = useState('')
  const [link, setLink] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<ContactType>('WhatsApp')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'topic' | 'link' | 'name' | 'contact', string>>>({})
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  const refs = { topic: useRef<HTMLInputElement>(null), link: useRef<HTMLInputElement>(null), name: useRef<HTMLInputElement>(null), contact: useRef<HTMLInputElement>(null) }

  useEffect(() => {
    const fill = () => {
      setTopic('Review my CV before Sunday’s interview')
      setLink('https://lina.dev/cv')
      setName('Lina Khoury')
      setType('WhatsApp')
      setContact('+962 79 123 4512')
      setErrors({})
    }
    window.addEventListener('doorin:autofill', fill)
    return () => window.removeEventListener('doorin:autofill', fill)
  }, [])

  if (!host) return null
  const hostFirst = firstName(host.name)
  const waiting = line.length
  const inLine = myTicket && (myTicket.state === 'waiting' || myTicket.state === 'reached')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const next: typeof errors = {}
    if (!topic.trim()) next.topic = `Say what you'd like to ask ${hostFirst}, in a line.`
    if (link.trim() && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/.test(link.trim())) next.link = 'That link looks incomplete. Paste the full address.'
    if (!name.trim()) next.name = `Add your name so ${hostFirst} knows who's next.`
    const c = validateContact(type, contact)
    if (c) next.contact = c
    setErrors(next)
    const first = (['topic', 'link', 'name', 'contact'] as const).find((k) => next[k])
    if (first) {
      refs[first].current?.focus()
      setShake((s) => s + 1)
      return
    }
    setBusy(true)
    setTimeout(() => {
      dispatch({
        type: 'take',
        mine: true,
        ticket: { name: name.trim(), topic: topic.trim(), link: link.trim() ? (/^https?:/.test(link.trim()) ? link.trim() : `https://${link.trim()}`) : undefined, contact: { type, value: contact.trim() } },
      })
      onTaken()
    }, 900)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader width={1000} right={inLine ? <PlaceChip text={placeOf(myTicket!.id) === 1 ? "You're next" : `You're ${ordinal(placeOf(myTicket!.id))}`} /> : undefined} />
      <main className="container-app flex-1 py-8 sm:py-14">
        <div className="mx-auto grid max-w-[1000px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
          {/* Who + how many */}
          <div className="lg:sticky lg:top-[96px]">
            <HostCard
              name={host.name}
              topic={host.topic}
              size="lg"
              footer={
                !inLine ? (
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="t-label opacity-80">You'd be</p>
                      <p className="display mt-1 text-[56px] leading-[0.85]">{ordinal(waiting + 1)}</p>
                    </div>
                    <p className="pb-1 text-right text-[15px] font-medium opacity-90">{waiting === 0 ? 'No one waiting' : `${waiting} ahead of you`}</p>
                  </div>
                ) : undefined
              }
            />
            <p className={`mt-6 text-[17px] text-ink ${!inLine ? 'sr-only' : ''}`} aria-live="polite">
              {waiting === 0 ? (
                <>
                  <span className="font-semibold">No one waiting.</span> <span className="text-secondary">You'd be next.</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    {waiting} {waiting === 1 ? 'person' : 'people'} waiting.
                  </span>{' '}
                  <span className="text-secondary">You'd be {ordinal(waiting + 1)}.</span>
                </>
              )}
            </p>
          </div>

          {/* Form, or the way back to your ticket */}
          {inLine ? (
            <div className="card fade-in p-6">
              <p className="display text-[40px] leading-none">You're {ordinal(placeOf(myTicket!.id))}</p>
              <p className="mt-3 text-[16px] text-secondary">You're already in {hostFirst}'s line on this device. Your ticket has your place and how you'll be reached.</p>
              <Button size="lg" className="mt-6 w-full" onClick={onSeeTicket}>
                <Icon name="ticket" />
                See your ticket
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-6">
              <h1 className="text-poster !text-[clamp(28px,1vw+22px,36px)]">Get in {hostFirst}'s line</h1>
              <TextField
                ref={refs.topic}
                label="What's it about?"
                value={topic}
                onChange={(v) => {
                  setTopic(v)
                  if (errors.topic) setErrors({ ...errors, topic: undefined })
                }}
                maxChars={TOPIC_MAX}
                placeholder="Review my CV before an interview"
                error={errors.topic}
              />
              <TextField
                ref={refs.link}
                label="Link"
                optional
                type="url"
                inputMode="url"
                autoCapitalize="none"
                value={link}
                onChange={(v) => {
                  setLink(v)
                  if (errors.link) setErrors({ ...errors, link: undefined })
                }}
                placeholder="https://"
                hint={`A doc, repo or post ${hostFirst} should look at.`}
                error={errors.link}
              />
              <TextField
                ref={refs.name}
                label="Your name"
                autoComplete="name"
                value={name}
                onChange={(v) => {
                  setName(v)
                  if (errors.name) setErrors({ ...errors, name: undefined })
                }}
                error={errors.name}
              />
              <ContactPicker
                ref={refs.contact}
                host={hostFirst}
                type={type}
                value={contact}
                onType={(t) => {
                  setType(t)
                  setContact('')
                  setErrors({ ...errors, contact: undefined })
                }}
                onValue={(v) => {
                  setContact(v)
                  if (errors.contact) setErrors({ ...errors, contact: undefined })
                }}
                error={errors.contact}
              />

              <div key={shake} className={shake ? 'shake' : ''}>
                <Button type="submit" size="lg" busy={busy} className="w-full">
                  <Icon name="ticket" />
                  Take a ticket
                </Button>
                <p className="mt-3 text-center text-body-sm text-secondary">You'll get a ticket with your place in line.</p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
