"use client";

import { Home, MessageSquare, User, Settings, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getCurrentUser } from "@/lib/mock-data";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rooms", label: "Rooms", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar-1");
  const currentUser = getCurrentUser();

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
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      isActive={
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)
                      }
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
               <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                  <SidebarMenuButton tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/profile" passHref legacyBehavior>
                    <SidebarMenuButton tooltip={currentUser.name}>
                       <Avatar className="h-7 w-7">
                          <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      <span>{currentUser.name}</span>
                    </SidebarMenuButton>
                  </Link>
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
            <Link href="/profile">
               <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
          </header>
          <SidebarInset>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
