export const RESERVED = new Set([
  'admin', 'login', 'logout', 'new', 't', 'dashboard', 'auth', 'tickets', 'static', 'public', 'api', 'healthz', 'favicon.ico', 'assets',
])

export const normalizeSlug = (raw: string) =>
  raw.toLowerCase().trim().replace(/[\s_.]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)

export function slugError(slug: string): string | null {
  if (slug.length < 3) return 'Use at least 3 letters or numbers.'
  if (slug.length > 30) return 'Use 30 characters or fewer.'
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Use lowercase letters, numbers and hyphens.'
  if (RESERVED.has(slug)) return 'That one is reserved. Try another.'
  return null
}
