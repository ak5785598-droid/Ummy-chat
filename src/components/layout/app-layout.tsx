"use client";

import { Home, MessageSquare, User, Settings, LogOut, ShoppingBag, ShieldCheck, Mail, Crown, Gamepad2, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
import { useUser, useAuth } from "@/firebase";
import { UmmyLogoIcon, GameControllerIcon } from "../icons";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { FloatingRoomBar } from "../floating-room-bar";
import Image from "next/image";

/**
 * 3D-ish Navigation Icons using emojis/assets to match standard tribe apps.
 */
const CastleEmoji = () => <span className="text-2xl">🏰</span>;
const MessageEmoji = () => <span className="text-2xl">📑</span>;
const CrownEmoji = () => <span className="text-2xl">👑</span>;

/**
 * Universal Tribe Navigation.
 * Synchronized to "Home", "Message", "Mine" as requested.
 */
const navItems = [
  { href: "/rooms", label: "Home", icon: CastleEmoji },
  { href: "/messages", label: "Message", icon: MessageEmoji },
  { href: "/profile", label: "Mine", icon: CrownEmoji },
];

const sidebarItems = [
  { href: "/rooms", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Crown },
  { href: "/games", label: "Game Zone", icon: GameControllerIcon },
];

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
  const { user, isLoading: isUserLoading } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  if (isUserLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#FFCC00]">
        <UmmyLogoIcon className="h-12 w-12 text-white animate-pulse" />
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div className="min-h-[100dvh] w-full bg-black font-headline overflow-hidden relative">
        <main className="h-full w-full relative">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-[#FFCC00] font-headline overflow-hidden relative">
        <Sidebar className="hidden md:flex">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2" aria-label="Ummy Home">
              <UmmyLogoIcon className="h-7 w-7"/>
              <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
                Ummy
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                    size="lg"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Official Panel" size="lg" className="bg-primary/5 text-primary border border-primary/20 rounded-xl mb-2">
                    <Link href="/admin">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Admin Control</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" asChild isActive={pathname.startsWith('/settings')} size="lg">
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sign Out" onClick={handleLogout} className="text-destructive hover:bg-destructive/10" size="lg">
                    <LogOut />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden relative bg-[#FFCC00]">
          <SidebarInset className="bg-[#FFCC00]">
            <main className="flex-1 overflow-y-auto h-[100dvh] pb-28 md:pb-4 bg-white rounded-t-[2.5rem] md:rounded-none">
              {children}
            </main>
          </SidebarInset>

          <FloatingRoomBar />

          {!hideSidebarOnMobile && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-[70] h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              {navItems.map((item) => {
                const isMine = item.href === '/profile' && pathname.startsWith('/profile');
                const isRooms = item.href === '/rooms' && pathname.startsWith('/rooms');
                const isMessages = item.href === '/messages' && pathname.startsWith('/messages');
                const active = pathname === item.href || isMine || isRooms || isMessages;
                
                return (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all flex-1",
                      active ? "text-gray-900" : "text-gray-300"
                    )}
                  >
                    <div className={cn("transition-transform", active ? "scale-110" : "scale-100 grayscale")}>
                       <item.icon />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
