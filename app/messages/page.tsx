
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Flag, 
  Shield, 
  MessageSquareText, 
  ChevronRight, 
  Loader, 
  CheckCircle2,
  Users,
  CheckCircle,
  Send,
  ChevronLeft
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, where, serverTimestamp, doc, limit } from 'firebase/firestore';
import { format, isToday, isYesterday, isSameWeek } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const CategoryItem = ({ icon: Icon, label, subtext, date, colorClass, onClick, customIcon, isVerified }: any) => (
  <div 
    onClick={onClick}
    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
  >
    <div className="relative shrink-0">
      <div className={cn("h-14 w-14 rounded-full flex items-center justify-center shadow-sm", colorClass)}>
        {customIcon ? customIcon : <Icon className="h-7 w-7 text-white" fill="white" />}
      </div>
      {isVerified && (
        <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
           <CheckCircle className="h-4 w-4 text-green-500 fill-green-500 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="font-bold text-[16px] text-gray-900 tracking-tight">{label}</h3>
        {date && <span className="text-[12px] font-medium text-gray-400">{date}</span>}
      </div>
      {subtext && <p className="text-[14px] text-gray-400 truncate">{subtext}</p>}
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

  const getDisplayTime = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    if (isSameWeek(date, new Date())) return format(date, 'eeee');
    return format(date, 'M/d/yy');
  };

  const isOfficial = otherUser.tags?.includes('Official') || otherUser.tags?.includes('Admin');

  return (
    <div 
      onClick={() => onSelect(chat.id, otherUser)}
      className="px-6 py-4 flex gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 border border-gray-100 shadow-sm">
          <AvatarImage src={otherUser.avatarUrl || undefined} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        {isOfficial && (
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
             <CheckCircle className="h-4 w-4 text-green-500 fill-green-500 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-bold text-[16px] text-gray-900 truncate tracking-tight">
            {otherUser.username}
          </h3>
          <span className="text-[12px] font-medium text-gray-400">
            {getDisplayTime(chat.updatedAt)}
          </span>
        </div>
        <p className="text-[14px] text-gray-400 truncate">
          {chat.lastMessage || 'Sent a vibe'}
        </p>
      </div>
    </div>
  );
};

/**
 * High-Fidelity Chat Room Window.
 */
function ChatRoomDialog({ open, onOpenChange, chatId, otherUser, currentUser }: any) {
  const [text, setText] = useState('');
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !firestore || !currentUser || !chatId) return;

    const messageData = {
      text: text.trim(),
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    };

    // 1. Dispatch message
    addDocumentNonBlocking(collection(firestore, 'privateChats', chatId, 'messages'), messageData);

    // 2. Sync metadata
    setDocumentNonBlocking(doc(firestore, 'privateChats', chatId), {
      lastMessage: text.trim(),
      lastSenderId: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-[#f8f9fa] text-black p-0 flex flex-col font-headline">
        <DialogHeader className="p-6 pt-10 border-b border-gray-100 bg-white flex flex-row items-center gap-4 shrink-0 shadow-sm relative z-50">
           <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
           <Avatar className="h-10 w-10 border shadow-sm">
              <AvatarImage src={otherUser?.avatarUrl || undefined} />
              <AvatarFallback>{otherUser?.username?.charAt(0)}</AvatarFallback>
           </Avatar>
           <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-black uppercase italic tracking-tighter truncate">{otherUser?.username}</DialogTitle>
              <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Active Frequency</p>
           </div>
           <DialogDescription className="sr-only">Conversation with {otherUser?.username}</DialogDescription>
        </DialogHeader>

        <main className="flex-1 overflow-hidden relative">
           <ScrollArea className="h-full px-4 pt-6" ref={scrollRef}>
              <div className="flex flex-col gap-4 pb-10">
                 {messages?.map((msg: any) => {
                   const isMe = msg.senderId === currentUser?.uid;
                   return (
                     <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-body shadow-sm",
                          isMe ? "bg-black text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                        )}>
                           <p className="leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 px-1">
                           {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                        </span>
                     </div>
                   );
                 })}
              </div>
           </ScrollArea>
        </main>

        <footer className="p-4 pb-10 bg-white border-t border-gray-100 shrink-0">
           <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Say something..."
                className="flex-1 h-12 rounded-full border-2 border-gray-50 focus:border-primary px-6 text-sm italic"
              />
              <button 
                type="submit" 
                disabled={!text.trim()}
                className="bg-primary text-black h-12 w-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
              >
                 <Send className="h-5 w-5" />
              </button>
           </form>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [showOfficial, setShowOfficial] = useState(false);
  const [showSystemDialog, setShowSystemDialog] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

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

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: allNotifications } = useCollection(notificationsQuery);

  // Filter logic for official vs direct system portals
  const teamMsgs = useMemo(() => allNotifications?.filter((n: any) => n.type === 'system') || [], [allNotifications]);
  const systemMsgs = useMemo(() => allNotifications?.filter((n: any) => n.type === 'direct_system') || [], [allNotifications]);

  const latestTeam = teamMsgs[0];
  const latestSystem = systemMsgs[0];

  const handleSelectChat = (id: string, other: any) => {
    setActiveChatId(id);
    setSelectedRecipient(other);
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-white flex flex-col relative font-headline animate-in fade-in duration-700">
        
        {/* Header Protocol: Yellow-to-White Gradient */}
        <header className="relative shrink-0 pt-10 pb-6 px-6">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FFCC00] via-[#FFCC00]/40 to-white pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10" /> {/* Balancer */}
            <h1 className="text-3xl font-black text-black tracking-tight">Message</h1>
            <button className="text-black hover:scale-110 transition-transform p-1">
               <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 bg-white relative z-10">
          <div className="flex flex-col">
            <CategoryItem 
              icon={Flag} 
              label="Ummy Team" 
              subtext={latestTeam?.content || "No team broadcasts."}
              date={latestTeam?.timestamp ? format(latestTeam.timestamp.toDate(), 'h:mm a') : ""}
              colorClass="bg-green-100"
              customIcon={<img src="https://img.icons8.com/color/96/lion.png" className="h-10 w-10" alt="Team" />}
              isVerified
              onClick={() => setShowOfficial(true)}
            />
            
            <CategoryItem 
              icon={Shield} 
              label="Ummy System" 
              subtext={latestSystem?.content || "Welcome to Ummy! Reach out to us ..."}
              date={latestSystem?.timestamp ? format(latestSystem.timestamp.toDate(), 'h:mm a') : "Sunday"}
              colorClass="bg-green-600"
              customIcon={<img src="https://img.icons8.com/color/96/appointment-reminders--v1.png" className="h-8 w-8" alt="System" />}
              isVerified
              onClick={() => setShowSystemDialog(true)}
            />

            {/* Real-time Chats */}
            {isChatsLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader className="animate-spin text-primary h-8 w-8" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Syncing Frequencies...</p>
              </div>
            ) : (
              chats?.map(chat => (
                <ChatListItem 
                  key={chat.id} 
                  chat={chat} 
                  currentUid={user?.uid} 
                  onSelect={handleSelectChat} 
                />
              ))
            )}
          </div>
        </div>

        {/* Official Team Notifications Dialog */}
        <Dialog open={showOfficial} onOpenChange={setShowOfficial}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
            <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
              <div className="h-14 w-14 bg-[#FF6600] rounded-[1.2rem] flex items-center justify-center text-white shrink-0">
                 <Flag className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Official Activities</DialogTitle>
                <DialogDescription className="sr-only">Global team broadcasts.</DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
               <div className="space-y-4">
                  {teamMsgs.length === 0 ? (
                    <div className="py-10 text-center opacity-20 italic">No official broadcasts.</div>
                  ) : (
                    teamMsgs.map((msg: any) => (
                      <div key={msg.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black uppercase text-sm">{msg.title || 'Official'}</h4>
                            <span className="text-[10px] text-gray-400 font-bold">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
                         </div>
                         <p className="text-sm font-body italic text-gray-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
               </div>
            </ScrollArea>
            <div className="p-8 pt-0">
              <button onClick={() => setShowOfficial(false)} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">Close</button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Official System Notifications Dialog (Targeted) */}
        <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
            <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
              <div className="h-14 w-14 bg-green-600 rounded-[1.2rem] flex items-center justify-center text-white shrink-0">
                 <Shield className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">System Notices</DialogTitle>
                <DialogDescription className="sr-only">Personal official notifications.</DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
               <div className="space-y-4">
                  {systemMsgs.length === 0 ? (
                    <div className="py-10 text-center opacity-20 italic">No system notices.</div>
                  ) : (
                    systemMsgs.map((msg: any) => (
                      <div key={msg.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black uppercase text-sm">{msg.title || 'System'}</h4>
                            <span className="text-[10px] text-gray-400 font-bold">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
                         </div>
                         <p className="text-sm font-body italic text-gray-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
               </div>
            </ScrollArea>
            <div className="p-8 pt-0">
              <button onClick={() => setShowSystemDialog(false)} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">Close</button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Real-time Private Chat Dialog */}
        <ChatRoomDialog 
          open={!!activeChatId} 
          onOpenChange={(open: boolean) => !open && setActiveChatId(null)}
          chatId={activeChatId}
          otherUser={selectedRecipient}
          currentUser={user}
        />
      </div>
    </AppLayout>
  );
}
