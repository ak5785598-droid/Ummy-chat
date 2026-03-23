import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Alegreya, Belleza } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

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

export const metadata: Metadata = {
  title: 'Ummy - Connect Your Tribe',
  description: 'Elite real-time social voice chat frequency.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ummy',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-touch-fullscreen': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#140028',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

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
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
