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
  default: 'Ummy Chat Official - Voice Rooms & Games',
  template: '%s | Ummy Chat Official'
 },
 description: 'Welcome to Ummy Chat Official. The ultimate voice chat platform to meet new people, play Ludo and Carrom, and join live audio rooms. Download the Ummy Chat app now!',
 keywords: ['ummy chat official', 'ummy chat app', 'ummy chat india', 'voice chat rooms', 'social audio', 'carrom game', 'ludo game', 'live audio chat', 'make friends online'],
 authors: [{ name: 'Ummy Chat Official Team' }],
 icons: {
  icon: [
   { url: '/images/ummy-logon.png', sizes: 'any' },
   { url: '/images/ummy-logon.png', sizes: '192x192', type: 'image/png' },
   { url: '/images/ummy-logon.png', sizes: '512x512', type: 'image/png' },
  ],
  shortcut: '/images/ummy-logon.png',
  apple: '/images/ummy-logon.png',
 },
 openGraph: {
  title: 'Ummy Chat Official - Voice Rooms & Games',
  description: 'Welcome to Ummy Chat Official. Join lively audio rooms, play interactive games, and make friends on the best voice chat app.',
  url: 'https://ummychat.in',
  siteName: 'Ummy Chat Official',
  locale: 'en_IN',
  type: 'website',
 },
 twitter: {
  card: 'summary_large_image',
  title: 'Ummy Chat Official - Voice Rooms & Games',
  description: 'Welcome to Ummy Chat Official. Join lively audio rooms, play interactive games, and make friends on the best voice chat app.',
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
    {/* Global GPU-Accelerated Black Background Removal (Chroma Keying) SVG Filter */}
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
     <defs>
      <filter id="remove-black-background">
       <feColorMatrix type="matrix" values="
         1.2 0 0 0 0  
         0 1.2 0 0 0  
         0 0 1.2 0 0  
         1.5 1.5 1.5 0 -0.6" 
       />
      </filter>
     </defs>
    </svg>
   </body>
  </html>
 );
}
