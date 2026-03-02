'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageCircle, UserPlus, Star, ShieldCheck, ChevronRight, Search, Loader, Send, ChevronLeft } from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { collection, query, orderBy, where, doc, serverTimestamp, limitToLast } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  // Logic to find the other user's ID with safety checks
  const otherUid = chat.participantIds?.find((id: string) => id !== currentUid) || currentUid;
  const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

  if (isLoading) return (
    <div className="p-4 bg-white rounded-3xl border border-gray-100 flex gap-4 animate-pulse">
      <div className="h-12 w-12 bg-gray-100 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-2 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );

  if (!otherUser) return null;

  return (
    <div 
      onClick={() => onSelect(chat.id, otherUser)}
      className="p-4 bg-white rounded-3xl border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-primary/10">
          <AvatarImage src={otherUser.avatarUrl} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        {otherUser.isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-sm uppercase italic truncate">{otherUser.username}</h3>
          <span className="text-[8px] font-bold text-muted-foreground uppercase">
            {chat.updatedAt ? format(chat.updatedAt.toDate(), 'HH:mm') : 'Now'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {chat.lastSenderId === currentUid ? 'You: ' : ''}{chat.lastMessage || 'Sent a vibe'}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 self-center text-gray-300" />
    </div>
  );
};

const PrivateConversation = ({ chatId, otherUser, onBack, currentUid }: any) => {
  const firestore = useFirestore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'privateChats', chatId, 'messages'), 
      orderBy('timestamp', 'asc'), 
      limitToLast(50)
    );
  }, [firestore, chatId]);

  const { data: messages, isLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollViewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !firestore || !currentUid) return;

    const msgText = text.trim();
    setText('');

    try {
      const chatRef = doc(firestore, 'privateChats', chatId);
      // Update the chat metadata for both users
      updateDocumentNonBlocking(chatRef, {
        lastMessage: msgText,
        lastSenderId: currentUid,
        updatedAt: serverTimestamp()
      });

      // Add message to subcollection
      await addDocumentNonBlocking(collection(firestore, 'privateChats', chatId, 'messages'), {
        text: msgText,
        senderId: currentUid,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Message Sync Error:", e);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-[2.5rem] border border-gray-100 shadow-xl animate-in slide-in-from-right duration-300 overflow-hidden">
      <header className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser.avatarUrl} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-black text-xs uppercase italic tracking-tight">{otherUser.username}</p>
          <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest">{otherUser.isOnline ? 'Online' : 'Frequency Offline'}</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
               <MessageCircle className="h-10 w-10 mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest">No Messages Yet</p>
               <p className="text-[8px] uppercase">Start the tribal vibe.</p>
            </div>
          ) : messages?.map((msg: any) => {
            const isMe = msg.senderId === currentUid;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] px-4 py-2 rounded-[1.2rem] text-sm font-body italic",
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-[8px] mt-1 font-black uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                    {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : 'Syncing'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-gray-50">
        <form onSubmit={handleSend} className="flex gap-2 bg-gray-50 rounded-2xl p-1 pr-2 border border-gray-100">
          <Input 
            placeholder="Type your vibe..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm font-body italic placeholder:text-gray-300"
          />
          <button type="submit" disabled={!text.trim()} className="bg-primary text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform disabled:opacity-30 disabled:grayscale">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<{ id: string; otherUser: any } | null>(null);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'privateChats'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
  }, [firestore, user]);

  const { data: systemMessages, isLoading: isSysLoading } = useCollection(notificationsQuery);
  const { data: chats, isLoading: isChatsLoading } = useCollection(chatsQuery);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700 p-4">
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Messages</h1>
          <div className="flex gap-2">
             <button className="bg-secondary/50 p-2.5 rounded-full"><Search className="h-5 w-5" /></button>
             <button className="bg-secondary/50 p-2.5 rounded-full"><UserPlus className="h-5 w-5" /></button>
          </div>
        </header>

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
             {activeChat ? (
               <PrivateConversation 
                 chatId={activeChat.id} 
                 otherUser={activeChat.otherUser} 
                 currentUid={user?.uid}
                 onBack={() => setActiveChat(null)} 
               />
             ) : (
               <div className="space-y-4">
                 {isChatsLoading ? (
                   <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
                 ) : !chats || chats.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                      <MessageCircle className="h-16 w-16 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">No Recent Conversations</p>
                      <p className="text-[10px] uppercase font-bold mt-1">Start vibing in rooms to find your tribe.</p>
                   </div>
                 ) : (
                   chats.map(chat => (
                     <ChatListItem 
                       key={chat.id} 
                       chat={chat} 
                       currentUid={user?.uid} 
                       onSelect={(id: string, other: any) => setActiveChat({ id, otherUser: other })} 
                     />
                   ))
                 )}
               </div>
             )}
          </TabsContent>

          <TabsContent value="official" className="pt-6 space-y-4">
             {isSysLoading ? (
               <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
             ) : systemMessages?.length === 0 ? (
               <div className="py-20 text-center text-muted-foreground uppercase font-black text-[10px] tracking-widest italic opacity-40">No System Broadcasts</div>
             ) : (
               systemMessages?.map((msg: any) => (
                 <div 
                   key={msg.id} 
                   onClick={() => setSelectedMessage(msg)}
                   className="p-4 bg-white rounded-3xl border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                 >
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                       <UmmyLogoIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <h3 className="font-black text-sm uppercase italic">{msg.title || 'Ummy Assistant'}</h3>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {msg.timestamp ? format(msg.timestamp.toDate(), 'MMM d') : 'Now'}
                          </span>
                       </div>
                       <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 self-center text-gray-300" />
                 </div>
               ))
             )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] md:rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
            <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
               <UmmyLogoIcon className="h-10 w-10" />
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {selectedMessage?.title || 'Official Broadcast'}
              </DialogTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                {selectedMessage?.timestamp ? format(selectedMessage.timestamp.toDate(), 'MMMM d, yyyy • HH:mm') : 'Recently'}
              </p>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 min-h-[200px]">
               <p className="text-lg font-body leading-relaxed text-gray-800 whitespace-pre-wrap italic">
                 {selectedMessage?.content}
               </p>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
               <ShieldCheck className="h-4 w-4 text-green-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Official Ummy Identity Sync Verified</span>
            </div>
          </div>
          <div className="p-8 pt-0">
            <button 
              onClick={() => setSelectedMessage(null)}
              className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              Sync Acknowledged
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}