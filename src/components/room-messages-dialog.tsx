'use client';
import { useRouter } from 'next/navigation';

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
 MessageSquare,
 ImageIcon,
 X
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, query, orderBy, where, serverTimestamp, doc, limitToLast } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, isToday, isYesterday, isSameWeek } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const ChatListItem = ({ chat, currentUid, onSelect, router }: any) => {
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
    <Avatar 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(null, { id: otherUser.id }); // Using null to signal close/navigation
        router.push(`/profile/${otherUser.id}`);
      }}
      className="h-12 w-12 border border-white/10 shadow-sm cursor-pointer active:scale-95 transition-transform"
    >
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

function ConversationView({ chatId, otherUser, currentUser, onBack, router, onClose }: any) {
 const [text, setText] = useState('');
 const [previewImage, setPreviewImage] = useState<string | null>(null);
 const [isUploadingImage, setIsUploadingImage] = useState(false);
 const firestore = useFirestore();
 const storage = useStorage();
 const { toast } = useToast();
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const imageInputRef = useRef<HTMLInputElement>(null);
 const { userProfile: currentUserProfile } = useUserProfile(currentUser?.uid);

 const messagesQuery = useMemoFirebase(() => {
  if (!firestore || !chatId) return null;
  return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50));
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
   senderBubble: currentUserProfile?.inventory?.activeBubble || null,
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
   toast({ variant: 'destructive', title: 'Upload Failed' });
  } finally {
   setIsUploadingImage(false);
   if (imageInputRef.current) imageInputRef.current.value = '';
  }
 };

 return (
  <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
   <header className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/40 shrink-0">
     <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
      <ChevronLeft className="h-5 w-5 text-white" />
     </button>
     <Avatar 
       onClick={() => {
         onClose();
         router.push(`/profile/${otherUser.id}`);
       }}
       className="h-8 w-8 border border-white/10 cursor-pointer active:scale-95 transition-transform"
     >
      <AvatarImage src={otherUser.avatarUrl} />
      <AvatarFallback>{otherUser.username?.charAt(0)}</AvatarFallback>
     </Avatar>
     <div className="flex-1">
      <h4 className="text-sm font-bold uppercase tracking-tight">{otherUser.username}</h4>
      <p className="text-[8px] font-bold text-green-500 uppercase tracking-wider">Active Sync</p>
     </div>
   </header>

   <ScrollArea className="flex-1 px-4 py-4">
     <div className="flex flex-col gap-3 pb-4">
      {messages?.map((msg: any) => {
       const isMe = msg.senderId === currentUser?.uid;
       return (
        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
           <ChatMessageBubble bubbleId={msg.senderBubble} isMe={isMe} className="text-xs">
            {msg.imageUrl && (
             <div 
              onClick={() => setPreviewImage(msg.imageUrl)}
              className="mb-2 relative aspect-square w-48 max-w-full rounded-xl overflow-hidden bg-black/20 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
             >
               <Image src={msg.imageUrl} fill className="object-cover" alt="Sent image" unoptimized />
             </div>
            )}
            {msg.text && <p className="leading-relaxed">{msg.text}</p>}
           </ChatMessageBubble>
          <span className="text-[7px] font-bold text-white/20 uppercase mt-1 px-1">
           {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
          </span>
        </div>
       );
      })}
      <div ref={messagesEndRef} />
     </div>
   </ScrollArea>

   <footer className="p-3 bg-black/60 border-t border-white/10 shrink-0">
     <div className="flex gap-2">
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
       className="bg-white/5 text-white/60 h-10 w-10 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform disabled:opacity-50"
      >
        {isUploadingImage ? <Loader className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      </button>
      <form onSubmit={handleSend} className="flex-1 flex gap-2">
        <Input 
         value={text}
         onChange={(e) => setText(e.target.value)}
         placeholder="Vibe text..."
         className="flex-1 h-10 rounded-full bg-white/5 border-white/10 focus:border-primary px-4 text-xs placeholder:text-white/20"
        />
        <button 
         type="submit" 
         disabled={!text.trim() && !isUploadingImage}
         className="bg-primary text-black h-10 w-10 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 shadow-lg"
        >
         <Send className="h-4 w-4" />
        </button>
      </form>
     </div>
   </footer>

   {/* Full Screen Image Preview Dialog */}
   <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
    <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-black/95 p-0 flex flex-col items-center justify-center z-[400]">
     <DialogHeader className="sr-only">
      <DialogTitle>Image Preview</DialogTitle>
      <DialogDescription>Full screen view</DialogDescription>
     </DialogHeader>
     <button 
      onClick={() => setPreviewImage(null)}
      className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-[410] active:scale-90 transition-transform"
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
  </div>
 );
}

export function RoomMessagesDialog({ open, onOpenChange, initialRecipient }: { open: boolean; onOpenChange: (val: boolean) => void; initialRecipient?: any }) {
 const router = useRouter();
 const { user } = useUser();
 const firestore = useFirestore();
 const [activeChatId, setActiveChatId] = useState<string | null>(null);
 const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

 // Identity Chat Sync: Automatically initialize chat when provided with a direct recipient
 useEffect(() => {
  if (open && initialRecipient && user) {
   const recipientId = initialRecipient.id || initialRecipient.uid;
   const participantIds = [user.uid, recipientId].sort();
   const chatId = participantIds.join('_');
   setActiveChatId(chatId);
   setSelectedRecipient(initialRecipient);
  }
 }, [open, initialRecipient, user]);

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
   <DialogContent className="sm:max-w-md h-[65vh] bg-[#121212]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-sans shadow-2xl animate-in slide-in-from-bottom-full duration-500">
    <DialogHeader className="p-6 pb-2 border-b border-white/5 shrink-0">
      <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white/90 flex items-center gap-2">
       <MessageSquare className="h-5 w-5 text-primary" /> Messages
      </DialogTitle>
      <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-white/20 mt-1">
       Your social graph frequencies.
      </DialogDescription>
    </DialogHeader>

    {activeChatId ? (
     <ConversationView 
      chatId={activeChatId} 
      otherUser={selectedRecipient} 
      currentUser={user} 
      onBack={() => { setActiveChatId(null); setSelectedRecipient(null); }}
      router={router}
      onClose={() => handleClose(false)}
     />
    ) : (
     <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="pb-10">
         {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader className="animate-spin text-primary h-8 w-8" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/20">Syncing Identity...</p>
          </div>
         ) : chats && chats.length > 0 ? (
          chats.map(chat => (
           <ChatListItem 
            key={chat.id} 
            chat={chat} 
            currentUid={user?.uid} 
            onSelect={(id: string, other: any) => {
              if (id === null) {
                handleClose(false);
                return;
              }
              setActiveChatId(id);
              setSelectedRecipient(other);
            }} 
            router={router}
           />
          ))
         ) : (
          <div className="py-20 text-center opacity-20 space-y-2">
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
