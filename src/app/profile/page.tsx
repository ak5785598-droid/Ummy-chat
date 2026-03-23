
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { doc } from 'firebase/firestore';

/**
 * Root Profile Gateway.
 * Correctly identifies the authenticated user and redirects to their dynamic dashboard.
 * Synchronized with Global App Loading Background.
 */
export default function ProfileGateway() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const loadingBg = config?.appLoadingBackgroundUrl;

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace(`/profile/${user.uid}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div 
      className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] space-y-6 font-headline relative"
      style={loadingBg ? { backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
        <UmmyLogoIcon className="h-24 w-24 relative z-10 animate-bounce" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse relative z-10">
        Syncing Identity
      </p>
    </div>
  );
}
