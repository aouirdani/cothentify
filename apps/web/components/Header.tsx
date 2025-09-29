'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function Header() {
  const { status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (status !== 'authenticated') { setPlan(null); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/proxy/api/v1/me', { signal: ac.signal, cache: 'no-store' });
        if (res.ok) { const j = await res.json(); setPlan(j?.plan ?? null); }
      } catch (error) {
        console.error('[header] failed to load plan', error);
      }
    })();
    return () => ac.abort();
  }, [status]);

  const nav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/content', label: 'Content' },
    { href: '/seo', label: 'SEO' },
    { href: '/pricing', label: 'Pricing' },
  ] as const;
  const isActive = (h: string) => pathname === h || (h !== '/' && pathname?.startsWith(h));

  return (
    <header className="sticky top-0 z-50 mb-8 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight">
          <span className="bg-brand-gradient bg-clip-text text-transparent">Cothentify</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3 py-2 text-sm text-slate-300 hover:text-white relative ${isActive(n.href) ? 'text-white' : ''}`}
              aria-current={isActive(n.href) ? 'page' : undefined}
            >
              {n.label}
              {isActive(n.href) && <span className="absolute left-3 right-3 -bottom-[1px] h-[2px] bg-brand-gradient rounded-full" />}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {mounted && status === 'authenticated' ? (
            <>
              {plan && (
                <Link href="/pricing" className="hover:opacity-80">
                  <Badge className="uppercase tracking-wide bg-white/10 text-white">{plan}</Badge>
                </Link>
              )}
              <Button variant="secondary" size="sm" onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="secondary" size="sm">Log in</Button></Link>
              <Link href="/auth/signup"><Button size="sm" className="bg-brand-gradient">Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
