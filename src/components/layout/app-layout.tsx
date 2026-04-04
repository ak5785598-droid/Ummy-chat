'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
 SidebarProvider,
 SidebarInset,
} from '@/components/ui/sidebar';
import {
 Loader
} from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { QuestTracker } from '@/components/quest-tracker';
import { ActiveRoomManager } from '@/components/active-room-manager';

/**
 * DEBUG LOCKDOWN LAYOUT.
 * Disabling All Navigation to isolate Hydration Error #310.
 */
export function AppLayout({
 children,
 fullScreen = false,
 hideBottomNav = false,
 hideSidebarOnMobile = false
}: {
 children: React.ReactNode;
 fullScreen?: boolean;
 hideBottomNav?: boolean;
 hideSidebarOnMobile?: boolean;
}) {
 const pathname = usePathname();
 const { isHydrated, isLoading: isFirebaseLoading } = useFirebase();
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 
 // 🔒 THE MASTER HYDRATION LOCK.
 const [mounted, setMounted] = useState(false);
 useEffect(() => {
   setMounted(true);
 }, []);

 const deterministicAuth = useMemo(() => {
  const AUTH_PAGES = ['/login', '/', '/terms', '/privacy-policy', '/refund-policy', '/contact', '/help-center'];
  if (!isHydrated) return false; 
  return fullScreen || AUTH_PAGES.some(page => pathname === page || (page !== '/' && pathname?.startsWith(page)));
 }, [pathname, fullScreen, isHydrated]);

 const showRealContent = mounted && isHydrated && !isFirebaseLoading && (deterministicAuth || userProfile);

 // SERVER-SIDE / PRE-MOUNT RENDER.
 if (!mounted) {
   return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center gap-4">
      <Loader className="h-10 w-10 animate-spin text-primary opacity-20" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Initializing Reality Shell...</p>
    </div>
   );
 }

 return (
  <SidebarProvider defaultOpen={!deterministicAuth}>
    {/* PERSISTENT MANAGERS */}
    <ActiveRoomManager />
    {!deterministicAuth && isHydrated && mounted && <QuestTracker />}

    {/* NAVIGATION REMOVED FOR DEBUGGING (#310 ISOLATION) */}

    <SidebarInset className="bg-[#F8F9FE] flex flex-col min-h-screen relative overflow-hidden">
      
      {/* THE VISIBLE SHELL */}
      {(!showRealContent) && (
        <div className="absolute inset-0 z-[9999] bg-[#F8F9FE] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Reality...</p>
        </div>
      )}

      {/* THE CHILDREN: Main Content */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-opacity duration-700",
          !showRealContent ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {children}
      </div>

    </SidebarInset>
  </SidebarProvider>
 );
}
