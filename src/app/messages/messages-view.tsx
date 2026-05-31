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
 Home,
 Pin,
 Trash2,
 MoreVertical,
 Ban,
 Trash,
 AlertTriangle,
 User,
 Bell,
 Info,
 FileText,
 Settings,
 UserCircle
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
   arrayRemove,
   addDoc as addFirestoreDoc,
   deleteDoc,
   setDoc,
   updateDoc,
   getDocs,
   writeBatch
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
import { Sheet, SheetContent } from '@/components/ui/sheet';
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

// ==================== ChatListItem ====================
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
  const isPinned = (chat.pinnedBy || []).includes(currentUid);

  return (
    <div 
      onClick={() => onSelect(chat.id, otherUser)}
      className={cn(
        "px-6 py-4 flex gap-4 hover:bg-black/5 active:bg-black/10 transition-all cursor-pointer group border-b border-black/5 last:border-0 relative",
        isUnread && "bg-primary/10",
        isPinned && "bg-slate-50/80 border-l-4 border-l-primary"
      )}
    >
      {isPinned && <Pin className="absolute top-2 right-2 h-3 w-3 text-primary fill-current rotate-45" />}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-md">
          <AvatarImage src={otherUser.avatarUrl ? `${otherUser.avatarUrl}${otherUser.avatarUrl.includes('?') ? '&' : '?'}v=${otherUser.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
          <AvatarFallback className="bg-slate-200">
            <UserCircle className="h-6 w-6 text-slate-400" />
          </AvatarFallback>
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

// ==================== OfficialPage (Team) ====================
function OfficialPage({ open, onOpenChange, messages }: any) {
  const { user } = useUser();
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans">
        {/* Purple gradient top 10vh */}
        <div className="h-[10vh] bg-gradient-to-b from-purple-400/30 via-purple-300/20 to-white shrink-0 absolute top-0 left-0 right-0 z-0 pointer-events-none" />
        
        <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
          <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
            <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Flag className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-lg font-bold uppercase tracking-tight">Ummy Team</DialogTitle>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Official Updates</p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
          <ScrollArea className="h-full px-4 pt-6">
            <div className="flex flex-col gap-4 pb-10">
              {messages && messages.length > 0 ? (
                messages.map((msg: any) => (
                  <div key={msg.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <Flag className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {msg.timestamp ? format(msg.timestamp.toDate(), 'MMM d, h:mm a') : '...'}
                      </span>
                    </div>
                    <p className="text-sm font-body text-gray-700 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">No team updates yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        {/* Footer - You can't message */}
        <footer className="p-4 bg-white border-t border-gray-100 flex justify-center items-center h-16">
          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">You Can't Message Ummy Team</p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SystemPage ====================
function SystemPage({ open, onOpenChange, messages }: any) {
  const { user } = useUser();
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans">
        {/* Purple gradient top 10vh */}
        <div className="h-[10vh] bg-gradient-to-b from-purple-400/30 via-purple-300/20 to-white shrink-0 absolute top-0 left-0 right-0 z-0 pointer-events-none" />
        
        <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
          <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
            <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-lg font-bold uppercase tracking-tight">Ummy System</DialogTitle>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">System Notices</p>
            </div>
          </div>
        </DialogHeader>

        <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
          <ScrollArea className="h-full px-4 pt-6">
            <div className="flex flex-col gap-4 pb-10">
              {messages && messages.length > 0 ? (
                messages.map((msg: any) => (
                  <div key={msg.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {msg.timestamp ? format(msg.timestamp.toDate(), 'MMM d, h:mm a') : '...'}
                      </span>
                    </div>
                    <p className="text-sm font-body text-gray-700 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">No system notices</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        <footer className="p-4 bg-white border-t border-gray-100 flex justify-center items-center h-16">
          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">You Can't Message Ummy System</p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

// ==================== RequestsPage ====================
function RequestsPage({ open, onOpenChange }: any) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

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
        toast({ title: 'Relationship Established!' });
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
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans">
        {/* Purple gradient top 10vh */}
        <div className="h-[10vh] bg-gradient-to-b from-purple-400/30 via-purple-300/20 to-white shrink-0 absolute top-0 left-0 right-0 z-0 pointer-events-none" />
        
        <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
          <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
            <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <div className="h-12 w-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Heart className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-lg font-bold uppercase tracking-tight">Purpose Requests</DialogTitle>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Special bond proposals</p>
            </div>
          </div>
        </DialogHeader>

        <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
          <ScrollArea className="h-full px-4 pt-6">
            <div className="flex flex-col gap-4 pb-10">
              {isLoading ? (
                <div className="py-20 text-center flex flex-col items-center gap-2">
                  <Loader className="h-6 w-6 text-rose-500 animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading requests...</span>
                </div>
              ) : !requests || requests.length === 0 ? (
                <div className="py-20 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">No pending requests</p>
                </div>
              ) : requests.map((req: any) => (
                <RequestItem key={req.id} request={req} onAction={handleAction} />
              ))}
            </div>
          </ScrollArea>
        </main>

        <footer className="p-4 bg-white border-t border-gray-100 flex justify-center items-center h-16">
          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">You Can't Message Requests</p>
        </footer>
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
        <AvatarFallback className="bg-slate-200">
          <UserCircle className="h-6 w-6 text-slate-400" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-black text-xs uppercase text-slate-800 truncate">{fromUser?.username || 'Somebody'}</h4>
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Wants to be your {request.type}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAction(request, 'accept')} className="h-8 w-8 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center active:scale-90">
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <button onClick={() => onAction(request, 'decline')} className="h-8 w-8 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center active:scale-90">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== ChatRoomDialog ====================
function ChatRoomDialog({ open, onOpenChange, chatId, otherUser, currentUser }: any) {
  const [text, setText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showChatActions, setShowChatActions] = useState(false);
  const [showBlockedCard, setShowBlockedCard] = useState(false);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const msgLongPressTimer = useRef<any>(null);

  const { userProfile: liveOtherUser } = useUserProfile(otherUser?.id);
  const isOnline = liveOtherUser?.isOnline;

  const chatRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'privateChats', chatId);
  }, [firestore, chatId]);
  
  const { data: chatData } = useDoc(chatRef);
  const isPinned = (chatData?.pinnedBy || []).includes(currentUser?.uid);

  const blockCheckQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid || !otherUser?.id) return null;
    const pairId = [currentUser.uid, otherUser.id].sort().join('_');
    return doc(firestore, 'blockedUsers', pairId);
  }, [firestore, currentUser?.uid, otherUser?.id]);
  
  const { data: blockData } = useDoc(blockCheckQuery);
  const isBlocked = blockData?.blockedBy?.includes(currentUser?.uid) || blockData?.blockedBy?.includes(otherUser?.id);
  const isBlockedByMe = blockData?.blockedBy?.includes(currentUser?.uid);
  const isBlockedByOther = blockData?.blockedBy?.includes(otherUser?.id);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(100));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (open && chatId && currentUser?.uid && firestore && (messages?.length ?? 0) > 0) {
      const chatRef = doc(firestore, 'privateChats', chatId);
      updateDocumentNonBlocking(chatRef, { lastMessageReadBy: arrayUnion(currentUser.uid) });
    }
  }, [open, chatId, messages, currentUser?.uid, firestore]);

  // Show blocked card when blocked
  useEffect(() => {
    if (isBlockedByOther && open) {
      setShowBlockedCard(true);
    } else {
      setShowBlockedCard(false);
    }
  }, [isBlockedByOther, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !imageUrl) || !firestore || !currentUser || !chatId) return;
    
    if (isBlocked) {
      toast({ variant: 'destructive', title: 'Cannot send message', description: 'You have blocked this user or are blocked' });
      return;
    }

    const messageData = {
      text: text.trim(),
      imageUrl: imageUrl || null,
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    };

    addDocumentNonBlocking(collection(firestore, 'privateChats', chatId, 'messages'), messageData);

    const participantIds = [currentUser.uid, otherUser.id].sort();
    setDocumentNonBlocking(doc(firestore, 'privateChats', chatId), {
      id: chatId,
      participantIds,
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
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleMsgTouchStart = (msg: any) => {
    msgLongPressTimer.current = setTimeout(() => {
      setSelectedMessage(msg);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleMsgTouchEnd = () => {
    if (msgLongPressTimer.current) clearTimeout(msgLongPressTimer.current);
  };

  const deleteMessage = async () => {
    if (!selectedMessage || !firestore || !chatId) return;
    try {
      await deleteDoc(doc(firestore, 'privateChats', chatId, 'messages', selectedMessage.id));
      setSelectedMessage(null);
    } catch (e) {
      console.error(e);
    }
  };

  const blockUser = async () => {
    if (!firestore || !currentUser?.uid || !otherUser?.id) return;
    try {
      const pairId = [currentUser.uid, otherUser.id].sort().join('_');
      const blockRef = doc(firestore, 'blockedUsers', pairId);
      await setDocumentNonBlocking(blockRef, {
        id: pairId,
        blockedBy: arrayUnion(currentUser.uid),
        participantIds: [currentUser.uid, otherUser.id],
        blockedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: 'User Blocked' });
      setShowChatActions(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to block user' });
    }
  };

  const unblockUser = async () => {
    if (!firestore || !currentUser?.uid || !otherUser?.id) return;
    try {
      const pairId = [currentUser.uid, otherUser.id].sort().join('_');
      const blockRef = doc(firestore, 'blockedUsers', pairId);
      await updateDocumentNonBlocking(blockRef, {
        blockedBy: arrayRemove(currentUser.uid)
      });
      toast({ title: 'User Unblocked' });
      setShowChatActions(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to unblock user' });
    }
  };

  const deleteEntireChat = async () => {
    if (!firestore || !chatId) return;
    try {
      const msgsQuery = query(collection(firestore, 'privateChats', chatId, 'messages'));
      const msgsSnap = await getDocs(msgsQuery);
      const batch = writeBatch(firestore);
      msgsSnap.forEach(m => batch.delete(m.ref));
      await batch.commit();
      await deleteDoc(doc(firestore, 'privateChats', chatId));
      toast({ title: 'Conversation Deleted' });
      setShowChatActions(false);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to delete chat' });
    }
  };

  const clearChat = async () => {
    if (!firestore || !chatId) return;
    try {
      const msgsQuery = query(collection(firestore, 'privateChats', chatId, 'messages'));
      const msgsSnap = await getDocs(msgsQuery);
      const batch = writeBatch(firestore);
      msgsSnap.forEach(m => batch.delete(m.ref));
      await batch.commit();
      toast({ title: 'Chat Cleared' });
      setShowChatActions(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to clear chat' });
    }
  };

  const pinChat = async () => {
    if (!firestore || !chatId || !currentUser?.uid) return;
    try {
      const chatRef = doc(firestore, 'privateChats', chatId);
      await updateDocumentNonBlocking(chatRef, {
        pinnedBy: arrayUnion(currentUser.uid)
      });
      toast({ title: 'Chat Pinned to Top' });
      setShowChatActions(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to pin chat' });
    }
  };

  const unpinChat = async () => {
    if (!firestore || !chatId || !currentUser?.uid) return;
    try {
      const chatRef = doc(firestore, 'privateChats', chatId);
      await updateDocumentNonBlocking(chatRef, {
        pinnedBy: arrayRemove(currentUser.uid)
      });
      toast({ title: 'Chat Unpinned' });
      setShowChatActions(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to unpin chat' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans">
          {/* Purple gradient top 10vh */}
          <div className="h-[10vh] bg-gradient-to-b from-purple-400/30 via-purple-300/20 to-white shrink-0 absolute top-0 left-0 right-0 z-0 pointer-events-none" />
          
          {/* Header */}
          <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
            <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
              <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              <Avatar className="h-10 w-10 border shadow-sm rounded-full">
                <AvatarImage src={otherUser?.avatarUrl ? `${otherUser.avatarUrl}${otherUser.avatarUrl.includes('?') ? '&' : '?'}v=${otherUser.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
                <AvatarFallback className="bg-slate-200">
                  <UserCircle className="h-6 w-6 text-slate-400" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <DialogTitle className="text-lg font-bold uppercase tracking-tight truncate">{otherUser?.username}</DialogTitle>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider", isOnline ? "text-green-500" : "text-gray-400")}>
                  {isOnline ? 'online' : 'offline'}
                </p>
              </div>
              <button 
                onClick={() => setShowChatActions(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90"
              >
                <MoreVertical className="h-6 w-6 text-black" />
              </button>
            </div>
            <DialogDescription className="sr-only">Conversation with {otherUser?.username}</DialogDescription>
          </DialogHeader>

          {/* Messages Area with blocked card overlay */}
          <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
            {/* Blocked Card - Center screen transparent card */}
            {showBlockedCard && isBlockedByOther && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm px-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-200 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-300">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ban className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">You Are Blocked</h3>
                  <p className="text-sm font-body text-gray-500 mb-6">This user has blocked you. You cannot send messages anymore.</p>
                  <button 
                    onClick={() => onOpenChange(false)}
                    className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold uppercase text-sm tracking-wider hover:bg-gray-800 active:scale-[0.98] transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}

            <ScrollArea className="h-full px-4 pt-6">
              <div className="flex flex-col gap-3 pb-10">
                {isBlocked && !isBlockedByOther && (
                  <div className="text-center py-8 px-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase text-yellow-700">
                      {isBlockedByMe ? 'You have blocked this user' : 'You are blocked'}
                    </p>
                  </div>
                )}
                {messages?.map((msg: any) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  
                  return (
                    <div key={msg.id} 
                      onMouseDown={() => handleMsgTouchStart(msg)} 
                      onMouseUp={handleMsgTouchEnd} 
                      onMouseLeave={handleMsgTouchEnd}
                      onTouchStart={() => handleMsgTouchStart(msg)} 
                      onTouchEnd={handleMsgTouchEnd}
                      className={cn(
                        "flex gap-3 transition-transform active:scale-[0.98]",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar - Sirf avatar, no letters */}
                      <div className="shrink-0 self-end">
                        {isMe ? (
                          <Avatar className="h-7 w-7 border border-white shadow-sm rounded-full">
                            <AvatarImage src={currentUser?.avatarUrl ? `${currentUser.avatarUrl}${currentUser.avatarUrl.includes('?') ? '&' : '?'}v=${currentUser?.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
                            <AvatarFallback className="bg-slate-200">
                              <UserCircle className="h-4 w-4 text-slate-400" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-7 w-7 border border-white shadow-sm rounded-full">
                            <AvatarImage src={otherUser?.avatarUrl ? `${otherUser.avatarUrl}${otherUser.avatarUrl.includes('?') ? '&' : '?'}v=${otherUser?.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
                            <AvatarFallback className="bg-slate-200">
                              <UserCircle className="h-4 w-4 text-slate-400" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={cn(
                        "flex flex-col max-w-[75%]",
                        isMe ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-body shadow-sm border",
                          isMe 
                            ? "bg-primary text-white rounded-br-none border-primary/20" 
                            : "bg-white text-gray-800 rounded-bl-none border-gray-100"
                        )}>
                          {msg.imageUrl && (
                            <div 
                              onClick={() => setPreviewImage(msg.imageUrl)} 
                              className="mb-2 relative aspect-square w-48 max-w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner cursor-pointer active:scale-[0.98] transition-transform"
                            >
                              <Image src={msg.imageUrl} fill className="object-cover" alt="Sent image" unoptimized />
                            </div>
                          )}
                          {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 px-1">
                          {msg.timestamp ? format(msg.timestamp.toDate(), 'h:mm a') : '...'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </main>

          {/* Footer Input */}
          <footer className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 relative z-50 pb-safe">
            {isBlockedByMe ? (
              <div className="flex-1 text-center">
                <p className="text-xs font-bold uppercase text-gray-400">User blocked. Unblock to send messages.</p>
              </div>
            ) : isBlocked ? (
              <div className="flex-1 text-center">
                <p className="text-xs font-bold uppercase text-gray-400">You cannot send messages</p>
              </div>
            ) : (
              <>
                <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-50 rounded-full active:scale-90 transition-all">
                  <ImageIcon className="h-6 w-6" />
                </button>
                <input type="file" hidden ref={imageInputRef} accept="image/*" onChange={handleImageUpload} />
                <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
                  <input 
                    type="text" 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-50 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-body" 
                  />
                  <button 
                    type="submit" 
                    disabled={!text.trim() && !isUploadingImage} 
                    className="p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/30 active:scale-90 transition-all disabled:opacity-50"
                  >
                    {isUploadingImage ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>
              </>
            )}
          </footer>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] p-0 overflow-hidden bg-black border-none z-[600]">
          <div className="relative aspect-square w-full">
            {previewImage && <Image src={previewImage} fill className="object-contain" alt="Preview" unoptimized />}
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Delete Sheet */}
      <Sheet open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-8 pb-20 bg-white border-t-2 border-primary/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000]">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <div className="flex flex-col gap-4">
              <button 
                onClick={deleteMessage} 
                className="w-full py-5 px-6 flex items-center gap-5 bg-red-50 rounded-[1.5rem] active:scale-[0.98] transition-all hover:bg-red-100 border border-red-100 group text-red-600"
              >
                <div className="h-10 w-10 rounded-xl bg-white text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <Trash2 className="h-5 w-5" />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Delete Message</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat Actions Sheet */}
      <Sheet open={showChatActions} onOpenChange={setShowChatActions}>
        <SheetContent 
          side="bottom" 
          className="p-4 pb-10 bg-transparent border-none z-[1000] flex flex-col items-center justify-end"
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            {/* Top dark section */}
            <div className="bg-[#2C2C2E] rounded-t-2xl overflow-hidden">
              <button 
                onClick={() => { setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                Report
              </button>
              <button 
                onClick={() => { clearChat(); setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                Clear history
              </button>
              <button 
                onClick={() => { deleteEntireChat(); setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                Delete
              </button>
              <button 
                onClick={() => { isBlockedByMe ? unblockUser() : blockUser(); setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                {isBlockedByMe ? 'Unblock' : 'Block'}
              </button>
              <button 
                onClick={() => { isPinned ? unpinChat() : pinChat(); setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                {isPinned ? 'Unpin Chat' : 'Pin Chat'}
              </button>
            </div>
            <button 
              onClick={() => setShowChatActions(false)}
              className="w-full bg-[#00A86B] hover:bg-[#00945D] active:bg-[#008050] text-white font-medium text-[17px] py-5 text-center transition-colors rounded-b-2xl mt-2"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ==================== Bottom Navigation Bar Component ====================
function BottomNavBar({ messageBadge = 0 }: { messageBadge?: number }) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="bg-gradient-to-r from-pink-400/95 via-pink-300/95 to-pink-400/95 backdrop-blur-xl border-t border-white/30 shadow-[0_-8px_32px_rgba(236,72,153,0.3)]">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {/* Home Tab */}
          <button 
            onClick={() => router.push('/')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl transition-all active:scale-90 min-w-[64px]",
              isActive('/home') || isActive('/') ? "bg-white/30" : "hover:bg-white/10"
            )}
          >
            <Home className={cn("h-5 w-5 transition-all", isActive('/home') || isActive('/') ? "text-white fill-white" : "text-white/70")} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Home</span>
          </button>

          {/* Rooms Tab */}
          <button 
            onClick={() => router.push('/rooms')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl transition-all active:scale-90 min-w-[64px]",
              isActive('/rooms') ? "bg-white/30" : "hover:bg-white/10"
            )}
          >
            <Users className={cn("h-5 w-5 transition-all", isActive('/rooms') ? "text-white fill-white" : "text-white/70")} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Rooms</span>
          </button>

          {/* Messages Tab - WITH BADGE */}
          <button 
            onClick={() => router.push('/messages')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl transition-all active:scale-90 min-w-[64px] relative",
              isActive('/messages') ? "bg-white/30" : "hover:bg-white/10"
            )}
          >
            <div className="relative">
              <MessageSquare className={cn("h-5 w-5 transition-all", isActive('/messages') ? "text-white fill-white" : "text-white/70")} />
              
              {/* 🔴 Unread Message Badge */}
              {messageBadge > 0 && (
                <span className={cn(
                  "absolute -top-2.5 -right-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-in zoom-in duration-300 border-2 border-white",
                  messageBadge > 99 ? "min-w-[22px] h-[18px] px-1.5" : messageBadge > 9 ? "min-w-[18px] h-[18px] px-1" : "h-[18px] w-[18px]"
                )}>
                  {messageBadge > 99 ? '99+' : messageBadge}
                </span>
              )}
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Messages</span>
          </button>

          {/* Notifications Tab */}
          <button 
            onClick={() => router.push('/notifications')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl transition-all active:scale-90 min-w-[64px]",
              isActive('/notifications') ? "bg-white/30" : "hover:bg-white/10"
            )}
          >
            <Bell className={cn("h-5 w-5 transition-all", isActive('/notifications') ? "text-white fill-white" : "text-white/70")} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Alerts</span>
          </button>

          {/* Profile Tab */}
          <button 
            onClick={() => router.push('/profile')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl transition-all active:scale-90 min-w-[64px]",
              isActive('/profile') ? "bg-white/30" : "hover:bg-white/10"
            )}
          >
            <User className={cn("h-5 w-5 transition-all", isActive('/profile') ? "text-white fill-white" : "text-white/70")} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Main MessagesView ====================
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

  useEffect(() => {
    if (userIdFromUrl && otherUserFromUrl && user?.uid && firestore) {
      const participantIds = [user.uid, userIdFromUrl].sort();
      const chatId = participantIds.join('_');
      setActiveChatId(chatId);
      setSelectedRecipient(otherUserFromUrl);
      setDocumentNonBlocking(doc(firestore, 'privateChats', chatId), {
        id: chatId, participantIds, updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }, [userIdFromUrl, otherUserFromUrl, user?.uid, firestore]);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'privateChats'), where('participantIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: rawChats, isLoading: isChatsLoading } = useCollection(chatsQuery);

  const chats = useMemo(() => {
    if (!rawChats) return null;
    return [...rawChats].sort((a, b) => {
      const aPinned = (a.pinnedBy || []).includes(user?.uid) ? 1 : 0;
      const bPinned = (b.pinnedBy || []).includes(user?.uid) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
    });
  }, [rawChats, user?.uid]);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [firestore, user?.uid]);

  const { data: allNotifications } = useCollection(notificationsQuery);
  const teamMsgs = useMemo(() => allNotifications?.filter((n: any) => n.type === 'system') || [], [allNotifications]);
  const systemMsgs = useMemo(() => allNotifications?.filter((n: any) => n.type === 'direct_system') || [], [allNotifications]);

  // ==================== Unread Counts Calculation ====================
  
  // Unread chat count
  const unreadChatCount = useMemo(() => {
    if (!chats || !user?.uid) return 0;
    return chats.filter((chat: any) => {
      return chat.lastSenderId !== user.uid && 
             !(chat.lastMessageReadBy || []).includes(user.uid);
    }).length;
  }, [chats, user?.uid]);

  // Unread team messages count
  const unreadTeamCount = useMemo(() => {
    if (!teamMsgs || !user?.uid) return 0;
    return teamMsgs.filter((msg: any) => {
      return !(msg.readBy || []).includes(user.uid);
    }).length;
  }, [teamMsgs, user?.uid]);

  // Unread system messages count
  const unreadSystemCount = useMemo(() => {
    if (!systemMsgs || !user?.uid) return 0;
    return systemMsgs.filter((msg: any) => {
      return !(msg.readBy || []).includes(user.uid);
    }).length;
  }, [systemMsgs, user?.uid]);

  // Pending requests count
  const pendingRequestsCount = useMemo(() => {
    // requests data is fetched in RequestsPage, but we can approximate
    // For now, we'll count from allNotifications if any proposal type exists
    return allNotifications?.filter((n: any) => n.type === 'proposal' && n.status === 'pending')?.length || 0;
  }, [allNotifications]);

  // Total unread badge count
  const totalUnreadBadge = unreadChatCount + unreadTeamCount + unreadSystemCount + pendingRequestsCount;

  if (theme === 'GLOSSY') return <MessagesViewGlossy />;

  return (
    <AppLayout hideBottomNav={!!activeChatId}>
      {/* Soft pink background */}
      <div className="h-[100dvh] bg-gradient-to-b from-pink-200/50 via-pink-100/40 to-white flex flex-col relative font-sans overflow-hidden">
        
        {/* Top 10vh purple gradient mixing with white */}
        <div className="h-[10vh] bg-gradient-to-b from-purple-400/30 via-purple-300/20 to-transparent shrink-0 absolute top-0 left-0 right-0 z-0 pointer-events-none" />
        
        <header className="relative shrink-0 pt-safe pb-2 px-6 bg-white/50 backdrop-blur-md border-b border-black/5 z-20">
          <div className="flex items-center justify-between pt-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{t.messages.title}</h1>
            <button className="p-2.5 bg-white/60 rounded-full border border-black/5 text-slate-600"><Search className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
          <div className="bg-white/30 backdrop-blur-sm">
            <CategoryItem 
              icon={Flag} 
              label={t.messages.team} 
              subtext={teamMsgs[0]?.content || "Welcome to Ummy"} 
              colorClass="bg-gradient-to-br from-orange-400 to-red-500" 
              customIcon={<UmmyLogoIcon className="h-10 w-10 p-1" />} 
              onClick={() => setShowOfficial(true)} 
            />
            <CategoryItem 
              icon={Shield} 
              label={t.messages.system} 
              subtext={systemMsgs[0]?.content || "No new notices"} 
              colorClass="bg-gradient-to-br from-blue-400 to-indigo-600" 
              onClick={() => setShowSystemDialog(true)} 
            />
            <CategoryItem 
              icon={Heart} 
              label="Requests" 
              subtext={pendingRequestsCount > 0 ? `${pendingRequestsCount} pending request${pendingRequestsCount > 1 ? 's' : ''}` : "No requests"} 
              colorClass="bg-gradient-to-br from-rose-400 to-pink-500" 
              onClick={() => setShowRequests(true)} 
            />
          </div>

          <h2 className="px-6 mt-6 mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Conversations</h2>
          
          <div className="min-h-[300px] bg-white/20 backdrop-blur-sm">
            {isChatsLoading ? (
              <div className="py-20 flex flex-col items-center gap-4"><Loader className="animate-spin text-primary h-8 w-8" /></div>
            ) : chats && chats.length > 0 ? (
              chats.map(chat => <ChatListItem key={chat.id} chat={chat} currentUid={user?.uid} onSelect={(id: string, other: any) => { setActiveChatId(id); setSelectedRecipient(other); }} />)
            ) : (
              <div className="py-20 text-center opacity-40"><MessageSquare className="h-10 w-10 mx-auto mb-2" /><p className="text-xs font-bold uppercase">It's quiet here...</p></div>
            )}
          </div>
        </div>

        {/* Pink Bottom Navigation Bar with Badge */}
        <BottomNavBar messageBadge={totalUnreadBadge} />

        {/* Pages */}
        <OfficialPage 
          open={showOfficial} 
          onOpenChange={setShowOfficial} 
          messages={teamMsgs} 
        />
        
        <SystemPage 
          open={showSystemDialog} 
          onOpenChange={setShowSystemDialog} 
          messages={systemMsgs} 
        />
        
        <RequestsPage 
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
