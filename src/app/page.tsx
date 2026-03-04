'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { Loader2 } from 'lucide-react';

/**
 * Root Application Gateway / Splash Screen.
 * Re-engineered to match the official design blueprint exactly.
 * Background: #FFCC00 Yellow
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
        return prev + 2;
      });
    }, 30);

    // Standardized check using isUserLoading naming convention to prevent 404/start issues
    if (!isUserLoading) {
      const destination = user ? '/rooms' : '/login';
      
      // Delay redirection to show the beautiful splash sequence
      const timer = setTimeout(() => {
        router.replace(destination);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [isUserLoading, user, router]);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] overflow-hidden relative font-headline select-none touch-none">
      
      {/* Brand Identity dimension */}
      <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="relative h-44 w-44 flex items-center justify-center">
           {/* Glossy back-glow */}
           <div className="absolute inset-0 bg-white/10 rounded-[3rem] blur-3xl animate-pulse" />
           <UmmyLogoIcon className="h-full w-full drop-shadow-[0_10px_40px_rgba(0,0,0,0.15)] relative z-10" />
        </div>
        
        <div className="flex flex-col items-center gap-1 mt-2 text-center">
           <h1 className="text-6xl font-black text-white tracking-widest uppercase drop-shadow-md">
             Ummy
           </h1>
           <p className="text-white/90 font-bold uppercase tracking-[0.2em] text-[11px]">
             Connecting Your Tribe
           </p>
        </div>
      </div>
      
      {/* Bottom Loading Sync Engine */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4 w-full px-20 max-w-sm">
         <div className="h-[3px] w-full bg-white/20 rounded-full overflow-hidden shadow-inner relative">
            <div 
              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }} 
            />
         </div>
         <div className="flex items-center gap-3 opacity-60">
            <Loader2 className="h-3 w-3 text-white animate-spin" />
            <p className="text-[10px] text-white font-black uppercase tracking-[0.3em] italic">
                Syncing Social Graph...
            </p>
         </div>
      </div>

      {/* Atmospheric Vibe Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
         <div className="absolute top-[10%] left-[10%] h-64 w-64 rounded-full bg-white blur-[100px]" />
         <div className="absolute bottom-[10%] right-[10%] h-64 w-64 rounded-full bg-white blur-[100px]" />
      </div>
    </div>
  );
}