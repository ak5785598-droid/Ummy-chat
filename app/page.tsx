
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

/**
 * Root Application Gateway / Splash Screen.
 * Re-engineered for the Deep-Purple Ummy identity.
 * Synchronized with Global App Loading Background.
 */
export default function Home() {
  const { user, isUserLoading } = useUser();
  const [showFailSafe, setShowFailSafe] = useState(false);
  const router = useRouter();
  
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const loadingBg = config?.appLoadingBackgroundUrl;

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
    <div 
      className="flex h-[100dvh] w-full flex-col items-center justify-center bg-ummy-gradient overflow-hidden relative font-headline select-none touch-none"
      style={loadingBg ? { backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {!loadingBg && <div className="absolute inset-0 bg-white/5 animate-pulse duration-[3000ms]" />}
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="relative h-48 w-48 flex items-center justify-center">
           <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl animate-pulse" />
           <UmmyLogoIcon className="h-full w-full drop-shadow-2xl relative z-10" />
        </div>
        
        <div className="flex flex-col items-center gap-2 mt-4 text-center px-6">
           <h1 className="text-6xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
             Ummy
           </h1>
           <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] opacity-80">
             Connecting Your Tribe
           </p>
        </div>
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
