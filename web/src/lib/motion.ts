import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'


export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

let slow = 1
const subs = new Set<() => void>()
export const T = (ms: number) => (reducedMotion() ? 0 : ms * slow)
export function setSlow(f: number) {
  slow = f
  document.documentElement.style.setProperty('--tk-slow', String(f))
  subs.forEach((s) => s())
}
export const useSlow = () =>
  useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => slow,
  )

export function haptic(pattern: number | number[]) {
  if (reducedMotion() || !(navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

type VTDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

export function withViewTransition(update: () => void, opts: { origin?: { x: number; y: number }; kind?: string } = {}) {
  const d = document as VTDoc
  if (!d.startViewTransition || reducedMotion()) return update()
  const html = document.documentElement
  if (opts.origin) {
    html.style.setProperty('--vt-x', `${opts.origin.x}px`)
    html.style.setProperty('--vt-y', `${opts.origin.y}px`)
  }
  html.dataset.vt = opts.kind ?? 'on'
  const vt = d.startViewTransition(() => flushSync(update))
  vt.finished.finally(() => {
    delete html.dataset.vt
  })
}
