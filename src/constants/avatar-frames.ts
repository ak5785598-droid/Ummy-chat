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
  
  // High-Fidelity Additions
  extraType?: 'wings' | 'halo' | 'clouds' | 'nebula' | 'crystals' | 'dragon-body' | 'sun-rays' | 'spikes' | 'dragon-wrap' | 'aurora-wings' | 'constellation' | 'none';
  particleType?: 'stars' | 'fire' | 'bubbles' | 'matrix' | 'gold-sparkle' | 'sparkle' | 'star' | 'none';
  textureType?: 'gold' | 'glass' | 'lava' | 'ice' | 'none';
  extraColor?: string;
  particleColor?: string;
}

export const AVATAR_FRAMES: Record<string, AvatarFrameConfig> = {
  // --- IDENTITY DIMENSION SUITE (EXACT LOOK MATCH) ---
  'mystic-dragon': {
    id: 'mystic-dragon',
    name: 'Mystic Dragon',
    tier: 'legendary',
    gradient: 'linear-gradient(135deg, #FF00E4 0%, #B300FF 50%, #FFD700 100%)',
    borderColor: '#FFD700',
    glowColor: 'rgba(179, 0, 255, 0.7)',
    ornament: '🐉',
    animationType: 'float',
    extraType: 'dragon-wrap',
    particleType: 'gold-sparkle',
    textureType: 'lava',
    extraColor: '#FFD700'
  },
  'aurora-gem': {
    id: 'aurora-gem',
    name: 'Aurora Gem',
    tier: 'mythic',
    gradient: 'linear-gradient(135deg, #9D00FF 0%, #FF00A6 50%, #9D00FF 100%)',
    borderColor: '#9D00FF',
    glowColor: 'rgba(255, 0, 166, 0.8)',
    ornament: 'gem-crown',
    animationType: 'sparkle',
    extraType: 'aurora-wings',
    particleType: 'sparkle',
    textureType: 'ice',
    extraColor: '#FF00A6'
  },
  'celestial-star': {
    id: 'celestial-star',
    name: 'Celestial Star',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #FF00D6 0%, #9D00FF 50%, #00C2FF 100%)',
    borderColor: '#00C2FF',
    glowColor: 'rgba(0, 194, 255, 0.6)',
    ornament: 'celestial-star',
    animationType: 'rotate',
    extraType: 'constellation',
    particleType: 'star',
    extraColor: '#00C2FF'
  },
  'phoenix-blaze': {
    id: 'phoenix-blaze',
    name: 'Phoenix Blaze',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #EF4444, #F97316, #FDE047, #EF4444)',
    borderColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.8)',
    ornament: FlameKindling,
    animationType: 'pulse',
    extraType: 'wings',
    particleType: 'fire',
    textureType: 'lava',
    extraColor: '#EF4444'
  },
  'sun-king': {
    id: 'sun-king',
    name: 'Sun King',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #F9E58A, #FDB931, #FFD700, #F9E58A)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.9)',
    ornament: Sun,
    animationType: 'rotate',
    extraType: 'sun-rays',
    particleType: 'fire',
    textureType: 'gold'
  },
  'celestial-angel': {
    id: 'celestial-angel',
    name: 'Celestial Angel',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #FFF, #F9E58A, #FFF)',
    borderColor: '#E8C27E',
    glowColor: 'rgba(255, 255, 255, 0.7)',
    ornament: Crown,
    animationType: 'float',
    extraType: 'clouds',
    particleType: 'stars',
    textureType: 'gold',
  },
  'dragon-soul': {
    id: 'dragon-soul',
    name: 'Dragon Soul',
    tier: 'legendary',
    gradient: 'linear-gradient(to right, #450A0A, #DC2626, #450A0A)',
    borderColor: '#DC2626',
    glowColor: 'rgba(220, 38, 38, 0.8)',
    ornament: '🔥',
    animationType: 'flow',
    extraType: 'dragon-body',
    particleType: 'fire',
    textureType: 'lava',
  },
  'emerald-guardian': {
    id: 'emerald-guardian',
    name: 'Emerald Guardian',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #064E3B, #10B981, #064E3B)',
    borderColor: '#10B981',
    glowColor: 'rgba(5, 150, 105, 0.7)',
    ornament: Trees,
    animationType: 'pulse',
    extraType: 'crystals',
    particleType: 'none',
    textureType: 'gold'
  },
  'diamond-empress': {
    id: 'diamond-empress',
    name: 'Diamond Empress',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #FFF, #E0F2FE, #FFF)',
    borderColor: '#fff',
    glowColor: 'rgba(255, 255, 255, 0.9)',
    ornament: Gem,
    animationType: 'sparkle',
    extraType: 'halo',
    particleType: 'stars',
    textureType: 'ice'
  },
  'cyber-wraith': {
    id: 'cyber-wraith',
    name: 'Cyber Wraith',
    tier: 'legendary',
    gradient: 'linear-gradient(180deg, #000, #22C55E, #000)',
    borderColor: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.8)',
    ornament: Terminal,
    animationType: 'matrix',
    extraType: 'spikes',
    particleType: 'matrix',
    textureType: 'none'
  },
  'shadow-ninja': {
    id: 'shadow-ninja',
    name: 'Shadow Ninja',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #000, #991B1B, #000)',
    borderColor: '#991B1B',
    glowColor: 'rgba(153, 27, 27, 0.8)',
    ornament: Sword,
    animationType: 'float',
    extraType: 'spikes',
    particleType: 'none',
    textureType: 'gold'
  },

  // --- MYTHIC & LUXURY (MORE DETAILED) ---
  'void-walker': {
    id: 'void-walker',
    name: 'Void Walker',
    tier: 'mythic',
    gradient: 'radial-gradient(circle, #000 30%, #4C1D95 70%, #000 100%)',
    borderColor: '#A855F7',
    glowColor: 'rgba(124, 58, 237, 0.8)',
    ornament: Orbit,
    animationType: 'pulse',
    extraType: 'nebula',
    particleType: 'stars'
  },
  'ocean-mystic': {
    id: 'ocean-mystic',
    name: 'Ocean Mystic',
    tier: 'mythic',
    gradient: 'linear-gradient(180deg, #0EA5E9, #1E40AF, #0EA5E9)',
    borderColor: '#60A5FA',
    glowColor: 'rgba(37, 99, 235, 0.6)',
    ornament: Waves,
    animationType: 'flow',
    extraType: 'bubbles' as any, // Temporary fix for 'bubbles' not in union yet
    particleType: 'bubbles' as any
  },
  'imperial-gold': {
    id: 'imperial-gold',
    name: 'Imperial Gold',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #FFF281, #FFB700, #B8860B)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    ornament: Crown,
    animationType: 'rotate',
    textureType: 'gold'
  },
  'glacial-diamond': {
    id: 'glacial-diamond',
    name: 'Glacial Diamond',
    tier: 'luxury',
    gradient: 'linear-gradient(45deg, #E0F2FE, #7DD3FC, #0EA5E9)',
    borderColor: '#BAE6FD',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    ornament: Diamond,
    animationType: 'sparkle',
    textureType: 'ice'
  },
  'veridian-emerald': {
    id: 'veridian-emerald',
    name: 'Veridian Emerald',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #064E3B, #10B981, #064E3B)',
    borderColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    ornament: Gem,
    animationType: 'sparkle',
    textureType: 'glass'
  },
  'rose-quartz': {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #FDF2F8, #F472B6, #FDF2F8)',
    borderColor: '#F9A8D4',
    glowColor: 'rgba(244, 114, 182, 0.5)',
    ornament: Heart,
    animationType: 'pulse',
    textureType: 'glass'
  },
  'obsidian-onyx': {
    id: 'obsidian-onyx',
    name: 'Obsidian Onyx',
    tier: 'luxury',
    gradient: 'linear-gradient(135deg, #000, #444, #000)',
    borderColor: '#333',
    glowColor: 'rgba(0, 0, 0, 0.7)',
    ornament: ShieldCheck,
    animationType: 'pulse',
    textureType: 'gold'
  },
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    tier: 'luxury',
    gradient: 'conic-gradient(from 0deg, #A855F7, #D946EF, #A855F7)',
    borderColor: '#D946EF',
    glowColor: 'rgba(217, 70, 239, 0.6)',
    ornament: Zap,
    animationType: 'pulse',
    particleType: 'matrix'
  }
};
// End of registry
