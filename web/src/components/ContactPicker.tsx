
import { AppMark } from './AppMark'

import { forwardRef, useId } from 'react'
import type { ContactType } from './Ticket'

export const CONTACTS: ContactType[] = ['WhatsApp', 'Telegram', 'Signal', 'Phone', 'Email']

const CONFIG: Record<ContactType, { label: string; type: string; inputMode: 'tel' | 'email' | 'text'; placeholder: string; autoComplete: string; hint: string }> = {
  WhatsApp: { label: 'WhatsApp number', type: 'tel', inputMode: 'tel', placeholder: '+962 79 123 4512', autoComplete: 'tel', hint: 'Include your country code.' },
  Signal: { label: 'Signal number', type: 'tel', inputMode: 'tel', placeholder: '+962 79 123 4512', autoComplete: 'tel', hint: 'Include your country code.' },
  Telegram: { label: 'Telegram username', type: 'text', inputMode: 'text', placeholder: '@username', autoComplete: 'off', hint: 'Your @username, not your display name.' },
  Phone: { label: 'Phone number', type: 'tel', inputMode: 'tel', placeholder: '+962 79 123 4512', autoComplete: 'tel', hint: 'Include your country code.' },
  Email: { label: 'Email address', type: 'email', inputMode: 'email', placeholder: 'you@example.com', autoComplete: 'email', hint: '' },
}

export function validateContact(type: ContactType, v: string): string | undefined {
  const value = v.trim()
  if (!value) return `Add your ${CONFIG[type].label.replace(/^(Phone|Email)/, (m) => m.toLowerCase())} so {host} can reach you.`;
  if (type === 'Email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'That email looks incomplete. Check for the @ and the part after it.';
  if (type === 'Telegram') return /^@?[a-zA-Z0-9_]{5,32}$/.test(value) ? undefined : 'Telegram usernames are 5 to 32 letters, numbers or underscores.';
  const digits = value.replace(/\D/g, '')
  if (digits.length < 8) return 'That number looks too short. Include your country code, like +962.'
  if (!value.trim().startsWith('+')) return 'Start with your country code, like +962.'
  return undefined
}

export const ContactPicker = forwardRef<
  HTMLInputElement,
  { host: string; type: ContactType; value: string; onType: (t: ContactType) => void; onValue: (v: string) => void; error?: string }
>(function ContactPicker({ host, type, value, onType, onValue, error }, ref) {
  const id = useId()
  const cfg = CONFIG[type]
  const valid = !validateContact(type, value)
  return (
    <fieldset>
      <legend className="text-[15px] font-medium text-ink">How should {host} reach you?</legend>
      <div role="radiogroup" aria-label="App" className="mt-2 flex flex-wrap gap-2">
        {CONTACTS.map((c) => {
          const on = c === type
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onType(c)}
              onKeyDown={(e) => {
                const i = CONTACTS.indexOf(c)
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  onType(CONTACTS[(i + 1) % CONTACTS.length])
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  onType(CONTACTS[(i - 1 + CONTACTS.length) % CONTACTS.length])
                }
              }}
              tabIndex={on ? 0 : -1}
              className={`chip inline-flex min-h-touch items-center gap-2 px-4 ${'pl-2.5'} text-[15px] font-medium transition-[background-color,box-shadow,color] duration-150`}
            >
              <AppMark app={c} size={22} />
              {c}
            </button>
          );
        })}
      </div>

      <label htmlFor={id} className="mt-4 block text-body-sm font-medium text-ink">
        {cfg.label}
      </label>
      <input
        ref={ref}
        id={id}
        key={type}
        className="field-control fade-in mt-1.5"
        type={cfg.type}
        inputMode={cfg.inputMode}
        autoComplete={cfg.autoComplete}
        autoCapitalize="none"
        placeholder={cfg.placeholder}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-help`}
      />
      <div id={`${id}-help`} className="mt-1.5 space-y-1 text-body-sm">
        {error ? (
          <p className="text-danger">{error.replace('{host}', host)}</p>
        ) : valid ? (
          <p className="fade-in text-ink">
            {host} will {type === 'Phone' ? 'call' : type === 'Email' ? 'email' : 'message'} you{type === 'Phone' || type === 'Email' ? '' : ` on ${type}`} at{' '}
            <span className="font-semibold">{value.trim()}</span>
          </p>
        ) : (
          cfg.hint && <p className="text-secondary">{cfg.hint}</p>
        )}
        <p className="text-secondary">{host} will see this to reach you.</p>
      </div>
    </fieldset>
  );
})
