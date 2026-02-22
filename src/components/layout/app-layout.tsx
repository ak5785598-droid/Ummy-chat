
"use client";

import { Compass, User, Settings, Youtube, ClipboardList, Loader, Trophy, LogOut, ShoppingBag, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, useAuth } from "@/firebase";
import { GameControllerIcon } from "../icons";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";

const navItems = [
  { href: "/rooms", label: "Explore", icon: Compass },
  { href: "/match", label: "Vibe Match", icon: Zap },
  { href: "/store", label: "Boutique", icon: ShoppingBag },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
  { href: "/tasks", label: "Task Center", icon: ClipboardList },
  { href: "/games", label: "Game Zone", icon: GameControllerIcon },
  { href: "/watch", label: "Watch Party", icon: Youtube },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
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

  const displayName = userProfile?.username || user?.displayName || 'User';
  const avatarUrl = userProfile?.avatarUrl || user?.photoURL || '';
  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-headline">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
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

              <SidebarMenuItem className="pt-4 mt-4 border-t border-white/5">
                 {isUserLoading || isProfileLoading ? (
                    <div className="flex items-center justify-center py-4"><Loader className="animate-spin text-primary" /></div>
                 ): user ? (
                    <SidebarMenuButton asChild className="h-16 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-all border border-white/5">
                       <Link href="/profile">
                         <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        <div className="flex flex-col ml-2 overflow-hidden">
                          <span className="font-bold truncate text-sm">{displayName}</span>
                          <span className="text-[10px] opacity-40 uppercase tracking-widest truncate">View Profile</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                 ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col overflow-hidden">
           <header className="flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 md:hidden sticky top-0 z-40 shadow-sm">
            <SidebarTrigger />
            <Logo />
             {user && (
                <Link href="/profile" className="ml-auto">
                 <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
              </Link>
             )}
          </header>
          <SidebarInset>
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-secondary/10 px-4 py-8 md:px-12 md:py-16">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
