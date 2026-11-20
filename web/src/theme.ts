export type ThemeName = 'apple'
export const THEME: ThemeName = 'apple'

export interface TicketPreset {
  name: string
  paper: string
  ink: string
  band: string
  bandInk: string
  pill: string
  pillInk: string
  code: string
  codeInk: string
}

const P = (name: string, paper: string, ink: string, band: string, bandInk: string, pill: string, pillInk: string, code = 'transparent', codeInk = ink): TicketPreset => ({
  name,
  paper,
  ink,
  band,
  bandInk,
  pill,
  pillInk,
  code,
  codeInk,
})

export const PRESETS: Record<'a' | 'b' | 'c', TicketPreset> = {
  a: P('Ticket Red', '#FF4D2E', '#3F000D', 'rgba(63,0,13,0.12)', '#3F000D', 'rgba(63,0,13,0.18)', '#3F000D', '#FFFFFF', '#3F000D'),
  b: P('Oxblood', '#3F000D', '#FAF8F4', 'rgba(250,248,244,0.14)', '#FAF8F4', 'rgba(250,248,244,0.22)', '#FAF8F4', '#FFFFFF', '#3F000D'),
  c: P('Tint', '#FFD8CC', '#3F000D', 'rgba(63,0,13,0.08)', '#3F000D', 'rgba(63,0,13,0.12)', '#3F000D', '#FFFFFF', '#3F000D'),
}
export type PresetKey = keyof typeof PRESETS
