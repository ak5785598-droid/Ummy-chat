'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';

/**
 * Splash Screen - Initial Landing Page
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Start animation almost instantly
    const timer = setTimeout(() => setShowContent(true), 50);

    const redirectTimer = setTimeout(() => {
      const destination = user ? '/rooms' : '/login';
      router.push(destination);
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [user, isUserLoading, router]);

  return (
    /* Base background is now themed pink gradient to prevent "Black Flash" (Screenshot 1 fix) */
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-[#ff8ebb] via-[#ffade0] to-[#f472b6]">
      
      {/* Attractive Intro Logo - This shows IMMEDIATELY even before JS fully hydrates */}
      {!showContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-48 h-48 rounded-3xl shadow-2xl overflow-hidden animate-pulse border-4 border-white/20"
            style={{
              backgroundImage: `url('/images/splash_bg.png')`,
              backgroundSize: '350%', // Zoomed in on characters
              backgroundPosition: 'center',
            }}
          />
        </div>
      )}

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
