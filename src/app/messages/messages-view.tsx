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
 Heart,
 Home
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useStorage, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { MessagesViewGlossy } from './messages-view-glossy';
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

const CategoryItem = ({ icon: Icon, label, subtext, date, colorClass, onClick, customIcon, isVerified }: any) => (
 <div 
  onClick={onClick}
  className="px-6 py-4 flex items-center gap-4 hover:bg-black/5 active:bg-black/10 transition-all cursor-pointer group border-b border-black/5 last:border-0"
 >
  <div className="relative shrink-0">
   <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shadow-md border-2 border-white overflow-hidden", colorClass)}>
    {customIcon ? customIcon : <Icon className="h-6 w-6 text-white" fill="white" />}
   </div>
   {isVerified && (
    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
      <CheckCircle className="h-3.5 w-3.5 text-green-500 fill-green-500" strokeWidth={3} />
    </div>
   )}
  </div>
  <div className="flex-1 min-w-0">
   <div className="flex items-center justify-between mb-0.5">
    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight ">{label}</h3>
    {date && <span className="text-[10px] font-bold text-slate-500 uppercase">{date}</span>}
   </div>
   {subtext && <p className="text-[11px] font-body text-slate-600 truncate leading-tight">{subtext}</p>}
  </div>
  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
 </div>
);

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  const router = useRouter();
  const participantIds = chat?.participantIds || [];
  const otherUid = participantIds.find((id: string) => id !== currentUid) || currentUid;
  const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

  if (isLoading) return (
   <div className="px-6 py-4 flex gap-4 animate-pulse border-b border-black/5 last:border-0">
    <div className="h-12 w-12 bg-white/40 rounded-2xl" />
    <div className="flex-1 space-y-3 pt-2">
     <div className="h-3 bg-white/40 rounded w-1/3" />
     <div className="h-2 bg-white/40 rounded w-1/2" />
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

  const isUnread = chat.lastSenderId !== currentUid && !(chat.lastMessageReadBy || []).includes(currentUid);
  const isOnline = otherUser.isOnline === true;
  const inRoomId = otherUser.currentRoomId;

  return (
   <div 
    onClick={() => onSelect(chat.id, otherUser)}
    className={cn(
     "px-6 py-4 flex gap-4 hover:bg-black/5 active:bg-black/10 transition-all cursor-pointer group border-b border-black/5 last:border-0",
     isUnread && "bg-primary/10"
    )}
   >
    <div className="relative shrink-0">
     <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-md">
      <AvatarImage src={otherUser.avatarUrl || undefined} />
      <AvatarFallback className="bg-slate-200 text-slate-500">{(otherUser.username || 'U').charAt(0)}</AvatarFallback>
     </Avatar>
     {isUnread && (
      <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
     )}
    </div>
    <div className="flex-1 min-w-0 pt-1">
     <div className="flex items-center justify-between mb-0.5">
      <h3 className={cn("font-bold text-sm uppercase tracking-tight ", isUnread ? "text-primary" : "text-slate-900")}>
       {otherUser.username}
      </h3>
      <div className="flex items-center gap-1.5">
       {isOnline && !inRoomId && (
         <div className="h-2 w-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
       )}
       <span className="text-[10px] font-bold text-slate-500 uppercase">
        {getDisplayTime(chat.updatedAt)}
       </span>
      </div>
     </div>
     <div className="flex items-center justify-between gap-2 overflow-hidden">
       <p className={cn("text-[11px] font-body truncate flex-1 ", isUnread ? "font-black text-slate-900" : "text-slate-600")}>
        {chat.lastMessage || 'Sent a vibe'}
       </p>
       
       {isOnline && inRoomId && (
         <div 
           onClick={(e) => {
             e.stopPropagation();
             router.push(`/rooms/${inRoomId}`);
           }}
           className="flex items-center bg-indigo-500/90 text-white rounded-full pl-2 pr-0.5 py-0.5 shadow-md active:scale-95 transition-all animate-in zoom-in duration-500 shrink-0 border border-white/20 backdrop-blur-sm"
         >
           <div className="flex items-center gap-1.5">
             <Home className="h-2.5 w-2.5 fill-current" />
             <span className="text-[8px] font-black uppercase tracking-tighter">In Room</span>
           </div>
           <div className="ml-2 px-1.5 py-0.5 bg-yellow-400 rounded-full text-[8px] font-black text-slate-900 flex items-center gap-0.5 shadow-sm">
             GO <ChevronRight className="h-2 w-2" />
           </div>
         </div>
       )}
     </div>
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

 // Sync real-time online status
 const { userProfile: liveOtherUser } = useUserProfile(otherUser?.id);
 const isOnline = liveOtherUser?.isOnline;

 const messagesQuery = useMemoFirebase(() => {
  if (!firestore || !chatId) return null;
  return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(100));
 }, [firestore, chatId]);

 const { data: messages } = useCollection(messagesQuery);

 // MARK AS READ PROTOCOL
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
   lastMessageReadBy: [currentUser.uid], // Reset read status to only sender
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
    <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
      <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
      <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
        <ChevronLeft className="h-6 w-6 text-gray-800" />
      </button>
      <Avatar className="h-10 w-10 border shadow-sm rounded-full">
        <AvatarImage src={otherUser?.avatarUrl || undefined} />
        <AvatarFallback>{otherUser?.username?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <DialogTitle className="text-lg font-bold uppercase tracking-tight truncate">{otherUser?.username}</DialogTitle>
        <p className={cn(
         "text-[9px] font-bold uppercase tracking-wider",
         isOnline ? "text-green-500" : "text-gray-400"
        )}>
         {isOnline ? 'online' : 'offline'}
        </p>
      </div>
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
               <div 
                onClick={() => setPreviewImage(msg.imageUrl)}
                className="mb-2 relative aspect-square w-48 max-w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner cursor-pointer active:scale-[0.98] transition-transform"
               >
                <Image src={msg.imageUrl} fill className="object-cover" alt="Sent image" unoptimized />
               </div>
              )}
              {msg.text && <p className="leading-relaxed ">{msg.text}</p>}
            </div>
            <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 px-1">
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
          className="flex-1 h-14 rounded-2xl border-2 border-yellow-200 bg-yellow-50 focus:border-primary px-6 text-sm text-gray-900 placeholder:text-yellow-600/40"
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

    {/* High-Fidelity Full Screen Image Viewer */}
    <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
     <DialogContent className="w-screen h-screen max-none m-0 rounded-none border-none bg-black/95 p-0 flex flex-col items-center justify-center z-[300]">
      <DialogHeader className="sr-only">
       <DialogTitle>Image Preview</DialogTitle>
       <DialogDescription>Full screen view</DialogDescription>
      </DialogHeader>
      <button 
       onClick={() => setPreviewImage(null)}
       className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-[310] active:scale-90 transition-transform"
      >
       <X className="h-6 w-6" />
      </button>
      {previewImage && (
       <div className="relative w-full h-full flex items-center justify-center p-4">
        <Image 
         src={previewImage} 
         alt="Full screen preview" 
         fill 
         className="object-contain" 
         unoptimized 
        />
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
      <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-sans">
        <DialogHeader className="p-8 pb-4 border-b border-gray-100 bg-rose-50/30">
          <div className="h-12 w-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
            <Heart className="h-6 w-6" />
          </div>
          <div className="flex-1 text-left">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Requests</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-rose-600/60 mt-1">Special bond proposals.</DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                 <Loader className="h-6 w-6 text-rose-500 animate-spin" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Searching Hearts...</span>
              </div>
            ) : !requests || requests.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-20">
                 <Heart className="h-12 w-12 mx-auto" />
                 <p className="font-bold text-xs uppercase tracking-widest">No pending proposals</p>
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
    <div className="p-4 bg-gray-50 rounded-3xl border-2 border-white shadow-sm flex items-center gap-4">
      <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
        <AvatarImage src={fromUser?.avatarUrl} />
        <AvatarFallback>{fromUser?.username?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 className="font-black text-xs uppercase text-slate-800 truncate">{fromUser?.username || 'Somebody'}</h4>
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Wants to be your {request.type}</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onAction(request, 'accept')}
          className="h-8 w-8 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center active:scale-90"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onAction(request, 'decline')}
          className="h-8 w-8 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function MessagesView() {
 const { user } = useUser();
 const firestore = useFirestore();
 const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
 const { data: config } = useDoc(configRef);
 const theme = config?.appTheme || 'CLASSIC';
  const { t } = useTranslation();
 const [showOfficial, setShowOfficial] = useState(false);
 const [showSystemDialog, setShowSystemDialog] = useState(false);
 const [showRequests, setShowRequests] = useState(false);
 const [activeChatId, setActiveChatId] = useState<string | null>(null);
 const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
 const searchParams = useSearchParams();
 const userIdFromUrl = searchParams.get('userId');
 const { userProfile: otherUserFromUrl } = useUserProfile(userIdFromUrl || undefined);

 // 🔄 AUTO-SYNC: If coming from a profile page, open the chat immediately
 useEffect(() => {
   if (userIdFromUrl && otherUserFromUrl && user?.uid) {
     const participantIds = [user.uid, userIdFromUrl].sort();
     const chatId = participantIds.join('_');
     
     setActiveChatId(chatId);
     setSelectedRecipient(otherUserFromUrl);
   }
 }, [userIdFromUrl, otherUserFromUrl, user?.uid]);

 // 🔔 RED DOT SYNC: Check for pending requests
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

 if (theme === 'GLOSSY') {
  return <MessagesViewGlossy />;
 }

 const handleSelectChat = (id: string, other: any) => {
  setActiveChatId(id);
  setSelectedRecipient(other);
 };

 return (
    <AppLayout hideBottomNav={!!activeChatId}>
    <div className="h-[100dvh] bg-gradient-to-b from-[#FF91B5] via-[#ffade0] to-[#f472b6] flex flex-col relative font-sans animate-in fade-in duration-1000 overflow-hidden">
     
     <div className="absolute inset-0 pointer-events-none opacity-40">
       {[
         { left: '10%', top: '15%', width: '2px', height: '2px', delay: '0s' },
         { left: '25%', top: '35%', width: '3px', height: '3px', delay: '0.5s' },
         { left: '40%', top: '25%', width: '2px', height: '2px', delay: '1s' },
         { left: '55%', top: '45%', width: '2px', height: '2px', delay: '1.5s' },
         { left: '70%', top: '55%', width: '3px', height: '3px', delay: '2s' },
         { left: '85%', top: '20%', width: '2px', height: '2px', delay: '2.5s' },
         { left: '15%', top: '65%', width: '2px', height: '2px', delay: '3s' },
         { left: '30%', top: '75%', width: '3px', height: '3px', delay: '3.5s' },
         { left: '45%', top: '85%', width: '2px', height: '2px', delay: '4s' },
         { left: '60%', top: '70%', width: '2px', height: '2px', delay: '4.5s' },
         { left: '75%', top: '80%', width: '3px', height: '3px', delay: '0.2s' },
         { left: '90%', top: '60%', width: '2px', height: '2px', delay: '0.7s' },
         { left: '20%', top: '40%', width: '2px', height: '2px', delay: '1.2s' },
         { left: '50%', top: '10%', width: '3px', height: '3px', delay: '1.7s' },
         { left: '80%', top: '90%', width: '2px', height: '2px', delay: '2.2s' }
       ].map((pos, i) => (
        <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
         left: pos.left,
         top: pos.top,
         width: pos.width,
         height: pos.height,
         animationDelay: pos.delay
        }} />
       ))}
     </div>      {/* MESSAGES HEADER - MINIMALIST */}
      <header className="relative shrink-0 pt-safe pb-2 px-6 bg-white/40 backdrop-blur-md border-b border-black/5">
       <div className="relative z-10 flex items-center justify-between pt-2">
         <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 drop-shadow-sm">{t.messages.title}</h1>
         <button className="p-2.5 bg-white/60 rounded-full active:scale-95 transition-transform border border-black/5 text-slate-600">
           <Search className="h-5 w-5" />
         </button>
       </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-40">
        
        {/* SEAMLESS CATEGORIES */}
        <div className="bg-white/30 backdrop-blur-sm">
          <CategoryItem 
            icon={Flag} 
            label={t.messages.team} 
            subtext={latestTeam?.content || "Welcome to ummy Chat"}
            date={latestTeam?.timestamp ? format(latestTeam.timestamp.toDate(), 'h:mm a') : ""}
            colorClass="bg-gradient-to-br from-orange-400 to-red-500"
            customIcon={<UmmyLogoIcon className="h-10 w-10 p-1" />}
            onClick={() => setShowOfficial(true)}
          />
          
          <CategoryItem 
            icon={Shield} 
            label={t.messages.system} 
            subtext={latestSystem?.content || "You receive 100 coins From Ummy team"}
            date={latestSystem?.timestamp ? format(latestSystem.timestamp.toDate(), 'h:mm a') : ""}
            colorClass="bg-gradient-to-br from-blue-400 to-indigo-600"
            customIcon={<img src="https://img.icons8.com/color/96/appointment-reminders--v1.png" className="h-7 w-7" alt="System" />}
            onClick={() => setShowSystemDialog(true)}
          />

          <CategoryItem 
            icon={Heart} 
            label="Bond Requests" 
            subtext={hasPending ? "You have a new relationship proposal!" : "No new bond requests."}
            colorClass="bg-gradient-to-br from-rose-400 to-pink-500"
            onClick={() => setShowRequests(true)}
            customIcon={
              <div className="relative">
                <Heart className="h-6 w-6 text-white" fill="white" />
                {hasPending && <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full animate-ping" />}
                {hasPending && <div className="absolute -top-1 -right-1 h-3 w-3 bg-rose-300 rounded-full" />}
              </div>
            }
          />
        </div>

        <div className="mt-6 mb-2">
          <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 underline decoration-primary/20 underline-offset-4">{t.messages.conversations}</h2>
        </div>
        
        {/* SEAMLESS CONVERSATIONS */}
        <div className="min-h-[300px] bg-white/20 backdrop-blur-sm">
          {isChatsLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
             <Loader className="animate-spin text-primary h-8 w-8" />
             <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Syncing Identity...</p>
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
            <div className="py-20 text-center space-y-4 opacity-40 flex flex-col items-center">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <div className="space-y-1">
               <p className="font-bold text-xs uppercase text-slate-400">{t.messages.quiet}</p>
               <p className="text-[9px] font-bold uppercase text-slate-300">{t.messages.startVibe}</p>
              </div>
            </div>
          )}
        </div>
      </div>

     <Dialog open={showOfficial} onOpenChange={setShowOfficial}>
      <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-sans">
       <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4 bg-orange-50/30">
        <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
          <Flag className="h-6 w-6" />
        </div>
        <div className="flex-1 text-left">
         <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Official Activities</DialogTitle>
         <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-orange-600/60 mt-1">Global team broadcasts.</DialogDescription>
        </div>
       </DialogHeader>
       <ScrollArea className="max-h-[60vh] p-6">
         <div className="space-y-4">
          {teamMsgs.length === 0 ? (
           <div className="py-10 text-center opacity-20 font-body">No official broadcasts in the grid.</div>
          ) : (
           teamMsgs.map((msg: any) => (
            <div key={msg.id} className="p-5 bg-gray-50 rounded-3xl border-2 border-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
               <h4 className="font-bold uppercase text-sm text-gray-800">{msg.title || 'Official'}</h4>
               <span className="text-[10px] text-gray-400 font-bold uppercase">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
              </div>
              <p className="text-sm font-body text-gray-600 leading-relaxed">{msg.content}</p>
            </div>
           ))
          )}
         </div>
       </ScrollArea>
       <div className="p-8 pt-0">
        <button onClick={() => setShowOfficial(false)} className="w-full h-16 bg-black text-white rounded-xl font-bold uppercase text-lg shadow-xl active:scale-95 transition-all">Dismiss</button>
       </div>
      </DialogContent>
     </Dialog>

     <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
      <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-sans">
       <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4 bg-blue-50/30">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
          <Shield className="h-6 w-6" />
        </div>
        <div className="flex-1 text-left">
         <DialogTitle className="text-2xl font-bold uppercase tracking-tight">System Notices</DialogTitle>
         <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-blue-600/60 mt-1">Personal security frequency.</DialogDescription>
        </div>
       </DialogHeader>
       <ScrollArea className="max-h-[60vh] p-6">
         <div className="space-y-4">
          {systemMsgs.length === 0 ? (
           <div className="py-10 text-center opacity-20 font-body">No system notices found.</div>
          ) : (
           systemMsgs.map((msg: any) => (
            <div key={msg.id} className="p-5 bg-gray-50 rounded-3xl border-2 border-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
               <h4 className="font-bold uppercase text-sm text-gray-800">{msg.title || 'System'}</h4>
               <span className="text-[10px] text-gray-400 font-bold uppercase">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
              </div>
              <p className="text-sm font-body text-gray-600 leading-relaxed">{msg.content}</p>
            </div>
           ))
          )}
         </div>
       </ScrollArea>
       <div className="p-8 pt-0">
        <button onClick={() => setShowSystemDialog(false)} className="w-full h-16 bg-black text-white rounded-xl font-bold uppercase text-lg shadow-xl active:scale-95 transition-all">Dismiss</button>
       </div>
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
  </AppLayout>
 );
}
