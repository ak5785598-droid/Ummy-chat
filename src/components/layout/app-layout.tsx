'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
 SidebarInset,
 SidebarProvider,
} from '@/components/ui/sidebar';
import { useFirebase, useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestTracker } from '@/components/quest-tracker';
import { ActiveRoomManager } from '@/components/active-room-manager';

/**
 * THE RECOVERED HYDRATION LOCKDOWN.
 * Resolves both #310 (Hydration) and Build Failures (Missing AppSidebar).
 * Uses standard primitives to ensure 100% build stability.
 */
export function AppLayout({
 children,
 fullScreen = false,
 hideSidebarOnMobile = false,
 hideBottomNav = false
}: {
 children: React.ReactNode;
 fullScreen?: boolean;
 hideSidebarOnMobile?: boolean;
 hideBottomNav?: boolean;
}) {
 const pathname = usePathname();
 const { isHydrated, isLoading: isFirebaseLoading } = useFirebase();
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 
 // 🔒 THE MASTER LOCK: Only strictly TRUE on the client after mount.
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

 // SERVER-SIDE / PRE-MOUNT RENDER: Return a minimal matched shell.
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

    {/* Note: AppSidebar was a ghost import. We use SidebarInset and internal navigation for now to restore build. */}
    <SidebarInset className="bg-[#F8F9FE] flex flex-col min-h-screen relative overflow-hidden">
      
      {/* THE VISIBLE SHELL: Loader is an absolute overlay */}
      {(!showRealContent) && (
        <div className="absolute inset-0 z-[9999] bg-[#F8F9FE] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Reality...</p>
        </div>
      )}

      {/* THE CHILDREN: Always in the DOM once mounted */}
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
