'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
 Sidebar,
 SidebarContent,
 SidebarHeader,
 SidebarInset,
 SidebarMenu,
 SidebarMenuButton,
 SidebarMenuItem,
 SidebarProvider,
 SidebarFooter,
} from '@/components/ui/sidebar';
import {
 Settings,
 ShoppingBag,
 Mail,
 Crown,
 Gamepad2,
 Power,
 ShieldAlert,
 Castle,
 Home,
 Users,
 User,
 Compass,
 Loader
} from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { QuestTracker } from '@/components/quest-tracker';
import { ActiveRoomManager } from '@/components/active-room-manager';
import { UnreadBadge } from '@/components/unread-badge';

/**
 * THE ELITE NAVIGATION LAYOUT (Recovered & Shielded).
 * Resolves #310 (Hydration) + Restores All Nav Menus (Home, Discovery, Me).
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
 const { t } = useTranslation();
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

    {/* SIDEBAR FOR DESKTOP */}
    {mounted && (
      <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white/80 backdrop-blur-xl">
        <SidebarHeader className="h-16 flex items-center px-4 border-b border-slate-100">
           <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-primary rounded-xl" />
             <span className="font-black uppercase tracking-widest text-slate-900">Ummy</span>
           </div>
        </SidebarHeader>
        <SidebarContent className="px-2 pt-4">
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/rooms'} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/rooms" className="flex items-center gap-4">
                    <Castle className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t.nav.home}</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/discover'} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/discover" className="flex items-center gap-4">
                    <Compass className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t.nav.discover}</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/messages'} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/messages" className="flex items-center gap-4 relative">
                    <Mail className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t.nav.message}</span>
                    <UnreadBadge size="sm" className="absolute top-0 right-0" />
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/profile')} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/profile" className="flex items-center gap-4">
                    <User className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t.nav.me}</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    )}

    <SidebarInset className="bg-[#F8F9FE] flex flex-col min-h-screen relative overflow-hidden">
      
      {/* THE VISIBLE SHELL: Loader absolute overlay */}
      {(!showRealContent) && (
        <div className="absolute inset-0 z-[9999] bg-[#F8F9FE] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Reality...</p>
        </div>
      )}

      {/* THE CHILDREN: Main Content */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-opacity duration-700 pb-20 md:pb-0",
          !showRealContent ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {children}
      </div>

      {/* MOBILE BOTTOM NAVIGATION (RESTORED VICTORY) */}
      {mounted && !deterministicAuth && !hideBottomNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-4 pb-safe-area-inset-bottom"
        >
          <div className="flex items-center justify-around bg-gradient-to-r from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e] h-16 mb-4 rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <Link href="/rooms" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/rooms' ? "text-[#00E5FF]" : "text-white/40")}>
               {pathname === '/rooms' && <div className="absolute -top-2 w-8 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
               <Home className={cn("h-5 w-5", pathname === '/rooms' ? "fill-current" : "")} />
               <span className="text-[8px] font-bold uppercase tracking-tight">{t.nav.home}</span>
            </Link>

            <Link href="/discover" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/discover' ? "text-[#00E5FF]" : "text-white/40")}>
               {pathname === '/discover' && <div className="absolute -top-2 w-8 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
               <Compass className={cn("h-5 w-5", pathname === '/discover' ? "fill-current" : "")} />
               <span className="text-[8px] font-bold uppercase tracking-tight">{t.nav.discover}</span>
            </Link>

            <Link href="/messages" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/messages' ? "text-[#00E5FF]" : "text-white/40")}>
               {pathname === '/messages' && <div className="absolute -top-2 w-8 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
               <div className="relative">
                 <Mail className={cn("h-5 w-5", pathname === '/messages' ? "fill-current" : "")} />
                 <UnreadBadge size="sm" className="absolute -top-2 -right-2" />
               </div>
               <span className="text-[8px] font-bold uppercase tracking-tight">{t.nav.message}</span>
            </Link>

            <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname?.startsWith('/profile') ? "text-[#00E5FF]" : "text-white/40")}>
               {pathname?.startsWith('/profile') && <div className="absolute -top-2 w-8 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
               <User className={cn("h-5 w-5", pathname?.startsWith('/profile') ? "fill-current" : "")} />
               <span className="text-[8px] font-bold uppercase tracking-tight">{t.nav.me}</span>
            </Link>
          </div>
        </nav>
      )}

    </SidebarInset>
  </SidebarProvider>
 );
}
