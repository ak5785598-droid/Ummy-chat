'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection } from 'firebase/firestore';
import { MessageCircle, Send, Loader, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DirectMessageDialogProps {
  recipient: {
    uid: string;
    username: string;
    avatarUrl: string;
  };
  trigger: React.ReactNode;
}

export function DirectMessageDialog({ recipient, trigger }: DirectMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!user || !firestore || !text.trim()) return;
    setIsSubmitting(true);

    try {
      // 1. Generate unique chatId protocol (Sorted UIDs ensures single frequency)
      const participantIds = [user.uid, recipient.uid].sort();
      const chatId = participantIds.join('_');

      // 2. Initialize Chat Metadata
      const chatRef = doc(firestore, 'privateChats', chatId);
      setDocumentNonBlocking(chatRef, {
        id: chatId,
        participantIds,
        lastMessage: text.trim(),
        lastSenderId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Dispatch Message to Subcollection
      const messagesRef = collection(firestore, 'privateChats', chatId, 'messages');
      await addDocumentNonBlocking(messagesRef, {
        text: text.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp()
      });

      toast({ title: 'Vibe Synchronized', description: 'Your message has reached their frequency.' });
      setOpen(false);
      setText('');
      router.push('/messages');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Dispatch Failed', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] border-none shadow-2xl bg-white text-black p-0 overflow-hidden animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={recipient.avatarUrl} />
            <AvatarFallback>{recipient.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Sync Message</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">To: {recipient.username}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <Textarea 
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none h-32 rounded-[1.5rem] border-2 border-gray-100 focus:border-primary transition-all p-4 text-sm font-body italic"
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter className="p-8 pt-0">
          <Button 
            onClick={handleSend} 
            disabled={isSubmitting || !text.trim()} 
            className="w-full h-16 rounded-[1.5rem] text-xl font-black uppercase italic shadow-xl shadow-primary/20"
          >
            {isSubmitting ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}