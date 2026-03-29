/**
 * @fileOverview Centralized Room Theme Ledger.
 */

export interface RoomTheme {
  id: string;
  name: string;
  url: string;
  isOfficial?: boolean;
  seatColor?: string;
  accentColor?: string;
  category?: 'help' | 'entertainment' | 'general';
  price?: number;
  durationDays?: number;
  animationId?: 'galaxy' | 'stars' | 'love' | 'rain';
}

export const ROOM_THEMES: RoomTheme[] = [
  // --- SIGNATURE SCENIC (New) ---
  {
    id: 'scenic_neon_night_v2',
    name: 'Neon Night Scenic',
    url: '/themes/neon_night_scenic.png',
    seatColor: 'rgba(124, 58, 237, 0.2)',
    accentColor: '#8b5cf6',
    category: 'general'
  },
  {
    id: 'lights_festival_scenic',
    name: 'Lights Festival',
    url: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2048',
    seatColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#fbbf24',
    category: 'entertainment'
  },
  {
    id: 'eid_special_scenic',
    name: 'Eid Special',
    url: 'https://images.unsplash.com/photo-1594911772125-077551000f08?q=80&w=2000',
    seatColor: 'rgba(34, 197, 94, 0.2)',
    accentColor: '#22c55e',
    category: 'entertainment'
  },
  {
    id: 'birthday_special_scenic',
    name: 'Birthday Special',
    url: 'https://images.unsplash.com/photo-1541280894840-06f157155639?q=80&w=2000',
    seatColor: 'rgba(236, 72, 153, 0.2)',
    accentColor: '#ec4899',
    category: 'entertainment'
  },
  {
    id: 'celestial_love_v2',
    name: 'Celestial Love',
    url: '/themes/celestial_love_v2.png',
    seatColor: 'rgba(99, 102, 241, 0.2)',
    accentColor: '#6366f1',
    category: 'general'
  },

  // --- ATMOSPHERIC ---
  {
    id: 'new_year_scenic',
    name: 'New Year 2026',
    url: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=2000',
    seatColor: 'rgba(59, 130, 246, 0.2)',
    accentColor: '#3b82f6',
    category: 'entertainment'
  },
  {
    id: 'christmas_scenic',
    name: 'Christmas Cozy',
    url: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=2000',
    seatColor: 'rgba(239, 68, 68, 0.2)',
    accentColor: '#ef4444',
    category: 'entertainment'
  },
  {
    id: 'holi_scenic',
    name: 'Holi Festival',
    url: 'https://images.unsplash.com/photo-1590076215667-873d6f00918c?q=80&w=2000',
    seatColor: 'rgba(217, 70, 239, 0.2)',
    accentColor: '#d946ef',
    category: 'entertainment'
  },
  {
     id: 'beach_luxury_scenic',
     name: 'Beach Luxury Lounge',
     url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000',
     seatColor: 'rgba(14, 165, 233, 0.2)',
     accentColor: '#0ea5e9',
     category: 'entertainment'
  },
  {
    id: 'midnight_proposal_scenic',
    name: 'Midnight Proposal',
    url: 'https://images.unsplash.com/photo-1533929891212-ce602377c088?q=80&w=2000',
    seatColor: 'rgba(59, 130, 246, 0.2)',
    accentColor: '#60a5fa',
    category: 'entertainment'
  },
  {
    id: 'moonlit_romance_scenic',
    name: 'Moonlit Romance',
    url: 'https://images.unsplash.com/photo-1520635332303-d02bc7969875?q=80&w=2000',
    seatColor: 'rgba(192, 132, 252, 0.2)',
    accentColor: '#c084fc',
    category: 'entertainment'
  },

  // --- UMMY OFFICIAL COLLECTION ---
  {
    id: 'official_gold_v2',
    name: 'Official Ummy Gold',
    url: '/themes/official_ummy_v2.png',
    seatColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#fbbf24',
    category: 'general'
  },
  {
    id: 'ummy_galaxy_v3',
    name: 'Ummy Galaxy Scenic',
    url: '/themes/ummy_galaxy_v2.png',
    seatColor: 'rgba(217, 70, 239, 0.2)',
    accentColor: '#d946ef',
    category: 'general'
  },
  {
    id: 'halloween_scenic_v2',
    name: 'Halloween 2025 Scenic',
    url: '/themes/halloween_2025_v2.png',
    seatColor: 'rgba(249, 115, 22, 0.2)',
    accentColor: '#f97316',
    category: 'general'
  },
  { 
    id: 'ummy_spring_garden_v2', 
    name: 'Ummy Spring Garden', 
    url: '/themes/ummy_spring_garden_v2.png',
    isOfficial: true,
    seatColor: 'rgba(74, 222, 128, 0.25)',
    accentColor: '#4ade80',
    category: 'general'
  },
  {
    id: 'vip_club_scenic',
    name: 'VIP Club',
    url: 'https://images.unsplash.com/photo-1514525253361-caae94770202?q=80&w=2000',
    seatColor: 'rgba(168, 85, 247, 0.2)',
    accentColor: '#a855f7',
    category: 'entertainment'
  },
  { 
    id: 'ummy_love_scenic', 
    name: 'Ummy Love Vibes', 
    url: '/themes/ummy_love_vibes.png',
    isOfficial: true,
    seatColor: 'rgba(236, 72, 153, 0.2)',
    accentColor: '#ec4899',
    category: 'entertainment'
  },
  { 
    id: 'community_help_scenic', 
    name: 'Community Hub', 
    url: '/themes/community_help_v2.png',
    isOfficial: true,
    seatColor: 'rgba(34, 197, 94, 0.2)',
    accentColor: '#22c55e',
    category: 'help'
  },

  // --- ORIGINAL CLASSICS ---
  {
    id: 'neon_universe_classic',
    name: 'Neon Universe',
    url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2000',
    seatColor: 'rgba(147, 51, 234, 0.2)',
    accentColor: '#d946ef',
    category: 'entertainment'
  },
  {
    id: 'emoji_party_classic',
    name: 'Emoji Party',
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2000',
    seatColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#fbbf24',
    category: 'entertainment'
  },
  {
    id: 'coding_hacker_classic',
    name: 'Hacker Room',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000',
    seatColor: 'rgba(34, 197, 94, 0.15)',
    accentColor: '#22c55e',
    category: 'entertainment'
  },
  {
    id: 'gaming_arcade_classic',
    name: 'Arcade Room',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000',
    seatColor: 'rgba(59, 130, 246, 0.2)',
    accentColor: '#3b82f6',
    category: 'entertainment'
  },
  {
    id: 'heartbeat_arcade_classic',
    name: 'Heartbeat Room',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000',
    seatColor: 'rgba(236, 72, 153, 0.2)',
    accentColor: '#ec4899',
    category: 'entertainment'
  },
  {
    id: 'gentle_lounge_classic',
    name: 'Gentle Lounge',
    url: 'https://images.unsplash.com/photo-1574091237482-0afea70accb1?q=80&w=2000',
    seatColor: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#f8fafc',
    category: 'entertainment'
  },
  {
    id: 'support_center_classic',
    name: 'Support Hub',
    url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2000',
    isOfficial: true,
    seatColor: 'rgba(59, 130, 246, 0.1)',
    accentColor: '#3b82f6',
    category: 'help'
  },
  {
    id: 'knowledge_hub_classic',
    name: 'Knowledge Center',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000',
    isOfficial: true,
    seatColor: 'rgba(120, 113, 108, 0.1)',
    accentColor: '#78716c',
    category: 'help'
  },
  {
    id: 'summary_guide_classic',
    name: 'Summary Guide',
    url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=2000',
    isOfficial: true,
    seatColor: 'rgba(14, 165, 233, 0.1)',
    accentColor: '#0ea5e9',
    category: 'help'
  },
  {
    id: 'friendly_guide_classic',
    name: 'Friendly Guide',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2000',
    isOfficial: true,
    seatColor: 'rgba(34, 197, 94, 0.1)',
    accentColor: '#22c55e',
    category: 'help'
  },
  {
    id: 'minimal_help_ui_classic',
    name: 'Minimal Help',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000',
    isOfficial: true,
    seatColor: 'rgba(100, 116, 139, 0.1)',
    accentColor: '#64748b',
    category: 'help'
  }
];
