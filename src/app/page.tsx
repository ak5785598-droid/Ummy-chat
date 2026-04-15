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
  const [showContent, setShowContent] = useState(true); // Direct entry

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      const destination = user ? '/rooms' : '/login';
      router.push(destination);
    }, 1500); // 1.5s for fast but premium entry

    return () => clearTimeout(redirectTimer);
  }, [user, isUserLoading, router]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-[#FF91B5] via-[#f472b6] to-[#d946ef]">
      
      {/* Decorative Particle Layer (Subtle vibrancy) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/20 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/20 blur-3xl rounded-full animate-pulse decoration-slow" />
      </div>

      <AnimatePresence>
        <motion.div
           initial={{ scale: 1.1, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
           className="relative h-full w-full flex flex-col items-center justify-center p-8"
        >
          {/* FLOATING CHARACTER CONTAINER (Fixes Cropping) */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-full max-w-[320px] aspect-square rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden border-4 border-white/30 backdrop-blur-sm"
          >
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `url('/images/splash_bg.png')`,
                backgroundSize: '350%', // Re-centering on characters
                backgroundPosition: 'center',
              }}
            />
          </motion.div>

          {/* Splash content text */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute bottom-24 flex flex-col items-center z-10"
          >
            <h2 className="text-[22px] text-white font-black font-sans tracking-tight drop-shadow-md">
              Ummy
            </h2>
            <p className="text-[14px] text-white/90 font-medium tracking-wide">
              Connect Your Tribe
            </p>

            {/* Animated Loading Dots */}
            <div className="mt-8 flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 1, 0.3] 
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="h-1.5 w-1.5 bg-white/60 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
