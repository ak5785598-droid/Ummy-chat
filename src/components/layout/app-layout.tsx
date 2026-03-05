'use client';

import * as React from "react";
import { Settings, ShoppingBag, Mail, Crown, Gamepad2, Power, ShieldAlert, Castle, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { useUserProfile } from "@/hooks/use-user-profile";
import { UmmyLogoIcon } from "@/components/icons";
import { signOut } from "firebase/auth";
import { FloatingRoomBar } from "@/components/floating-room-bar";
import { doc, getDoc, writeBatch, serverTimestamp, increment } from "firebase/firestore";

/**
 * High-Fidelity Home Nav Icon.
 */
const HomeNavIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 100 100" className="h-7 w-7 transition-all" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="none" stroke={active ? "#000" : "#E0E0E0"} strokeWidth="6" />
    <path d="M 30 65 Q 50 80 70 65" stroke={active ? "#000" : "#E0E0E0"} strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);

/**
 * High-Fidelity Message Nav Icon (Yellow Bubble).
 */
const MessageNavIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 100 100" className="h-7 w-7 transition-all" xmlns="http://www.w3.org/2000/svg">
    <path d="M 10 20 Q 10 10 30 10 L 70 10 Q 90 10 90 20 L 90 60 Q 90 70 70 70 L 40 70 L 20 90 L 20 70 Q 10 70 10 60 Z" fill={active ? "#FFCC00" : "none"} stroke={active ? "#000" : "#E0E0E0"} strokeWidth="6" />
    <circle cx="40" cy="40" r="4" fill={active ? "#000" : "#E0E0E0"} />
    <circle cx="60" cy="40" r="4" fill={active ? "#000" : "#E0E0E0"} />
    <path d="M 45 55 Q 50 60 55 55" stroke={active ? "#000" : "#E0E0E0"} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

/**
 * High-Fidelity Me Nav Icon (Refined Silhouette).
 */
const MeNavIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 100 100" className="h-7 w-7 transition-all" xmlns="http://www.w3.org/2000/svg">
    <path d="M 50 15 Q 50 5 70 5 Q 90 5 90 20 Q 90 40 70 40 Q 50 40 50 30" fill="none" stroke={active ? "#000" : "#E0E0E0"} strokeWidth="6" className="hidden" />
    <circle cx="50" cy="35" r="20" fill="none" stroke={active ? "#000" : "#E0E0E0"} strokeWidth="6" />
    <path d="M 20 85 Q 20 60 50 60 Q 80 60 80 85" fill="none" stroke={active ? "#000" : "#E0E0E0"} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export function AppLayout({ 
  children, 
  hideSidebarOnMobile = false,
  fullScreen = false
}: { 
  children: React.ReactNode; 
  hideSidebarOnMobile?: boolean; 
  fullScreen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const auth = useAuth();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const isInsideRoom = pathname?.startsWith('/rooms/') && pathname !== '/rooms';

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-[100dvh] w-full bg-[#FFCC00] font-headline overflow-hidden relative">
        <Sidebar className="bg-[#FFCC00] border-none text-black">
          <SidebarHeader className="bg-transparent p-6 pb-10">
            <div className="flex items-center gap-3">
              <UmmyLogoIcon className="h-10 w-10" />
              <span className="font-black text-3xl italic tracking-tighter uppercase">Ummy</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-transparent px-2">
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/rooms'} className="h-14 rounded-xl px-4"><Link href="/rooms" className="flex items-center gap-4"><Castle className="h-6 w-6" /><span className="text-base font-black uppercase italic">Home</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/messages'} className="h-14 rounded-xl px-4"><Link href="/messages" className="flex items-center gap-4"><Mail className="h-6 w-6" /><span className="text-base font-black uppercase italic">Messages</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/store'} className="h-14 rounded-xl px-4"><Link href="/store" className="flex items-center gap-4"><ShoppingBag className="h-6 w-6" /><span className="text-base font-black uppercase italic">Boutique</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/leaderboard'} className="h-14 rounded-xl px-4"><Link href="/leaderboard" className="flex items-center gap-4"><Crown className="h-6 w-6" /><span className="text-base font-black uppercase italic">Rankings</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/games'} className="h-14 rounded-xl px-4"><Link href="/games" className="flex items-center gap-4"><Gamepad2 className="h-6 w-6" /><span className="text-base font-black uppercase italic">Game Zone</span></Link></SidebarMenuButton></SidebarMenuItem>
              {isOfficial && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/admin'} className="h-14 rounded-xl px-4 mt-4 bg-red-500/10">
                    <Link href="/admin" className="flex items-center gap-4">
                      <ShieldAlert className="h-6 w-6 text-red-600" />
                      <span className="text-base font-black uppercase italic text-red-600">Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="bg-transparent p-6">
            <button onClick={handleLogout} className="flex items-center gap-4 px-4 h-14 w-full text-black">
              <Power className="h-5 w-5" />
              <span className="text-base font-black uppercase italic">Sign Out</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#FFCC00] flex-1 overflow-hidden flex flex-col p-0">
          <header className="md:hidden flex items-center justify-between p-4 bg-black/5 h-14 shrink-0 relative z-50">
             <div className="flex items-center gap-2 text-black"><UmmyLogoIcon className="h-6 w-6" /><span className="font-black italic uppercase tracking-tighter">Ummy</span></div>
             <SidebarTrigger className="text-black scale-125" />
          </header>
          <main className="flex-1 w-full overflow-y-auto bg-white rounded-tl-[2.5rem] shadow-2xl relative no-scrollbar">{children}</main>
          
          {!isInsideRoom && (
            <nav className="md:hidden flex items-center justify-around bg-white border-t border-gray-100 h-16 pb-safe shrink-0 relative z-50 px-2">
              <Link href="/rooms" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-90", pathname === '/rooms' ? "text-black" : "text-gray-300")}>
                <HomeNavIcon active={pathname === '/rooms'} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
              </Link>
              <Link href="/messages" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-90", pathname === '/messages' ? "text-black" : "text-gray-300")}>
                <MessageNavIcon active={pathname === '/messages'} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Message</span>
              </Link>
              <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-90", pathname?.startsWith('/profile') ? "text-black" : "text-gray-300")}>
                <MeNavIcon active={pathname?.startsWith('/profile')} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Me</span>
              </Link>
            </nav>
          )}
          <FloatingRoomBar />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
