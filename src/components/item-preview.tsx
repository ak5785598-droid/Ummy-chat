'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarFrame } from '@/components/avatar-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Crown } from 'lucide-react';
import Image from 'next/image';

interface ItemPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    type: string;
    description: string;
    url?: string;
  } | null;
  avatarUrl?: string;
  username?: string;
}

/**
 * ItemPreview - A high-fidelity "Try-On" experience for store assets.
 * Allows users to see exactly how a Frame, Bubble, or Theme looks in a real context.
 */
export function ItemPreview({ isOpen, onClose, item, avatarUrl, username }: ItemPreviewProps) {
  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop with Clear-Screen Philosophy */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
        />

        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-[280px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[1.5rem] border border-white/20 shadow-2xl overflow-hidden p-3"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <header className="text-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5 block">Preview</span>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{item.name}</h2>
            <p className="text-white/40 text-[9px] mt-1 font-medium px-2">{item.description}</p>
          </header>

          <div className="flex flex-col items-center justify-center min-h-[140px] relative">
            {/* Context-Specific Component Render */}
            {item.type === 'Frame' && (
              <div className="relative p-6">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1.1 }}
                  className="z-10"
                >
                  <AvatarFrame frameId={item.id} size="md" className="transition-transform">
                    <Avatar className="w-full h-full border-4 border-white/10 shadow-2xl overflow-hidden">
                      {avatarUrl ? (
                         <AvatarImage src={avatarUrl} />
                      ) : (
                         <AvatarImage src={`https://picsum.photos/seed/${item.id}/400`} />
                      )}
                      <AvatarFallback className="bg-slate-800 text-white font-black text-2xl">{(username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </AvatarFrame>
                </motion.div>
                
                {/* Visual Flair */}
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
              </div>
            )}

            {item.type === 'Bubble' && (
              <div className="w-full space-y-6 flex flex-col items-center">
                <div className="w-full max-w-[280px]">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-sm py-3 px-5 shadow-2xl">
                      Bhai, ye dekho mera naya chat bubble! Ekdum premium lag raha hai na? 🔥
                    </ChatMessageBubble>
                  </motion.div>
                </div>

                <div className="w-full max-w-[280px] self-end">
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <ChatMessageBubble bubbleId={item.id} isMe={false} className="text-sm py-3 px-5 shadow-2xl opacity-80">
                      Haan bhai, ye wala bilkul Wafa app jaisa professional lag raha hai. Top tier! 🏾✨
                    </ChatMessageBubble>
                  </motion.div>
                </div>
              </div>
            )}

            {item.type === 'Theme' && item.url && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full h-48 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10"
              >
                 <Image src={item.url} alt={item.name} fill className="object-cover" unoptimized />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <p className="text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md px-3 py-1 rounded-full bg-white/10">In-Room Appearance</p>
                 </div>
              </motion.div>
            )}

            {item.type === 'Wave' && (
              <div className="flex flex-col items-center gap-6">
                <div className="relative h-20 w-20 flex items-center justify-center">
                   <div className={cn("absolute inset-0 rounded-full border-4 border-primary/20 animate-ping")} />
                   <div className="relative z-10 h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="h-8 w-8 text-black" />
                   </div>
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest animate-pulse">Dynamic Voice Aura Active</p>
              </div>
            )}
          </div>

          <footer className="mt-2 flex flex-col gap-2">
             <div className="flex items-center justify-center gap-2 mb-0.5">
                <div className="h-px bg-white/10 flex-1" />
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <div className="h-px bg-white/10 flex-1" />
             </div>
             <p className="text-center text-[9px] text-white/30 uppercase font-bold tracking-tighter leading-relaxed">
                This item is available for purchase in the Ummy Boutique.<br/>
                All assets are optimized for high-performance mobile devices.
             </p>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
