'use client';

import { useMemo } from 'react';
import { 
  useFirestore, 
  useCollection 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Sparkles, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlobalActivityBanner - A scrolling system-wide announcement for premium events.
 * Listens to the 'globalActivity' collection for legendary gifts and wins.
 */
export function GlobalActivityBanner() {
  const firestore = useFirestore();

  const activityQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'globalActivity'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore]);

  const { data: activities } = useCollection<any>(activityQuery);
  const activeEvent = activities?.[0];

  if (!activeEvent) return null;

  // Only show if it happened in the last 60 seconds
  const isRecent = activeEvent.timestamp?.toDate?.() > new Date(Date.now() - 60000);
  if (!isRecent) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[600] pointer-events-none"
      >
        <div className="w-full max-w-[500px] mx-auto px-4 mt-2">
           <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 backdrop-blur-2xl h-10 rounded-full border border-yellow-500/30 flex items-center shadow-[0_0_30px_rgba(251,191,36,0.2)]">
              {/* Animated Shine */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full skew-x-[45deg]"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="shrink-0 px-3 flex items-center gap-1.5 z-10 border-r border-white/10">
                 <Trophy className="h-4 w-4 text-yellow-400 animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-yellow-400 tracking-tighter">System</span>
              </div>

              <div className="flex-1 px-4 overflow-hidden relative z-10">
                 <motion.div 
                   className="whitespace-nowrap flex items-center gap-2"
                   animate={{ x: [400, -800] }}
                   transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                 >
                    <Sparkles className="h-3 w-3 text-white/40" />
                    <p className="text-[11px] font-bold text-white tracking-tight">
                       WOW! <span className="text-yellow-400">{activeEvent.userName}</span> sent a <span className="text-primary uppercase tracking-tighter">{activeEvent.giftName}</span> in Room <span className="text-emerald-400">#{activeEvent.roomNumber}</span>
                    </p>
                    <Sparkles className="h-3 w-3 text-white/40" />
                 </motion.div>
              </div>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
