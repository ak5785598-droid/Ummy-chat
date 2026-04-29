import { LucideIcon, Sun, Flame, Terminal, Waves, Orbit, Wind, Trees, Diamond, Sword, CloudSun, Stars, Gem, Crown, Rocket, Zap, Heart, FlameKindling, ShieldCheck, Sparkles } from 'lucide-react';

export interface AvatarFrameConfig {
  id: string;
  name: string;
  tier: 'elite' | 'luxury' | 'mythic' | 'legendary';
  price: number; 
  gradient: string;
  borderColor: string;
  glowColor: string;
  ornament?: string | LucideIcon;
  animationType: 'rotate' | 'pulse' | 'float' | 'sparkle' | 'matrix' | 'flow' | 'none';
  
  // High-Fidelity Additions
  extraType?: 'wings' | 'halo' | 'clouds' | 'nebula' | 'crystals' | 'dragon-body' | 'sun-rays' | 'spikes' | 'bubbles' | 'none';
  particleType?: 'stars' | 'fire' | 'bubbles' | 'matrix' | 'none';
  textureType?: 'gold' | 'glass' | 'lava' | 'ice' | 'none';
  extraColor?: string;
  particleColor?: string;
  
  // Image-based frame support
  imageUrl?: string;
  scaleMultiplier?: number;
  holeRatio?: number;
  offsetX?: number;
  offsetY?: number;
}

export const AVATAR_FRAMES: Record<string, AvatarFrameConfig> = {
  'neon-glow': {
    id: 'neon-glow',
    name: 'Neon Glow',
    tier: 'legendary',
    price: 250000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'pulse',
    imageUrl: '/images/frames/neon_glow.png'
  },
  'golden-phoenix': {
    id: 'golden-phoenix',
    name: 'Golden Phoenix',
    tier: 'legendary',
    price: 350000,
    gradient: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.8)',
    ornament: Flame,
    animationType: 'sparkle',
    extraType: 'none',
    particleType: 'fire',
    textureType: 'gold'
  },
  'cyber-wraith': {
    id: 'cyber-wraith',
    name: 'Cyber Wraith',
    tier: 'legendary',
    price: 280000,
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
    price: 260000,
    gradient: 'linear-gradient(45deg, #000, #991B1B, #000)',
    borderColor: '#991B1B',
    glowColor: 'rgba(153, 27, 27, 0.8)',
    ornament: Sword,
    animationType: 'float',
    extraType: 'spikes',
    particleType: 'none',
    textureType: 'gold'
  },
  'void-walker': {
    id: 'void-walker',
    name: 'Void Walker',
    tier: 'mythic',
    price: 150000,
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
    price: 145000,
    gradient: 'linear-gradient(180deg, #0EA5E9, #1E40AF, #0EA5E9)',
    borderColor: '#60A5FA',
    glowColor: 'rgba(37, 99, 235, 0.6)',
    ornament: Waves,
    animationType: 'flow',
    extraType: 'bubbles' as any,
    particleType: 'bubbles' as any
  },
  'imperial-gold': {
    id: 'imperial-gold',
    name: 'Imperial Gold',
    tier: 'luxury',
    price: 120000,
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
    price: 115000,
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
    price: 110000,
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
    price: 105000,
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
    price: 100000,
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
    price: 95000,
    gradient: 'conic-gradient(from 0deg, #A855F7, #D946EF, #A855F7)',
    borderColor: '#D946EF',
    glowColor: 'rgba(217, 70, 239, 0.6)',
    ornament: Zap,
    animationType: 'pulse',
    particleType: 'matrix'
  },
  'neon-void': {
    id: 'neon-void',
    name: 'Neon Void',
    tier: 'legendary',
    price: 200000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/neon_void.png'
  },
  'phoenix-flame': {
    id: 'phoenix-flame',
    name: 'Phoenix Flame',
    tier: 'legendary',
    price: 200000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/phoenix_flame.png'
  },
  'emerald-vine': {
    id: 'emerald-vine',
    name: 'Emerald Vine',
    tier: 'legendary',
    price: 150000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/emerald_vine.png'
  },
  'silver-crown': {
    id: 'silver-crown',
    name: 'Silver Crown',
    tier: 'legendary',
    price: 180000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/silver_crown.png'
  },
  'angel-wing': {
    id: 'angel-wing',
    name: 'Angel Wing',
    tier: 'legendary',
    price: 220000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/angel_wing.png'
  },
  'dark-star': {
    id: 'dark-star',
    name: 'Dark Star',
    tier: 'legendary',
    price: 200000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/dark_star.png'
  },
  'red-star': {
    id: 'red-star',
    name: 'Red Star',
    tier: 'legendary',
    price: 200000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/Red_star.png'
  },
  'cloud-sky': {
    id: 'cloud-sky',
    name: 'Cloud Sky',
    tier: 'legendary',
    price: 120000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/Cloud_sky.png'
  },
  'lion-wings': {
    id: 'lion-wings',
    name: 'Lion Wings',
    tier: 'legendary',
    price: 250000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/Lion_wings.png'
  },
  'mystic-dragon-3d': {
    id: 'mystic-dragon-3d',
    name: 'Mystic Dragon 3D',
    tier: 'legendary',
    price: 300000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/Mystic_dragon.png'
  },
  'krishna-pankh': {
    id: 'krishna-pankh',
    name: 'Krishna Pankh',
    tier: 'legendary',
    price: 280000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/krishna_pankh.png'
  },
  'shadow-eclipse': {
    id: 'shadow-eclipse',
    name: 'Shadow Eclipse',
    tier: 'legendary',
    price: 240000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/shadow_eclipse.png'
  },
  'blue-energy': {
    id: 'blue-energy',
    name: 'Blue Pulse',
    tier: 'elite',
    price: 80000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/blue_energy.png'
  }
};

