import * as React from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md'
  asChild?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild,
  ...props
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:pointer-events-none'

  const variants: Record<Variant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
  } as const

  const v: Variant = variant
  const s: 'sm' | 'md' = size
  const mergedClassName = cn(base, variants[v], sizes[s], className)

  if (asChild) {
    const onlyChild = React.Children.only(props.children) as React.ReactElement<any>
    return React.cloneElement(onlyChild, {
      className: cn(mergedClassName, onlyChild.props?.className),
    })
  }

  return <button className={mergedClassName} {...props} />
}
