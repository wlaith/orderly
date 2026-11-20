// Mark path from the design system. Never redraw it.
export const MARK_PATH =
  'M123.493 11.658 L170.252 0 L176.263 42.769 L164.084 60.921 L180.368 71.977 L186.378 114.745 L139.619 126.404 L127.485 114.417 L131.164 140.592 L123.051 157.73 L16.126 182.359 L10.116 139.59 L22.294 121.438 L6.011 110.382 L0 67.614 L106.925 42.985 L119.059 54.972 L115.38 28.797 Z'

export function Mark({ className = '', title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 186.378 182.359" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  )
}

export function Lockup({ className = '' }: { className?: string }) {
  return (
    <span className={`logo-link inline-flex items-center ${className}`}>
      <Mark className="logo-mark" />
      <span className="logo-text">Orderly</span>
    </span>
  )
}
