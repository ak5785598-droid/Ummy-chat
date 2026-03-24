'use client';

import * as React from "react";
import { Settings, ShoppingBag, Mail, Crown, Gamepad2, Power, ShieldAlert, Castle, Home, Users, User, Compass } from "lucide-react";
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
import { doc, getDoc, writeBatch, serverTimestamp, increment, query, collection, where, runTransaction } from "firebase/firestore";
import { useTranslation } from "@/hooks/use-translation";

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
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const auth = useAuth();
 const firestore = useFirestore();
 const { t } = useTranslation();
 const [mounted, setMounted] = useState(false);

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

 // INTERNAL ID MIGRATION PROTOCOL
 useEffect(() => {
  const migrateId = async () => {
   if (!firestore || !user || !userProfile) return;
   if ((userProfile as any).isInternalId) return;

   try {
    const userRef = doc(firestore, 'users', user.uid);
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const counterRef = doc(firestore, 'appConfig', 'counters');

    await runTransaction(firestore, async (transaction) => {
     const counterDoc = await transaction.get(counterRef);
     let newId = 100001;
     if (counterDoc.exists()) {
      newId = (counterDoc.data()?.lastUserId || 100000) + 1;
     }
     transaction.set(counterRef, { lastUserId: newId }, { merge: true });
     transaction.update(userRef, { accountNumber: newId.toString(), isInternalId: true, updatedAt: serverTimestamp() });
     transaction.update(profileRef, { accountNumber: newId.toString(), isInternalId: true, updatedAt: serverTimestamp() });
    });
    console.log(`✅ Migrated existing user to Internal ID: ${user.uid}`);
   } catch (err) {
    // Silently skip if transaction fails (another instance might be doing it)
   }
  };
  if (user && userProfile && !(userProfile as any).isInternalId) {
   migrateId();
  }
 }, [firestore, user, userProfile]);

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

 const isOfficial = userProfile?.tags?.some(tag => 
  ['Admin', 'Official', 'Super Admin'].includes(tag)
 );

 if (!mounted) return null;
 if (fullScreen || pathname?.startsWith('/login') || pathname === '/') return <main className="h-full w-full relative">{children}</main>;

 const shouldShowBottomNav = !hideBottomNav;

 return (
  <SidebarProvider defaultOpen={false}>
   <div className="flex h-[100dvh] w-full bg-[#f3e5f5] font-sans overflow-hidden relative">
    <Sidebar className="bg-[#140028] border-none text-white">
     <SidebarHeader className="bg-transparent p-6 pb-10 pt-safe">
      <div className="flex items-center gap-3">
       <UmmyLogoIcon className="h-10 w-10" />
       <span className="font-bold text-3xl tracking-tight uppercase text-white">Ummy</span>
      </div>
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

    <SidebarInset className="bg-background flex-1 flex flex-col p-0 w-full max-w-full h-full overflow-hidden">
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
      <nav className="md:hidden fixed z-[999] bottom-safe left-4 right-4 flex items-center justify-around bg-white/85 backdrop-blur-[24px] h-16 shrink-0 px-2 rounded-full border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] mb-2">
       <Link href="/rooms" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-full active-press relative overflow-hidden", pathname === '/rooms' ? "text-primary" : "text-slate-400")}>
        {pathname === '/rooms' && <div className="absolute inset-0 bg-primary/10 rounded-full animate-in fade-in zoom-in duration-300" />}
        <Home className={cn("h-6 w-6 relative z-10 transition-all duration-300", pathname === '/rooms' ? "fill-primary scale-110" : "")} />
        <span className="text-[9px] font-black uppercase tracking-wider relative z-10">{t.nav.home}</span>
       </Link>
       
       <Link href="/discover" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-full active-press relative overflow-hidden", pathname === '/discover' ? "text-primary" : "text-slate-400")}>
        {pathname === '/discover' && <div className="absolute inset-0 bg-primary/10 rounded-full animate-in fade-in zoom-in duration-300" />}
        <Compass className={cn("h-6 w-6 relative z-10 transition-all duration-300", pathname === '/discover' ? "fill-primary scale-110" : "")} />
        <span className="text-[9px] font-black uppercase tracking-wider relative z-10">{t.nav.discover}</span>
       </Link>
       
       <Link href="/messages" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-full active-press relative overflow-hidden", pathname === '/messages' ? "text-primary" : "text-slate-400")}>
        {pathname === '/messages' && <div className="absolute inset-0 bg-primary/10 rounded-full animate-in fade-in zoom-in duration-300" />}
        <div className="relative z-10">
         <Mail className={cn("h-6 w-6 transition-all duration-300", pathname === '/messages' ? "fill-primary scale-110" : "")} />
         {hasUnread && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
         )}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider relative z-10">{t.nav.message}</span>
       </Link>
       
       <Link href="/profile" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-full active-press relative overflow-hidden", pathname?.startsWith('/profile') ? "text-primary" : "text-slate-400")}>
        {pathname?.startsWith('/profile') && <div className="absolute inset-0 bg-primary/10 rounded-full animate-in fade-in zoom-in duration-300" />}
        <User className={cn("h-6 w-6 relative z-10 transition-all duration-300", pathname?.startsWith('/profile') ? "fill-primary scale-110" : "")} />
        <span className="text-[9px] font-black uppercase tracking-wider relative z-10">{t.nav.me}</span>
       </Link>
      </nav>
     )}
     <FloatingRoomBar />
    </SidebarInset>
   </div>
  </SidebarProvider>
 );
}
