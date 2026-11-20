const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

const header = $('.app-header')
const onScroll = () => header.toggleAttribute('data-scrolled', scrollY > 4)
addEventListener('scroll', onScroll, { passive: true }); onScroll()

document.addEventListener('click', async (e) => {
  const copy = e.target.closest('[data-copy]')
  if (copy) {
    try { await navigator.clipboard.writeText(copy.dataset.copy) } catch { return }
    const label = $('span', copy), old = label.textContent
    label.textContent = 'Copied'; setTimeout(() => (label.textContent = old), 1600)
  }
  const share = e.target.closest('[data-share]')
  if (share) {
    const { share: url, title } = share.dataset
    if (navigator.share) navigator.share({ url, title }).catch(() => {})
    else navigator.clipboard?.writeText(url)
  }
  const reached = e.target.closest('[data-reached]')
  if (reached) fetch(reached.dataset.reached, { method: 'POST', keepalive: true })
})

document.addEventListener('submit', (e) => {
  const msg = e.target.dataset.confirm
  if (msg && !confirm(msg)) e.preventDefault()
})

$$('[data-contact] input[type=radio]').forEach((r) => r.addEventListener('change', () => {
  const input = $('#f-contact'); input.type = r.dataset.type; input.placeholder = r.dataset.placeholder
  $('[data-contact-label]').textContent = r.dataset.label
}))

const WAITING = (n) => (n === 0 ? 'No one waiting' : `${n} ${n === 1 ? 'person' : 'people'} waiting`)
async function poll(el) {
  try {
    const res = await fetch(el.dataset.poll, { credentials: 'same-origin' })
    if (res.redirected && res.url.includes('/login')) return location.reload()
    if (!res.ok) return
    const text = await res.text()
    if (text === el._last) return
    el._last = text; el.innerHTML = text
    if ('pollBadge' in el.dataset) {
      const n = $$('.line-list > li', el).length
      $$('[data-count]').forEach((c) => (c.textContent = WAITING(n)))
      $$('[data-live-badge]').forEach((b) => (b.textContent = `${n} waiting`))
    }
  } catch { /* offline: try again next time */ }
}
setInterval(() => { if (!document.hidden) $$('[data-poll]').forEach(poll) }, 5000)
