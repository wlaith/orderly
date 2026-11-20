import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  value: string
  onChange: (value: string) => void
  optional?: boolean
  hint?: ReactNode
  error?: string
  maxChars?: number
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, value, onChange, optional, hint, error, maxChars, id, className = '', ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const counterId = maxChars ? `${inputId}-count` : undefined

  const length = value.length
  const nearLimit = maxChars ? length >= Math.floor(maxChars * 0.8) : false
  const atLimit = maxChars ? length >= maxChars : false

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-[15px] font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-secondary">optional</span>}
        </label>
        {maxChars && nearLimit && (
          <span id={counterId} className={`text-[13px] tabular-nums ${atLimit ? 'text-danger' : 'text-secondary'}`} aria-live="polite">
            {maxChars - length} left
          </span>
        )}
      </div>
      <input
        ref={ref}
        id={inputId}
        className="field-control"
        value={value}
        maxLength={maxChars}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId, nearLimit ? counterId : undefined].filter(Boolean).join(' ') || undefined}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-body-sm text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-body-sm text-secondary">
          {hint}
        </p>
      )}
    </div>
  )
})
