'use client';

import * as React from "react";
import { Settings, ShoppingBag, Mail, Crown, Gamepad2, Power, ShieldAlert, Castle, Home, Users, User, Compass, Loader, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, useCallback } from "react";

import {
 Sidebar,
 SidebarProvider,
 SidebarInset,
 SidebarHeader,
 SidebarContent,
 SidebarMenu,
 SidebarMenuItem,
 SidebarMenuButton,
 SidebarFooter,
} from "@/components/ui/sidebar";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { useUserProfile } from "@/hooks/use-user-profile";
import { UmmyLogoIcon } from "@/components/icons";
import { signOut } from "firebase/auth";
import { FloatingRoomBar } from "@/components/floating-room-bar";
import { RoomMiniPlayer } from "@/components/room-mini-player";
import { BanDialog } from "@/components/ban-dialog";
import { doc, getDoc, writeBatch, serverTimestamp, increment } from "firebase/firestore";
import { useTranslation } from "@/hooks/use-translation";
import { UnreadBadge } from "@/components/unread-badge";
import { DailyQuestsDialog } from "@/components/daily-quests-dialog";
import { QuestTracker } from "@/components/quest-tracker";

/**
 * High-Integrity Application Layout.
 * Re-certified for React 18 Concurrent Mode & SSR Stability.
 * 
 * Fixes Error #310 by maintaining a persistent, non-branching component structure.
 */
