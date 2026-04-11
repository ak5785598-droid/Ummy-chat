import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

export async function generateStaticParams() {
  return [];
}

/**
 * THE PROFILE GATEWAY.
 * Wrapping the entire Profile experience into a non-SSR dynamic bundle.
 * This eliminates hydration mismatches from dynamic stats and random particles.
 */
const ProfileView = dynamic(() => import('./profile-view'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Loader className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
        Syncing Identity...
      </p>
    </div>
  )
});

export default async function ProfileGatewayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-white">
      <ProfileView profileId={id} mode="public" />
    </main>
  );
}
