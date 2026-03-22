
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';

/**
 * Splash Screen - Initial Landing Page
 * Shows for 2.5 seconds before redirecting to /login or /rooms
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      const destination = user ? '/rooms' : '/login';
      router.push(destination);
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [user, isUserLoading, router]);

  return (
    <div 
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('/bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content with fade-in animation */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
        
        {/* Logo */}
        <div className="h-32 w-32 sm:h-40 sm:w-40 flex items-center justify-center drop-shadow-2xl">
          <UmmyLogoIcon className="h-full w-full" />
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-7xl font-black text-white drop-shadow-lg tracking-wider">
          UMMY
        </h1>

        {/* Tagline */}
        <p className="text-white/90 text-lg sm:text-2xl font-semibold drop-shadow-md">
          Connect your tribe
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex items-center gap-2">
          <div className="h-2 w-2 bg-white/70 rounded-full animate-pulse" />
          <div className="h-2 w-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="h-2 w-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
