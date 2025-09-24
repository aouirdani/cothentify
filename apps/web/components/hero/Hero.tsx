"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function Hero({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border p-8 shadow-card surface"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[var(--accent-50)] blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[color-mix(in_oklab,var(--accent)_35%,transparent)] blur-3xl" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
