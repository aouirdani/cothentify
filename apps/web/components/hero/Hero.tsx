"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function Hero({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border bg-white/80 p-8 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

