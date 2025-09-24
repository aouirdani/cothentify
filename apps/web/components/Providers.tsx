'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 10000 }}>
        {children}
      </SWRConfig>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </SessionProvider>
  );
}
