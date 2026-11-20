import type { ReactNode } from 'react'


const P: Record<string, ReactNode> = {
  person: (<><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6" /></>),
  link: (<><path d="M10.2 13.8a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1" /><path d="M13.8 10.2a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" /></>),
  ticket: (<><path d="M3.5 8.2A2 2 0 0 1 5.5 6.5h13a2 2 0 0 1 2 1.7v1.4a2.4 2.4 0 0 0 0 4.8v1.4a2 2 0 0 1-2 1.7h-13a2 2 0 0 1-2-1.7v-1.4a2.4 2.4 0 0 0 0-4.8z" /><path d="M14.5 7v1.6M14.5 11.2v1.6M14.5 15.4V17" /></>),
  send: (<><path d="M20.5 3.8 10.3 14" /><path d="M20.5 3.8 14.2 20.2l-3.9-6.2L4 10.1z" /></>),
  check: <path d="m5 12.7 4.4 4.3L19 7.3" />,
  circleCheck: (<><circle cx="12" cy="12" r="8.6" /><path d="m8.2 12.4 2.7 2.6 5-5.4" /></>),
  undo: (<><path d="M9 6.5 4.8 10.4 9 14.3" /><path d="M5 10.4h8.2a5.3 5.3 0 0 1 0 10.6H10" /></>),
  eye: (<><path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12z" /><circle cx="12" cy="12" r="2.8" /></>),
  signout: (<><path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14" /><path d="M10 8.2 6.2 12 10 15.8M6.4 12H15" /></>),
  copy: (<><rect x="8.8" y="8.8" width="11" height="11" rx="2.6" /><path d="M15.2 6.4A2.4 2.4 0 0 0 12.8 4H6.6A2.6 2.6 0 0 0 4 6.6v6.2A2.4 2.4 0 0 0 6.4 15" /></>),
  share: (<><path d="M12 14.5V3.8M12 3.8 8.3 7.4M12 3.8l3.7 3.6" /><path d="M7.5 10.2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5" /></>),
  people: (<><circle cx="9.2" cy="8.6" r="3.2" /><path d="M3.2 19.4c.4-3.2 2.7-5 6-5s5.6 1.8 6 5" /><path d="M15.6 5.7a3 3 0 0 1 0 5.8M17.6 14.8c1.9.5 3.1 2 3.4 4.4" /></>),
  chat: <path d="M12 4.2c-4.6 0-8.2 3-8.2 6.8 0 2 1 3.8 2.6 5l-.8 3.6 3.9-1.9c.8.2 1.6.3 2.5.3 4.6 0 8.2-3 8.2-7S16.6 4.2 12 4.2z" />,
  plane: <path d="M20.6 4.4 3.6 11l5.8 2.2 2.2 5.8z M9.4 13.2l4.4-4.4" />,
  phone: <path d="M7.5 3.8h2.2l1.6 4.2-2 1.3a11 11 0 0 0 5.4 5.4l1.3-2 4.2 1.6v2.2a2 2 0 0 1-2.2 2C10.4 18.1 5.9 13.6 5.5 6A2 2 0 0 1 7.5 3.8z" />,
  mail: (<><rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.6" /><path d="m4.4 7.6 7.6 5.6 7.6-5.6" /></>),
  shield: (<><path d="M12 3.4 5 6v5.6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z" /><path d="m9.2 12.2 2 2 3.6-4" /></>),
  bolt: <path d="M13 3 5.5 13.2h5.2L10 21l8-10.4h-5.3z" />,
  clock: (<><circle cx="12" cy="12" r="8.6" /><path d="M12 7.4V12l3.2 2" /></>),
  play: <path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10-6.4a.8.8 0 0 0 0-1.4l-10-6.4A.8.8 0 0 0 8 5.6z" />,
  arrowRight: <path d="M4.5 12h14.2M13.4 6.6 18.8 12l-5.4 5.4" />,
  hand: <path d="M9 11V5.2a1.6 1.6 0 0 1 3.2 0V10m0-.6V4.4a1.6 1.6 0 0 1 3.2 0v5.4m0-3.2a1.6 1.6 0 0 1 3.2 0V14a6.6 6.6 0 0 1-6.6 6.6h-.6a6.5 6.5 0 0 1-5.1-2.5L4 14.4a1.6 1.6 0 0 1 2.4-2.1L9 14.6" />,
  xmark: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  google: (<><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6" /></>),
}

export type IconName = keyof typeof P
export const CONTACT_ICON: Record<string, IconName> = { WhatsApp: 'chat', Telegram: 'plane', Signal: 'shield', Phone: 'phone', Email: 'mail' }

export function Icon({ name, size = 18, className = '', bare }: { name: IconName; size?: number; className?: string; bare?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${bare ? '' : 'mr-[0.45em] inline-block align-[-0.24em]'} ${className}`}>
      {P[name]}
    </svg>
  )
}

export function IconTile({ name, size = 40 }: { name: IconName; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[26%] bg-accent text-on-accent" style={{ width: size, height: size }}>
      <Icon name={name} size={Math.round(size * 0.55)} />
    </span>
  )
}
