'use client';

import * as React from "react";
import { Settings, ShoppingBag, Mail, Crown, Gamepad2, Power, ShieldAlert, Castle, Home, Users, User, Compass, Ban, X, Loader, Trophy } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";

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
import { useUser, useAuth, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { useUserProfile } from "@/hooks/use-user-profile";
import { UmmyLogoIcon } from "@/components/icons";
import { signOut } from "firebase/auth";
import { FloatingRoomBar } from "@/components/floating-room-bar";
import { RoomMiniPlayer } from "@/components/room-mini-player";
import { BanDialog } from "@/components/ban-dialog";
import { doc, getDoc, writeBatch, serverTimestamp, increment, query, collection, where, runTransaction } from "firebase/firestore";
import { useTranslation } from "@/hooks/use-translation";
import { GlobalActivityBanner } from "@/components/global-activity-banner";
import { DailyQuestsDialog } from "@/components/daily-quests-dialog";

export function AppLayout({ 
 children, 
 hideSidebarOnMobile = false,
 hideBottomNav = false,
 fullScreen = false
}: { 
 children: React.ReactNode; 
 hideSidebarOnMobile?: boolean; 
 hideBottomNav?: boolean; 
 fullScreen?: boolean;
}) {
 const pathname = usePathname();
 const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(user?.uid || undefined);
  const auth = useAuth();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [showQuests, setShowQuests] = useState(false);

  const isOfficial = useMemo(() => 
    userProfile?.tags?.some(tag => ['Admin', 'Official', 'Super Admin'].includes(tag)) || false
  , [userProfile]);

  const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';
  const isCreator = user?.uid === CREATOR_ID;

  useEffect(() => { setMounted(true); }, []);

 // UNREAD SYNC LOGIC
 const unreadChatsQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(collection(firestore, 'privateChats'), where('participantIds', 'array-contains', user.uid));
 }, [firestore, user]);
 
 const { data: chatsForUnread } = useCollection(unreadChatsQuery);
 
 const hasUnread = useMemo(() => {
  if (!chatsForUnread || !user) return false;
  return chatsForUnread.some(chat => {
   const readBy = chat.lastMessageReadBy || [];
   return chat.lastSenderId !== user.uid && !readBy.includes(user.uid);
  });
 }, [chatsForUnread, user]);

  // SEQUENTIAL ID SYSTEM: Permanent Allotment Protocol
 useEffect(() => {
  const syncIdentities = async () => {
   if (!firestore || !user || !userProfile) return;

   const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';
   const currentAccNum = userProfile.accountNumber || '';
   const needsUserSync = !currentAccNum || currentAccNum.length !== 4 || isNaN(parseInt(currentAccNum)) || (user.uid === CREATOR_ID && currentAccNum !== '0000');

   try {
    // 1. User ID Handshake
    if (needsUserSync) {
     const userRef = doc(firestore, 'users', user.uid);
     const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
     const counterRef = doc(firestore, 'appConfig', 'counters');

     await runTransaction(firestore, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextUserId = 1;

      if (user.uid === CREATOR_ID) {
       nextUserId = 0;
      } else {
       const lastId = counterDoc.data()?.lastUserId;
       // Only reset to 1 if it's way out of range (legacy 100001 format)
       if (lastId === undefined || lastId > 5000) nextUserId = 1;
       else nextUserId = lastId + 1;
      }

      const paddedId = nextUserId.toString().padStart(4, '0');
      // Critical: Ensure we don't downgrade the counter if creator relogs
      const newCounterValue = user.uid === CREATOR_ID ? (counterDoc.data()?.lastUserId || 0) : nextUserId;
      transaction.set(counterRef, { lastUserId: newCounterValue }, { merge: true });
      transaction.update(userRef, { accountNumber: paddedId, updatedAt: serverTimestamp() });
      transaction.update(profileRef, { accountNumber: paddedId, updatedAt: serverTimestamp() });
     });
     console.log(`✅ Sequential User ID Synced: ${user.uid}`);
    }

    // 2. Room ID Handshake
    const roomRef = doc(firestore, 'chatRooms', user.uid);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
     const currentRoomNum = roomSnap.data().roomNumber;
     const needsRoomSync = !currentRoomNum || parseInt(currentRoomNum) < 100 || currentRoomNum.length > 4 || (user.uid === CREATOR_ID && currentRoomNum !== '100');
     
     if (needsRoomSync) {
      const counterRef = doc(firestore, 'appConfig', 'counters');
      await runTransaction(firestore, async (transaction) => {
       const counterDoc = await transaction.get(counterRef);
       let nextRoomId = 101;

       if (user.uid === CREATOR_ID) {
        nextRoomId = 100;
       } else {
        const lastId = counterDoc.data()?.lastRoomId;
        if (lastId === undefined || lastId < 100 || lastId > 10000) nextRoomId = 101;
        else nextRoomId = lastId + 1;
       }

       const newCounterValue = user.uid === CREATOR_ID ? (counterDoc.data()?.lastRoomId || 100) : nextRoomId;
       transaction.set(counterRef, { lastRoomId: newCounterValue }, { merge: true });
       transaction.update(roomRef, { roomNumber: nextRoomId.toString(), updatedAt: serverTimestamp() });
      });
      console.log(`✅ Sequential Room ID Synced: ${user.uid}`);
     }
    }
   } catch (err) {
    console.error("[Identity Sync] Handshake failed:", err);
    }
   };
 
   if (isCreator || isOfficial) {
     syncIdentities();
   }
  }, [firestore, user, userProfile, isCreator, isOfficial]);

 const handleLogout = async () => {
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
 };

  if (!mounted) return null;

  // Handle Loading States - but check for ban first
  if (isUserLoading || isProfileLoading) {
    // Check if we have ban error during loading
    if ((profileError as any)?.code === 'permission-denied') {
      return (
        <BanDialog 
          isOpen={true} 
          onClose={handleLogout}
          bannedUntil={null} // Fallback to permanent if we can't read the date
          accountNumber="Restricted"
        />
      );
    }
    // If we're loading, don't show children yet to prevent flashing/errors
    // We could return a SplashScreen here if needed
    return null; 
  }

  // Handle Case where profile read fails due to permission (likely ban)
  if ((profileError as any)?.code === 'permission-denied' || (user && !userProfile && !isProfileLoading && profileError)) {
    console.log('Permission denied detected - showing ban dialog immediately');
    return (
      <BanDialog 
        isOpen={true} 
        onClose={handleLogout}
        bannedUntil={null} // Fallback to permanent if we can't read the date
        accountNumber="Restricted"
      />
    );
  }
  if (
    fullScreen || 
    pathname?.startsWith('/login') || 
    pathname === '/' ||
    pathname === '/terms' ||
    pathname === '/privacy-policy' ||
    pathname === '/refund-policy' ||
    pathname === '/contact' ||
    pathname === '/help-center'
  ) {
    return <main className="h-full w-full relative">{children}</main>;
  }

 const isMainNav = pathname === '/rooms' || 
           pathname === '/discover' || 
           pathname === '/messages' || 
           pathname === '/profile';

  const shouldShowBottomNav = !hideBottomNav && isMainNav && !fullScreen;

  // GLOBAL BAN GUARD: If user is banned, block all content with the Management Message
  if (userProfile?.banStatus?.isBanned) {
    console.log('User is banned:', userProfile.banStatus);
    const until = userProfile.banStatus.bannedUntil?.toDate?.() || null;
    if (!until || until > new Date()) {
      return (
        <BanDialog 
          isOpen={true} 
          onClose={handleLogout}
          bannedUntil={userProfile.banStatus.bannedUntil}
          accountNumber={userProfile.accountNumber}
        />
      );
    }
  }

  return (
   <SidebarProvider defaultOpen={false}>
    <GlobalActivityBanner />
    <Sidebar className="bg-[#140028] border-none text-white">
     <SidebarHeader className="bg-transparent p-6 pb-10 pt-safe">
      <div className="flex items-center gap-3">
       <UmmyLogoIcon className="h-10 w-10" />
       <span className="font-bold text-3xl tracking-tight uppercase text-white">Ummy</span>
      </div>
      <button 
        onClick={() => setShowQuests(true)}
        className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-lg shadow-primary/20 animate-pulse active:scale-90 transition-transform"
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
           {hasUnread && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#140028] animate-pulse" />
           )}
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

     <SidebarInset className="bg-background flex-1 flex flex-col p-0 w-full max-w-full h-screen overflow-hidden">
      <main className={cn(
       "flex-1 w-full overflow-y-auto bg-ummy-gradient relative no-scrollbar overscroll-contain",
      "touch-auto", // Ensure touch events are handled correctly
      shouldShowBottomNav && "pb-32"
     )}
     style={{ WebkitOverflowScrolling: 'touch' }}
     >
      <div className="min-h-full w-full">
       {children}
      </div>
     </main>
     
     {shouldShowBottomNav && (
      <nav 
       style={{ 
        position: 'fixed', 
        bottom: 'calc(env(safe-area-inset-bottom) + 8px)', 
        left: '0',
        right: '0',
        width: '100%',
        zIndex: 999 
       }}
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
         {hasUnread && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1a0b2e] animate-pulse shadow-sm" />
         )}
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
     <FloatingRoomBar />
     <RoomMiniPlayer />
    </SidebarInset>
    <DailyQuestsDialog 
       isOpen={showQuests} 
       onClose={() => setShowQuests(false)} 
     />
   </SidebarProvider>
  );
}
