"use client";

import * as React from "react";
import { Home, Settings, LogOut, ShoppingBag, Mail, Crown, Gamepad2, Menu } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser, useAuth } from "@/firebase";
import { UmmyLogoIcon } from "@/components/icons";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { FloatingRoomBar } from "@/components/floating-room-bar";

const navItems = [
  { href: "/rooms", label: "HOME", icon: "🏰" },
  { href: "/messages", label: "MESSAGE", icon: "📑" },
  { href: "/profile", label: "MINE", icon: "👑" },
];

const sidebarItems = [
  { href: "/rooms", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Crown },
  { href: "/games", label: "Game Zone", icon: Gamepad2 },
];

function MoreNavButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <button 
      onClick={toggleSidebar}
      className="flex flex-col items-center gap-1 transition-all flex-1 py-1 text-gray-300"
    >
      <div className="scale-100 grayscale">
        <Menu className="h-6 w-6" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-tighter">MORE</span>
    </button>
  );
}

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
  const { user, isLoading: isUserLoading } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const auth = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user && !pathname.startsWith('/login') && pathname !== '/') {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  if (!mounted) return null;

  if (isUserLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#FFCC00]">
        <UmmyLogoIcon className="h-16 w-16 text-white animate-pulse" />
      </div>
    );
  }

  const isAuthExempt = pathname.startsWith('/login') || pathname === '/';

  if (fullScreen) {
    return (
      <div className="h-[100dvh] w-full bg-black font-headline overflow-hidden relative">
        <main className="h-full w-full relative">
          {children}
        </main>
      </div>
    );
  }

  if (isAuthExempt) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-[100dvh] w-full bg-[#FFCC00] font-headline overflow-hidden relative">
        <Sidebar className="bg-white border-r">
          <SidebarHeader className="border-b bg-white p-4">
            <div className="flex items-center gap-2">
              <UmmyLogoIcon className="h-7 w-7"/>
              <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
                Ummy
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-white">
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
          <SidebarFooter className="border-t bg-white p-4">
            <SidebarMenu>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild size="lg" className="bg-primary/5 text-primary border border-primary/20 rounded-xl mb-2">
                    <Link href="/admin">
                      <Settings className="h-5 w-5" />
                      <span>Admin Control</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} size="lg">
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10" size="lg">
                  <LogOut />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden relative bg-[#FFCC00]">
          <SidebarInset className="bg-[#FFCC00] flex-1 overflow-hidden">
            <main className={cn(
              "h-full w-full overflow-y-auto bg-white rounded-t-[2.5rem] md:rounded-none transition-all",
              !hideSidebarOnMobile ? "pb-[calc(72px+env(safe-area-inset-bottom,16px))]" : "pb-0"
            )}>
              {children}
            </main>
          </SidebarInset>

          <FloatingRoomBar />

          {!hideSidebarOnMobile && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 pt-2 pb-[env(safe-area-inset-bottom,16px)] flex justify-between items-center z-[70] h-auto min-h-[72px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
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
                      "flex flex-col items-center gap-1 transition-all flex-1 py-1",
                      active ? "text-gray-900" : "text-gray-300"
                    )}
                  >
                    <div className={cn("transition-transform", active ? "scale-110" : "scale-100 grayscale")}>
                       <span className="text-2xl">{item.icon}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                  </Link>
                );
              })}
              <MoreNavButton />
            </nav>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
