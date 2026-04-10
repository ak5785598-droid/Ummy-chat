'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader, MessageCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MomentCommentsSheetProps {
  momentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  momentUsername?: string;
}

export function MomentCommentsSheet({ momentId, open, onOpenChange, momentUsername }: MomentCommentsSheetProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !momentId) return null;
    return query(
      collection(firestore, 'moments', momentId, 'comments'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, momentId]);

  const { data: comments, isLoading } = useCollection(commentsQuery);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || !firestore || !user || !momentId || isSubmitting) return;

    setIsSubmitting(true);
    const commentText = newComment.trim();
    setNewComment('');

    try {
      // Add comment to subcollection
      await addDocumentNonBlocking(collection(firestore, 'moments', momentId, 'comments'), {
        text: commentText,
        userId: user.uid,
        username: user.displayName || 'User',
        avatarUrl: user.photoURL || '',
        createdAt: serverTimestamp(),
      });

      // Increment comments count on main moment
      await updateDocumentNonBlocking(doc(firestore, 'moments', momentId), {
        commentsCount: increment(1)
      });
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-[2.5rem] p-0 flex flex-col border-none shadow-2xl bg-white">
        <SheetHeader className="p-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-left font-black text-slate-900 uppercase tracking-tight">Comments</SheetTitle>
              <SheetDescription className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Moment by {momentUsername || 'Unknown'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <Loader className="h-6 w-6 text-slate-200 animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Syncing responses...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0 shadow-sm border border-slate-100">
                      <AvatarImage src={comment.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-50 text-slate-300 font-black">{comment.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-headline font-black text-[13px] text-slate-900 tracking-tight">{comment.username}</span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">
                          {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100/50">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
                
                {(!comments || comments.length === 0) && (
                  <div className="py-20 text-center space-y-4 opacity-30 flex flex-col items-center">
                    <MessageCircle className="h-12 w-12 text-slate-400" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">No frequencies shared yet.</p>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-50 bg-white/50 backdrop-blur-xl shrink-0 pb-12">
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
             <div className="relative flex-1 group">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share a vibe..."
                  className="w-full h-14 bg-slate-100/80 border border-slate-200 rounded-2xl px-6 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all hover:bg-slate-800"
                >
                  {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
             </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
