import { LucideIcon, Sun, Flame, Terminal, Waves, Orbit, Wind, Trees, Diamond, Sword, CloudSun, Stars, Gem, Crown, Rocket, Zap, Heart, FlameKindling, ShieldCheck, Sparkles } from 'lucide-react';

export interface AvatarFrameConfig {
  id: string;
  name: string;
  tier: 'elite' | 'luxury' | 'mythic' | 'legendary';
  gradient: string;
  borderColor: string;
  glowColor: string;
  ornament?: string | LucideIcon;
  animationType: 'rotate' | 'pulse' | 'float' | 'sparkle' | 'matrix' | 'flow';
  overlayEffect?: string;
}

export const AVATAR_FRAMES: Record<string, AvatarFrameConfig> = {
  // --- CELESTIAL & COSMIC ---
  'sun-king': {
    id: 'sun-king',
    name: 'Sun King',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #F9E58A, #FDB931, #FFD700, #F9E58A)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    ornament: Sun,
    animationType: 'rotate'
  },
  'celestial-star': {
    id: 'celestial-star',
    name: 'Celestial Star',
    tier: 'mythic',
    gradient: 'conic-gradient(from 180deg, #1E1B4B, #6366F1, #A855F7, #1E1B4B)',
    borderColor: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    ornament: Stars,
    animationType: 'rotate'
  },
  'void-walker': {
    id: 'void-walker',
    name: 'Void Walker',
    tier: 'legendary',
    gradient: 'radial-gradient(circle, #000 30%, #4C1D95 70%, #000 100%)',
    borderColor: '#7C3AED',
    glowColor: 'rgba(124, 58, 237, 0.8)',
    ornament: Orbit,
    animationType: 'pulse'
  },
  'celestial-angel': {
    id: 'celestial-angel',
    name: 'Celestial Angel',
    tier: 'legendary',
    gradient: 'linear-gradient(to bottom, #FFF, #F9E58A, #FFF)',
    borderColor: '#E8C27E',
    glowColor: 'rgba(255, 255, 255, 0.6)',
    ornament: CloudSun,
    animationType: 'float'
  },

  // --- FANTASY & MYTHIC ---
  'mystic-dragon': {
    id: 'mystic-dragon',
    name: 'Mystic Dragon',
    tier: 'mythic',
    gradient: 'conic-gradient(from 0deg, #991B1B, #EF4444, #7F1D1D, #991B1B)',
    borderColor: '#B91C1C',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    ornament: Flame,
    animationType: 'float'
  },
  'dragon-soul': {
    id: 'dragon-soul',
    name: 'Dragon Soul',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #450A0A, #DC2626, #450A0A)',
    borderColor: '#991B1B',
    glowColor: 'rgba(185, 28, 28, 0.7)',
    ornament: '🐉',
    animationType: 'flow'
  },
  'phoenix-blaze': {
    id: 'phoenix-blaze',
    name: 'Phoenix Blaze',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #EA580C, #FDE68A, #EF4444, #EA580C)',
    borderColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    ornament: FlameKindling,
    animationType: 'float'
  },

  // --- MATERIAL & LUXURY ---
  'imperial-gold': {
    id: 'imperial-gold',
    name: 'Imperial Gold',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #FFF281 0%, #FFB700 50%, #B8860B 100%)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    ornament: Crown,
    animationType: 'rotate'
  },
  'glacial-diamond': {
    id: 'glacial-diamond',
    name: 'Glacial Diamond',
    tier: 'luxury',
    gradient: 'linear-gradient(45deg, #E0F2FE 0%, #7DD3FC 50%, #0EA5E9 100%)',
    borderColor: '#BAE6FD',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    ornament: Diamond,
    animationType: 'sparkle'
  },
  'diamond-empress': {
    id: 'diamond-empress',
    name: 'Diamond Empress',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #FFF, #BAE6FD, #FFF, #BAE6FD, #FFF)',
    borderColor: '#fff',
    glowColor: 'rgba(255, 255, 255, 0.8)',
    ornament: Gem,
    animationType: 'sparkle'
  },
  'rose-quartz': {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #FDF2F8, #F472B6, #FDF2F8)',
    borderColor: '#F9A8D4',
    glowColor: 'rgba(244, 114, 182, 0.4)',
    ornament: Heart,
    animationType: 'pulse'
  },
  'obsidian-onyx': {
    id: 'obsidian-onyx',
    name: 'Obsidian Onyx',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #000, #444, #000)',
    borderColor: '#111',
    glowColor: 'rgba(0, 0, 0, 0.6)',
    ornament: ShieldCheck,
    animationType: 'pulse'
  },
  'veridian-emerald': {
    id: 'veridian-emerald',
    name: 'Veridian Emerald',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #064E3B, #10B981, #064E3B)',
    borderColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    ornament: Gem,
    animationType: 'sparkle'
  },

  // --- ELEMENTAL & NATURE ---
  'aurora-gem': {
    id: 'aurora-gem',
    name: 'Aurora Gem',
    tier: 'mythic',
    gradient: 'conic-gradient(from 0deg, #10B981, #3B82F6, #8B5CF6, #10B981)',
    borderColor: '#34D399',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    ornament: Sparkles,
    animationType: 'flow'
  },
  'ocean-mystic': {
    id: 'ocean-mystic',
    name: 'Ocean Mystic',
    tier: 'mythic',
    gradient: 'linear-gradient(180deg, #0EA5E9, #2563EB, #0EA5E9)',
    borderColor: '#60A5FA',
    glowColor: 'rgba(37, 99, 235, 0.5)',
    ornament: Waves,
    animationType: 'flow'
  },
  'emerald-guardian': {
    id: 'emerald-guardian',
    name: 'Emerald Guardian',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #064E3B, #059669, #064E3B)',
    borderColor: '#10B981',
    glowColor: 'rgba(5, 150, 105, 0.6)',
    ornament: Trees,
    animationType: 'pulse'
  },

  // --- DIGITAL & STEALTH ---
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    tier: 'luxury',
    gradient: 'conic-gradient(from 0deg, #A855F7, #D946EF, #A855F7)',
    borderColor: '#D946EF',
    glowColor: 'rgba(217, 70, 239, 0.5)',
    ornament: Zap,
    animationType: 'pulse'
  },
  'cyber-wraith': {
    id: 'cyber-wraith',
    name: 'Cyber Wraith',
    tier: 'legendary',
    gradient: 'linear-gradient(180deg, #000, #22C55E, #000)',
    borderColor: '#166534',
    glowColor: 'rgba(34, 197, 94, 0.8)',
    ornament: Terminal,
    animationType: 'matrix'
  },
  'shadow-ninja': {
    id: 'shadow-ninja',
    name: 'Shadow Ninja',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #000, #991B1B, #000)',
    borderColor: '#111',
    glowColor: 'rgba(153, 27, 27, 0.6)',
    ornament: Sword,
    animationType: 'float'
  }
};
// End of registry
