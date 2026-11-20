import { useEffect, useRef, useState } from 'react'
import type { TicketStatus } from '../components/Ticket'
import { firstName, maskContact, useStore, waitedText } from '../lib/store'
import { YoureInLine } from './YoureInLine'

const seen: { id?: string; place?: number; state?: string } = {}

export function TicketScreen({ onBackToPage }: { onBackToPage: () => void }) {
  const { myTicket, placeOf, host, dispatch, now } = useStore()
  const livePlace = myTicket ? placeOf(myTicket.id) : 0
  const sameTicket = seen.id === myTicket?.id
  const [shown, setShown] = useState(() => ({
    place: sameTicket && seen.place ? seen.place : livePlace,
    state: sameTicket && seen.state ? seen.state : myTicket?.state,
  }))
  useEffect(() => {
    const t = setTimeout(() => setShown({ place: livePlace, state: myTicket?.state }), sameTicket ? 650 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePlace, myTicket?.state])
  useEffect(() => {
    if (myTicket) Object.assign(seen, { id: myTicket.id, place: livePlace || seen.place, state: myTicket.state })
  }, [myTicket, livePlace])
  const place = shown.place || livePlace

  const [movedUp, setMovedUp] = useState(false)
  const last = useRef(place)
  useEffect(() => {
    if (place > 0 && last.current > 0 && place < last.current) {
      setMovedUp(true)
      const t = setTimeout(() => setMovedUp(false), 3000)
      last.current = place
      return () => clearTimeout(t)
    }
    if (place > 0) last.current = place
  }, [place])

  if (!myTicket || !host) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-[17px]">You don't have a ticket on this device yet.</p>
        <button type="button" className="mt-4 underline" onClick={onBackToPage}>
          Open the host's page
        </button>
      </div>
    )
  }

  const st = shown.state ?? myTicket.state
  const status: TicketStatus = st === 'reached' ? 'reaching' : st === 'done' ? 'done' : st === 'left' ? 'left' : 'waiting'
  const d = new Date(myTicket.createdAt)

  return (
    <YoureInLine
      ticket={{
        number: myTicket.number,
        place: Math.max(place, 1),
        waited: waitedText(myTicket.createdAt, now) === 'just now' ? '0 min' : waitedText(myTicket.createdAt, now),
        requester: { first: firstName(myTicket.name), full: myTicket.name },
        host: { first: firstName(host.name), full: host.name, slug: host.slug },
        topic: myTicket.topic,
        contact: { type: myTicket.contact.type, display: maskContact(myTicket.contact.type, myTicket.contact.value) },
        takenAt: {
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', ''),
        },
      }}
      status={status}
      movedUp={movedUp}
      onLeave={() => dispatch({ type: 'set', id: myTicket.id, state: 'left' })}
      onUndoLeave={() => dispatch({ type: 'set', id: myTicket.id, state: 'waiting' })}
    />
  )
}
