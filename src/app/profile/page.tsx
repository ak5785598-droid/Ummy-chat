
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import dynamic from 'next/dynamic';

const ProfileView = dynamic(() => import('./[id]/profile-view-glossy').then(mod => mod.ProfileViewGlossy), {
  ssr: false,
  loading: () => <ProfileLoadingView />
});

function ProfileLoadingView() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] space-y-6 font-sans relative">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
        <UmmyLogoIcon className="h-24 w-24 relative z-10 animate-bounce" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white animate-pulse relative z-10">
        Syncing Identity
      </p>
    </div>
  );
}

/**
 * Root Profile Gateway.
 * Correctly identifies the authenticated user and renders their dynamic dashboard.
 */
export default function ProfileGateway() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return <ProfileLoadingView />;
  }

  if (!user) {
    router.replace('/login');
    return <ProfileLoadingView />;
  }

  return <ProfileView profileId={user.uid} mode="editable" />;
}
