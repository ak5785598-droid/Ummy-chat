'use client';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Alegreya, Belleza } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';
import Script from 'next/script';
import { InstallButton } from '@/components/install-button';

const fontHeadline = Belleza({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-headline',
  display: 'swap',
});

const fontBody = Alegreya({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-[#140028] h-full w-full">
      <body
        className={cn(
          'min-h-[100dvh] bg-[#140028] text-white antialiased touch-manipulation overscroll-none overflow-hidden select-none',
          fontHeadline.variable,
          fontBody.variable
        )}
      >
        <Providers>
          {children}
          <InstallButton />
        </Providers>
        <Toaster />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
