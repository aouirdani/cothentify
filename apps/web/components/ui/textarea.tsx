'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

const base = 'block w-full min-h-[120px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = '', ...props },
  ref,
) {
  return <textarea ref={ref} className={`${base} ${className}`} {...props} />;
});