export function AppLayout({ 
 children, 
 hideBottomNav = false, 
 fullScreen = false
}: { 
 children: React.ReactNode; 
 hideSidebarOnMobile?: boolean; 
 hideBottomNav?: boolean; 
 fullScreen?: boolean;
}) {
 const pathname = usePathname();
 const { user, isUserLoading } = useUser();
 const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid || undefined);
 const auth = useAuth();
 const firestore = useFirestore();
 const { t } = useTranslation();
 const [showQuests, setShowQuests] = useState(false);

 const isOfficial = useMemo(() => 
   userProfile?.tags?.some(tag => ['Admin', 'Official', 'Super Admin'].includes(tag)) || false
 , [userProfile]);

 const handleLogout = useCallback(async () => {
    if (!auth || !user || !firestore) return;
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userSnap = await getDoc(userRef);
      const currentRoomId = userSnap.data()?.currentRoomId;
      const batch = writeBatch(firestore);
      batch.update(userRef, { isOnline: false, currentRoomId: null, updatedAt: serverTimestamp() });
      batch.update(profileRef, { isOnline: false, currentRoomId: null, updatedAt: serverTimestamp() });
      if (currentRoomId) {
        const roomRef = doc(firestore, 'chatRooms', currentRoomId);
        const participantRef = doc(firestore, 'chatRooms', currentRoomId, 'participants', user.uid);
        batch.delete(participantRef);
        batch.update(roomRef, { participantCount: increment(-1), updatedAt: serverTimestamp() });
      }
      await batch.commit();
      await signOut(auth);
      window.location.href = '/login';
    } catch (error: any) {
      await signOut(auth);
      window.location.href = '/login';
    }
  }, [auth, user, firestore]);

 const isInitialLoading = isUserLoading || (isProfileLoading && !userProfile);
 const isMainNav = pathname === '/rooms' || pathname === '/discover' || pathname === '/messages' || pathname === '/profile';
 const shouldShowBottomNav = !hideBottomNav && isMainNav && !fullScreen;
 
 // AVOID STRUCTRUAL REDIRECT BRANCHES DURING HYDRATION
 const isAuthScreen = fullScreen || pathname?.startsWith('/login') || pathname === '/' || pathname === '/terms' || pathname === '/privacy-policy' || pathname === '/refund-policy' || pathname === '/contact' || pathname === '/help-center';

 // AVOID CONDITIONAL RENDER OF SIDEBAR PROVIDER TO FIX #310
 return (
  <SidebarProvider defaultOpen={!isAuthScreen}>
    {!isAuthScreen && (
      <Sidebar className="bg-[#140028] border-none text-white">
        <SidebarHeader className="bg-transparent p-6 pb-10 pt-safe">
         <div className="flex items-center gap-3">
          <UmmyLogoIcon className="h-10 w-10" />
          <span className="font-bold text-3xl tracking-tight uppercase text-white">Ummy</span>
         </div>
         <button 
           onClick={() => setShowQuests(true)}
           className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-lg shadow-primary/20 animate-pulse active:scale-90 transition-transform mt-4"
         >
           <Trophy className="h-5 w-5" />
         </button>
        </SidebarHeader>
        <SidebarContent className="bg-transparent px-2">
         <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/rooms'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/rooms" className="flex items-center gap-4"><Castle className="h-6 w-6" /><span className="text-base font-bold uppercase ">{t.nav.home}</span></Link></SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem>
           <SidebarMenuButton asChild isActive={pathname === '/messages'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary">
            <Link href="/messages" className="flex items-center gap-4 relative">
             <div className="relative">
              <Mail className="h-6 w-6" />
              <UnreadBadge className="absolute -top-1 -right-1" />
             </div>
             <span className="text-base font-bold uppercase ">{t.nav.message}</span>
            </Link>
           </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/store'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/store" className="flex items-center gap-4"><ShoppingBag className="h-6 w-6" /><span className="text-base font-bold uppercase ">{t.nav.boutique}</span></Link></SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/leaderboard'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/leaderboard" className="flex items-center gap-4"><Crown className="h-6 w-6" /><span className="text-base font-bold uppercase ">{t.nav.rankings}</span></Link></SidebarMenuButton></SidebarMenuItem>
           <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/games'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/games" className="flex items-center gap-4"><Gamepad2 className="h-6 w-6" /><span className="text-base font-bold uppercase ">{t.nav.games}</span></Link></SidebarMenuButton></SidebarMenuItem>
           <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname?.startsWith('/families')} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/families" className="flex items-center gap-4"><Users className="h-6 w-6" /><span className="text-base font-bold uppercase ">Families</span></Link></SidebarMenuButton></SidebarMenuItem>
          {isOfficial && (
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin'} className="h-14 rounded-xl px-4 mt-4 bg-primary/10">
             <Link href="/admin" className="flex items-center gap-4">
              <ShieldAlert className="h-6 w-6 text-primary" />
              <span className="text-base font-bold uppercase text-primary">Admin</span>
             </Link>
            </SidebarMenuButton>
           </SidebarMenuItem>
          )}
         </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="bg-transparent p-6">
         <button onClick={handleLogout} className="flex items-center gap-4 px-4 h-14 w-full text-white/60 hover:text-white">
          <Power className="h-5 w-5" />
          <span className="text-base font-bold uppercase ">{t.nav.signout}</span>
         </button>
        </SidebarFooter>
      </Sidebar>
    )}

    <SidebarInset className={cn(
      "bg-background flex-1 flex flex-col p-0 w-full max-w-full h-screen overflow-hidden",
      isAuthScreen ? "max-w-full" : ""
    )}>
     <main className={cn(
       "flex-1 w-full overflow-y-auto bg-ummy-gradient relative no-scrollbar overscroll-contain", 
       "touch-auto", 
       shouldShowBottomNav && "pb-32"
     )} style={{ WebkitOverflowScrolling: 'touch' }}>
      {!isAuthScreen && <QuestTracker />}
      <div className="min-h-full w-full">
       {isInitialLoading && !isAuthScreen ? (
         <div className="flex flex-col items-center justify-center h-[500px] gap-4 opacity-50">
           <Loader className="h-10 w-10 animate-spin text-primary" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Synchronizing Reality...</p>
         </div>
       ) : children}
      </div>
     </main>

     {!isAuthScreen && shouldShowBottomNav && (
       <nav 
        style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 8px)', left: '0', right: '0', width: '100%', zIndex: 999 }}
        className="flex items-center justify-around bg-gradient-to-r from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e] h-14 shrink-0 px-2 rounded-2xl border-2 border-primary/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
       >
        <Link href="/rooms" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname === '/rooms' ? "text-[#00E5FF]" : "text-white/40")}>
         {pathname === '/rooms' && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
         <Home className={cn("h-5 w-5", pathname === '/rooms' ? "fill-current" : "")} />
         <span className="text-[9px] font-bold uppercase tracking-tight">{t.nav.home}</span>
        </Link>
        <Link href="/discover" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname === '/discover' ? "text-[#00E5FF]" : "text-white/40")}>
         {pathname === '/discover' && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
         <Compass className={cn("h-5 w-5", pathname === '/discover' ? "fill-current" : "")} />
         <span className="text-[9px] font-bold uppercase tracking-tight">{t.nav.discover}</span>
        </Link>
        <Link href="/messages" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname === '/messages' ? "text-[#00E5FF]" : "text-white/40")}>
         {pathname === '/messages' && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
         <div className="relative">
          <Mail className={cn("h-5 w-5", pathname === '/messages' ? "fill-current" : "")} />
          <UnreadBadge size="sm" className="absolute -top-1 -right-1" />
         </div>
         <span className="text-[9px] font-bold uppercase tracking-tight">{t.nav.message}</span>
        </Link>
        <Link href="/profile" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname?.startsWith('/profile') ? "text-[#00E5FF]" : "text-white/40")}>
         {pathname?.startsWith('/profile') && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
         <User className={cn("h-5 w-5", pathname?.startsWith('/profile') ? "fill-current" : "")} />
         <span className="text-[9px] font-bold uppercase tracking-tight">{t.nav.me}</span>
        </Link>
       </nav>
     )}

     {!isAuthScreen && (
       <>
         <FloatingRoomBar />
         <RoomMiniPlayer />
       </>
     )}
    </SidebarInset>

    {!isAuthScreen && userProfile?.banStatus?.isBanned && (
       <BanDialog 
         isOpen={true} 
         onClose={handleLogout} 
         bannedUntil={userProfile.banStatus.bannedUntil} 
         accountNumber={userProfile.accountNumber} 
       />
    )}

    {!isAuthScreen && showQuests && (
      <DailyQuestsDialog isOpen={showQuests} onClose={() => setShowQuests(false)} />
    )}
  </SidebarProvider>
 );
}
