"use client";

import dynamicImport from 'next/dynamic';
import { AppLayout } from '@/components/layout/app-layout';
import { Loader } from 'lucide-react';

export const dynamic = 'force-dynamic';

const AdminClient = dynamicImport(() => import('./admin-client'), {
  ssr: false,
  loading: () => (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  ),
});

export default function AdminPage() {
  return <AdminClient />;
}
