import { useSyncExternalStore } from 'react'
import { PRESETS, type TicketPreset } from './theme'


const subs = new Set<() => void>()
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

const toRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const }
const lum = ([r, g, b]: readonly number[]) => { const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a: readonly number[], b: readonly number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

export const contrast = (a: string, b: string) => ratio(toRgb(a), toRgb(b))

export const INK = '#3F000D'
export const PAPER = '#FAF8F4'
export const autoInk = (paper: string) => (contrast(paper, INK) >= contrast(paper, PAPER) ? INK : PAPER)

export interface HostColors { paper: string | null; ink: string | null }
let hostColors: HostColors = { paper: null, ink: null }
export function setHostColors(c: HostColors) {
  if (c.paper === hostColors.paper && c.ink === hostColors.ink) return
  hostColors = c
  subs.forEach((fn) => fn())
}
const useHostColors = () => useSyncExternalStore(subscribe, () => hostColors)

const tint = (ink: string, k: number) => `rgba(${toRgb(ink).join(',')},${k})`

export function usePresets(): Record<string, TicketPreset> {
  const hc = useHostColors()
  const base = PRESETS as Record<string, TicketPreset>
  if (!hc.paper && !hc.ink) return base
  const paper = hc.paper ?? base.a.paper
  const ink = hc.ink ?? autoInk(paper)
  return { ...base, a: { ...base.a, name: 'Host', paper, ink, band: tint(ink, 0.12), bandInk: ink, pill: tint(ink, 0.2), pillInk: ink } }
}
