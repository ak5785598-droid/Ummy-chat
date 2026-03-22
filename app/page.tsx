
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

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
        backgroundImage: `url('/images/splash_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Splash content */}
      <div className="absolute w-full bottom-20 flex justify-center z-10 animate-fade-in">
        <p className="text-lg sm:text-xl text-white/90 font-medium tracking-wide drop-shadow-md">
          Connect Your Tribe
        </p>
      </div>

      {/* Remove any extra text or duplicate logos in the bottom area */}
      <div className="hidden" />

      {/* Loading indicator */}
      <div className="absolute bottom-8 flex items-center gap-2">
        <div className="h-2 w-2 bg-white/70 rounded-full animate-pulse" />
        <div className="h-2 w-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="h-2 w-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
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
