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
  ChevronLeft,
  MessageSquare,
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, query, orderBy, where, serverTimestamp, doc, limitToLast } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const CategoryItem = ({ icon: Icon, label, subtext, date, colorClass, onClick, customIcon, isVerified }: any) => (
  <div 
    onClick={onClick}
    className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50/50 active:bg-gray-100/50 transition-all cursor-pointer group border-b border-gray-50 last:border-0"
  >
    <div className="relative shrink-0">
      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-md border-2 border-white", colorClass)}>
        {customIcon ? customIcon : <Icon className="h-7 w-7 text-white" fill="white" />}
      </div>
      {isVerified && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
           <CheckCircle className="h-4 w-4 text-green-500 fill-green-500 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="font-black text-sm text-gray-800 uppercase tracking-tight italic">{label}</h3>
        {date && <span className="text-[10px] font-black text-gray-400 italic uppercase">{date}</span>}
      </div>
      {subtext && <p className="text-xs font-body text-gray-400 truncate italic">{subtext}</p>}
    </div>
    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:translate-x-1 transition-transform" />
  </div>
);

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  const participantIds = chat?.participantIds || [];
  const otherUid = participantIds.find((id: string) => id !== currentUid) || currentUid;
  const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

  if (isLoading) return (
    <div className="px-6 py-5 flex gap-4 animate-pulse border-b border-gray-50 last:border-0">
      <div className="h-14 w-14 bg-gray-50 rounded-2xl" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-4 bg-gray-50 rounded w-1/3" />
        <div className="h-3 bg-gray-50 rounded w-1/2" />
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
      className="px-6 py-5 flex gap-4 hover:bg-gray-50/50 active:bg-gray-100/50 transition-all cursor-pointer group border-b border-gray-50 last:border-0"
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-md">
          <AvatarImage src={otherUser.avatarUrl || undefined} />
          <AvatarFallback className="bg-slate-50 text-slate-400">{(otherUser.username || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
        {isOfficial && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
             <CheckCircle className="h-4 w-4 text-green-500 fill-green-500 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-black text-sm text-gray-800 truncate uppercase tracking-tight italic">
            {otherUser.username}
          </h3>
          <span className="text-[10px] font-black text-gray-400 italic uppercase">
            {getDisplayTime(chat.updatedAt)}
          </span>
        </div>
        <p className="text-xs font-body text-gray-400 truncate italic">
          {chat.lastMessage || 'Sent a vibe'}
        </p>
      </div>
      <div className="flex items-center">
         <ChevronRight className="h-4 w-4 text-gray-200 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

function ChatRoomDialog({ open, onOpenChange, chatId, otherUser, currentUser }: any) {
  const [text, setText] = useState('');
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(100));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !imageUrl) || !firestore || !currentUser || !chatId) return;

    const messageData = {
      text: text.trim(),
      imageUrl: imageUrl || null,
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    };

    addDocumentNonBlocking(collection(firestore, 'privateChats', chatId, 'messages'), messageData);

    setDocumentNonBlocking(doc(firestore, 'privateChats', chatId), {
      lastMessage: imageUrl ? 'Sent an image' : text.trim(),
      lastSenderId: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setText('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !currentUser || !chatId) return;

    setIsUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `chats/${chatId}/${timestamp}_${file.name}`);
      const result = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(result.ref);
      await handleSend(undefined, url);
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not send image vibe.' });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-headline">
        <DialogHeader className="p-6 pt-12 border-b border-gray-100 bg-white flex flex-row items-center gap-4 shrink-0 shadow-sm relative z-50">
           <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
           <Avatar className="h-10 w-10 border shadow-sm rounded-xl">
              <AvatarImage src={otherUser?.avatarUrl || undefined} />
              <AvatarFallback>{otherUser?.username?.charAt(0)}</AvatarFallback>
           </Avatar>
           <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-black uppercase italic tracking-tighter truncate">{otherUser?.username}</DialogTitle>
              <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Active Frequency</p>
           </div>
           <DialogDescription className="sr-only">Conversation with {otherUser?.username}</DialogDescription>
        </DialogHeader>

        <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
           <ScrollArea className="h-full px-4 pt-6">
              <div className="flex flex-col gap-4 pb-10">
                 {messages?.map((msg: any) => {
                   const isMe = msg.senderId === currentUser?.uid;
                   return (
                     <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-body shadow-sm border",
                          isMe ? "bg-primary text-white rounded-br-none border-primary/20" : "bg-white text-gray-800 rounded-bl-none border-gray-100"
                        )}>
                           {msg.imageUrl && (
                             <div className="mb-2 relative aspect-square w-48 max-w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
                                <Image src={msg.imageUrl} fill className="object-cover" alt="Sent image" unoptimized />
                             </div>
                           )}
                           {msg.text && <p className="leading-relaxed italic">{msg.text}</p>}
                        </div>
                        <span className="text-[8px] font-black text-gray-400 uppercase mt-1 px-1">
                           {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                        </span>
                     </div>
                   );
                 })}
                 <div ref={messagesEndRef} />
              </div>
           </ScrollArea>
        </main>

        <footer className="p-4 pb-10 bg-white border-t border-gray-100 shrink-0">
           <div className="flex gap-3 items-center">
              <input 
                type="file" 
                ref={imageInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <button 
                type="button"
                disabled={isUploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="bg-yellow-50 text-yellow-600 h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-yellow-100 active:scale-90 transition-transform disabled:opacity-50"
              >
                 {isUploadingImage ? <Loader className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
              </button>
              <form onSubmit={handleSend} className="flex-1 flex gap-3">
                 <Input 
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                   placeholder="Say something..."
                   className="flex-1 h-14 rounded-2xl border-2 border-yellow-200 bg-yellow-50 focus:border-primary px-6 text-sm italic text-gray-900 placeholder:text-yellow-600/40"
                 />
                 <button 
                   type="submit" 
                   disabled={!text.trim() && !isUploadingImage}
                   className="bg-primary text-white h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
                 >
                    <Send className="h-6 w-6" />
                 </button>
              </form>
           </div>
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
      <div className="min-h-full bg-gradient-to-b from-[#f3e5f5] via-[#f3e5f5] to-[#ffffff] flex flex-col relative font-headline animate-in fade-in duration-1000 overflow-x-hidden">
        
        <div className="absolute inset-0 pointer-events-none opacity-40">
           {Array.from({ length: 15 }).map((_, i) => (
             <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
               left: `${Math.random() * 100}%`,
               top: `${Math.random() * 100}%`,
               width: `${1 + Math.random() * 2}px`,
               height: `${1 + Math.random() * 2}px`,
               animationDelay: `${Math.random() * 5}s`
             }} />
           ))}
        </div>

        <header className="relative shrink-0 pt-12 pb-8 px-6 bg-transparent">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
               <h1 className="text-4xl font-black uppercase italic tracking-tighter text-gray-900 drop-shadow-sm">Message</h1>
               <div className="h-1 w-12 bg-primary/40 rounded-full mt-1" />
            </div>
            <button className="text-primary hover:scale-110 transition-all p-3 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm active:scale-95 border border-white/50">
               <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 relative z-10 space-y-6 pb-32">
          
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-md">
            <CategoryItem 
              icon={Flag} 
              label="Ummy Team" 
              subtext={latestTeam?.content || "No team broadcasts."}
              date={latestTeam?.timestamp ? format(latestTeam.timestamp.toDate(), 'h:mm a') : ""}
              colorClass="bg-gradient-to-br from-orange-400 to-red-500"
              customIcon={<img src="https://img.icons8.com/color/96/lion.png" className="h-9 w-9" alt="Team" />}
              isVerified
              onClick={() => setShowOfficial(true)}
            />
            
            <CategoryItem 
              icon={Shield} 
              label="Ummy System" 
              subtext={latestSystem?.content || "Welcome to Ummy! Social frequencies online."}
              date={latestSystem?.timestamp ? format(latestSystem.timestamp.toDate(), 'h:mm a') : ""}
              colorClass="bg-gradient-to-br from-blue-500 to-indigo-600"
              customIcon={<img src="https://img.icons8.com/color/96/appointment-reminders--v1.png" className="h-8 w-8" alt="System" />}
              isVerified
              onClick={() => setShowSystemDialog(true)}
            />
          </Card>

          <div className="space-y-3">
             <div className="flex items-center justify-between px-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Conversations</h2>
                <button className="p-1.5 bg-white/40 rounded-lg"><Search className="h-3 w-3 text-gray-400" /></button>
             </div>
             
             <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-md min-h-[300px]">
                {isChatsLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <Loader className="animate-spin text-primary h-8 w-8" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Syncing Identity...</p>
                  </div>
                ) : chats && chats.length > 0 ? (
                  chats.map(chat => (
                    <ChatListItem 
                      key={chat.id} 
                      chat={chat} 
                      currentUid={user?.uid} 
                      onSelect={handleSelectChat} 
                    />
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-40 italic flex flex-col items-center">
                     <MessageSquare className="h-12 w-12 text-gray-200" />
                     <div className="space-y-1">
                        <p className="font-black text-sm uppercase italic text-gray-400">Quiet Frequency</p>
                        <p className="text-[10px] font-bold uppercase text-gray-300">Start a vibe with your tribe.</p>
                     </div>
                  </div>
                )}
             </Card>
          </div>
        </div>

        <Dialog open={showOfficial} onOpenChange={setShowOfficial}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
            <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4 bg-orange-50/30">
              <div className="h-14 w-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                 <Flag className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Official Activities</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-orange-600/60 mt-1">Global team broadcasts.</DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
               <div className="space-y-4">
                  {teamMsgs.length === 0 ? (
                    <div className="py-10 text-center opacity-20 italic font-body">No official broadcasts in the grid.</div>
                  ) : (
                    teamMsgs.map((msg: any) => (
                      <div key={msg.id} className="p-5 bg-gray-50 rounded-3xl border-2 border-white shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black uppercase italic text-sm text-gray-800">{msg.title || 'Official'}</h4>
                            <span className="text-[10px] text-gray-400 font-black italic uppercase">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
                         </div>
                         <p className="text-sm font-body italic text-gray-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
               </div>
            </ScrollArea>
            <div className="p-8 pt-0">
              <button onClick={() => setShowOfficial(false)} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">Dismiss</button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
            <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4 bg-blue-50/30">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                 <Shield className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">System Notices</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-600/60 mt-1">Personal security frequency.</DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
               <div className="space-y-4">
                  {systemMsgs.length === 0 ? (
                    <div className="py-10 text-center opacity-20 italic font-body">No system notices found.</div>
                  ) : (
                    systemMsgs.map((msg: any) => (
                      <div key={msg.id} className="p-5 bg-gray-50 rounded-3xl border-2 border-white shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black uppercase italic text-sm text-gray-800">{msg.title || 'System'}</h4>
                            <span className="text-[10px] text-gray-400 font-black italic uppercase">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
                         </div>
                         <p className="text-sm font-body italic text-gray-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
               </div>
            </ScrollArea>
            <div className="p-8 pt-0">
              <button onClick={() => setShowSystemDialog(false)} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">Dismiss</button>
            </div>
          </DialogContent>
        </Dialog>

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