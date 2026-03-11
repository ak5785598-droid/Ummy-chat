'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  Loader, 
  CheckCircle,
  Send,
  MessageSquare
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, where, serverTimestamp, doc, limitToLast } from 'firebase/firestore';
import { format, isToday, isYesterday, isSameWeek } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  const participantIds = chat?.participantIds || [];
  const otherUid = participantIds.find((id: string) => id !== currentUid) || currentUid;
  const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

  if (isLoading) return (
    <div className="px-6 py-4 flex gap-4 animate-pulse">
      <div className="h-12 w-12 bg-white/5 rounded-full" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-3 bg-white/5 rounded w-1/3" />
        <div className="h-2 bg-white/5 rounded w-1/2" />
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
      className="px-6 py-4 flex gap-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group border-b border-white/5 last:border-0"
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 border border-white/10 shadow-sm">
          <AvatarImage src={otherUser.avatarUrl || undefined} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        {isOfficial && (
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
             <CheckCircle className="h-3 w-3 text-green-500 fill-green-500 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-bold text-sm text-white truncate tracking-tight">
            {otherUser.username}
          </h3>
          <span className="text-[10px] font-medium text-white/40">
            {getDisplayTime(chat.updatedAt)}
          </span>
        </div>
        <p className="text-xs text-white/60 truncate">
          {chat.lastMessage || 'Sent a vibe'}
        </p>
      </div>
    </div>
  );
};

function ConversationView({ chatId, otherUser, currentUser, onBack }: any) {
  const [text, setText] = useState('');
  const firestore = useFirestore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !firestore || !currentUser || !chatId) return;

    const messageData = {
      text: text.trim(),
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    };

    addDocumentNonBlocking(collection(firestore, 'privateChats', chatId, 'messages'), messageData);

    setDocumentNonBlocking(doc(firestore, 'privateChats', chatId), {
      lastMessage: text.trim(),
      lastSenderId: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setText('');
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <header className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/40">
         <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-white" />
         </button>
         <Avatar className="h-8 w-8 border border-white/10">
            <AvatarImage src={otherUser.avatarUrl} />
            <AvatarFallback>{otherUser.username?.charAt(0)}</AvatarFallback>
         </Avatar>
         <div className="flex-1">
            <h4 className="text-sm font-black uppercase tracking-tight">{otherUser.username}</h4>
            <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Active Sync</p>
         </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-4">
         <div className="flex flex-col gap-3 pb-4">
            {messages?.map((msg: any) => {
              const isMe = msg.senderId === currentUser?.uid;
              return (
                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
                   <div className={cn(
                     "px-3 py-2 rounded-2xl text-xs font-body shadow-sm",
                     isMe ? "bg-primary text-black rounded-br-none" : "bg-white/10 text-white rounded-bl-none"
                   )}>
                      <p className="leading-relaxed">{msg.text}</p>
                   </div>
                   <span className="text-[7px] font-bold text-white/20 uppercase mt-1 px-1">
                      {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                   </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
         </div>
      </ScrollArea>

      <footer className="p-3 bg-black/60 border-t border-white/10">
         <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Vibe text..."
              className="flex-1 h-10 rounded-full bg-white/5 border-white/10 focus:border-primary px-4 text-xs italic"
            />
            <button 
              type="submit" 
              disabled={!text.trim()}
              className="bg-primary text-black h-10 w-10 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            >
               <Send className="h-4 w-4" />
            </button>
         </form>
      </footer>
    </div>
  );
}

export function RoomMessagesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (val: boolean) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'privateChats'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: rawChats, isLoading } = useCollection(chatsQuery);

  const chats = useMemo(() => {
    if (!rawChats) return null;
    return [...rawChats].sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  }, [rawChats]);

  const handleClose = (val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setActiveChatId(null);
        setSelectedRecipient(null);
      }, 300);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md h-[60vh] bg-[#121212]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="p-6 pb-2 border-b border-white/5">
           <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white/90 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Messages
           </DialogTitle>
           <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1">
              Your social graph frequencies.
           </DialogDescription>
        </DialogHeader>

        {activeChatId ? (
          <ConversationView 
            chatId={activeChatId} 
            otherUser={selectedRecipient} 
            currentUser={user} 
            onBack={() => { setActiveChatId(null); setSelectedRecipient(null); }}
          />
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
               <div className="pb-10">
                  {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                       <Loader className="animate-spin text-primary h-8 w-8" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing Identity...</p>
                    </div>
                  ) : chats && chats.length > 0 ? (
                    chats.map(chat => (
                      <ChatListItem 
                        key={chat.id} 
                        chat={chat} 
                        currentUid={user?.uid} 
                        onSelect={(id: string, other: any) => {
                          setActiveChatId(id);
                          setSelectedRecipient(other);
                        }} 
                      />
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-20 italic space-y-2">
                       <MessageSquare className="h-10 w-10 mx-auto opacity-20" />
                       <p className="text-sm font-bold">No social frequencies detected.</p>
                    </div>
                  )}
               </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
