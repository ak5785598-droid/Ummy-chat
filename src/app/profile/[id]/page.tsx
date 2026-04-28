'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

const ProfileView = dynamic(() => import('./profile-view'), {
  ssr: false,
  loading: () => null
});

export default function ProfileGatewayPage({ params }: { params: any }) {
  return (
    <main className="min-h-screen bg-white">
      <ProfileGateway params={params} />
    </main>
  );
}

import { use } from 'react';

function ProfileGateway({ params }: { params: any }) {
  const resolvedParams = use(params) as any;
  return <ProfileView profileId={resolvedParams.id} mode="public" />;
}
