import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Outfit, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

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
};

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 5,
 userScalable: true,
 themeColor: '#FF91B5',
 viewportFit: 'cover',
 interactiveWidget: 'resizes-content',
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html lang="en" suppressHydrationWarning className="bg-[#FF91B5] h-full w-full">
   <body
    className={cn(
     'min-h-screen bg-[#FF91B5] text-slate-900 antialiased touch-manipulation',
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
