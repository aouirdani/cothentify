'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
// Dark mode removed

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [plan, setPlan] = useState<string | null>(null);
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
      } catch {}
    }
    loadPlan();
  }, [status]);

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 ${pathname === href ? 'text-slate-900' : 'text-slate-600'}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="mb-8 rounded-xl border bg-white/90 backdrop-blur shadow-soft">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-slate-900">
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
              {/* Theme toggle removed */}
              {status === 'authenticated' ? (
                <>
                  {plan && (
                    <Link href="/pricing" className="hover:opacity-80">
                      <Badge color="blue">{plan}</Badge>
                    </Link>
                  )}
                  <span className="hidden sm:inline text-sm text-slate-600">{session?.user?.email}</span>
                  <Button variant="secondary" size="sm" onClick={() => signOut()}>Sign out</Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="secondary" size="sm">Log in</Button>
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
