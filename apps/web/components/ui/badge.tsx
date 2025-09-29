import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'slate' | 'green' | 'red' | 'blue';
  className?: string;
}

export function Badge({ children, color = 'slate', className = '' }: BadgeProps) {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[color]} ${className}`}>
      {children}
    </span>
  );
}
