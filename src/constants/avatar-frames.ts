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
  extraType?: 'wings' | 'halo' | 'clouds' | 'nebula' | 'crystals' | 'dragon-body' | 'sun-rays' | 'spikes' | 'none';
  particleType?: 'stars' | 'fire' | 'bubbles' | 'matrix' | 'none';
  textureType?: 'gold' | 'glass' | 'lava' | 'ice' | 'none';
  extraColor?: string;
  particleColor?: string;
  imageUrl?: string;
  scaleMultiplier?: number;
  holeRatio?: number;
}

export const AVATAR_FRAMES: Record<string, AvatarFrameConfig> = {
  // --- LEGENDARY ---
  'sakura-blossom': {
    id: 'sakura-blossom',
    name: 'Sakura Blossom',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #FFB7C5, #D946EF, #4F46E5, #D946EF, #FFB7C5)',
    borderColor: '#FF69B4',
    glowColor: 'rgba(217, 70, 239, 0.6)',
    ornament: '🌸',
    animationType: 'float',
    extraType: 'none',
    particleType: 'stars',
    textureType: 'glass',
    extraColor: '#FF69B4'
  },
  'mystic-dragon': {
    id: 'mystic-dragon',
    name: 'Mystic Dragon',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #D4AF37, #FFD700, #9A7B4F, #D4AF37)',
    borderColor: '#FFD700',
    glowColor: 'rgba(212, 175, 55, 0.7)',
    ornament: '🐉',
    animationType: 'float',
    extraType: 'dragon-body',
    particleType: 'fire',
    textureType: 'gold',
    extraColor: '#FFD700'
  },
  'aurora-gem': {
    id: 'aurora-gem',
    name: 'Aurora Gem',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #A855F7, #E9D5FF, #7E22CE, #A855F7)',
    borderColor: '#E9D5FF',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    ornament: Gem,
    animationType: 'sparkle',
    extraType: 'crystals',
    particleType: 'stars',
    textureType: 'glass',
    extraColor: '#E9D5FF'
  },
  'celestial-star': {
    id: 'celestial-star',
    name: 'Celestial Star',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #FFE29F, #FFA91B, #FF9912, #FFE29F)',
    borderColor: '#FFA91B',
    glowColor: 'rgba(255, 169, 27, 0.6)',
    ornament: Stars,
    animationType: 'rotate',
    extraType: 'halo',
    particleType: 'stars',
    textureType: 'gold'
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
  },
  'royal-wreath': {
    id: 'royal-wreath',
    name: 'Royal Wreath',
    tier: 'legendary',
    gradient: 'conic-gradient(from 0deg, #F9E58A, #FDB931, #FFD700, #F9E58A)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    imageUrl: '/images/frames/royal_wreath.png',
    animationType: 'float',
    extraType: 'none',
    particleType: 'stars'
  },
  'phoenix-flame': {
    id: 'phoenix-flame',
    name: 'Phoenix Flame',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #F97316, #EF4444, #F97316)',
    borderColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    imageUrl: '/images/frames/phoenix_flame.png',
    scaleMultiplier: 2.22,
    holeRatio: 0.45,
    animationType: 'pulse',
    extraType: 'none'
  },
  'emerald-vine': {
    id: 'emerald-vine',
    name: 'Emerald Vine',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #065F46, #10B981, #065F46)',
    borderColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    imageUrl: '/images/frames/emerald_vine.png',
    scaleMultiplier: 2.08,
    holeRatio: 0.48,
    animationType: 'float',
    extraType: 'none'
  },
  'silver-crown': {
    id: 'silver-crown',
    name: 'Silver Crown',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #D1D5DB, #F3F4F6, #D1D5DB)',
    borderColor: '#F3F4F6',
    glowColor: 'rgba(243, 244, 246, 0.6)',
    imageUrl: '/images/frames/silver_crown.png',
    scaleMultiplier: 1.69,
    holeRatio: 0.59,
    animationType: 'float',
    extraType: 'none'
  },
  'angel-wing': {
    id: 'angel-wing',
    name: 'Angel Wing',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #BFDBFE, #EFF6FF, #BFDBFE)',
    borderColor: '#EFF6FF',
    glowColor: 'rgba(239, 246, 255, 0.6)',
    imageUrl: '/images/frames/angel_wing.png',
    scaleMultiplier: 1.81,
    holeRatio: 0.55,
    animationType: 'float',
    extraType: 'none'
  },
  'dark-star': {
    id: 'dark-star',
    name: 'Dark Star',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #1F2937, #EF4444, #1F2937)',
    borderColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    imageUrl: '/images/frames/dark_star.png',
    scaleMultiplier: 2.32,
    holeRatio: 0.43,
    animationType: 'pulse',
    extraType: 'none'
  },
  'red-star': {
    id: 'red-star',
    name: 'Red Star',
    tier: 'legendary',
    gradient: 'linear-gradient(45deg, #1F2937, #EF4444, #1F2937)',
    borderColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    imageUrl: '/images/frames/Red_star.png',
    scaleMultiplier: 2.38,
    holeRatio: 0.42,
    animationType: 'pulse',
    extraType: 'none'
  },
  'cloud-sky': {
    id: 'cloud-sky',
    name: 'Cloud Sky',
    tier: 'legendary',
    gradient: 'linear-gradient(135deg, #0EA5E9, #FFF, #0EA5E9)',
    borderColor: '#BAE6FD',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    imageUrl: '/images/frames/Cloud_sky.png',
    scaleMultiplier: 2.2,
    holeRatio: 0.45,
    animationType: 'float',
    extraType: 'clouds'
  },
  'lion-wings': {
    id: 'lion-wings',
    name: 'Lion Wings',
    tier: 'legendary',
    gradient: 'linear-gradient(135deg, #B45309, #FBBF24, #B45309)',
    borderColor: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    imageUrl: '/images/frames/Lion_wings.png',
    scaleMultiplier: 2.4,
    holeRatio: 0.42,
    animationType: 'pulse',
    extraType: 'wings'
  },
  'krishna-pankh': {
    id: 'krishna-pankh',
    name: 'Krishna Pankh',
    tier: 'legendary',
    gradient: 'linear-gradient(135deg, #1E1B4B, #4338CA, #1E1B4B)',
    borderColor: '#4338CA',
    glowColor: 'rgba(79, 70, 229, 0.7)',
    imageUrl: '/images/frames/krishna_pankh.png',
    scaleMultiplier: 2.3,
    holeRatio: 0.43,
    animationType: 'float',
    extraType: 'none',
    extraColor: '#FFD700'
  }
};
// End of registry
