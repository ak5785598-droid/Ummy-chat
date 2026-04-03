'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';

/**
 * Splash Screen - Initial Landing Page
 * Shows with premium entry animations before redirecting to /login or /rooms
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Small delay to ensure initial mount is clean before starting animations
    const entryTimer = setTimeout(() => setShowContent(true), 100);

    const redirectTimer = setTimeout(() => {
      const destination = user ? '/rooms' : '/login';
      router.push(destination);
    }, 3500); // Increased slightly for better animation visibility

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(redirectTimer);
    };
  }, [user, isUserLoading, router]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-[#ff8ebb] via-[#ffade0] to-[#f472b6] flex flex-col items-center justify-center">
      <AnimatePresence>
        {showContent && (
          <>
            {/* Background Decorative Hearts (Motion) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url('/images/splash_bg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(4px) brightness(1.1)',
                transform: 'scale(1.1)'
              }}
            />

            {/* Main Attractive Intro - "Coming from outside to inside" effect */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.34, 1.56, 0.64, 1], // Custom springy ease-out
                delay: 0.2 
              }}
              className="relative z-20 w-[90%] max-w-[400px] aspect-square flex items-center justify-center"
            >
              {/* Fix for Pink Character Cutting: Using Image with object-contain */}
              <div className="relative w-full h-full drop-shadow-[0_20px_50px_rgba(255,20,147,0.3)]">
                <Image 
                  src="/images/splash_bg.png" 
                  alt="Ummy Heroes"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Bottom Content Group */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="absolute bottom-20 left-0 right-0 flex flex-col items-center z-30"
            >
              <h1 className="text-[24px] text-white font-headline tracking-loose drop-shadow-lg mb-8">
                Ummy - Connect Your Tribe
              </h1>

              {/* Animated Loading Bar / Dots */}
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 1, 0.4] 
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                    className="h-2.5 w-2.5 bg-white rounded-full shadow-[0_0_10px_white]"
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Decorative Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none z-10" />
    </div>
  );
}
