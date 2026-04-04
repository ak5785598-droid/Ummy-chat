'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
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
 * THE RE-ENGINEERED NUCLEAR SHELL.
 * Prevents React Hydration Error #310 by maintaining an identical DOM tree.
 * We never unmount children; we use CSS to mask reality until hydration is confirmed.
 */
export function AppLayout({
 children,
 fullScreen = false,
 hideSidebarOnMobile = false
}: {
 children: React.ReactNode;
 fullScreen?: boolean;
 hideSidebarOnMobile?: boolean;
}) {
 const pathname = usePathname();
 const { isHydrated, isLoading } = useFirebase();
 const { user } = useUser();
 const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
 
 // THE HYDRATION LOCK: Only flips on the client after the first pass.
 const [isReady, setIsReady] = useState(false);
 useEffect(() => {
   setIsReady(true);
 }, []);

 const deterministicAuth = useMemo(() => {
  const AUTH_PAGES = ['/login', '/', '/terms', '/privacy-policy', '/refund-policy', '/contact', '/help-center'];
  // IMPORTANT: Mismatch protection for auth status
  if (!isHydrated) return false; 
  return fullScreen || AUTH_PAGES.some(page => pathname === page || (page !== '/' && pathname?.startsWith(page)));
 }, [pathname, fullScreen, isHydrated]);

 // ULTIMATE SYNC: We combine all signals into one 'Truth'
 const showRealContent = isReady && isHydrated && !isLoading && (deterministicAuth || userProfile);

 return (
  <SidebarProvider defaultOpen={!deterministicAuth}>
    {/* PERSISTENT MANAGERS: Always part of the tree */}
    <ActiveRoomManager />
    {!deterministicAuth && isHydrated && isReady && <QuestTracker />}

    <AppSidebar 
      className={cn(
        "transition-opacity duration-500",
        hideSidebarOnMobile ? "hidden md:flex" : "flex",
        !showRealContent ? "opacity-0" : "opacity-100"
      )} 
    />

    <SidebarInset className="bg-[#F8F9FE] flex flex-col min-h-screen relative overflow-hidden">
      
      {/* THE VISIBLE SHELL: Loader is an absolute overlay on top of children */}
      {(!showRealContent) && (
        <div className="absolute inset-0 z-[9999] bg-[#F8F9FE] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Reality... (Stable Shell)</p>
        </div>
      )}

      {/* THE CHILDREN: Always rendered in the DOM tree, even if invisible */}
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
