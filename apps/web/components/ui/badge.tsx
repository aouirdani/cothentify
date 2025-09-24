import { ReactNode } from 'react';

export function Badge({ children, color = 'neutral' }: { children: ReactNode; color?: 'neutral' | 'accent' | 'danger' | 'success' }) {
  const map: Record<string, string> = {
    neutral: 'bg-[var(--bg-subtle)] text-[var(--fg)] border border-[var(--border)]',
    accent: 'bg-[var(--accent-50)] text-[var(--accent)]',
    danger: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]}`}>{children}</span>;
}
