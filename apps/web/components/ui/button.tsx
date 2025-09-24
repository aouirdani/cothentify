'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'subtle' | 'ghost' | 'destructive' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed';
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};
const variants: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white shadow-card hover:bg-[var(--accent-600)] hover:shadow-cardHover',
  subtle: 'bg-[var(--bg-subtle)] text-[var(--fg)] border border-[var(--border)] hover:bg-[color-mix(in_oklab,var(--bg-subtle)_85%,var(--fg))] shadow-soft',
  ghost: 'bg-transparent text-[var(--fg)] hover:bg-[var(--bg-subtle)]',
  destructive: 'bg-[var(--error)] text-white hover:opacity-90',
  secondary: 'bg-[var(--bg-subtle)] text-[var(--fg)] border border-[var(--border)] hover:bg-[color-mix(in_oklab,var(--bg-subtle)_85%,var(--fg))] shadow-soft',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className = '', variant = 'primary', size = 'md', ...props },
  ref,
) {
  return <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
});
