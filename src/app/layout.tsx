import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Outfit, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';
import { DESIGN_TOKENS } from '@/lib/design-tokens';

const fontHeadline = Outfit({
 subsets: ['latin'],
 variable: '--font-outfit',
 display: 'swap',
});

const fontBody = Inter({
 subsets: ['latin'],
 variable: '--font-inter',
 display: 'swap',
});

export const metadata: Metadata = {
 metadataBase: new URL('https://ummychat.in'),
 title: {
  default: 'Ummy - Chat, Share, Connect',
  template: '%s | Ummy'
 },
 description: 'Whether you are discussing a punchline or sharing your own stories, Ummy helps you find your crowd and express yourself freely. Join Ummy and make your day.',
 keywords: ['ummy', 'voice chat', 'social audio', 'carrom game', 'real-time chat', 'community'],
 authors: [{ name: 'Ummy Team' }],
 openGraph: {
  title: 'Ummy - Chat, Share, Connect',
  description: 'Elite real-time social voice chat and games.',
  url: 'https://ummychat.in',
  siteName: 'Ummy',
  locale: 'en_US',
  type: 'website',
 },
 twitter: {
  card: 'summary_large_image',
  title: 'Ummy - Chat, Share, Connect',
  description: 'Elite real-time social voice chat and games.',
 },
 manifest: '/manifest.webmanifest',
 appleWebApp: {
  capable: true,
  statusBarStyle: 'black-translucent',
  title: 'Ummy',
  startupImage: [
    '/apple-touch-icon.png',
  ],
 },
 formatDetection: {
  telephone: false,
 },
};

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 1,
 userScalable: false,
 viewportFit: 'cover',
 themeColor: '#ffffff',
 interactiveWidget: 'resizes-content',
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html lang="en" suppressHydrationWarning className="h-full w-full">
   <body
    style={{ backgroundColor: '#ffffff' }}
    className={cn(
     'min-h-screen text-slate-900 antialiased touch-manipulation transition-colors duration-500',
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
