'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveBackgroundProps {
  themeId: 'galaxy' | 'stars' | 'love' | 'rain' | 'none';
  className?: string;
}

/**
 * LiveBackground - High-fidelity animated room environments.
 * Uses pure CSS/SVG animations for high performance on mobile.
 * 
 * HYDRATION STABILIZED: All randomness is deferred until after mount.
 */
export function LiveBackground({ themeId, className }: LiveBackgroundProps) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (themeId === 'none') return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none -z-10", className)}>
      {themeId === 'galaxy' && (
        <div className="w-full h-full bg-[#030014] relative overflow-hidden">
           {/* Pulsing Nebulas */}
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
             transition={{ duration: 10, repeat: Infinity }}
             className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 blur-[100px] rounded-full"
           />
           <motion.div 
             animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/30 blur-[120px] rounded-full"
           />
           {/* Twinkling Stars - Deterministic during hydration */}
           <div className="absolute inset-0 opacity-50">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ 
                    duration: hasHydrated ? (Math.random() * 3 + 2) : 2.5, 
                    repeat: Infinity 
                  }}
                  className="absolute bg-white rounded-full"
                  style={{
                    top: hasHydrated ? `${Math.random() * 100}%` : `${(i * 7) % 100}%`,
                    left: hasHydrated ? `${Math.random() * 100}%` : `${(i * 13) % 100}%`,
                    width: hasHydrated ? Math.random() * 2 + 1 : 1.5,
                    height: hasHydrated ? Math.random() * 2 + 1 : 1.5,
                  }}
                />
              ))}
           </div>
        </div>
      )}

      {themeId === 'stars' && (
        <div className="w-full h-full bg-black relative">
           <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]" />
           {[...Array(60)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, 5, 0], scale: [1, 1.1, 1] }}
                transition={{ 
                  duration: hasHydrated ? (Math.random() * 5 + 3) : 4, 
                  repeat: Infinity 
                }}
                className="absolute bg-blue-100 rounded-full blur-[1px]"
                style={{
                  top: hasHydrated ? `${Math.random() * 100}%` : `${(i * 9) % 100}%`,
                  left: hasHydrated ? `${Math.random() * 100}%` : `${(i * 17) % 100}%`,
                  width: hasHydrated ? Math.random() * 2 + 0.5 : 1,
                  height: hasHydrated ? Math.random() * 2 + 0.5 : 1,
                }}
              />
           ))}
        </div>
      )}

      {themeId === 'love' && (
        <div className="w-full h-full bg-rose-950/20 relative overflow-hidden">
           {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: '110%', 
                  x: hasHydrated ? `${Math.random() * 100}%` : `${(i * 15) % 100}%`, 
                  scale: hasHydrated ? (Math.random() * 0.5 + 0.5) : 0.7 
                }}
                animate={{ 
                  y: '-10%', 
                  x: hasHydrated ? `${Math.random() * 100}%` : `${(i * 20) % 100}%` 
                }}
                transition={{ 
                  duration: hasHydrated ? (Math.random() * 10 + 10) : 15, 
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
                className="absolute text-pink-500/20"
              >
                 <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current">
                   <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                 </svg>
              </motion.div>
           ))}
        </div>
      )}

      {themeId === 'rain' && (
        <div className="w-full h-full bg-slate-900/40 relative">
           {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: '-10%', 
                  x: hasHydrated ? `${Math.random() * 100}%` : `${(i * 5) % 100}%` 
                }}
                animate={{ y: '110%' }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  ease: 'linear', 
                  delay: hasHydrated ? (Math.random() * 2) : (i * 0.05) 
                }}
                className="absolute bg-blue-300/30 w-[1px] h-6"
              />
           ))}
        </div>
      )}
    </div>
  );
}
