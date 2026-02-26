
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

/**
 * Root Application Entry / Splash Screen.
 * Featuring cinematic reveal animations and fail-safe mobile transitions.
 */
export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [showFailSafe, setShowFailSafe] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fail-safe: If loading takes too long on mobile, show manual entry button
    const failSafeTimer = setTimeout(() => setShowFailSafe(true), 5000);
    return () => clearTimeout(failSafeTimer);
  }, []);

  useEffect(() => {
    if (!isLoading && mounted) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/rooms');
        } else {
          router.replace('/login');
        }
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, router, mounted]);

  const handleManualEntry = () => {
    if (user) router.push('/rooms');
    else router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] overflow-hidden relative font-headline">
      {/* Dynamic Background Pulse */}
      <div className="absolute inset-0 bg-white/5 animate-pulse duration-[3000ms]" />
      
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8 relative z-10">
        <div className="relative h-48 w-48 flex items-center justify-center group">
           <div className="absolute inset-0 bg-white/20 rounded-[3rem] blur-2xl group-hover:bg-white/40 transition-all duration-1000 animate-pulse" />
           <UmmyLogoIcon className="h-full w-full drop-shadow-2xl relative z-10 transition-transform duration-1000 hover:scale-110" />
        </div>
        
        <div className="flex flex-col items-center gap-2 mt-4 text-center">
           <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
             Ummy
           </h1>
           <p className="text-white font-black uppercase tracking-[0.5em] text-[10px] opacity-80 animate-in fade-in duration-1000 delay-500">
             Connecting Your Tribe
           </p>
        </div>
      </div>
      
      <div className="absolute bottom-24 flex flex-col items-center gap-6 w-full px-12">
         {showFailSafe ? (
           <Button 
             onClick={handleManualEntry}
             className="bg-white text-[#FFCC00] rounded-full px-10 h-14 font-black uppercase italic shadow-xl animate-in zoom-in duration-500"
           >
             Enter Frequency <ArrowRight className="ml-2 h-5 w-5" />
           </Button>
         ) : (
           <>
            <div className="h-[3px] w-56 bg-white/20 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-loading-bar" style={{ width: '45%' }} />
            </div>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest animate-pulse">
                Syncing Social Graph...
            </p>
           </>
         )}
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(250%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
}
