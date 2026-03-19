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
import { doc, getDoc, writeBatch, serverTimestamp, increment, query, collection, where } from "firebase/firestore";
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
      <div className="flex h-[100dvh] w-full bg-[#140028] font-headline overflow-hidden relative">
        <Sidebar className="bg-[#140028] border-none text-white">
          <SidebarHeader className="bg-transparent p-6 pb-10">
            <div className="flex items-center gap-3">
              <UmmyLogoIcon className="h-10 w-10" />
              <span className="font-black text-3xl italic tracking-tighter uppercase text-white">Ummy</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-transparent px-2">
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/rooms'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/rooms" className="flex items-center gap-4"><Castle className="h-6 w-6" /><span className="text-base font-black uppercase italic">{t.nav.home}</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/messages'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary">
                  <Link href="/messages" className="flex items-center gap-4 relative">
                    <div className="relative">
                      <Mail className="h-6 w-6" />
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#140028] animate-pulse" />
                      )}
                    </div>
                    <span className="text-base font-black uppercase italic">{t.nav.message}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/store'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/store" className="flex items-center gap-4"><ShoppingBag className="h-6 w-6" /><span className="text-base font-black uppercase italic">{t.nav.boutique}</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/leaderboard'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/leaderboard" className="flex items-center gap-4"><Crown className="h-6 w-6" /><span className="text-base font-black uppercase italic">{t.nav.rankings}</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/games'} className="h-14 rounded-xl px-4 text-white hover:bg-white/5 active:text-primary"><Link href="/games" className="flex items-center gap-4"><Gamepad2 className="h-6 w-6" /><span className="text-base font-black uppercase italic">{t.nav.games}</span></Link></SidebarMenuButton></SidebarMenuItem>
              {isOfficial && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/admin'} className="h-14 rounded-xl px-4 mt-4 bg-primary/10">
                    <Link href="/admin" className="flex items-center gap-4">
                      <ShieldAlert className="h-6 w-6 text-primary" />
                      <span className="text-base font-black uppercase italic text-primary">Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="bg-transparent p-6">
            <button onClick={handleLogout} className="flex items-center gap-4 px-4 h-14 w-full text-white/60 hover:text-white">
              <Power className="h-5 w-5" />
              <span className="text-base font-black uppercase italic">{t.nav.signout}</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background flex-1 overflow-x-hidden flex flex-col p-0 w-full max-w-full h-full">
          <main className={cn(
            "flex-1 w-full overflow-y-auto bg-ummy-gradient relative no-scrollbar",
            shouldShowBottomNav && "pb-28"
          )}>
            <div className="min-h-full w-full">
              {children}
            </div>
          </main>
          
          {shouldShowBottomNav && (
            <nav 
              style={{ 
                position: 'fixed', 
                bottom: 'calc(env(safe-area-inset-bottom) + 12px)', 
                left: '5%', 
                right: '5%', 
                zIndex: 999 
              }}
              className="md:hidden flex items-center justify-around bg-gradient-to-r from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e] h-14 shrink-0 px-2 rounded-[2rem] border-2 border-primary/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              <Link href="/rooms" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname === '/rooms' ? "text-[#00E5FF]" : "text-white/40")}>
                {pathname === '/rooms' && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
                <Home className={cn("h-5 w-5", pathname === '/rooms' ? "fill-current" : "")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{t.nav.home}</span>
              </Link>
              <Link href="/discover" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname === '/discover' ? "text-[#00E5FF]" : "text-white/40")}>
                {pathname === '/discover' && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
                <Compass className={cn("h-5 w-5", pathname === '/discover' ? "fill-current" : "")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{t.nav.discover}</span>
              </Link>
              <Link href="/messages" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname === '/messages' ? "text-[#00E5FF]" : "text-white/40")}>
                {pathname === '/messages' && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
                <div className="relative">
                  <Mail className={cn("h-5 w-5", pathname === '/messages' ? "fill-current" : "")} />
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1a0b2e] animate-pulse shadow-sm" />
                  )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter">{t.nav.message}</span>
              </Link>
              <Link href="/profile" className={cn("flex flex-col items-center gap-0.5 p-1.5 transition-all active:scale-90 relative", pathname?.startsWith('/profile') ? "text-[#00E5FF]" : "text-white/40")}>
                {pathname?.startsWith('/profile') && <div className="absolute -top-1 w-10 h-0.5 bg-[#00E5FF] rounded-full blur-[1px] animate-pulse" />}
                <User className={cn("h-5 w-5", pathname?.startsWith('/profile') ? "fill-current" : "")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{t.nav.me}</span>
              </Link>
            </nav>
          )}
          <FloatingRoomBar />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
