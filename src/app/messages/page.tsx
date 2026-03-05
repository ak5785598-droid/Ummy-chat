'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Flag, 
  Shield, 
  MessageSquareText, 
  ChevronRight, 
  Search, 
  Loader, 
  Send, 
  ChevronLeft, 
  CheckCircle2,
  Users
} from 'lucide-react';
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

const CategoryItem = ({ icon: Icon, label, subtext, date, colorClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
  >
    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center shadow-lg shrink-0", colorClass)}>
      <Icon className="h-7 w-7 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="font-black text-[17px] text-gray-900 tracking-tight">{label}</h3>
        {date && <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tighter">{date}</span>}
      </div>
      {subtext && <p className="text-[13px] text-gray-400 truncate font-body italic">{subtext}</p>}
    </div>
  </div>
);

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  const participantIds = chat?.participantIds || [];
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
    <div className="flex flex-col h-[85vh] bg-white rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden font-headline">
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
               <MessageSquareText className="h-12 w-12 mb-2" />
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
  const [activeChat, setActiveChat] = useState<{ id: string; otherUser: any } | null>(null);
  const [showOfficial, setShowOfficial] = useState(false);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'privateChats'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: rawChats, isLoading: isChatsLoading } = useCollection(chatsQuery);

  const chats = useMemo(() => {
    if (!rawChats) return null;
    return [...rawChats].sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  }, [rawChats]);

  const officialQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: officialMsgs } = useCollection(officialQuery);
  const latestOfficial = officialMsgs?.[0];

  if (activeChat) {
    return (
      <AppLayout>
        <div className="min-h-full bg-white flex flex-col relative font-headline">
          <PrivateConversation 
            chatId={activeChat.id} 
            otherUser={activeChat.otherUser} 
            currentUid={user?.uid}
            onBack={() => setActiveChat(null)} 
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-full bg-white flex flex-col relative font-headline animate-in fade-in duration-700">
        
        {/* Header with Yellow Gradient */}
        <header className="relative shrink-0">
          <div className="bg-gradient-to-b from-[#FFCC00] to-white h-24 absolute inset-x-0 top-0 z-0" />
          <div className="relative z-10 px-6 pt-10 flex items-center justify-between">
            <div className="w-8" /> {/* Placeholder for alignment */}
            <h1 className="text-3xl font-black text-black tracking-tight text-center">Message</h1>
            <button className="p-2 text-black hover:scale-110 transition-transform">
               <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 bg-white relative z-10 pt-4">
          <div className="divide-y divide-gray-50">
            {/* Official Categories */}
            <CategoryItem 
              icon={Flag} 
              label="Activity" 
              subtext={latestOfficial?.content || "No new tribal activities."}
              date={latestOfficial?.timestamp ? format(latestOfficial.timestamp.toDate(), 'M/d/ yyyy') : "4/3/ 2026"}
              colorClass="bg-gradient-to-br from-orange-500 to-red-600"
              onClick={() => setShowOfficial(true)}
            />
            
            <CategoryItem 
              icon={Shield} 
              label="Family" 
              colorClass="bg-gradient-to-br from-amber-400 to-orange-500"
            />

            <CategoryItem 
              icon={MessageSquareText} 
              label="Feedback" 
              colorClass="bg-gradient-to-br from-blue-500 to-blue-700"
            />

            {/* Chat Divider */}
            <div className="h-2 bg-gray-50/50" />

            {/* Real-time Chats */}
            {isChatsLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader className="animate-spin text-primary h-8 w-8" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Syncing Frequencies...</p>
              </div>
            ) : !chats || chats.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center opacity-10">
                <MessageSquareText className="h-16 w-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No active vibes</p>
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
        </div>

        {/* Official Notifications Dialog */}
        <Dialog open={showOfficial} onOpenChange={setShowOfficial}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
            <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
              <div className="h-14 w-14 bg-orange-500 rounded-[1.2rem] flex items-center justify-center text-white shrink-0">
                 <Flag className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Official Activities</DialogTitle>
                <DialogDescription className="sr-only">System messages and official tribal broadcasts.</DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
               <div className="space-y-4">
                  {officialMsgs?.map((msg: any) => (
                    <div key={msg.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black uppercase text-sm">{msg.title || 'Official'}</h4>
                          <span className="text-[10px] text-gray-400 font-bold">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
                       </div>
                       <p className="text-sm font-body italic text-gray-600 leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
               </div>
            </ScrollArea>
            <div className="p-8 pt-0">
              <button onClick={() => setShowOfficial(false)} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">Close</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
