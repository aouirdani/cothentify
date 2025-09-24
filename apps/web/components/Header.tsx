'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [plan, setPlan] = useState<string | null>(null);
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadPlan() {
      if (status !== 'authenticated') { setPlan(null); return; }
      try {
        const res = await fetch('/api/proxy/api/v1/me');
        if (res.ok) {
          const json = await res.json();
          setPlan(json?.plan || null);
        }
      } catch { /* noop */ }
    }
    loadPlan();
  }, [status]);

  const NavLink = ({ href, label }: { href: Route; label: string }) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)] ${pathname === href ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 mb-8 border-b bg-[color-mix(in_oklab,var(--bg) 80%,transparent)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--bg) 80%,transparent)]">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-[var(--fg)]">
            <span className="text-gradient">Cothentify</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/content" label="Content" />
            <NavLink href="/pricing" label="Pricing" />
          </nav>
        </div>
        <div className="flex items-center gap-3" suppressHydrationWarning>
          {!mounted ? (
            <div className="h-8 w-40" />
          ) : (
            <>
              <button aria-label="Toggle theme" onClick={toggle} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
                {theme === 'dark' ? (
                  <span className="inline-flex items-center gap-1"><SunIcon className="h-4 w-4"/> Light</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><MoonIcon className="h-4 w-4"/> Dark</span>
                )}
              </button>
              {status === 'authenticated' ? (
                <>
                  {plan && (
                    <Link href="/pricing" className="hover:opacity-80">
                      <Badge color="accent">{plan}</Badge>
                    </Link>
                  )}
                  <span className="hidden sm:inline text-sm text-[var(--fg-muted)]">{session?.user?.email}</span>
                  <Link href="/content" className="hidden md:inline"><Button size="sm">New Check</Button></Link>
                  <Button variant="subtle" size="sm" onClick={() => signOut()}>Sign out</Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="subtle" size="sm">Log in</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
