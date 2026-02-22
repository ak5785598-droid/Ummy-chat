"use client";

import { Compass, User, Settings, Youtube, ClipboardList, Loader, Trophy, LogOut } from "lucide-react";
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
  { href: "/rooms", label: "Rooms", icon: Compass },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/games", label: "Games", icon: GameControllerIcon },
  { href: "/watch", label: "Watch", icon: Youtube },
  { href: "/profile", label: "Profile", icon: User },
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
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
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.label}
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
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" asChild isActive={pathname.startsWith('/settings')}>
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sign Out" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <LogOut />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem className="pt-4 border-t border-white/5">
                 {isUserLoading || isProfileLoading ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40">Syncing...</span>
                  </div>
                 ): user ? (
                    <SidebarMenuButton tooltip={displayName} asChild className="h-12">
                       <Link href="/profile">
                         <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        <span className="font-bold truncate">{displayName}</span>
                      </Link>
                    </SidebarMenuButton>
                 ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
           <header className="flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 md:hidden sticky top-0 z-40">
            <SidebarTrigger />
            <div className="flex-1">
              <Logo />
            </div>
             {user && (
                <Link href="/profile">
                 <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-md">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
              </Link>
             )}
          </header>
          <SidebarInset>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
