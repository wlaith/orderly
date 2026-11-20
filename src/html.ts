export class Raw {
  constructor(readonly value: string) {}
  toString() { return this.value }
}

export const raw = (s: string) => new Raw(s)

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])

function render(v: unknown): string {
  if (v instanceof Raw) return v.value
  if (Array.isArray(v)) return v.map(render).join('')
  if (v === false || v === null || v === undefined) return ''
  return esc(v)
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Raw {
  let out = strings[0]
  values.forEach((v, i) => { out += render(v) + strings[i + 1] })
  return new Raw(out)
}
