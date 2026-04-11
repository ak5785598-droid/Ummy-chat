import { FamilyView } from './family-view';
import { AppLayout } from '@/components/layout/app-layout';

export async function generateStaticParams() {
  return [];
}

export default async function FamilyHQGateway({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppLayout>
      <FamilyView familyId={id} />
    </AppLayout>
  );
}
