import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Alegreya, Belleza } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontSans = Belleza({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-sans',
});

const fontSerif = Alegreya({
  subsets: ['latin'],
  variable: '--font-serif',
});


export const metadata: Metadata = {
  title: 'Ummy - Find Your Vibe',
  description: 'A voice chat app to connect with people and build communities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontSerif.variable
        )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
