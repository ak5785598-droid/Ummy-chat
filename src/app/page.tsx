'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';
import { SplashScreen as CapacitorSplash } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

/**
 * Splash Screen - Initial Landing Page
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 1. FORCE HIDE NATIVE SPLASH (Screenshot 11 fix)
    // We do this immediately to get rid of the blue logo as fast as possible.
    if (Capacitor.isNativePlatform()) {
      CapacitorSplash.hide();
    }

    // 2. Start animation instantly
    const timer = setTimeout(() => setShowContent(true), 10); // Even faster 10ms

    // SMART REDIRECTION: Only move forward when 
    // 1. Min duration (2s) reached 
    // 2. User info is loaded (No more loading flicker)
    if (!isUserLoading && showContent) {
      const redirectTimer = setTimeout(() => {
        const destination = user ? '/rooms' : '/login';
        router.push(destination);
      }, 2000); 
      return () => clearTimeout(redirectTimer);
    }

    return () => clearTimeout(timer);
  }, [user, isUserLoading, router, showContent]);

  return (
    /* Base background is now themed pink gradient to prevent "Black Flash" (Screenshot 1 fix) */
    <div className="relative h-screen w-full overflow-hidden bg-[#ff8ebb]">
      
      {/* 
        REMOVED PLACEHOLDER LOGIC (Screenshot 12 fix)
        We no longer show a separate square icon state.
        The main animated splash will fade in over the pink background.
      */}

      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key="splash-main"
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative h-full w-full flex flex-col items-center justify-center"
            style={{
              backgroundImage: `url('/images/splash_bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark overlay for better visibility */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Splash content text with its own motion */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="absolute w-full bottom-24 flex flex-col items-center z-10"
            >
              <p className="text-[20px] text-[#222222] font-normal font-sans tracking-normal drop-shadow-sm">
                Ummy - Connect Your Tribe
              </p>

              {/* Animated Loading Indicator */}
              <div className="mt-8 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 1, 0.3] 
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                    className="h-2 w-2 bg-black/40 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
