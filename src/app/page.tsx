'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

/**
 * Root Application Gateway / Splash Screen.
 * Re-engineered for absolute stability across all mobile browsers.
 * Uses a single-source redirection protocol to prevent hydration loops.
 */
export default function Home() {
  const { user, isUserLoading } = useUser();
  const [showFailSafe, setShowFailSafe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fail-safe: If auto-redirection doesn't trigger within 2s, show manual entry
    const timer = setTimeout(() => setShowFailSafe(true), 2000);

    if (!isUserLoading) {
      const destination = user ? '/rooms' : '/login';
      
      // Client-side push for smooth transition
      router.push(destination);

      // Hard redirect fallback for stubborn mobile browsers (Android Chrome/In-app)
      const hardTimer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          window.location.href = destination;
        }
      }, 1500);

      return () => clearTimeout(hardTimer);
    }

    return () => clearTimeout(timer);
  }, [isUserLoading, user, router]);

  const handleManualEntry = () => {
    if (typeof window !== 'undefined') {
      window.location.href = user ? '/rooms' : '/login';
    }
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] overflow-hidden relative font-headline select-none touch-none">
      <div className="absolute inset-0 bg-white/5 animate-pulse duration-[3000ms]" />
      
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="relative h-48 w-48 flex items-center justify-center">
           <div className="absolute inset-0 bg-white/20 rounded-[3rem] blur-2xl animate-pulse" />
           <UmmyLogoIcon className="h-full w-full drop-shadow-2xl relative z-10" />
        </div>
        
        <div className="flex flex-col items-center gap-2 mt-4 text-center px-6">
           <h1 className="text-6xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
             Ummy
           </h1>
           <p className="text-white font-black uppercase tracking-[0.5em] text-[10px] opacity-80">
             Connecting Your Tribe
           </p>
        </div>
      </div>
      
      <div className="absolute bottom-24 flex flex-col items-center gap-6 w-full px-12">
         {showFailSafe ? (
           <Button 
             onClick={handleManualEntry}
             className="bg-white text-[#FFCC00] rounded-full px-10 h-14 font-black uppercase shadow-2xl animate-in zoom-in duration-500 hover:scale-105 active:scale-95 transition-transform"
           >
             Enter Frequency <ArrowRight className="ml-2 h-5 w-5" />
           </Button>
         ) : (
           <div className="flex flex-col items-center gap-4">
              <div className="h-[4px] w-56 bg-white/20 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-loading-bar" style={{ width: '45%' }} />
              </div>
              <div className="flex items-center gap-2">
                 <Loader2 className="h-3 w-3 text-white/60 animate-spin" />
                 <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                     Syncing Social Graph...
                 </p>
              </div>
           </div>
         )}
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(250%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
}
