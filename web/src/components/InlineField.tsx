import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type InputHTMLAttributes, type ReactNode } from 'react'


export function FieldLabel({ id, label, status, className = '' }: { id: string; label: string; status?: ReactNode; className?: string }) {
  return (
    <span id={id} className={`sr-only ${className}`}>
      {label}
      {status && <>, {status}</>}
    </span>
  )
}



interface InlineFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'prefix'> {
  label: string
  status?: ReactNode
  value: string
  onChange: (v: string) => void
  prefix?: ReactNode
  suffix?: ReactNode
  trailing?: ReactNode
  invalid?: boolean
  describedBy?: string
  textCase?: 'uppercase' | 'normal-case'
}

export const InlineField = forwardRef<HTMLInputElement, InlineFieldProps>(function InlineField(
  { label, status, value, onChange, prefix, suffix, trailing, invalid, placeholder, describedBy, id, textCase = 'normal-case', ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const labelId = `${inputId}-label`
  return (
    <span className="group relative inline-flex max-w-full flex-wrap items-baseline whitespace-nowrap leading-[1.18]" data-invalid={invalid || undefined}>
      {prefix && <span className="text-ink">{prefix}</span>}
      <span className="marker relative inline-block min-w-[1ch] max-w-full">
        {/* Mirror sizes the field to its text */}
        <span aria-hidden="true" className={`invisible block overflow-hidden whitespace-pre pr-[2px] leading-[1.18] ${textCase}`}>
          {value || placeholder || ' '}
        </span>
        <input
          ref={ref}
          id={inputId}
          size={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-labelledby={labelId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`absolute bottom-[0.06em] left-[0.22em] right-[0.22em] top-[0.02em] min-w-0 bg-transparent p-0 leading-[1.18] text-ink caret-ink outline-none placeholder:text-ink/40 focus-visible:outline-none ${textCase}`}
          {...rest}
        />
      </span>
      {trailing}
      {suffix && <span>{suffix}</span>}
      <FieldLabel id={labelId} label={label} status={status} />
    </span>
  )
})


export interface InlineTextHandle {
  focus: () => void
}

export const InlineText = forwardRef<
  InlineTextHandle,
  {
    label: string
    status?: ReactNode
    value: string
    onChange: (v: string) => void
    placeholder: string
    maxLength: number
    invalid?: boolean
    describedBy?: string
    suffix?: ReactNode
  }
>(function InlineText({ label, status, value, onChange, placeholder, maxLength, invalid, describedBy, suffix }, ref) {
  const id = useId()
  const labelId = `${id}-label`
  const el = useRef<HTMLSpanElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => el.current?.focus() }))

  useEffect(() => {
    if (el.current && el.current.textContent !== value) el.current.textContent = value
  }, [value])

  const read = () => {
    const node = el.current
    if (!node) return
    let text = (node.textContent ?? '').replace(/\s+/g, ' ')
    if (text.length > maxLength) {
      text = text.slice(0, maxLength)
      node.textContent = text
      placeCaretAtEnd(node)
    }
    onChange(text.trimStart())
  }

  return (
    <span className="group relative block" data-invalid={invalid || undefined}>
      <span
        ref={el}
        id={id}
        role="textbox"
        aria-multiline="false"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-placeholder={placeholder}
        tabIndex={0}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        onInput={read}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.currentTarget.closest('form') as HTMLFormElement | null)?.requestSubmit()
          }
        }}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s+/g, ' '))
        }}
        className="marker cursor-text text-ink caret-ink outline-none focus-visible:outline-none empty:before:text-ink/40 empty:before:content-[attr(data-placeholder)]"
      />
      {suffix && <span>{suffix}</span>}
      <FieldLabel id={labelId} label={label} status={status} />
    </span>
  )
})

function placeCaretAtEnd(node: HTMLElement) {
  const r = document.createRange()
  r.selectNodeContents(node)
  r.collapse(false)
  const s = window.getSelection()
  s?.removeAllRanges()
  s?.addRange(r)
}
