"use client";

import { Home, MessageSquare, User, Settings, Youtube, ClipboardList, Trophy, LogOut, ShoppingBag, ShieldCheck, Zap } from "lucide-react";
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
import { Logo } from "@/components/logo";
import { useUser, useAuth } from "@/firebase";
import { UmmyLogoIcon, GameControllerIcon } from "../icons";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { FloatingRoomBar } from "../floating-room-bar";

const navItems = [
  { href: "/rooms", label: "Home", icon: Home },
  { href: "/watch", label: "Watch", icon: MessageSquare },
  { href: "/profile", label: "Me", icon: User },
];

const sidebarItems = [
  { href: "/rooms", label: "Explore", icon: Home },
  { href: "/match", label: "Vibe Match", icon: Zap },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
  { href: "/tasks", label: "Task Center", icon: ClipboardList },
  { href: "/games", label: "Game Zone", icon: GameControllerIcon },
  { href: "/watch", label: "Watch Party", icon: Youtube },
];

export function AppLayout({ 
  children, 
  hideSidebarOnMobile = false 
}: { 
  children: React.ReactNode; 
  hideSidebarOnMobile?: boolean;
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
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <UmmyLogoIcon className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-headline">
        <Sidebar className="hidden md:flex">
          <SidebarHeader>
            <Logo />
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
          <SidebarInset>
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-12">
              {children}
            </main>
          </SidebarInset>

          {/* Floating Minimized Room Bar */}
          <FloatingRoomBar />

          {/* Bottom Mobile Navigation */}
          {!hideSidebarOnMobile && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-[60] rounded-t-3xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile'));
                return (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      active ? "text-primary scale-110" : "text-gray-400"
                    )}
                  >
                    {item.label === 'Home' ? (
                       <div className={cn("p-1.5 rounded-full", active ? "bg-primary/20" : "")}>
                          <UmmyLogoIcon className={cn("h-7 w-7", active ? "text-primary" : "text-gray-400 grayscale")} />
                       </div>
                    ) : (
                      <item.icon className="h-7 w-7" strokeWidth={active ? 3 : 2} />
                    )}
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
