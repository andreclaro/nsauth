import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import './globals.css';
import '@/components/layout/Layout.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NSAuth',
  description: 'Nostr Authentication with WebAuthn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="layout">
          <Header />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}

