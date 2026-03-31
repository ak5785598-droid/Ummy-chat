import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Outfit, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// NUCLEAR HYDRATION ISOLATION: 
// Disabling SSR for the entire Provider stack ensures a single, stable client mount.
// This is the definitive fix for React Error #310 hook mismatches.
const Providers = dynamic(() => import('./providers').then(mod => mod.Providers), {
 ssr: false,
});

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
 themeColor: '#F8F9FE',
 viewportFit: 'cover',
 interactiveWidget: 'resizes-content',
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html lang="en" suppressHydrationWarning className="bg-[#F8F9FE] h-full w-full">
   <body
    className={cn(
     'min-h-screen bg-[#F8F9FE] text-slate-900 antialiased touch-manipulation',
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
