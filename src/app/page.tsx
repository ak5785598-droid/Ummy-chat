
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

/**
 * Root Application Gateway / Splash Screen.
 * Synchronized with Global App Branding Sync.
 */
export default function Home() {
  const { user, isUserLoading } = useUser();
  const [showFailSafe, setShowFailSafe] = useState(false);
  const router = useRouter();
  
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  
  // High-Fidelity Background Priority Sync
  const activeBg = config?.appLoadingBackgroundUrl || config?.splashScreenUrl || config?.loginBackgroundUrl;

  useEffect(() => {
    const timer = setTimeout(() => setShowFailSafe(true), 2000);

    if (!isUserLoading) {
      const destination = user ? '/rooms' : '/login';
      router.push(destination);

      const hardTimer = setTimeout(() => {
        if (window.location.pathname === '/') {
          window.location.href = destination;
        }
      }, 1000);

      return () => clearTimeout(hardTimer);
    }

    return () => clearTimeout(timer);
  }, [isUserLoading, user, router]);

  const handleManualEntry = () => {
    window.location.href = user ? '/rooms' : '/login';
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#140028] overflow-hidden relative font-headline select-none touch-none">
      
      {/* High-Fidelity Background Dimension */}
      <div className="absolute inset-0 z-0">
         {activeBg ? (
           <Image 
             src={activeBg} 
             fill 
             className="object-cover animate-in fade-in duration-1000" 
             alt="Splash Background" 
             priority 
             unoptimized 
           />
         ) : (
           <div className="absolute inset-0 bg-ummy-gradient animate-pulse duration-[3000ms]" />
         )}
         <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      </div>
      
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 relative z-10 h-full">
        <p className="text-3xl sm:text-4xl text-white font-semibold tracking-wide text-center">
          Connect Your Tribe
        </p>
      </div>
      
      <div className="absolute bottom-24 flex flex-col items-center gap-6 w-full px-12 z-10">
         {showFailSafe ? (
           <Button 
             onClick={handleManualEntry}
             className="bg-primary text-white rounded-full px-10 h-14 font-black uppercase shadow-2xl animate-in zoom-in duration-500 hover:scale-105 active:scale-95 transition-transform"
           >
             Enter Frequency <ArrowRight className="ml-2 h-5 w-5" />
           </Button>
         ) : (
           <div className="flex flex-col items-center gap-4">
              <div className="h-[4px] w-56 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary shadow-[0_0_15px_rgba(255,154,0,0.8)] animate-loading-bar" style={{ width: '45%' }} />
              </div>
              <div className="flex items-center gap-2">
                 <Loader2 className="h-3 w-3 text-white/40 animate-spin" />
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
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
