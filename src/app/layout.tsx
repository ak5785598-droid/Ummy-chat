import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Alegreya, Belleza } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';
import Script from 'next/script';

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
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        
        {/* PWA Install Portal */}
        <button 
          id="pwa-install-button" 
          style={{ display: 'none' }}
          className="fixed bottom-32 right-6 z-[1000] bg-[#FFCC00] text-black font-black uppercase italic text-[10px] px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,204,0,0.4)] border-2 border-white animate-in slide-in-from-right-full duration-700 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Install App
        </button>

        <script dangerouslySetInnerHTML={{ __html: `
          let deferredPrompt;
          const installBtn = document.getElementById('pwa-install-button');

          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installBtn) installBtn.style.display = 'flex';
          });

          installBtn?.addEventListener('click', async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome === 'accepted') {
                installBtn.style.display = 'none';
              }
              deferredPrompt = null;
            }
          });

          window.addEventListener('appinstalled', () => {
            if (installBtn) installBtn.style.display = 'none';
            deferredPrompt = null;
          });
        `}} />
      </body>
    </html>
  );
}
