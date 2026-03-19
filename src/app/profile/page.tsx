
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

/**
 * Root Profile Gateway.
 * Synchronized with Global App Loading Background.
 */
export default function ProfileGateway() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  
  // High-Fidelity Background Priority Sync
  const activeBg = config?.appLoadingBackgroundUrl || config?.splashScreenUrl || config?.loginBackgroundUrl;

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        console.log(`[Identity Gateway] Synchronizing user frequency: ${user.uid}`);
        router.replace(`/profile/${user.uid}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#1B0033] space-y-6 font-headline relative">
      
      <div className="absolute inset-0 z-0">
         {activeBg ? (
           <Image 
             src={activeBg} 
             fill 
             className="object-cover opacity-60 animate-in fade-in duration-1000" 
             alt="Identity Sync" 
             priority 
             unoptimized 
           />
         ) : (
           <div className="absolute inset-0 bg-ummy-gradient opacity-20" />
         )}
         <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
        <UmmyLogoIcon className="h-24 w-24 relative z-10 animate-bounce" />
      </div>
      
      <div className="flex flex-col items-center gap-2 relative z-10">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">
           Syncing Identity
         </p>
         <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-primary animate-loading-bar w-1/2" />
         </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
