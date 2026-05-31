'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
 Gift
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useCollection, useMemoFirebase, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useStorage, updateDocumentNonBlocking, useDoc } from '@/firebase';
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
import { GiftPicker } from '@/components/gift-picker';

// ==================== ChatRoomDialog ====================
function ChatRoomDialog({ open, onOpenChange, chatId, otherUser, currentUser }: any) {
  const [text, setText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showChatActions, setShowChatActions] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
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

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'privateChats', chatId, 'messages'), orderBy('timestamp', 'asc'), limitToLast(100));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  const recipientForGift = useMemo(() => {
    if (!otherUser) return null;
    return {
      uid: otherUser.id || otherUser.uid,
      name: otherUser.username || 'User',
      avatarUrl: otherUser.avatarUrl,
      seatIndex: 1
    };
  }, [otherUser]);

  useEffect(() => {
    if (open && chatId && currentUser?.uid && firestore && (messages?.length ?? 0) > 0) {
      const chatRef = doc(firestore, 'privateChats', chatId);
      updateDocumentNonBlocking(chatRef, { lastMessageReadBy: arrayUnion(currentUser.uid) });
    }
  }, [open, chatId, messages, currentUser?.uid, firestore]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !imageUrl) || !firestore || !currentUser || !chatId) return;
    
    if (isBlocked) {
      toast({ variant: 'destructive', title: 'Cannot send message', description: 'You have blocked this user' });
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
          {/* Header */}
          <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
            <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
              <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              <Avatar className="h-10 w-10 border shadow-sm rounded-full">
                <AvatarImage src={otherUser?.avatarUrl ? `${otherUser.avatarUrl}${otherUser.avatarUrl.includes('?') ? '&' : '?'}v=${otherUser?.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
                <AvatarFallback>{otherUser?.username?.charAt(0)}</AvatarFallback>
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

          {/* Messages Area */}
          <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
            <ScrollArea className="h-full px-4 pt-6">
              <div className="flex flex-col gap-3 pb-10">
                {isBlocked && (
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
                      {/* Avatar */}
                      <div className="shrink-0 self-end">
                        {isMe ? (
                          <Avatar className="h-7 w-7 border border-white shadow-sm rounded-full">
                            <AvatarImage src={currentUser?.avatarUrl ? `${currentUser.avatarUrl}${currentUser.avatarUrl.includes('?') ? '&' : '?'}v=${currentUser?.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
                            <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
                              {(currentUser?.username || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-7 w-7 border border-white shadow-sm rounded-full">
                            <AvatarImage src={otherUser?.avatarUrl ? `${otherUser.avatarUrl}${otherUser.avatarUrl.includes('?') ? '&' : '?'}v=${otherUser?.updatedAt?.toMillis?.() || Date.now()}` : undefined} />
                            <AvatarFallback className="text-[9px] bg-slate-200 text-slate-500 font-bold">
                              {(otherUser?.username || 'U').charAt(0)}
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

          {/* Footer Input with Gift Button */}
          <footer className="p-4 bg-white border-t border-gray-100 relative z-50 pb-safe">
            {isBlockedByMe ? (
              <div className="flex-1 text-center">
                <p className="text-xs font-bold uppercase text-gray-400">User blocked. Unblock to send messages.</p>
              </div>
            ) : isBlocked ? (
              <div className="flex-1 text-center">
                <p className="text-xs font-bold uppercase text-gray-400">You cannot send messages</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowGiftPicker(true)}
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-full active:scale-90 transition-all relative"
                >
                  <Gift className="h-6 w-6" />
                </button>
                
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
              </div>
            )}
          </footer>
        </DialogContent>
      </Dialog>

      {/* Gift Picker Component */}
      {recipientForGift && (
        <GiftPicker
          open={showGiftPicker}
          onOpenChange={setShowGiftPicker}
          roomId={chatId}
          recipient={recipientForGift}
          participants={[recipientForGift]}
        />
      )}

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
                onClick={() => { /* Report logic */ setShowChatActions(false); }}
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
                {isPinned ? 'Unpin' : 'Pin'}
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

// ==================== UmmyTeamChatDialog ====================
// Yeh component Ummy Team/System ke messages ke liye hai
// Same UI as ChatRoomDialog, but no message input, no gift picker, no block/pin options
function UmmyTeamChatDialog({ open, onOpenChange, chatId, currentUser }: any) {
  const [text, setText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showChatActions, setShowChatActions] = useState(false);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const msgLongPressTimer = useRef<any>(null);

  // Ummy Team ka dummy user object - real me yeh firebase se aa sakta hai
  const ummyTeamUser = {
    id: 'ummy_team',
    uid: 'ummy_team',
    username: 'Ummy Team',
    avatarUrl: null,
    isOnline: true,
  };

  // Messages query - different collection than private chats
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'ummyTeamChats', chatId, 'messages'), 
      orderBy('timestamp', 'asc'), 
      limitToLast(100)
    );
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  // Mark messages as read when dialog opens
  useEffect(() => {
    if (open && chatId && currentUser?.uid && firestore && (messages?.length ?? 0) > 0) {
      const chatRef = doc(firestore, 'ummyTeamChats', chatId);
      updateDocumentNonBlocking(chatRef, { 
        lastMessageReadBy: arrayUnion(currentUser.uid) 
      });
    }
  }, [open, chatId, messages, currentUser?.uid, firestore]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Long press handler for message actions
  const handleMsgTouchStart = (msg: any) => {
    msgLongPressTimer.current = setTimeout(() => {
      setSelectedMessage(msg);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleMsgTouchEnd = () => {
    if (msgLongPressTimer.current) clearTimeout(msgLongPressTimer.current);
  };

  // Delete message - sirf apna message delete kar sakte ho
  const deleteMessage = async () => {
    if (!selectedMessage || !firestore || !chatId) return;
    // Only allow deleting own messages
    if (selectedMessage.senderId !== currentUser?.uid) {
      toast({ 
        variant: 'destructive', 
        title: 'Cannot delete', 
        description: 'You can only delete your own messages' 
      });
      setSelectedMessage(null);
      return;
    }
    try {
      await deleteDoc(doc(firestore, 'ummyTeamChats', chatId, 'messages', selectedMessage.id));
      setSelectedMessage(null);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to delete message' });
    }
  };

  // Clear all chat history
  const clearChat = async () => {
    if (!firestore || !chatId) return;
    try {
      const msgsQuery = query(collection(firestore, 'ummyTeamChats', chatId, 'messages'));
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

  // Delete entire chat conversation
  const deleteEntireChat = async () => {
    if (!firestore || !chatId) return;
    try {
      const msgsQuery = query(collection(firestore, 'ummyTeamChats', chatId, 'messages'));
      const msgsSnap = await getDocs(msgsQuery);
      const batch = writeBatch(firestore);
      msgsSnap.forEach(m => batch.delete(m.ref));
      await batch.commit();
      await deleteDoc(doc(firestore, 'ummyTeamChats', chatId));
      toast({ title: 'Conversation Deleted' });
      setShowChatActions(false);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to delete chat' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans">
          {/* Header - Same styling as user chat */}
          <DialogHeader className="p-0 border-b border-gray-100 bg-white shrink-0 shadow-sm relative z-50 pt-safe">
            <div className="px-4 py-4 pt-2 flex flex-row items-center gap-4 w-full relative">
              <button 
                onClick={() => onOpenChange(false)} 
                className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              
              {/* Ummy Team Avatar with gradient background */}
              <Avatar className="h-10 w-10 border shadow-sm rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                <AvatarImage src={ummyTeamUser.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold">
                  <Shield className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 text-left">
                <DialogTitle className="text-lg font-bold uppercase tracking-tight truncate">
                  Ummy Team
                </DialogTitle>
                <p className="text-[9px] font-bold uppercase tracking-wider text-purple-500">
                  official • always online
                </p>
              </div>
              
              <button 
                onClick={() => setShowChatActions(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90"
              >
                <MoreVertical className="h-6 w-6 text-black" />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Conversation with Ummy Team - Official announcements and updates
            </DialogDescription>
          </DialogHeader>

          {/* Messages Area - Same as user chat */}
          <main className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
            <ScrollArea className="h-full px-4 pt-6">
              <div className="flex flex-col gap-3 pb-10">
                {/* Welcome message when no messages exist */}
                {(!messages || messages.length === 0) && (
                  <div className="text-center py-8 px-4">
                    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-6 border border-purple-200">
                      <Shield className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                      <p className="text-sm font-bold uppercase text-purple-700 mb-1">
                        Welcome to Ummy Team Chat
                      </p>
                      <p className="text-xs text-purple-500">
                        Official announcements and updates will appear here.
                      </p>
                    </div>
                  </div>
                )}
                
                {messages?.map((msg: any) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  const isUmmyTeam = msg.senderId === 'ummy_team';
                  
                  return (
                    <div 
                      key={msg.id} 
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
                      {/* Avatar */}
                      <div className="shrink-0 self-end">
                        {isMe ? (
                          <Avatar className="h-7 w-7 border border-white shadow-sm rounded-full">
                            <AvatarImage 
                              src={currentUser?.avatarUrl ? `${currentUser.avatarUrl}${currentUser.avatarUrl.includes('?') ? '&' : '?'}v=${currentUser?.updatedAt?.toMillis?.() || Date.now()}` : undefined} 
                            />
                            <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
                              {(currentUser?.username || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-7 w-7 border border-white shadow-sm rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                            <AvatarImage src={ummyTeamUser.avatarUrl || undefined} />
                            <AvatarFallback className="text-[9px] text-white font-bold">
                              <Shield className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      {/* Message Bubble - Ummy team messages have special purple styling */}
                      <div className={cn(
                        "flex flex-col max-w-[75%]",
                        isMe ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-body shadow-sm border",
                          isMe 
                            ? "bg-primary text-white rounded-br-none border-primary/20" 
                            : isUmmyTeam
                              ? "bg-gradient-to-br from-purple-50 to-indigo-50 text-gray-800 rounded-bl-none border-purple-200"
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
                          
                          {/* Ummy Team official badge on their messages */}
                          {isUmmyTeam && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-purple-200">
                              <Shield className="h-3 w-3 text-purple-500" />
                              <span className="text-[8px] font-bold uppercase text-purple-500">
                                Ummy Official
                              </span>
                            </div>
                          )}
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

          {/* Footer - NO MESSAGE INPUT, just shows "You can't message Ummy Team" */}
          <footer className="p-4 bg-white border-t border-gray-100 relative z-50 pb-safe">
            <div className="flex items-center justify-center py-3">
              <div className="text-center">
                <Shield className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  You can&apos;t message Ummy Team
                </p>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  This is an official announcement channel
                </p>
              </div>
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog - Same as user chat */}
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

      {/* Message Delete Sheet - Same as user chat */}
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

      {/* Chat Actions Sheet - Simplified for Ummy Team (no block, no pin, no report) */}
      <Sheet open={showChatActions} onOpenChange={setShowChatActions}>
        <SheetContent 
          side="bottom" 
          className="p-4 pb-10 bg-transparent border-none z-[1000] flex flex-col items-center justify-end"
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            {/* Top dark section with only Clear and Delete options */}
            <div className="bg-[#2C2C2E] rounded-t-2xl overflow-hidden">
              <button 
                onClick={() => { clearChat(); setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                Clear history
              </button>
              <button 
                onClick={() => { deleteEntireChat(); setShowChatActions(false); }}
                className="w-full py-5 text-center text-white font-medium text-[17px] hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                Delete
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

export { ChatRoomDialog, UmmyTeamChatDialog };
