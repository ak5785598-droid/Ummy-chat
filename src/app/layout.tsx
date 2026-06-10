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
  default: 'Ummy Chat - Voice Rooms, Games & Connections',
  template: '%s | Ummy Chat'
 },
 description: 'Experience the ultimate social hub with Ummy Chat. Join lively audio rooms, play interactive games like Ludo and Carrom, send premium virtual gifts, and make lifelong friends online.',
 keywords: ['ummy chat', 'ummy', 'voice rooms', 'social audio', 'carrom', 'ludo', 'live chat', 'friends'],
 authors: [{ name: 'Ummy Chat Team' }],
 openGraph: {
  title: 'Ummy Chat - Voice Rooms, Games & Connections',
  description: 'Experience the ultimate social hub with Ummy Chat. Join lively audio rooms, play interactive games, and make friends.',
  url: 'https://ummychat.in',
  siteName: 'Ummy Chat',
  locale: 'en_IN',
  type: 'website',
 },
 twitter: {
  card: 'summary_large_image',
  title: 'Ummy Chat - Voice Rooms, Games & Connections',
  description: 'Experience the ultimate social hub with Ummy Chat. Join lively audio rooms, play interactive games, and make friends.',
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
