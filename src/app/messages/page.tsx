'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, MessageCircle, UserPlus, Star, ShieldCheck, ChevronRight, Search } from 'lucide-react';
import { useUser, useUserProfile } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UmmyLogoIcon } from '@/components/icons';

/**
 * Message Center - High-fidelity Inbox.
 */
export default function MessagesPage() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);

  const officialMessages = [
    {
      id: 'system-1',
      title: 'Welcome to Ummy Official!',
      content: 'Your Tribe Frequency is now online. Join the Official Hub for support.',
      time: 'Just now',
      isOfficial: true,
    }
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Messages</h1>
          <div className="flex gap-2">
             <button className="bg-secondary/50 p-2.5 rounded-full"><Search className="h-5 w-5" /></button>
             <button className="bg-secondary/50 p-2.5 rounded-full"><UserPlus className="h-5 w-5" /></button>
          </div>
        </header>

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-4">
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                 <Bell className="text-white h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-muted-foreground">Alerts</span>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="h-14 w-14 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                 <Star className="text-white h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-muted-foreground">Moments</span>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="h-14 w-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                 <UserPlus className="text-white h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-muted-foreground">Friends</span>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="h-14 w-14 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                 <ShieldCheck className="text-white h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-muted-foreground">Groups</span>
           </div>
        </div>

        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-100 rounded-none w-full h-12 justify-start gap-8 p-0">
            <TabsTrigger value="chats" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black uppercase text-xs tracking-widest px-0">Chats</TabsTrigger>
            <TabsTrigger value="official" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black uppercase text-xs tracking-widest px-0">Official</TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="pt-6">
             <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <MessageCircle className="h-16 w-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No Recent Conversations</p>
                <p className="text-[10px] uppercase font-bold mt-1">Start vibing in rooms to find your tribe.</p>
             </div>
          </TabsContent>

          <TabsContent value="official" className="pt-6 space-y-4">
             {officialMessages.map((msg) => (
               <div key={msg.id} className="p-4 bg-white rounded-3xl border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                     <UmmyLogoIcon className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                        <h3 className="font-black text-sm uppercase italic">Ummy Assistant</h3>
                        <span className="text-[10px] font-bold text-muted-foreground">{msg.time}</span>
                     </div>
                     <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 self-center text-gray-300" />
               </div>
             ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
