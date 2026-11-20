import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  busy?: boolean
  disabledReason?: string
  fullWidth?: boolean
  size?: 'md' | 'lg'
  icon?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 min-h-touch text-button whitespace-nowrap select-none ' +
  'transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0'

const variants: Record<Variant, string> = {
  primary: 'btn btn-primary px-4',
  secondary: 'btn btn-primary px-4',
  quiet: 'btn btn-quiet px-5',
  ghost: 'btn btn-ghost px-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', busy, disabledReason, fullWidth, icon, className = '', children, onClick, id, ...rest },
  ref,
) {
  const reasonId = disabledReason && id ? `${id}-reason` : undefined
  return (
    <>
      <button
        ref={ref}
        id={id}
        className={`${base} ${variants[variant]} ${size === 'lg' ? 'btn-lg !gap-2.5 !px-6 tracking-[-0.1px]' : ''} ${fullWidth ? 'w-full' : ''} ${busy ? 'cursor-progress' : ''} ${className}`}
        aria-busy={busy || undefined}
        aria-describedby={reasonId}
        disabled={rest.disabled || !!disabledReason}
        onClick={(e) => {
          if (busy) {
            e.preventDefault()
            return
          }
          onClick?.(e)
        }}
        {...rest}
      >
        {busy ? <Spinner /> : icon}
        <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
      </button>
      {disabledReason && (
        <p id={reasonId} className="mt-2 text-body-sm text-secondary">
          {disabledReason}
        </p>
      )}
    </>
  )
})

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
