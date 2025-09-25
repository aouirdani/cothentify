import '../styles/globals.css';
import { ReactNode } from 'react';
import Providers from '../components/Providers';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { Plus_Jakarta_Sans } from 'next/font/google';
// Dark mode removed
import { LocaleProvider } from '../components/LocaleProvider';

export const metadata = {
  title: 'Cothentify',
  description: 'Content authenticity platform for agencies',
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
      </head>
      <body className={`min-h-screen antialiased font-sans ${plusJakarta.variable}`}>
        <Providers>
          <LocaleProvider>
            <Header />
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40"></div>
              <div className="container pb-16">{children}</div>
            </div>
            <Footer />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
