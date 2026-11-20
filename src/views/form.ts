import { html, type Raw } from '../html.js'
import { KINDS, KIND_LABEL, type Kind } from '../contact.js'
import { icon } from './layout.js'

interface FieldOpts {
  name: string; label: string; value?: string; error?: string; hint?: string; type?: string
  placeholder?: string; optional?: boolean; maxlength?: number; autocomplete?: string; autofocus?: boolean
}

export function field(o: FieldOpts): Raw {
  return html`
<div class="field ${o.error ? 'invalid' : ''}">
  <label for="f-${o.name}">${o.label}${o.optional && html` <span class="optional">(optional)</span>`}</label>
  <input id="f-${o.name}" name="${o.name}" type="${o.type ?? 'text'}" value="${o.value ?? ''}" placeholder="${o.placeholder ?? ''}"
    ${o.maxlength ? html`maxlength="${o.maxlength}"` : ''} autocomplete="${o.autocomplete ?? 'off'}" ${o.autofocus ? 'autofocus' : ''}
    ${o.error ? html`aria-invalid="true" aria-describedby="e-${o.name}"` : ''}>
  ${o.error ? html`<p class="error" id="e-${o.name}">${o.error}</p>` : o.hint ? html`<p class="hint">${o.hint}</p>` : ''}
</div>`
}

const CONTACT_FIELD: Record<Kind, { label: string; type: string; placeholder: string }> = {
  whatsapp: { label: 'WhatsApp number', type: 'tel', placeholder: '+962 79 123 4512' },
  telegram: { label: 'Telegram username', type: 'text', placeholder: '@username' },
  signal: { label: 'Signal number', type: 'tel', placeholder: '+962 79 123 4512' },
  phone: { label: 'Phone number', type: 'tel', placeholder: '+962 79 123 4512' },
  email: { label: 'Email address', type: 'email', placeholder: 'you@example.com' },
}

export function contactPicker(host: string, kind: Kind, value: string, error?: string): Raw {
  const cfg = CONTACT_FIELD[kind]
  return html`
<fieldset data-contact>
  <legend class="label">How should ${host} reach you?</legend>
  <div class="chips" role="radiogroup" aria-label="App">
    ${KINDS.map((k) => html`<label class="chip">
      <input type="radio" name="kind" value="${k}" ${k === kind ? 'checked' : ''} data-label="${CONTACT_FIELD[k].label}" data-type="${CONTACT_FIELD[k].type}" data-placeholder="${CONTACT_FIELD[k].placeholder}">
      ${icon(k)}${KIND_LABEL[k]}</label>`)}
  </div>
  <div class="field mt-4 ${error ? 'invalid' : ''}">
    <label for="f-contact" data-contact-label>${cfg.label}</label>
    <input id="f-contact" name="contact" type="${cfg.type}" value="${value}" placeholder="${cfg.placeholder}" autocapitalize="none" autocomplete="off" ${error ? html`aria-invalid="true" aria-describedby="e-contact"` : ''}>
    ${error ? html`<p class="error" id="e-contact">${error}</p>` : ''}
    <p class="hint">${host} will see this to reach you.</p>
  </div>
</fieldset>`
}
