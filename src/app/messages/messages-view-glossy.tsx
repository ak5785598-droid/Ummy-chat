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
 Image as ImageIcon,
 X,
 Heart
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useStorage, updateDocumentNonBlocking } from '@/firebase';
import { 
   collection, 
   query, 
   orderBy, 
   where, 
   serverTimestamp, 
   doc, 
   limitToLast, 
   arrayUnion, 
   addDoc as addFirestoreDoc,
   deleteDoc,
   setDoc,
   updateDoc
} from 'firebase/firestore';
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
import { useTranslation } from '@/hooks/use-translation';
import { UmmyLogoIcon } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryItem = ({ icon: Icon, label, subtext, date, colorClass, onClick, customIcon, isVerified }: any) => (
 <div 
  onClick={onClick}
  className="px-6 py-5 flex items-center gap-4 hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer group"
 >
  <div className="relative shrink-0">
   <div className={cn("h-14 w-14 rounded-[1.2rem] flex items-center justify-center shadow-lg border-2 border-white transform group-active:scale-95 transition-transform", colorClass)}>
    {customIcon ? customIcon : <Icon className="h-7 w-7 text-white" fill="white" />}
   </div>
   {isVerified && (
    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md border border-slate-50">
      <CheckCircle className="h-4 w-4 text-green-500 fill-green-500" strokeWidth={3} />
    </div>
   )}
  </div>
  <div className="flex-1 min-w-0">
   <div className="flex items-center justify-between mb-0.5">
    <h3 className="font-black text-[15px] text-slate-900 uppercase tracking-tight">{label}</h3>
    {date && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{date}</span>}
   </div>
   {subtext && <p className="text-[11px] font-bold text-slate-400 truncate leading-tight tracking-tight">{subtext}</p>}
  </div>
  <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
 </div>
);

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
 const participantIds = chat?.participantIds || [];
 const otherUid = participantIds.find((id: string) => id !== currentUid) || currentUid;
 const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

 if (isLoading) return (
  <div className="px-6 py-5 flex gap-4 animate-pulse">
   <div className="h-14 w-14 bg-slate-100 rounded-[1.2rem]" />
   <div className="flex-1 space-y-3 pt-2">
    <div className="h-3 bg-slate-100 rounded w-1/3" />
    <div className="h-2 bg-slate-100 rounded w-1/2" />
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
 const isUnread = chat.lastSenderId !== currentUid && !(chat.lastMessageReadBy || []).includes(currentUid);

 return (
  <div 
   onClick={() => onSelect(chat.id, otherUser)}
   className={cn(
    "px-6 py-5 flex gap-4 hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer group",
    isUnread && "bg-slate-50/50"
   )}
  >
   <div className="relative shrink-0">
    <Avatar className="h-14 w-14 rounded-[1.2rem] border-2 border-white shadow-lg transform group-active:scale-95 transition-transform">
     <AvatarImage src={otherUser.avatarUrl || undefined} className="object-cover" />
     <AvatarFallback className="bg-slate-200 text-slate-400 font-black">{(otherUser.username || 'U').charAt(0)}</AvatarFallback>
    </Avatar>
    {isOfficial && (
     <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-50">
       <CheckCircle className="h-4 w-4 text-green-500 fill-green-500" strokeWidth={3} />
     </div>
    )}
    {isUnread && (
     <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse" />
    )}
   </div>
   <div className="flex-1 min-w-0 pt-1">
    <div className="flex items-center justify-between mb-0.5">
     <h3 className={cn("font-black text-[15px] uppercase tracking-tighter transition-colors", isUnread ? "text-slate-900" : "text-slate-700")}>
      {otherUser.username}
     </h3>
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
      {getDisplayTime(chat.updatedAt)}
     </span>
    </div>
    <p className={cn("text-[11px] font-bold truncate tracking-tight transition-all", isUnread ? "text-slate-900" : "text-slate-400")}>
     {chat.lastMessage || 'Sent a vibe'}
    </p>
   </div>
   <div className="flex items-center">
     <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
   </div>
  </div>
 );
};

