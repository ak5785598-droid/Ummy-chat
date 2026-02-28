'use client';

import * as React from "react";
import { Home, Settings, LogOut, ShoppingBag, Mail, Crown, Gamepad2, Menu, Power, User } from "lucide-react";
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
import { useUser, useAuth } from "@/firebase";
import { UmmyLogoIcon } from "@/components/icons";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { FloatingRoomBar } from "@/components/floating-room-bar";

const sidebarItems = [
  { href: "/rooms", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Crown },
  { href: "/games", label: "Game Zone", icon: Gamepad2 },
];

const mobileNavItems = [
  { href: "/rooms", label: "HOME", icon: Home },
  { href: "/messages", label: "MESSAGE", icon: Mail },
  { href: "/profile", label: "MINE", icon: User },
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
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
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

  if (fullScreen || pathname.startsWith('/login') || pathname === '/') {
    return <main className="h-full w-full relative">{children}</main>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-[100dvh] w-full bg-[#FFCC00] font-headline overflow-hidden relative">
        <Sidebar className="bg-[#FFCC00] border-none text-black">
          <SidebarHeader className="bg-transparent p-6 pb-10">
            <div className="flex items-center gap-3">
              <UmmyLogoIcon className="h-10 w-10 drop-shadow-sm" />
              <span className="font-black text-3xl italic tracking-tighter uppercase">
                Ummy
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-transparent px-2">
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className={cn(
                      "hover:bg-black/5 active:scale-95 transition-all h-14 rounded-xl px-4",
                      pathname.startsWith(item.href) && "bg-black/10 font-black"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <item.icon className="h-6 w-6" />
                      <span className="text-base font-black uppercase italic tracking-tight">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="bg-transparent p-6 space-y-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} className="hover:bg-black/5 h-14 rounded-xl mb-2">
                  <Link href="/settings" className="flex items-center gap-4">
                    <Settings className="h-6 w-6" />
                    <span className="text-base font-black uppercase italic tracking-tight">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-4 h-14 w-full text-black hover:bg-black/5 transition-all group"
                >
                  <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center text-[#FFCC00] group-active:scale-90 transition-transform shadow-lg">
                    <Power className="h-5 w-5" />
                  </div>
                  <span className="text-base font-black uppercase italic tracking-tight">Sign Out</span>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#FFCC00] flex-1 overflow-hidden flex flex-col p-0">
          <header className="md:hidden flex items-center justify-between p-4 bg-black/5 backdrop-blur-md h-14 shrink-0 relative z-50">
             <div className="flex items-center gap-2 text-black">
                <UmmyLogoIcon className="h-6 w-6" />
                <span className="font-black italic uppercase tracking-tighter">Ummy</span>
             </div>
             <SidebarTrigger className="text-black hover:bg-black/10 p-2 rounded-full scale-125" />
          </header>
          
          <main className="flex-1 w-full overflow-y-auto bg-white rounded-tl-[2.5rem] shadow-2xl relative no-scrollbar">
            {children}
          </main>

          {/* PORTAL NAVIGATION: HOME, MESSAGE, MINE */}
          {!fullScreen && (
            <nav className="md:hidden flex items-center justify-around bg-white border-t border-gray-100 h-20 pb-safe shrink-0 relative z-50 px-4">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/rooms' && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 transition-all active:scale-90",
                      isActive ? "text-primary" : "text-gray-300"
                    )}
                  >
                    <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                    <span className="text-[10px] font-black uppercase italic tracking-widest">{item.label}</span>
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
