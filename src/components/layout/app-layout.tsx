'use client';

import React, { useMemo, useEffect, useState, Suspense } from 'react';
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
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppLayoutGlossy } from './app-layout-glossy';

/**
 * THE NUCLEAR STABILITY LAYOUT (Final Remediated Version).
 * Resolves #310 (Hydration) by enforcing strict client-only structural logic.
 * Updated for Project Pink: Full-bleed pink background except in rooms.
 */
export function AppLayout(props: {
  children: React.ReactNode;
  fullScreen?: boolean;
  hideBottomNav?: boolean;
  hideSidebarOnMobile?: boolean;
}) {
  const firestore = useFirestore();
  const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
  const { data: config, isLoading } = useDoc(configRef);
  const { isHydrated } = useFirebase();

  // STABILITY LOCK: Removed blocking loader for speed.
  if (!isHydrated || isLoading) {
    return null;
  }

  const theme = config?.appTheme || 'CLASSIC';

  if (theme === 'GLOSSY') {
    return <AppLayoutGlossy {...props} />;
  }

  return <AppLayoutClassic {...props} />;
}

/**
 * THE NUCLEAR STABILITY LAYOUT (Classic Tier).
 */
function AppLayoutClassic(props: {
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
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const deterministicAuth = useMemo(() => {
    const AUTH_PAGES = ['/login', '/', '/terms', '/privacy-policy', '/refund-policy', '/contact', '/help-center'];
    if (!isHydrated) return false; 
    return props.fullScreen || AUTH_PAGES.some(page => pathname === page || (page !== '/' && pathname?.startsWith(page)));
  }, [pathname, props.fullScreen, isHydrated]);

  const isRoom = useMemo(() => pathname?.startsWith('/rooms/'), [pathname]);

  const MAIN_TABS = ['/rooms', '/discover', '/messages', '/profile'];
  const isMainTab = useMemo(() => MAIN_TABS.includes(pathname || ''), [pathname]);

  const {
    children,
    fullScreen = false,
    hideBottomNav = !isMainTab,
    hideSidebarOnMobile = false,
  } = props;

 const showRealContent = mounted && isHydrated && !isFirebaseLoading && (deterministicAuth || userProfile);

  // SERVER-SIDE / PRE-MOUNT RENDER (Clean Shard).
  if (!mounted) {
    return null;
  }

 return (
  <SidebarProvider defaultOpen={!deterministicAuth}>
    {/* PERSISTENT MANAGERS - Shielded by mounted check above */}
    <DynamicThemeSync />
    {!deterministicAuth && isHydrated && <QuestTracker />}

    {/* DESKTOP SIDEBAR (Strictly Client-Side) */}
    {!deterministicAuth && (
      <Sidebar collapsible="icon" className="border-r border-slate-200 bg-slate-50 transition-all">
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
      
      {/* ADDED: Top 20vh Purple Mixing with White Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-purple-500/40 via-white/20 to-transparent pointer-events-none z-0" />


      {/* MAIN CONTENT AREA */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-opacity duration-700",
          !hideBottomNav && !isRoom ? "pb-20 md:pb-0" : "pb-0",
          !showRealContent ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Atomic Shielded Rebuild) */}
      {!deterministicAuth && !hideBottomNav && isMainTab && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#1a0b2e]"
        >
          <div className="flex items-center justify-around min-h-[4rem] pb-safe border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-all">
            <Link href="/rooms" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/rooms' ? DESIGN_TOKENS.navActiveTextColor : "text-white/40")}>
               {pathname === '/rooms' && <div className={cn("absolute -top-2 w-8 h-0.5 rounded-full blur-[1px] animate-pulse", DESIGN_TOKENS.navAccentColor === '#FF91B5' ? 'bg-pink-400' : 'bg-primary')} />}
               <Home className={cn("h-5 w-5", pathname === '/rooms' ? "fill-current" : "")} />
               <span className="text-[8px] font-bold uppercase tracking-tight">{t?.nav?.home || 'Home'}</span>
            </Link>

            <Link href="/discover" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/discover' ? DESIGN_TOKENS.navActiveTextColor : "text-white/40")}>
               {pathname === '/discover' && <div className={cn("absolute -top-2 w-8 h-0.5 rounded-full blur-[1px] animate-pulse", DESIGN_TOKENS.navAccentColor === '#FF91B5' ? 'bg-pink-400' : 'bg-primary')} />}
               <Compass className={cn("h-5 w-5", pathname === '/discover' ? "fill-current" : "")} />
               <span className="text-[8px] font-bold uppercase tracking-tight">{t?.nav?.discover || 'Discover'}</span>
            </Link>

            <Link href="/messages" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname === '/messages' ? DESIGN_TOKENS.navActiveTextColor : "text-white/40")}>
               {pathname === '/messages' && <div className={cn("absolute -top-2 w-8 h-0.5 rounded-full blur-[1px] animate-pulse", DESIGN_TOKENS.navAccentColor === '#FF91B5' ? 'bg-pink-400' : 'bg-primary')} />}
               <div className="relative">
                 <Mail className={cn("h-5 w-5", pathname === '/messages' ? "fill-current" : "")} />
                 <UnreadBadge size="sm" className="absolute -top-2 -right-2" />
               </div>
               <span className="text-[8px] font-bold uppercase tracking-tight">{t?.nav?.message || 'Message'}</span>
            </Link>

            <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative", pathname?.startsWith('/profile') ? DESIGN_TOKENS.navActiveTextColor : "text-white/40")}>
               {pathname?.startsWith('/profile') && <div className={cn("absolute -top-2 w-8 h-0.5 rounded-full blur-[1px] animate-pulse", DESIGN_TOKENS.navAccentColor === '#FF91B5' ? 'bg-pink-400' : 'bg-primary')} />}
               <User className={cn("h-5 w-5", pathname?.startsWith('/profile') ? "fill-current" : "")} />
               <span className="text-[8px] font-bold uppercase tracking-tight">{t?.nav?.me || 'Me'}</span>
            </Link>
          </div>
        </nav>
      )}

    </SidebarInset>
  </SidebarProvider>
 );
}