function ChatRoomDialog({ open, onOpenChange, chatId, otherUser, currentUser }: any) {
  const [text, setText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { userProfile: liveOtherUser } = useUserProfile(otherUser?.id);
  const isOnline = liveOtherUser?.isOnline;

  const messagesQuery = useMemoFirebase(() => {
   if (!firestore || !chatId) return null;
   return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(100));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
   if (open && chatId && currentUser?.uid && firestore && (messages?.length ?? 0) > 0) {
    const chatRef = doc(firestore, 'privateChats', chatId);
    updateDocumentNonBlocking(chatRef, {
     lastMessageReadBy: arrayUnion(currentUser.uid)
    });
   }
  }, [open, chatId, messages, currentUser?.uid, firestore]);

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
    lastMessageReadBy: [currentUser.uid],
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
    toast({ variant: 'destructive', title: 'Upload Failed' });
   } finally {
    setIsUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
   }
  };

  return (
   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans">
     <DialogHeader className="p-0 border-b border-slate-100 bg-white/80 backdrop-blur-xl shrink-0 shadow-sm relative z-50 pt-safe">
       <div className="px-4 py-5 flex flex-row items-center gap-4 w-full relative max-w-lg mx-auto">
       <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-all active:scale-90">
         <ChevronLeft className="h-6 w-6 text-slate-900" />
       </button>
       <Avatar className="h-10 w-10 border border-slate-100 shadow-sm rounded-xl">
         <AvatarImage src={otherUser?.avatarUrl || undefined} className="object-cover" />
         <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">{otherUser?.username?.charAt(0)}</AvatarFallback>
       </Avatar>
       <div className="flex-1 min-w-0">
         <DialogTitle className="text-lg font-black tracking-tight truncate text-slate-900 uppercase">{otherUser?.username}</DialogTitle>
         <div className="flex items-center gap-1.5 leading-none mt-0.5">
           <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isOnline ? "bg-green-500" : "bg-slate-300")} />
           <p className={cn("text-[9px] font-black uppercase tracking-widest", isOnline ? "text-green-500" : "text-slate-400")}>
            {isOnline ? 'online' : 'offline'}
           </p>
         </div>
       </div>
       </div>
       <DialogDescription className="sr-only">Conversation with {otherUser?.username}</DialogDescription>
     </DialogHeader>

     <main className="flex-1 overflow-hidden relative bg-[#F4F7FE]">
       <ScrollArea className="h-full px-4 pt-6">
        <div className="flex flex-col gap-5 pb-12 max-w-lg mx-auto">
          {messages?.map((msg: any) => {
           const isMe = msg.senderId === currentUser?.uid;
           return (
            <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
             <div className={cn(
              "px-4 py-3 rounded-[1.5rem] text-[14px] font-medium shadow-sm border transition-all",
              isMe ? "bg-slate-900 text-white rounded-br-none border-slate-800" : "bg-white text-slate-800 rounded-bl-none border-white shadow-md shadow-black/5"
             )}>
               {msg.imageUrl && (
                <div 
                 onClick={() => setPreviewImage(msg.imageUrl)}
                 className="mb-2 relative aspect-square w-56 max-w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner cursor-pointer active:scale-[0.98] transition-all"
                >
                 <Image src={msg.imageUrl} fill className="object-cover" alt="Sent image" unoptimized />
                </div>
               )}
               {msg.text && <p className="leading-relaxed ">{msg.text}</p>}
             </div>
             <span className="text-[8px] font-black text-slate-400 uppercase mt-1.5 px-2 tracking-widest opacity-60">
               {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
             </span>
            </div>
           );
          })}
          <div ref={messagesEndRef} />
        </div>
       </ScrollArea>
     </main>

     <footer className="p-4 pb-12 bg-white/80 backdrop-blur-xl border-t border-slate-100 shrink-0">
      <div className="max-w-lg mx-auto flex gap-3 items-center">
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
        className="bg-slate-50 text-slate-400 h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
       >
         {isUploadingImage ? <Loader className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
       </button>
       <form onSubmit={handleSend} className="flex-1 flex gap-3">
         <Input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-14 rounded-2xl border-none bg-slate-100/80 px-6 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:shadow-inner"
         />
         <button 
          type="submit" 
          disabled={!text.trim() && !isUploadingImage}
          className="bg-slate-900 text-white h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
         >
          <Send className="h-6 w-6" />
         </button>
       </form>
      </div>
     </footer>

     <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
      <DialogContent className="w-screen h-screen max-none m-0 rounded-none border-none bg-black/98 p-0 flex flex-col items-center justify-center z-[300]">
       <DialogHeader className="sr-only">
        <DialogTitle>Image Preview</DialogTitle>
        <DialogDescription>Full screen view</DialogDescription>
       </DialogHeader>
       <button 
        onClick={() => setPreviewImage(null)}
        className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-[310] active:scale-95 transition-transform"
       >
        <X className="h-6 w-6" />
       </button>
       {previewImage && (
        <div className="relative w-full h-full flex items-center justify-center p-4">
         <Image src={previewImage} alt="Full screen" fill className="object-contain" unoptimized />
        </div>
       )}
      </DialogContent>
     </Dialog>
    </DialogContent>
   </Dialog>
  );
}

