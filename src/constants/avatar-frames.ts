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
  'lightning-tiger': {
    id: 'lightning-tiger',
    name: 'Lightning Tiger',
    tier: 'legendary',
    price: 260000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/lightning_tiger.png'
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
  },
  'crimson-bolt': {
    id: 'crimson-bolt',
    name: 'Crimson Lightning',
    tier: 'elite',
    price: 85000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/crimson_bolt.png'
  },
  'green-cyber-pulse': {
    id: 'green-cyber-pulse',
    name: 'Green Cyber Pulse',
    tier: 'legendary',
    price: 190000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/green_cyber_pulse.png'
  },
  'crystal-shard': {
    id: 'crystal-shard',
    name: 'Crystal Shard',
    tier: 'mythic',
    price: 140000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/shadow_eclipse.png'
  },
  'shadow-orb': {
    id: 'shadow-orb',
    name: 'Shadow Orb',
    tier: 'luxury',
    price: 110000,
    gradient: 'transparent',
    borderColor: 'transparent',
    glowColor: 'transparent',
    animationType: 'none',
    imageUrl: '/images/frames/shadow_eclipse.png'
  }
};

