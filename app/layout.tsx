import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/app/providers';
import { Belleza, Alegreya } from 'next/font/google';
import { cn } from '@/lib/utils';

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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFCC00',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-[#FFCC00] h-full w-full">
      <body className={cn(
        "min-h-[100dvh] bg-[#FFCC00] antialiased overflow-hidden select-none touch-manipulation",
        fontHeadline.variable,
        fontBody.variable
      )}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
