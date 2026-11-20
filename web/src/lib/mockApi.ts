export type Availability =
  | { status: 'available' }
  | { status: 'taken'; alternatives: string[] }
  | { status: 'reserved' }

export async function checkSlug(slug: string, name: string): Promise<Availability> {
  const res = await fetch(`/api/slug/${encodeURIComponent(slug)}?name=${encodeURIComponent(name)}`)
  return res.json()
}

export async function createLink(link: { slug: string; name: string; topic: string }, _opts: { fail?: boolean; hang?: boolean } = {}) {
  const res = await fetch('/api/links', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(link) })
  if (!res.ok) {
    if (res.status === 401) window.location.assign('/login')
    throw new Error((await res.json().catch(() => ({}))).error ?? 'network')
  }
  return { ok: true as const }
}
