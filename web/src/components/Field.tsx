import type { InputHTMLAttributes, ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
}

export function Field({ label, hint, id, ...rest }: Props) {
  const inputId = id ?? rest.name
  return (
    <label htmlFor={inputId} className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        id={inputId}
        {...rest}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus:border-work focus:outline-none"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const base = 'rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50'
  const v =
    variant === 'primary'
      ? 'bg-work text-white'
      : variant === 'danger'
        ? 'bg-red-600 text-white'
        : 'border border-slate-300 bg-white text-slate-700'
  return (
    <button type="button" {...rest} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  )
}
