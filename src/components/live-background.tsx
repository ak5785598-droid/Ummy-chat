'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveBackgroundProps {
  themeId: 'galaxy' | 'stars' | 'love' | 'rain' | 'none';
  className?: string;
}

/**
 * LiveBackground - Optimized room environments.
 * PERFORMANCE REDUCTION: Particle counts reduced by 50% for mobile stability.
 * USES CSS Keyframes where possible to offload from JS main thread.
 */
export function LiveBackground({ themeId, className }: LiveBackgroundProps) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (themeId === 'none') return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none -z-10 overflow-hidden", className)}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes custom-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes custom-rain {
          0% { transform: translateY(-10vh); }
          100% { transform: translateY(110vh); }
        }
        @keyframes custom-float-up {
          0% { transform: translateY(110vh) scale(0.5); opacity: 0; }
          20% { opacity: 0.2; }
          80% { opacity: 0.2; }
          100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
        }
      `}} />

      {themeId === 'galaxy' && (
        <div className="w-full h-full bg-[#030014] relative">
           {/* Pulsing Nebulas - Kept as motion for slow scale (Low Impact) */}
           <motion.div 
             animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full"
           />
           {/* Twinkling Stars - Optimized density 40 -> 20 */}
           <div className="absolute inset-0 opacity-40">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-white rounded-full"
                  style={{
                    top: `${(i * 13) % 100}%`,
                    left: `${(i * 7) % 100}%`,
                    width: '1.5px',
                    height: '1.5px',
                    animation: `custom-twinkle ${2 + (i % 3)}s infinite ease-in-out`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
           </div>
        </div>
      )}

      {themeId === 'stars' && (
        <div className="w-full h-full bg-black relative">
           <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]" />
           {/* Optimized density 60 -> 25 */}
           {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-blue-100 rounded-full blur-[0.5px]"
                style={{
                  top: `${(i * 17) % 100}%`,
                  left: `${(i * 9) % 100}%`,
                  width: '1px',
                  height: '1px',
                  animation: `custom-twinkle ${3 + (i % 4)}s infinite ease-in-out`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
           ))}
        </div>
      )}

      {themeId === 'love' && (
        <div className="w-full h-full bg-rose-950/10 relative">
           {/* Optimized density 15 -> 8 */}
           {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-pink-500/10"
                style={{
                  left: `${(i * 25) % 100}%`,
                  animation: `custom-float-up ${12 + (i % 5)}s infinite linear`,
                  animationDelay: `${i * 1.5}s`
                }}
              >
                 <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
                   <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                 </svg>
              </div>
           ))}
        </div>
      )}

      {themeId === 'rain' && (
        <div className="w-full h-full bg-slate-900/40 relative">
           {/* Optimized density 50 -> 20 and CSS Rain */}
           {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-blue-300/20 w-[1px] h-6"
                style={{
                  left: `${(i * 7) % 100}%`,
                  top: '-10%',
                  animation: 'custom-rain 1.2s infinite linear',
                  animationDelay: `${i * 0.1}s`
                }}
              />
           ))}
        </div>
      )}
    </div>
  );
}
