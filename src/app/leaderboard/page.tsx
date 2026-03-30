'use client';

import { 
  useFirestore, 
  useCollection,
  useMemoFirebase
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Sparkles, Trophy, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlobalActivityBanner - Modernized UI Design
 * System-wide announcement for premium events with a sleek, 3D gaming look.
 */
export function GlobalActivityBanner() {
  const firestore = useFirestore();

  const activityQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'globalActivity'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore]);

  const { data: activities } = useCollection<any>(activityQuery, { silent: true });
  const activeEvent = activities?.[0];

  if (!activeEvent) return null;

  // Defensive check for timestamp
  let isRecent = false;
  try {
    const timestamp = activeEvent.timestamp;
    if (timestamp) {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      isRecent = date.getTime() > (Date.now() - 60000); // 60 seconds threshold
    }
  } catch (err) {
    console.warn("GlobalActivityBanner: Date conversion failed", err);
  }

  if (!isRecent) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.9 }}
        className="fixed top-2 left-0 right-0 z-[1000] pointer-events-none px-4"
      >
        <div className="w-full max-w-[450px] mx-auto">
           {/* Modern Container with Neon Border and Glassmorphism */}
           <div className="relative h-12 flex items-center bg-[#0a0a0c]/80 backdrop-blur-xl rounded-2xl border-b-2 border-yellow-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(234,179,8,0.2)] overflow-hidden">
              
              {/* Left Side Icon Area (Gaming Style) */}
              <div className="h-full px-3 flex items-center bg-gradient-to-br from-yellow-500 to-orange-600 relative overflow-hidden shrink-0">
                 <motion.div 
                   animate={{ rotate: [0, 15, -15, 0] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="z-10"
                 >
                    <Trophy className="h-5 w-5 text-black fill-current" />
                 </motion.div>
                 {/* Shine Effect on Icon */}
                 <div className="absolute inset-0 bg-white/20 blur-sm mix-blend-overlay" />
              </div>

              {/* Scrolling Text Content */}
              <div className="flex-1 h-full flex items-center overflow-hidden relative">
                 <motion.div 
                   className="whitespace-nowrap flex items-center gap-4 px-4"
                   animate={{ x: [400, -1000] }}
                   transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                 >
                    {/* Announcement 1 */}
                    <div className="flex items-center gap-2">
                       <Zap className="h-3 w-3 text-yellow-400 fill-current" />
                       <span className="text-[12px] font-black text-white/40 uppercase tracking-tighter">System Alert:</span>
                       <p className="text-[13px] font-bold text-white tracking-tight flex items-center gap-1.5">
                          <span className="text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">{activeEvent.userName}</span> 
                          <span className="text-white/60 font-medium">sent</span> 
                          <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/5 text-blue-400 uppercase text-[11px] font-black italic">
                            {activeEvent.giftName}
                          </span>
                          <span className="text-white/60 font-medium text-[11px]">in Room</span> 
                          <span className="text-emerald-400 font-black">#{activeEvent.roomNumber}</span>
                       </p>
                       <Star className="h-3 w-3 text-yellow-500 animate-pulse" />
                    </div>

                    {/* Duplicate for smooth loop */}
                    <div className="w-20 h-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-2 opacity-60">
                       <Sparkles className="h-3 w-3 text-white/40" />
                       <p className="text-[11px] font-bold text-white/80 uppercase">Legendary Action taking place!</p>
                    </div>
                 </motion.div>

                 {/* Edge Fade Effect */}
                 <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0c] to-transparent z-10" />
                 <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0c] to-transparent z-10" />
              </div>

              {/* Background Animated Particles (Subtle) */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                 <div className="absolute top-0 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
                 <div className="absolute bottom-1 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-bounce" />
              </div>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
