'use client';

import * as React from "react";
import { Settings, ShoppingBag, Mail, Crown, Gamepad2, Power, ShieldAlert, Castle, Compass, MessageSquare, User } from "lucide-react";
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

const sidebarItems = [
  { href: "/rooms", label: "Home", icon: Castle },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Crown },
  { href: "/games", label: "Game Zone", icon: Gamepad2 },
];

const mobileNavItems = [
  { href: "/rooms", label: "Rooms", icon: Castle },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/messages", label: "Message", icon: MessageSquare },
  { href: "/profile", label: "Mine", icon: User },
];

/**
 * High-Fidelity Green Smiley SVG Signature for "MINE" tab.
 */
const GreenSmileyIcon = ({ className, active }: { className?: string, active?: boolean }) => (
  <svg viewBox="0 0 100 100" className={cn(className, "transition-all")} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill={active ? "#00FF00" : "#E0E0E0"} />
    <circle cx="35" cy="40" r="5" fill="#000" />
    <circle cx="65" cy="40" r="5" fill="#000" />
    <path d="M 30 65 Q 50 80 70 65" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" />
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
  const { user, isUserLoading } = useUser();
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
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith(item.href)} className={cn("h-14 rounded-xl px-4", pathname?.startsWith(item.href) && "bg-black/10 font-black")}>
                    <Link href={item.href} className="flex items-center gap-4">
                      <item.icon className="h-6 w-6" />
                      <span className="text-base font-black uppercase italic">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href === '/profile' && pathname?.startsWith('/profile'));
                return (
                  <Link key={item.label} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-90", isActive ? "text-[#00FF00]" : "text-gray-300")}>
                    {item.label === 'Mine' ? (
                      <GreenSmileyIcon className="h-7 w-7" active={isActive} />
                    ) : (
                      <item.icon className={cn("h-7 w-7", isActive && "fill-current")} />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
          <FloatingRoomBar />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
