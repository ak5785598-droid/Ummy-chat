'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageCircle, UserPlus, Star, ShieldCheck, ChevronRight, Search, Loader, Send, ChevronLeft, ClipboardList } from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';
import { collection, query, orderBy, where, doc, serverTimestamp, limitToLast } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
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
import Image from 'next/image';

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  const participantIds = chat.participantIds || [];
  const otherUid = participantIds.find((id: string) => id !== currentUid) || currentUid;
  const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

  if (isLoading) return (
    <div className="px-6 py-4 flex gap-4 animate-pulse">
      <div className="h-14 w-14 bg-gray-100 rounded-full" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );

  if (!otherUser) return null;

  const displayTime = chat.updatedAt ? (
    isToday(chat.updatedAt.toDate()) 
      ? format(chat.updatedAt.toDate(), 'HH:mm') 
      : format(chat.updatedAt.toDate(), 'MMM d')
  ) : 'Syncing';

  return (
    <div 
      onClick={() => onSelect(chat.id, otherUser)}
      className="px-6 py-4 flex gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 border border-gray-100 shadow-sm">
          <AvatarImage src={otherUser.avatarUrl} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        {otherUser.isOnline && (
          <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-black text-[15px] text-gray-900 truncate tracking-tight">
            {otherUser.username}
          </h3>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            {displayTime}
          </span>
        </div>
        <p className="text-[13px] text-gray-400 truncate italic font-body">
          {chat.lastMessage || 'Sent a vibe'}
        </p>
      </div>
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !firestore || !currentUid) return;

    const msgText = text.trim();
    setText('');

    const chatRef = doc(firestore, 'privateChats', chatId);
    updateDocumentNonBlocking(chatRef, {
      lastMessage: msgText,
      lastSenderId: currentUid,
      updatedAt: serverTimestamp()
    });

    addDocumentNonBlocking(collection(firestore, 'privateChats', chatId, 'messages'), {
      text: msgText,
      senderId: currentUid,
      timestamp: serverTimestamp()
    });
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden font-headline">
      <header className="p-4 border-b border-gray-50 flex items-center gap-3 bg-white/80 backdrop-blur-md">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="h-6 w-6 text-gray-600" /></button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatarUrl} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-black text-sm uppercase italic tracking-tight">{otherUser.username}</p>
          <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">{otherUser.isOnline ? 'Active' : 'Offline'}</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
               <MessageCircle className="h-12 w-12 mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest">No Message History</p>
            </div>
          ) : messages?.map((msg: any) => {
            const isMe = msg.senderId === currentUid;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] px-5 py-3 rounded-[1.5rem] text-sm font-body italic shadow-sm",
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                )}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={cn("text-[8px] mt-1.5 font-black uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                    {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : 'Syncing'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <footer className="p-6 border-t border-gray-50 bg-white">
        <form onSubmit={handleSend} className="flex gap-3 bg-gray-50 rounded-2xl p-1.5 pr-3 border border-gray-100 shadow-inner">
          <Input 
            placeholder="Type your vibe..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-base font-body italic placeholder:text-gray-300"
          />
          <button type="submit" disabled={!text.trim()} className="bg-primary text-white p-3 rounded-xl shadow-lg active:scale-90 transition-transform disabled:opacity-30">
            <Send className="h-5 w-5" />
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
      <div className="min-h-full bg-white flex flex-col relative font-headline">
        {!activeChat && (
          <header className="px-6 pt-10 pb-6 bg-white shrink-0">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Messages</h1>
              <div className="flex gap-3">
                 <button className="bg-gray-50 p-2.5 rounded-full text-gray-400 hover:text-primary transition-colors"><Search className="h-6 w-6" /></button>
                 <button className="bg-gray-50 p-2.5 rounded-full text-gray-400 hover:text-primary transition-colors"><UserPlus className="h-6 w-6" /></button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
               {[
                 { icon: Bell, label: 'Alerts', color: 'bg-blue-500' },
                 { icon: Star, label: 'Moments', color: 'bg-pink-500' },
                 { icon: UserPlus, label: 'Friends', color: 'bg-yellow-500' },
                 { icon: ShieldCheck, label: 'Groups', color: 'bg-purple-500' }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className={cn("h-14 w-14 rounded-[1.2rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", item.color, `shadow-${item.color.split('-')[1]}-500/20`)}>
                       <item.icon className="text-white h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{item.label}</span>
                 </div>
               ))}
            </div>
          </header>
        )}

        <div className="flex-1 bg-white">
          <Tabs defaultValue="chats" className="w-full">
            {!activeChat && (
              <TabsList className="bg-transparent border-b border-gray-50 rounded-none w-full h-12 justify-start gap-10 px-6 p-0">
                <TabsTrigger value="chats" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none font-black uppercase text-xs tracking-widest px-0 pb-3 h-full transition-all">Chats</TabsTrigger>
                <TabsTrigger value="official" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none font-black uppercase text-xs tracking-widest px-0 pb-3 h-full transition-all">Official</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="chats" className="m-0">
               {activeChat ? (
                 <PrivateConversation 
                   chatId={activeChat.id} 
                   otherUser={activeChat.otherUser} 
                   currentUid={user?.uid}
                   onBack={() => setActiveChat(null)} 
                 />
               ) : (
                 <div className="pb-32">
                   {isChatsLoading ? (
                     <div className="flex flex-col items-center py-20 gap-4">
                        <Loader className="animate-spin text-primary h-8 w-8" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Syncing Frequencies...</p>
                     </div>
                   ) : !chats || chats.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-32 text-center opacity-10">
                        <MessageCircle className="h-20 w-20 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">No active vibes</p>
                     </div>
                   ) : (
                     <div className="divide-y divide-gray-50">
                       {chats.map(chat => (
                         <ChatListItem 
                           key={chat.id} 
                           chat={chat} 
                           currentUid={user?.uid} 
                           onSelect={(id: string, other: any) => setActiveChat({ id, otherUser: other })} 
                         />
                       ))}
                     </div>
                   )}
                 </div>
               )}
            </TabsContent>

            <TabsContent value="official" className="m-0 divide-y divide-gray-50 pb-32">
               {isSysLoading ? (
                 <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" /></div>
               ) : systemMessages?.length === 0 ? (
                 <div className="py-32 text-center text-gray-200 uppercase font-black text-[10px] tracking-widest italic">No System Broadcasts</div>
               ) : (
                 systemMessages?.map((msg: any) => (
                   <div 
                     key={msg.id} 
                     onClick={() => setSelectedMessage(msg)}
                     className="px-6 py-5 bg-white flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer active:scale-[0.98]"
                   >
                      <div className="h-14 w-14 bg-primary/10 rounded-[1.2rem] flex items-center justify-center text-primary shrink-0">
                         <UmmyLogoIcon className="h-10 w-10" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                         <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-black text-[15px] text-gray-900 uppercase italic tracking-tighter">{msg.title || 'Ummy Assistant'}</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {msg.timestamp ? format(msg.timestamp.toDate(), 'MMM d') : 'Now'}
                            </span>
                         </div>
                         <p className="text-[13px] text-gray-400 line-clamp-1 italic font-body">{msg.content}</p>
                      </div>
                   </div>
                 ))
               )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Task Hub Portal */}
        {!activeChat && (
          <div className="fixed bottom-24 right-6 z-[100] animate-in zoom-in duration-500">
             <div className="relative group">
                <button className="h-16 w-16 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-2 border-gray-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                   <div className="relative h-12 w-12">
                      <Image 
                        src="https://img.icons8.com/color/96/todo-list.png" 
                        alt="Tasks" 
                        fill 
                        className="object-contain" 
                      />
                   </div>
                </button>
                {/* Notification Pulse */}
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
             </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
          <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
            <div className="h-14 w-14 bg-primary/10 rounded-[1.2rem] flex items-center justify-center text-primary shrink-0">
               <UmmyLogoIcon className="h-10 w-10" />
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {selectedMessage?.title || 'Official Broadcast'}
              </DialogTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                {selectedMessage?.timestamp ? format(selectedMessage.timestamp.toDate(), 'MMMM d • HH:mm') : 'Recently'}
              </p>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 min-h-[200px] shadow-inner">
               <p className="text-lg font-body leading-relaxed text-gray-800 whitespace-pre-wrap italic">
                 {selectedMessage?.content}
               </p>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
               <ShieldCheck className="h-4 w-4 text-green-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Identity Sync Verified</span>
            </div>
          </div>
          <div className="p-8 pt-0">
            <button 
              onClick={() => setSelectedMessage(null)}
              className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              Sync Confirmed
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
