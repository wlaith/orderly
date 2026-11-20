export const SLUG_MIN = 3
export const SLUG_MAX = 32
export const LINK_HOST = `${typeof window === 'undefined' ? 'localhost' : window.location.host}/`

export const RESERVED = new Set([
  'admin', 'api', 'app', 'help', 'login', 'logout', 'signin', 'signup', 'settings', 'dashboard',
  'about', 'terms', 'privacy', 'support', 'doorin', 'ticket', 'tickets', 'new', 'www',
])

export interface NormalizeResult {
  slug: string
  changed: boolean
  removed: string
}

export function normalizeSlug(raw: string): NormalizeResult {
  let removed = ''
  const lowered = raw.toLowerCase()
  const spaced = lowered.replace(/[\s_.]+/g, '-')
  let out = ''
  for (const ch of spaced) {
    if (/[a-z0-9-]/.test(ch)) out += ch
    else removed += ch
  }
  out = out.replace(/-{2,}/g, '-').replace(/^-+/, '').slice(0, SLUG_MAX)
  const changed = removed.length > 0 || spaced !== lowered
  return { slug: out, changed, removed: [...new Set(removed.replace(/\s/g, ''))].join('') }
}

export function finalizeSlug(slug: string) {
  return slug.replace(/-+$/, '')
}

export function slugFromName(name: string) {
  return finalizeSlug(normalizeSlug(name.trim()).slug)
}
