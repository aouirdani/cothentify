"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, type Locale, resolveInitialLocale } from '../i18n/dictionaries';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const l = resolveInitialLocale();
    setLocaleState(l);
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }

  const t = useMemo(() => {
    const dict = dictionaries[locale] || dictionaries.en;
    return (key: string) => dict[key] ?? dictionaries.en[key] ?? key;
  }, [locale]);

  const value = useMemo<Ctx>(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider');
  return ctx;
}

