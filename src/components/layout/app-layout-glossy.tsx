'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import {
 Mail,
 Castle,
 Home,
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
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { DynamicThemeSync } from '@/components/dynamic-theme-sync';
import { motion } from 'framer-motion';

/**
 * THE GLOSSY WHITE LAYOUT
 * Restructured for sticky headers and translucent navigation.
 */
export function AppLayoutGlossy(props: {
 children: React.ReactNode;
 fullScreen?: boolean;
 hideBottomNav?: boolean;
 hideSidebarOnMobile?: boolean;
}) {
  const pathname = usePathname();
  const MAIN_TABS = ['/rooms', '/discover', '/messages', '/profile'];
  const isMainTab = useMemo(() => MAIN_TABS.includes(pathname || ''), [pathname]);

  const {
  children,
  fullScreen = false,
  hideBottomNav = !isMainTab,
  hideSidebarOnMobile = false,
 } = props;
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

 const isRoom = useMemo(() => pathname?.startsWith('/rooms/'), [pathname]);

 const showRealContent = mounted && isHydrated && !isFirebaseLoading && (deterministicAuth || userProfile);

 // SERVER-SIDE / PRE-MOUNT RENDER
 if (!mounted) {
   return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center gap-4",
      isRoom ? "bg-transparent" : ""
    )} style={{ backgroundColor: isRoom ? 'transparent' : 'hsl(var(--background))' }}>
      <Loader className="h-10 w-10 animate-spin text-primary opacity-20" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Locking Reality Shell...</p>
    </div>
   );
 }

 return (
  <SidebarProvider defaultOpen={!deterministicAuth}>
    {/* PERSISTENT MANAGERS */}
    <DynamicThemeSync />
    {!deterministicAuth && isHydrated && <QuestTracker />}

    {/* DESKTOP SIDEBAR */}
    {!deterministicAuth && (
      <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white/80 backdrop-blur-xl transition-all">
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
                    <span className="font-bold uppercase text-xs">{t?.nav?.home || 'Home'}</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/discover'} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/discover" className="flex items-center gap-4">
                    <Compass className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t?.nav?.discover || 'Discover'}</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/messages'} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/messages" className="flex items-center gap-4 relative">
                    <Mail className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t?.nav?.message || 'Message'}</span>
                    <UnreadBadge size="sm" />
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/profile')} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100 active:text-primary">
                  <Link href="/profile" className="flex items-center gap-4">
                    <User className="h-5 w-5" />
                    <span className="font-bold uppercase text-xs">{t?.nav?.me || 'Me'}</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    )}

    <SidebarInset className={cn(
      "flex flex-col min-h-screen relative overflow-hidden",
      (isRoom || pathname === '/rooms') ? "bg-transparent shadow-none" : ""
    )} style={{ backgroundColor: (isRoom || pathname === '/rooms') ? 'transparent' : 'hsl(var(--background))' }}>
      
      {/* THE VISIBLE SHELL */}
      {(!showRealContent) && (
        <div className={cn(
          "absolute inset-0 z-[9999] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500",
          isRoom ? "bg-transparent" : ""
        )} style={{ backgroundColor: isRoom ? 'transparent' : 'hsl(var(--background))' }}>
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Reality...</p>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-opacity duration-700",
          !hideBottomNav && !isRoom ? "pb-20 md:pb-0" : "pb-0",
          !showRealContent ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {children}
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Glossy White Rebuild) */}
      {!deterministicAuth && !hideBottomNav && isMainTab && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden"
        >
          <div className="flex items-center justify-around bg-white/70 backdrop-blur-2xl h-14 border-t border-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] transition-all">
            <Link href="/rooms" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/rooms' ? DESIGN_TOKENS.navActiveTextColor : "text-slate-400")}>
               {pathname === '/rooms' && <motion.div layoutId="bottom-nav-active" className="absolute -top-1 w-8 h-1 bg-slate-900 rounded-full" />}
               <Home className={cn("h-6 w-6", pathname === '/rooms' ? "fill-current" : "")} />
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.home || 'Home'}</span>
            </Link>

            <Link href="/discover" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/discover' ? DESIGN_TOKENS.navActiveTextColor : "text-slate-400")}>
               {pathname === '/discover' && <motion.div layoutId="bottom-nav-active" className="absolute -top-1 w-8 h-1 bg-slate-900 rounded-full" />}
               <Compass className={cn("h-6 w-6", pathname === '/discover' ? "fill-current" : "")} />
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.discover || 'Discover'}</span>
            </Link>

            <Link href="/messages" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/messages' ? "text-slate-900" : "text-slate-300")}>
               {pathname === '/messages' && <motion.div layoutId="bottom-nav-active" className="absolute -top-1 w-8 h-1 bg-slate-900 rounded-full" />}
               <div className="relative">
                 <Mail className={cn("h-6 w-6", pathname === '/messages' ? "fill-current" : "")} />
                 <UnreadBadge size="sm" className="absolute -top-2 -right-2 border-2 border-white" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.message || 'Message'}</span>
            </Link>

            <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname?.startsWith('/profile') ? "text-slate-900" : "text-slate-300")}>
               {pathname?.startsWith('/profile') && <motion.div layoutId="bottom-nav-active" className="absolute -top-1 w-8 h-1 bg-slate-900 rounded-full" />}
               <User className={cn("h-6 w-6", pathname?.startsWith('/profile') ? "fill-current" : "")} />
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.me || 'Me'}</span>
            </Link>
          </div>
        </nav>
      )}

    </SidebarInset>
  </SidebarProvider>
 );
}
