'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { Loader2 } from 'lucide-react';

/**
 * Root Application Gateway / Splash Screen.
 * Re-engineered to match the high-fidelity tribal blueprint.
 * Background: #FFCC00 (Official Ummy Yellow)
 */
export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Artificial progress sync for high-fidelity experience
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1.2; // Smooth progression
      });
    }, 30);

    if (!isUserLoading) {
      // Delay redirection to show the beautiful splash sequence
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/rooms');
        } else {
          router.replace('/login');
        }
      }, 2800); // 2.8s for maximum visual impact

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [isUserLoading, user, router]);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] overflow-hidden relative font-headline select-none touch-none">
      
      {/* Brand Identity Dimension */}
      <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="relative h-48 w-48 flex items-center justify-center">
           {/* Glossy radial back-glow */}
           <div className="absolute inset-0 bg-white/20 rounded-[3.5rem] blur-3xl animate-pulse" />
           <UmmyLogoIcon className="h-full w-full drop-shadow-[0_15px_50px_rgba(0,0,0,0.15)] relative z-10" />
        </div>
        
        <div className="flex flex-col items-center gap-1 mt-2 text-center">
           <h1 className="text-7xl font-black text-white tracking-[0.1em] uppercase drop-shadow-lg">
             UMMY
           </h1>
           <p className="text-white/90 font-bold uppercase tracking-[0.4em] text-[13px] italic">
             CONNECTING YOUR TRIBE
           </p>
        </div>
      </div>
      
      {/* Social Graph Sync Engine (Bottom) */}
      <div className="absolute bottom-24 flex flex-col items-center gap-6 w-full px-16 max-w-md">
         <div className="h-[5px] w-full bg-white/20 rounded-full overflow-hidden shadow-inner relative border border-white/10">
            <div 
              className="h-full bg-white shadow-[0_0_25px_rgba(255,255,255,1)] transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }} 
            />
         </div>
         <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-white animate-spin opacity-60" />
            <p className="text-[11px] text-white font-black uppercase tracking-[0.5em] italic opacity-80">
                SYNCING SOCIAL GRAPH...
            </p>
         </div>
      </div>

      {/* Atmospheric Environmental Effects */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] h-[60vh] w-[60vw] rounded-full bg-white/5 blur-[150px]" />
         <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-white/5 blur-[150px]" />
      </div>
    </div>
  );
}
