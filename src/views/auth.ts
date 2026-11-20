import { config } from '../config.js'
import { emailConfigured } from '../email.js'
import { html } from '../html.js'
import { field } from './form.js'
import { icon, page } from './layout.js'

export function loginPage({ error, sent }: { error?: string; sent?: boolean } = {}): string {
  const google = Boolean(config.googleId)
  const email = emailConfigured() || !config.production
  const intro = google && email ? 'No passwords. Use Google, or get a sign-in link by email.'
    : google ? 'No passwords. Sign in with your Google account.'
    : email ? 'No passwords. Get a sign-in link by email.'
    : 'Sign-in is not available yet.'
  return page({ title: 'Sign in, Orderly', width: 760 }, html`
<main class="container">
  <div class="page-narrow stack" style="margin-top:32px">
    <div>
      <h1 class="poster">Sign in to Orderly</h1>
      <p class="muted mt-2">${intro}</p>
    </div>
    ${error && html`<p class="notice error" role="alert">${error}</p>`}
    ${sent && html`<p class="notice" role="status">Check your email. The link works once and expires in 15 minutes.</p>`}
    <div class="stack" style="--gap:12px">
      ${google && html`<a class="btn btn-lg btn-google btn-block" href="/login/google">${icon('person')}Continue with Google</a>`}
      ${email && html`<form method="post" action="/login/email" class="stack" style="--gap:12px">
        ${field({ name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', autofocus: !google })}
        <button class="btn btn-lg btn-primary btn-block" type="submit">${icon('email')}Email me a sign-in link</button>
      </form>`}
    </div>
    ${config.devLogin && devForm()}
    <p class="small muted center">New here? Sign in either way, then choose your link name.</p>
  </div>
</main>`)
}

function devForm() {
  return html`
<form method="post" action="/login/dev" class="card stack" style="padding:20px">
  <p class="small muted">Local development only (DEV_LOGIN=1). Not available in production.</p>
  ${field({ name: 'name', label: 'Your name', placeholder: 'Omar Khalil' })}
  <button class="btn btn-quiet btn-block" type="submit">Sign in for development</button>
</form>`
}
