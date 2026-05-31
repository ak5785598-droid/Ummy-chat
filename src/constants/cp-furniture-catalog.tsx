import React from 'react';

export interface FurnitureItem {
  id: string;
  name: string;
  category: 'seating' | 'decor' | 'ambient' | 'luxury';
  unlockLevel: number;
  price: number;
  gridWidth: number; // Cells occupied in isometric grid (X)
  gridLength: number; // Cells occupied in isometric grid (Y)
  renderSvg: (color?: string) => React.ReactNode;
}

export const FURNITURE_CATALOG: FurnitureItem[] = [
  {
    id: 'neon-gaming-chair',
    name: 'Neon Cyber Seat',
    category: 'seating',
    unlockLevel: 1,
    price: 0, // Free basic
    gridWidth: 1,
    gridLength: 1,
    renderSvg: (color = '#00ffff') => (
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        {/* Shadow */}
        <ellipse cx="50" cy="95" rx="30" ry="12" fill="rgba(0,0,0,0.3)" />
        {/* Base & Stand */}
        <path d="M50 95 L50 75" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
        <path d="M30 95 L70 95 M50 95 L40 100 M50 95 L60 100" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        
        {/* Seat Cushion */}
        <path d="M25 60 L75 60 L65 75 L35 75 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
        <path d="M25 60 L75 60 L65 67 L35 67 Z" fill="#1e293b" />
        
        {/* Backrest outline (Glowing Neon) */}
        <path 
          d="M32 60 L32 20 Q50 10 68 20 L68 60 Z" 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          className="animate-pulse"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Backrest cushion */}
        <path d="M35 58 L35 22 Q50 14 65 22 L65 58 Z" fill="#020617" />
        <path d="M42 30 L58 30 L55 45 L45 45 Z" fill={color} opacity="0.15" />
        
        {/* Armrests */}
        <path d="M23 60 L23 48 L28 48" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M77 60 L77 48 L72 48" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'lovers-canopy-bed',
    name: 'Lover Canopy Bed',
    category: 'luxury',
    unlockLevel: 5,
    price: 15000,
    gridWidth: 3,
    gridLength: 3,
    renderSvg: () => (
      <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
        {/* Floor Shadow */}
        <polygon points="10,120 80,85 150,120 80,155" fill="rgba(0,0,0,0.35)" />
        
        {/* Wooden bed frame posts */}
        <path d="M15 120 L15 30" stroke="#451a03" strokeWidth="6" strokeLinecap="round" />
        <path d="M80 85 L80 10" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
        <path d="M145 120 L145 30" stroke="#451a03" strokeWidth="6" strokeLinecap="round" />
        
        {/* Bed Base Mattress */}
        <polygon points="20,115 80,85 140,115 80,145" fill="#fecdd3" stroke="#fda4af" strokeWidth="2" />
        
        {/* Red satin blanket overlay */}
        <polygon points="45,112 80,95 130,120 90,140" fill="#e11d48" />
        <polygon points="90,140 130,120 135,123 88,143" fill="#be123c" />
        
        {/* Soft pillows */}
        <polygon points="40,100 60,90 70,95 50,105" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
        <polygon points="62,90 82,80 92,85 72,95" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Canopy Curtains (Glassmorphic Sheer Pink) */}
        <path d="M15 30 L80 10 L145 30" stroke="#f43f5e" strokeWidth="3" fill="none" />
        <path d="M15 30 Q35 70 20 110" fill="none" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="8" strokeLinecap="round" />
        <path d="M145 30 Q125 70 140 110" fill="none" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="8" strokeLinecap="round" />
        
        {/* Floating Hearts Animation */}
        <g className="animate-bounce" style={{ transformOrigin: 'center' }}>
          <path d="M80 40 Q77 35 72 37 Q68 40 73 48 L80 55 L87 48 Q92 40 88 37 Q83 35 80 40 Z" fill="#f43f5e" className="animate-pulse" />
        </g>
      </svg>
    )
  },
  {
    id: 'ambient-lava-lamp',
    name: 'Love Aura Lamp',
    category: 'ambient',
    unlockLevel: 2,
    price: 2500,
    gridWidth: 1,
    gridLength: 1,
    renderSvg: (color = '#ec4899') => (
      <svg viewBox="0 0 60 120" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        {/* Base Shadow */}
        <ellipse cx="30" cy="110" rx="18" ry="6" fill="rgba(0,0,0,0.3)" />
        
        {/* Chrome Stand */}
        <path d="M15 110 L45 110 L40 95 L20 95 Z" fill="#64748b" stroke="#475569" strokeWidth="1" />
        
        {/* Glass Flask */}
        <path d="M22 95 L26 35 C28 25, 32 25, 34 35 L38 95 Z" fill="rgba(255,255,255,0.15)" stroke="#94a3b8" strokeWidth="1" />
        
        {/* Glowing Lava Liquid inside */}
        <path 
          d="M23 93 L27 45 Q30 40 33 45 L37 93 Z" 
          fill={color} 
          opacity="0.75" 
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        
        {/* Top Chrome Cap */}
        <path d="M25 35 L35 35 L32 25 L28 25 Z" fill="#64748b" />
        
        {/* Animated Lava Blobs (CSS floating effect) */}
        <circle cx="30" cy="75" r="4" fill="#ffffff" opacity="0.9" className="animate-pulse" />
        <circle cx="28" cy="55" r="5" fill="#ffffff" opacity="0.9" className="animate-bounce" />
        
        {/* Light Wave Glow */}
        <circle 
          cx="30" 
          cy="65" 
          r="25" 
          fill={color} 
          opacity="0.15" 
          className="animate-ping" 
          style={{ animationDuration: '3s' }} 
        />
      </svg>
    )
  },
  {
    id: 'zen-bonsai-plant',
    name: 'Bonsai Harmony',
    category: 'decor',
    unlockLevel: 1,
    price: 800,
    gridWidth: 1,
    gridLength: 1,
    renderSvg: () => (
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        {/* Shadow */}
        <ellipse cx="40" cy="85" rx="20" ry="6" fill="rgba(0,0,0,0.25)" />
        
        {/* Ceramic pot */}
        <path d="M25 75 L55 75 L50 90 L30 90 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <ellipse cx="40" cy="75" rx="15" ry="3" fill="#cbd5e1" />
        
        {/* Twisted Trunk */}
        <path d="M40 75 Q42 55 30 50 Q22 45 35 35 Q45 28 40 15" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M35 50 Q48 45 45 35" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
        
        {/* Green Pine Leaves Clump 1 */}
        <circle cx="28" cy="42" r="12" fill="#15803d" opacity="0.9" />
        <circle cx="25" cy="40" r="9" fill="#166534" />
        
        {/* Green Pine Leaves Clump 2 */}
        <circle cx="48" cy="32" r="14" fill="#16a34a" opacity="0.95" />
        <circle cx="45" cy="30" r="11" fill="#15803d" />
        
        {/* Green Pine Leaves Clump 3 (Top) */}
        <circle cx="38" cy="15" r="10" fill="#22c55e" opacity="0.9" />
        <circle cx="36" cy="13" r="7" fill="#16a34a" />
      </svg>
    )
  },
  {
    id: 'aquarium-virtual',
    name: 'Dynamic Aquarium',
    category: 'luxury',
    unlockLevel: 3,
    price: 8000,
    gridWidth: 2,
    gridLength: 2,
    renderSvg: () => (
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
        {/* Shadow */}
        <polygon points="10,95 60,70 110,95 60,118" fill="rgba(0,0,0,0.3)" />
        
        {/* Stand Cabinet */}
        <polygon points="15,85 60,63 105,85 100,105 60,115 20,105" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
        
        {/* Water Tank Box (Glassmorphic Blue) */}
        <polygon points="15,40 60,18 105,40 105,85 60,98 15,85" fill="rgba(6, 182, 212, 0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        
        {/* Seaweed inside */}
        <path d="M35 83 Q30 65 38 52 Q43 45 35 35" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
        <path d="M85 83 Q90 68 83 55 Q78 48 85 38" stroke="#059669" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
        
        {/* Swimming Golden Fish (Simple micro-animation path) */}
        <g className="animate-pulse">
          {/* Fish 1 */}
          <path d="M50 55 C53 53 58 53 60 55 L65 52 L63 56 L60 57 Z" fill="#f97316" />
          {/* Fish 2 */}
          <path d="M72 70 C75 68 80 68 82 70 L87 67 L85 71 L82 72 Z" fill="#ef4444" />
        </g>
        
        {/* Rising Oxygen Bubbles */}
        <circle cx="58" cy="75" r="1.5" fill="#ffffff" opacity="0.8" className="animate-bounce" />
        <circle cx="62" cy="60" r="1" fill="#ffffff" opacity="0.8" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
        <circle cx="60" cy="45" r="2" fill="#ffffff" opacity="0.6" className="animate-pulse" />
        
        {/* Top Lid */}
        <polygon points="13,38 60,15 107,38 60,45" fill="#334155" />
      </svg>
    )
  }
];