function RelationshipRequestsDialog({ open, onOpenChange }: any) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'proposals'), where('toUid', '==', user.uid), where('status', '==', 'pending'));
  }, [firestore, user?.uid]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const handleAction = async (request: any, action: 'accept' | 'decline') => {
    if (!firestore || !user?.uid) return;
    try {
      const proposalRef = doc(firestore, 'proposals', request.id);
      
      if (action === 'accept') {
        const pairId = [user.uid, request.fromUid].sort().join('_');
        const pairRef = doc(firestore, 'cpPairs', pairId);
        
        await setDoc(pairRef, {
          id: pairId,
          participantIds: [user.uid, request.fromUid],
          type: request.type,
          cpValue: 0,
          level: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await updateDoc(proposalRef, { status: 'accepted' });
        toast({ title: 'Relationship Established!', description: `You are now ${request.type} partners.` });
      } else {
        await updateDoc(proposalRef, { status: 'declined' });
        toast({ title: 'Request Declined' });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Action Failed' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-lg m-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-sans bg-white p-0">
        <DialogHeader className="p-8 pb-5 border-b border-slate-50 bg-[#F4F7FE]/50 backdrop-blur-xl">
          <div className="h-14 w-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shrink-0 shadow-xl transition-all">
            <Heart className="h-7 w-7" />
          </div>
          <div className="flex-1 text-left mt-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">Bond Requests</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Special status proposals waiting for your frequency.</DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-6 bg-white">
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                 <Loader className="h-7 w-7 text-slate-300 animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching Frequencies...</span>
              </div>
            ) : !requests || requests.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-30 flex flex-col items-center">
                 <Heart className="h-14 w-14 text-slate-200" />
                 <p className="font-black text-[11px] uppercase tracking-widest text-slate-400">No pending proposals in orbit</p>
              </div>
            ) : requests.map((req: any) => (
              <RequestItem key={req.id} request={req} onAction={handleAction} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function RequestItem({ request, onAction }: any) {
  const { userProfile: fromUser } = useUserProfile(request.fromUid);
  
  return (
    <div className="p-5 bg-[#F4F7FE] rounded-[2rem] border border-white shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
      <Avatar className="h-14 w-14 border-2 border-white shadow-md shrink-0 rounded-[1.2rem]">
        <AvatarImage src={fromUser?.avatarUrl} className="object-cover" />
        <AvatarFallback className="bg-slate-200 text-slate-400 font-black">{(fromUser?.username || 'U').charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 className="font-black text-sm uppercase text-slate-900 truncate tracking-tight">{fromUser?.username || 'Somebody'}</h4>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-0.5">Wants to be your <span className="text-slate-900">{request.type}</span></p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onAction(request, 'accept')}
          className="h-10 w-10 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center active:scale-90 transition-all"
        >
          <CheckCircle2 className="h-5 w-5 font-black" />
        </button>
        <button 
          onClick={() => onAction(request, 'decline')}
          className="h-10 w-10 bg-white text-slate-400 rounded-2xl flex items-center justify-center active:scale-90 transition-all border border-slate-100 hover:bg-slate-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function MessagesViewGlossy() {
 const { user } = useUser();
 const firestore = useFirestore();
 const { t } = useTranslation();
 const [showOfficial, setShowOfficial] = useState(false);
 const [showSystemDialog, setShowSystemDialog] = useState(false);
 const [showRequests, setShowRequests] = useState(false);
 const [activeChatId, setActiveChatId] = useState<string | null>(null);
 const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

 // 🔔 RED DOT SYNC
 const requestsQuery = useMemoFirebase(() => {
   if (!firestore || !user?.uid) return null;
   return query(collection(firestore, 'proposals'), where('toUid', '==', user.uid), where('status', '==', 'pending'), orderBy('timestamp', 'asc'), limitToLast(1));
 }, [firestore, user?.uid]);
 const { data: pendingRequests } = useCollection(requestsQuery);
 const hasPending = (pendingRequests?.length ?? 0) > 0;

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
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F7FE] font-sans">
      
      {/* FIXED GLOSSY HEADER */}
      <header className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-3xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-6 py-5 shrink-0">
       <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-[1.2rem] bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center p-3 animate-in zoom-in duration-500 shrink-0">
            <UmmyLogoIcon className="h-full w-full text-white fill-white" />
          </div>
          <div className="flex flex-col">
           <h1 className="text-[26px] font-black uppercase tracking-tighter text-slate-900 leading-none">{t.messages.title}</h1>
           <div className="flex items-center gap-1.5 mt-2">
             <div className="h-1 w-8 bg-slate-900 rounded-full" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Communications</p>
           </div>
          </div>
        </div>
        <button className="text-slate-900 p-2.5 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white active:scale-95 transition-all">
          <CheckCircle2 className="h-6 w-6" strokeWidth={3} />
        </button>
       </div>
      </header>

      {/* SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
          
          {/* CATEGORIES CARD */}
          <Card className="rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white">
           <CategoryItem 
            icon={Flag} 
            label={t.messages.team} 
            subtext={latestTeam?.content || "No active broadcasts"}
            date={latestTeam?.timestamp ? format(latestTeam.timestamp.toDate(), 'h:mm a') : ""}
            colorClass="bg-slate-900"
            customIcon={<UmmyLogoIcon className="h-10 w-10 p-1.5 text-white fill-white" />}
            isVerified
            onClick={() => setShowOfficial(true)}
           />
           
           <CategoryItem 
            icon={Shield} 
            label={t.messages.system} 
            subtext={latestSystem?.content || "Everything is secure"}
            date={latestSystem?.timestamp ? format(latestSystem.timestamp.toDate(), 'h:mm a') : ""}
            colorClass="bg-[#F4F7FE] border-slate-100"
            customIcon={<img src="https://img.icons8.com/color/96/appointment-reminders--v1.png" className="h-8 w-8" alt="System" />}
            isVerified
            onClick={() => setShowSystemDialog(true)}
           />

           <CategoryItem 
            icon={Heart} 
            label="Bond Requests" 
            subtext={hasPending ? "You have a new status proposal!" : "No pending proposals"}
            colorClass="bg-white border-slate-100"
            onClick={() => setShowRequests(true)}
            customIcon={
              <div className="relative">
                <Heart className="h-7 w-7 text-slate-900" fill="currentColor" />
                {hasPending && <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-md" />}
              </div>
            }
           />
          </Card>

          {/* CHAT LIST SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
             <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">{t.messages.conversations}</h2>
             <button className="p-2 bg-white rounded-xl shadow-sm text-slate-300 hover:text-slate-900 transition-all"><Search className="h-4 w-4" /></button>
            </div>
            
            <Card className="rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white min-h-[400px]">
             {isChatsLoading ? (
              <div className="py-24 flex flex-col items-center gap-4">
               <Loader className="animate-spin text-slate-200 h-10 w-10" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Reality...</p>
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
              <div className="py-32 text-center space-y-6 opacity-30 flex flex-col items-center">
                <MessageSquareText className="h-16 w-16 text-slate-200" />
                <div className="space-y-1 px-10">
                 <p className="font-black text-sm uppercase tracking-tighter text-slate-900">{t.messages.quiet}</p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.messages.startVibe}</p>
                </div>
              </div>
             )}
            </Card>
          </div>
        </div>
      </div>

       {/* DIALOGS - KEPT AS WHITE FULL SCREEN ALREADY */}
      <Dialog open={showOfficial} onOpenChange={setShowOfficial}>
       <DialogContent className="w-screen max-w-lg m-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden bg-white p-0">
        <DialogHeader className="p-8 pb-5 border-b border-slate-50 bg-slate-900">
         <div className="h-14 w-14 bg-white rounded-[1.2rem] flex items-center justify-center text-slate-900 shrink-0 shadow-lg">
           <Flag className="h-7 w-7" />
         </div>
         <div className="flex-1 text-left mt-4 text-white">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Team Broadcasts</DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Official frequency transmissions.</DialogDescription>
         </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-8">
          <div className="space-y-6">
           {teamMsgs.length === 0 ? (
            <div className="py-20 text-center opacity-30 font-black text-[10px] tracking-widest">No transmissions active.</div>
           ) : (
            teamMsgs.map((msg: any) => (
             <div key={msg.id} className="p-6 bg-[#F4F7FE] rounded-[2.5rem] border border-white shadow-sm">
               <div className="flex justify-between items-start mb-3">
                <h4 className="font-black uppercase text-[15px] text-slate-900 tracking-tighter">{msg.title || 'Official'}</h4>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
               </div>
               <p className="text-[14px] font-medium text-slate-600 leading-relaxed">{msg.content}</p>
             </div>
            ))
           )}
          </div>
        </ScrollArea>
       </DialogContent>
      </Dialog>

      <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
       <DialogContent className="w-screen max-w-lg m-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden bg-white p-0">
        <DialogHeader className="p-8 pb-5 border-b border-slate-50 bg-[#F4F7FE]/50">
         <div className="h-14 w-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shrink-0 shadow-lg transition-all">
           <Shield className="h-7 w-7" />
         </div>
         <div className="flex-1 text-left mt-4">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">Notifications</DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Direct system-to-user intelligence.</DialogDescription>
         </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-8">
          <div className="space-y-6">
           {systemMsgs.length === 0 ? (
            <div className="py-20 text-center opacity-30 font-black text-[10px] tracking-widest uppercase">No active security logs.</div>
           ) : (
            systemMsgs.map((msg: any) => (
             <div key={msg.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
               <div className="flex justify-between items-start mb-3">
                <h4 className="font-black uppercase text-[15px] text-slate-900 tracking-tighter">{msg.title || 'Notice'}</h4>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
               </div>
               <p className="text-[14px] font-medium text-slate-600 leading-relaxed">{msg.content}</p>
             </div>
            ))
           )}
          </div>
        </ScrollArea>
       </DialogContent>
      </Dialog>

      <RelationshipRequestsDialog 
        open={showRequests}
        onOpenChange={setShowRequests}
       />

      <ChatRoomDialog 
       open={!!activeChatId} 
       onOpenChange={(open: boolean) => !open && setActiveChatId(null)}
       chatId={activeChatId}
       otherUser={selectedRecipient}
       currentUser={user}
      />
    </div>
 );
}
