
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
  const { user, isLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error.message,
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
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

              <SidebarMenuItem>
                 {isLoading ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader className="h-7 w-7 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                 ): user ? (
                    <SidebarMenuButton tooltip={user.displayName || 'Profile'} asChild>
                       <Link href="/profile">
                         <Avatar className="h-7 w-7">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                        <span>{user.displayName}</span>
                      </Link>
                    </SidebarMenuButton>
                 ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
           <header className="flex h-14 items-center gap-4 border-b bg-background px-6 md:hidden">
            <SidebarTrigger />
            <div className="flex-1">
              <Logo />
            </div>
             {user && (
                <Link href="/profile">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
              </Link>
             )}
          </header>
          <SidebarInset>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
