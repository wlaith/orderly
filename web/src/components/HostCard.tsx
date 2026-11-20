import { useEffect, useRef, useState, type ReactNode } from 'react'

import { RouteRow, TicketShell } from './TicketShell'

export function HostCard({
  name,
  topic,
  footer,
  flash = false,
  size = 'md',
}: {
  name: string
  topic: string
  footer?: ReactNode
  flash?: boolean
  size?: 'md' | 'lg'
}) {
  const display = name.trim() || 'Your name'
  const lg = size === 'lg'
  return (
    <TicketShell
      label={`${display}'s line`}
      padding={lg ? 'px-7 pt-6 pb-7' : 'px-6 pt-5 pb-6'}
      stubPadding={lg ? 'px-7 pt-5 pb-6' : 'px-6 pt-5 pb-6'}
      top={
        <>
          <RouteRow />
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={display} size={lg ? 48 : 40} />
            <p className={`display min-w-0 [overflow-wrap:anywhere] leading-[0.95] ${lg ? 'text-[32px]' : 'text-[26px]'}`}>{flash ? <Flash value={name}>{display}</Flash> : display}</p>
          </div>
          <p className={`${lg ? 'mt-6' : 'mt-5'} t-label opacity-80`}>Taking questions about</p>
          <p className={`display mt-1.5 leading-[0.98] [text-wrap:balance] ${lg ? 'text-[38px]' : 'text-[30px]'}`}>
            {flash ? <Flash value={topic}>{topic.trim() || 'anything you ask'}</Flash> : topic.trim() || 'anything you ask'}
          </p>
        </>
      }
      stub={footer}
    />
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  return (
    <span
      aria-hidden="true"
      className="avatar display inline-flex shrink-0 items-center justify-center rounded-full pt-0.5"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  )
}

export function Flash({ value, children }: { value: string; children: ReactNode }) {
  const [key, setKey] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setKey((k) => k + 1)
  }, [value])
  return (
    <span key={key} className={key ? 'flash -mx-1 px-1' : '-mx-1 px-1'}>
      {children}
    </span>
  )
}

