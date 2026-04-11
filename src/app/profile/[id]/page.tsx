import ProfileClientWrapper from './profile-client';

export async function generateStaticParams() {
  return [];
}

/**
 * THE PROFILE GATEWAY.
 * Server component that bridges the static export build and the client-only profile view.
 */
export default async function ProfileGatewayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-white">
      <ProfileClientWrapper id={id} />
    </main>
  );
}
