export const KINDS = ['whatsapp', 'telegram', 'signal', 'phone', 'email'] as const
export type Kind = (typeof KINDS)[number]

export const KIND_LABEL: Record<Kind, string> = { whatsapp: 'WhatsApp', telegram: 'Telegram', signal: 'Signal', phone: 'Phone', email: 'Email' }

export const isKind = (v: unknown): v is Kind => KINDS.includes(v as Kind)

export function contactError(kind: Kind, raw: string): string | null {
  const v = raw.trim()
  if (!v) return 'Add a way to reach you.'
  if (kind === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'That email looks incomplete.'
  if (kind === 'telegram') return /^@?[a-zA-Z0-9_]{5,32}$/.test(v) ? null : 'Telegram usernames are 5 to 32 letters, numbers or underscores.'
  if (v.replace(/\D/g, '').length < 8) return 'That number looks too short. Include your country code.'
  if (!v.startsWith('+')) return 'Start with your country code, like +962.'
  return null
}

export function normalizeContact(kind: Kind, raw: string): string {
  const v = raw.trim()
  if (kind === 'telegram') return v.replace(/^@/, '')
  return v
}

export function linkError(raw: string): string | null {
  if (!raw.trim()) return null
  return /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/.test(raw.trim()) ? null : 'That link looks incomplete. Paste the full address.'
}

export const normalizeLink = (raw: string) => {
  const v = raw.trim()
  return !v ? null : /^https?:\/\//.test(v) ? v : `https://${v}`
}

const digits = (s: string) => s.replace(/\D/g, '')

// Plain links only. Orderly sends nothing.
export function reachUrl(kind: Kind, contact: string, hello: string): string {
  const text = encodeURIComponent(hello)
  switch (kind) {
    case 'whatsapp': return `https://wa.me/${digits(contact)}?text=${text}`
    case 'signal': return `https://signal.me/#p/+${digits(contact)}`
    case 'telegram': return `https://t.me/${encodeURIComponent(contact)}`
    case 'phone': return `tel:+${digits(contact)}`
    case 'email': return `mailto:${contact}?subject=${encodeURIComponent('Your turn')}&body=${text}`
  }
}

export const maskContact = (kind: Kind, v: string) =>
  kind === 'email' ? v.replace(/^(.).*(@.*)$/, '$1***$2') : kind === 'telegram' ? `@${v}` : v
