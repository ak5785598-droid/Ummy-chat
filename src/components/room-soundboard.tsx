'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  Hand, 
  Laugh, 
  Wind, 
  Star,
  Zap,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SoundItem {
  id: string;
  name: string;
  emoji: string;
  icon: any;
  color: string;
  audioUrl?: string; // We'll trigger broadcast events instead of local audio if needed
}

const SOUNDS: SoundItem[] = [
  { id: 'clap', name: 'Clapping', emoji: '👏', icon: Hand, color: 'bg-yellow-500' },
  { id: 'laugh', name: 'Laughter', emoji: '😂', icon: Laugh, color: 'bg-green-500' },
  { id: 'wow', name: 'Wow!', emoji: '😮', icon: Star, color: 'bg-blue-500' },
  { id: 'fail', name: 'Fail', emoji: '🎺', icon: Wind, color: 'bg-red-500' },
  { id: 'cricket', name: 'Crickets', emoji: '🦗', icon: Music, color: 'bg-slate-500' },
  { id: 'hype', name: 'Hype', emoji: '🔥', icon: Zap, color: 'bg-orange-500' },
];

interface RoomSoundboardProps {
  onTrigger: (soundId: string) => void;
  className?: string;
}

/**
 * RoomSoundboard - Interactive SFX trigger for seated participants.
 * Boosts room atmosphere with real-time audio reactions.
 */
export function RoomSoundboard({ onTrigger, className }: RoomSoundboardProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4 bg-black/10 backdrop-blur-md rounded-[2rem] border border-white/10", className)}>
      <header className="flex items-center gap-2 px-1">
        <Volume2 className="h-4 w-4 text-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Soundboard</h3>
      </header>
      
      <div className="grid grid-cols-3 gap-3">
        {SOUNDS.map((sound) => (
          <motion.button
            key={sound.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTrigger(sound.id)}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", sound.color)}>
              <sound.icon className="h-5 w-5 text-black" />
            </div>
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">{sound.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
