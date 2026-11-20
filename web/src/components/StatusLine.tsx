import type { ReactNode } from 'react'

export type StatusTone = 'info' | 'success' | 'warning'

export function StatusLine({
  tone = 'info',
  children,
  id,
  live = 'polite',
  className = '',
}: {
  tone?: StatusTone
  children: ReactNode
  id?: string
  live?: 'polite' | 'off'
  className?: string
}) {
  const tones: Record<StatusTone, { text: string; icon: ReactNode }> = {
    info: { text: 'text-secondary', icon: <InfoIcon /> },
    success: { text: 'text-ink', icon: <CheckIcon /> },
    warning: { text: 'text-danger', icon: <AlertIcon /> },
  }
  const t = tones[tone]
  return (
    <p id={id} role={live === 'polite' ? 'status' : undefined} className={`flex items-start gap-1.5 text-body-sm ${t.text} ${className}`}>
      <span className="mt-[3px] shrink-0">{t.icon}</span>
      <span>{children}</span>
    </p>
  )
}

const iconProps = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true } as const

export function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.2v4M8 4.8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg {...iconProps}>
      <path d="M8 1.8l6.5 11.4H1.5L8 1.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11.4v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
