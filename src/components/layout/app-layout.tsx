
"use client";

import { Home, MessageSquare, User, Settings, LogOut, ShoppingBag, ShieldCheck, Zap, Mail, Crown, ScrollText, Trophy } from "lucide-react";
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

const CastleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M2 22V7l2-2V2h3v3l2-2v4l2-2v4l2-2v4l2-2v4l2-2v4l2-2v3l3 3v15H2zm4-4h2v-2H6v2zm0-4h2v-2H6v2zm0-4h2V8H6v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V8h-2v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V8h-2v2z" />
  </svg>
);

const ScrollIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

const MineIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm14 3c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1h16v1z" />
  </svg>
);

const navItems = [
  { href: "/rooms", label: "Rooms", icon: CastleIcon },
  { href: "/messages", label: "Message", icon: ScrollIcon },
  { href: "/profile", label: "Mine", icon: MineIcon },
];

const sidebarItems = [
  { href: "/rooms", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/match", label: "Vibe Match", icon: Zap },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Crown },
  { href: "/tasks", label: "Task Center", icon: ShieldCheck },
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
  const router = useRouter();
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
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <UmmyLogoIcon className="h-12 w-12 text-primary animate-pulse" />
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
      <div className="flex min-h-[100dvh] w-full bg-background font-headline overflow-hidden relative">
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

        <div className="flex flex-1 flex-col overflow-hidden relative">
          <SidebarInset className="bg-background">
            <main className="flex-1 overflow-y-auto h-[100dvh] pb-28 md:pb-4 bg-white">
              {children}
            </main>
          </SidebarInset>

          <FloatingRoomBar />

          {/* High-Fidelity Bottom Navigation */}
          {!hideSidebarOnMobile && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-50 px-8 py-2 flex justify-between items-center z-[70] h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile')) || (item.href === '/rooms' && pathname.startsWith('/rooms')) || (item.href === '/leaderboard' && pathname.startsWith('/leaderboard'));
                return (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    className={cn(
                      "flex flex-col items-center gap-1.5 transition-all",
                      active ? "text-gray-900" : "text-gray-300"
                    )}
                  >
                    <item.icon className={cn("h-7 w-7", active ? "scale-110" : "scale-100")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
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
