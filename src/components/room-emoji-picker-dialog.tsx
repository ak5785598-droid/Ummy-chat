'use client';

import React, { useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';

export function RoomEmojiPickerDialog({ open, onOpenChange, roomId }: { open: boolean, onOpenChange: (open: boolean) => void, roomId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch custom emojis from Firestore
  const customEmojisQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "customEmojis"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: customEmojis } = useCollection(customEmojisQuery);

  // Only use custom emojis, no built-in emojis
  const emojis = useMemo(() => {
    if (!customEmojis) return [];
    
    return customEmojis.map((custom: any) => ({
      id: custom.id || custom.name.toLowerCase().replace(/\s+/g, '-'),
      label: custom.name,
      imageUrl: custom.imageUrl,
      animationUrl: custom.animationUrl,
      displayTime: custom.displayTime || 3,
    }));
  }, [customEmojis]);

  const handleSendEmoji = (emojiId: string) => {
    if (!firestore || !roomId || !user) return;
    const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
    updateDocumentNonBlocking(pRef, { activeEmoji: emojiId, updatedAt: serverTimestamp() });
    onOpenChange(false);
  };

  // If no custom emojis, show empty state
  if (emojis.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="fixed bottom-0 sm:max-w-[400px] bg-black/95 border-t border-yellow-500/30 p-0 rounded-none overflow-hidden text-white outline-none shadow-[0_-10px_40px_-15px_rgba(234,179,8,0.3)] translate-y-0 duration-300 [&>button]:hidden">
          <div className="flex flex-col h-full">
            <div className="h-[340px] flex items-center justify-center text-white/40">
              No custom emojis yet
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed bottom-0 sm:max-w-[400px] bg-black/95 border-t border-yellow-500/30 p-0 rounded-none overflow-hidden text-white outline-none shadow-[0_-10px_40px_-15px_rgba(234,179,8,0.3)] translate-y-0 duration-300 [&>button]:hidden">
        <div className="flex flex-col h-full">
          <div className="h-[340px] overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="grid grid-cols-3 gap-y-10 gap-x-6 pt-4 pb-12">
              {emojis.map((item: any) => (
                <button 
                  key={item.id} 
                  onClick={() => handleSendEmoji(item.id)} 
                  className="flex flex-col items-center gap-2 group transition-all active:scale-90"
                >
                  <div className="h-16 w-16 drop-shadow-2xl group-hover:scale-110 duration-200 flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.label} 
                        width={64} 
                        height={64} 
                        className="object-contain"
                        unoptimized
                      />
                    ) : item.animationUrl ? (
                      <video 
                        src={item.animationUrl} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl"></span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234,179,8,0.3); border-radius: 10px; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
                    }
