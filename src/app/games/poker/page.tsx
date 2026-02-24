import { AppLayout } from '@/components/layout/app-layout';
import { Ghost } from 'lucide-react';

export default function RemovedPage() {
  return (
    <AppLayout>
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 opacity-20">
        <Ghost className="h-12 w-12" />
        <p className="font-black uppercase italic">Prototype Removed</p>
      </div>
    </AppLayout>
  );
}
