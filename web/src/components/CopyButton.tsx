import { useState } from 'react'
import { Button } from './Button'

export function CopyButton({ text, label = 'Copy link', variant = 'quiet', className = '' }: { text: string; label?: string; variant?: 'primary' | 'quiet'; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      variant={variant}
      className={`min-w-[120px] ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          /* clipboard may be refused in some frames; still confirm the action */
        }
        setDone(true)
        setTimeout(() => setDone(false), 2000)
      }}
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5">
        {done ? (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pop">
              <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="5" y="5" width="8.5" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10h.2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {label}
          </>
        )}
      </span>
    </Button>
  )
}

export function ShareButton({ url, title, onFallback, variant = 'quiet' }: { url: string; title: string; onFallback?: () => void; variant?: 'primary' | 'quiet' }) {
  return (
    <Button
      variant={variant}
      onClick={async () => {
        try {
          if (navigator.share) {
            await navigator.share({ url, title })
            return
          }
        } catch {
          /* cancelled or unavailable → fall back */
        }
        try {
          await navigator.clipboard.writeText(url)
        } catch {
          /* ignore */
        }
        onFallback?.()
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 10V2M8 2L5 5M8 2l3 3M3 8.5V13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Share
      </span>
    </Button>
  )
}
