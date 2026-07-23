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
import { Sparkles, Crown, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlobalActivityBanner - Ultra Premium System Announcement for Gifts & Wins
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

  let isRecent = false;
  try {
    const timestamp = activeEvent.timestamp;
    if (timestamp) {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      isRecent = date.getTime() > (Date.now() - 60000);
    }
  } catch (err) {
    console.warn("GlobalActivityBanner: Date conversion failed", err);
  }

  if (!isRecent) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 12, opacity: 1, scale: 1 }}
        exit={{ x: -800, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center"
      >
        <div className="w-[94%] max-w-[480px]">
          {/* Metallic Gold 3D Border Wrapper */}
          <div className="p-[1.8px] rounded-[24px] bg-gradient-to-r from-[#FFE89C] via-[#F5C57A] to-[#D08C3A] shadow-[0_4px_25px_rgba(245,197,122,0.45)]">
            <div className="h-[42px] rounded-[22px] bg-gradient-to-r from-[#1E1B4B] via-[#31103F] to-[#0F172A] px-3 flex items-center justify-between overflow-hidden relative backdrop-blur-xl">
              
              {/* Light Sweep Reflection Shine */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full skew-x-[-30deg]"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Left Group: Avatar & Badge */}
              <div className="shrink-0 flex items-center gap-1.5 z-10">
                <div className="h-8 w-8 rounded-full border-[1.5px] border-[#FFE566] bg-[#3b1800] flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                  {activeEvent?.userAvatar ? (
                    <img src={activeEvent.userAvatar} alt="user" className="h-full w-full object-cover" />
                  ) : (
                    <Crown className="h-4 w-4 text-[#FFE566] animate-pulse" />
                  )}
                </div>
                <div className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-[#F5C57A]">
                  <span className="text-[8px] font-black uppercase text-[#FFE566] tracking-wider">ROYAL</span>
                </div>
              </div>

              {/* Center Text Message */}
              <div className="flex-1 px-3 overflow-hidden relative z-10 min-w-0">
                <p className="text-[11px] font-bold text-white tracking-tight truncate">
                  <span className="text-[#FFE566] font-black">{activeEvent.userName}</span>
                  {' sent '}
                  <span className="text-[#FF3B81] font-black uppercase tracking-wider">{activeEvent.giftName}</span>
                  {' in '}
                  <span className="text-[#34D399] font-black">#{activeEvent.roomNumber || activeEvent.roomName || 'Room'}</span>
                </p>
              </div>

              {/* Right Gift Icon */}
              <div className="shrink-0 z-10 pl-1">
                {activeEvent?.giftIcon ? (
                  <img src={activeEvent.giftIcon} alt="gift" className="h-8 w-8 object-contain animate-bounce" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Gift className="h-4.5 w-4.5 text-[#FF3B81]" />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
