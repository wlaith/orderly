import { config } from '../config.js'
import { html, raw, type Raw } from '../html.js'

const MARK = raw('<svg viewBox="0 0 186.378 182.359" aria-hidden="true" focusable="false"><path fill="currentColor" d="M123.493 11.658 L170.252 0 L176.263 42.769 L164.084 60.921 L180.368 71.977 L186.378 114.745 L139.619 126.404 L127.485 114.417 L131.164 140.592 L123.051 157.73 L16.126 182.359 L10.116 139.59 L22.294 121.438 L6.011 110.382 L0 67.614 L106.925 42.985 L119.059 54.972 L115.38 28.797 Z"/></svg>')

const ICONS: Record<string, string> = {
  ticket: '<path d="M3.5 8.2A2 2 0 0 1 5.5 6.5h13a2 2 0 0 1 2 1.7v1.4a2.4 2.4 0 0 0 0 4.8v1.4a2 2 0 0 1-2 1.7h-13a2 2 0 0 1-2-1.7v-1.4a2.4 2.4 0 0 0 0-4.8z"/><path d="M14.5 7v1.6M14.5 11.2v1.6M14.5 15.4V17"/>',
  check: '<path d="m5 12.7 4.4 4.3L19 7.3"/>',
  circleCheck: '<circle cx="12" cy="12" r="8.6"/><path d="m8.2 12.4 2.7 2.6 5-5.4"/>',
  copy: '<rect x="8.8" y="8.8" width="11" height="11" rx="2.6"/><path d="M15.2 6.4A2.4 2.4 0 0 0 12.8 4H6.6A2.6 2.6 0 0 0 4 6.6v6.2A2.4 2.4 0 0 0 6.4 15"/>',
  share: '<path d="M12 14.5V3.8M12 3.8 8.3 7.4M12 3.8l3.7 3.6"/><path d="M7.5 10.2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5"/>',
  people: '<circle cx="9.2" cy="8.6" r="3.2"/><path d="M3.2 19.4c.4-3.2 2.7-5 6-5s5.6 1.8 6 5"/><path d="M15.6 5.7a3 3 0 0 1 0 5.8M17.6 14.8c1.9.5 3.1 2 3.4 4.4"/>',
  whatsapp: '<path d="M12 4.2c-4.6 0-8.2 3-8.2 6.8 0 2 1 3.8 2.6 5l-.8 3.6 3.9-1.9c.8.2 1.6.3 2.5.3 4.6 0 8.2-3 8.2-7S16.6 4.2 12 4.2z"/>',
  telegram: '<path d="M20.6 4.4 3.6 11l5.8 2.2 2.2 5.8z M9.4 13.2l4.4-4.4"/>',
  signal: '<path d="M12 3.4 5 6v5.6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z"/><path d="m9.2 12.2 2 2 3.6-4"/>',
  phone: '<path d="M7.5 3.8h2.2l1.6 4.2-2 1.3a11 11 0 0 0 5.4 5.4l1.3-2 4.2 1.6v2.2a2 2 0 0 1-2.2 2C10.4 18.1 5.9 13.6 5.5 6A2 2 0 0 1 7.5 3.8z"/>',
  email: '<rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.6"/><path d="m4.4 7.6 7.6 5.6 7.6-5.6"/>',
  person: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6"/>',
  key: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H20M17 12v3"/>',
}

export const icon = (name: string) =>
  raw(`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`)

export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'

export const avatar = (name: string, size = 40) =>
  html`<span class="avatar" aria-hidden="true" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${initials(name)}</span>`

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name

interface PageOpts { title: string; right?: Raw | false; badge?: Raw | false; width?: number; scripts?: string[]; description?: string }

export function page(o: PageOpts, body: Raw): string {
  const description = o.description ?? 'A line, not a calendar. Share one link, people take a ticket, you reach them in their own app.'
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${o.title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#faf8f4">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/static/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/static/app.css">
</head>
<body>
<header class="app-header">
  <div class="container">
    <div class="bar" style="${o.width ? `--w:${o.width}px` : ''}">
      <span style="display:inline-flex;align-items:center"><a class="logo" href="/" aria-label="Orderly home">${MARK}Orderly</a>${o.badge}</span>
      <div class="header-actions">${o.right}</div>
    </div>
  </div>
</header>
${body}
<script src="/static/app.js" defer></script>
${(o.scripts ?? []).map((s) => html`<script src="${s}" defer></script>`)}
</body>
</html>`.value
}

export const turnstileSite = () => config.turnstileSite
