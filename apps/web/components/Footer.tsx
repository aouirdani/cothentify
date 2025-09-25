"use client";
import { useI18n } from './LocaleProvider';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 border-t bg-white/60 py-8 text-sm text-slate-600">
      <div className="container flex flex-col items-center justify-between gap-3 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Cothentify</span>
          <span>© 2025</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="hover:underline">{t('nav.home')}</a>
          <a href="/dashboard" className="hover:underline">{t('nav.dashboard')}</a>
          <a href="/content" className="hover:underline">{t('nav.content')}</a>
          <a href="/pricing" className="hover:underline">{t('nav.pricing')}</a>
          <a href="/privacy" className="hover:underline">{t('nav.privacy')}</a>
          <a href="/terms" className="hover:underline">{t('nav.terms')}</a>
        </div>
      </div>
    </footer>
  );
}
