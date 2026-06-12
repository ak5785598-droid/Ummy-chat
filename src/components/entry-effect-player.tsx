'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryEffectProps {
  effect: {
    senderName: string;
    senderAvatar?: string;
    mediaUrl: string;
  } | null;
  onComplete: () => void;
}

export function EntryEffectPlayer({ effect, onComplete }: EntryEffectProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);

  useEffect(() => {
    if (effect) {
      setIsVisible(true);
      setIsVideoEnded(false);
      
      // Safety timeout in case video fails or doesn't have an end event
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [effect, onComplete]);

  const handleVideoEnd = () => {
    setIsVideoEnded(true);
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  if (!effect) return null;

  const isVideo = effect.mediaUrl.match(/\.(mp4|webm|mov)$/i);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Main Effect Media */}
          <div className="relative h-[80vh] w-full max-w-[600px] flex items-center justify-center">
            {isVideo ? (
              <video
                src={effect.mediaUrl}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                style={{ mixBlendMode: 'screen' }} // Ensure black background becomes transparent
              />
            ) : (
              <img
                src={effect.mediaUrl}
                alt="Entry Effect"
                className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              />
            )}
            
            {/* User Announcer Overlay */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute bottom-10 flex items-center gap-3 rounded-full bg-black/40 px-6 py-2 backdrop-blur-md border border-white/20 shadow-2xl"
            >
              {effect.senderAvatar && (
                <img src={effect.senderAvatar} alt="" className="h-10 w-10 rounded-full border-2 border-white/50 object-cover" />
              )}
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none drop-shadow-md">
                  {effect.senderName}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#FCD535] drop-shadow-sm">
                  made a grand entrance!
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
