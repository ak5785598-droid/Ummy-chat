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
  // --- ORIGINAL COLLECTION (Restored) ---
  { id: 'neon_universe', name: 'Neon Universe', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2000', seatColor: 'rgba(147, 51, 234, 0.2)', accentColor: '#d946ef', category: 'entertainment' },
  { id: 'emoji_party', name: 'Emoji Party', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2000', seatColor: 'rgba(251, 191, 36, 0.2)', accentColor: '#fbbf24', category: 'entertainment' },
  { id: 'hacker_room', name: 'Hacker Room', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000', seatColor: 'rgba(34, 197, 94, 0.15)', accentColor: '#22c55e', category: 'entertainment' },
  { id: 'arcade_room', name: 'Arcade Room', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000', seatColor: 'rgba(59, 130, 246, 0.2)', accentColor: '#3b82f6', category: 'entertainment' },
  { id: 'heartbeat_room', name: 'Heartbeat Room', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000', seatColor: 'rgba(236, 72, 153, 0.2)', accentColor: '#ec4899', category: 'entertainment' },
  { id: 'gentle_lounge', name: 'Gentle Lounge', url: 'https://images.unsplash.com/photo-1574091237482-0afea70accb1?q=80&w=2000', seatColor: 'rgba(255, 255, 255, 0.1)', accentColor: '#f8fafc', category: 'entertainment' },
  { id: 'support_hub', name: 'Support Hub', url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2000', isOfficial: true, seatColor: 'rgba(59, 130, 246, 0.1)', accentColor: '#3b82f6', category: 'help' },
  { id: 'knowledge_center', name: 'Knowledge Center', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000', isOfficial: true, seatColor: 'rgba(120, 113, 108, 0.1)', accentColor: '#78716c', category: 'help' },
  { id: 'summary_guide', name: 'Summary Guide', url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=2000', isOfficial: true, seatColor: 'rgba(14, 165, 233, 0.1)', accentColor: '#0ea5e9', category: 'help' },
  { id: 'friendly_guide', name: 'Friendly Guide', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2000', isOfficial: true, seatColor: 'rgba(34, 197, 94, 0.1)', accentColor: '#22c55e', category: 'help' },
  { id: 'minimal_help', name: 'Minimal Help', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000', isOfficial: true, seatColor: 'rgba(100, 116, 139, 0.1)', accentColor: '#64748b', category: 'help' },
  { id: 'celestial_love', name: 'Celestial Love', url: '/themes/celestial_love.png', seatColor: 'rgba(99, 102, 241, 0.25)', accentColor: '#818cf8', category: 'entertainment' },
  { id: 'moonlit_romance', name: 'Moonlit Romance', url: '/themes/moonlit_romance.png', seatColor: 'rgba(192, 132, 252, 0.25)', accentColor: '#c084fc', category: 'entertainment' },
  { id: 'midnight_proposal', name: 'Midnight Proposal', url: '/themes/midnight_proposal.png', seatColor: 'rgba(59, 130, 246, 0.25)', accentColor: '#60a5fa', category: 'entertainment', animationId: 'rain' },
  { id: 'dreamy_hearts', name: 'Dreamy Hearts', url: '/themes/dreamy_hearts.png', seatColor: 'rgba(232, 121, 249, 0.25)', accentColor: '#e879f9', category: 'entertainment', animationId: 'love' },
  { id: 'sunset_shore', name: 'Sunset Shore', url: '/themes/sunset_shore.png', seatColor: 'rgba(251, 146, 60, 0.25)', accentColor: '#fb923c', category: 'entertainment' },
  { id: 'ummy_love_vibes', name: 'Ummy Love Vibes', url: '/themes/ummy_love_vibes.png', isOfficial: true, seatColor: 'rgba(251, 146, 60, 0.25)', accentColor: '#fb923c', category: 'entertainment' },
  { id: 'ummy_emoji_party', name: 'Ummy Fun Emoji Party', url: '/themes/ummy_emoji_party.png', isOfficial: true, seatColor: 'rgba(236, 72, 153, 0.25)', accentColor: '#ec4899', category: 'entertainment' },
  { id: 'ummy_support_hub', name: 'Ummy Support Center', url: '/themes/ummy_support_hub.png', isOfficial: true, seatColor: 'rgba(139, 92, 246, 0.25)', accentColor: '#8b5cf6', category: 'help' },
  { id: 'ummy_golden_glow', name: 'Ummy Golden Glow', url: '/themes/ummy_golden_glow.png', isOfficial: true, seatColor: 'rgba(251, 191, 36, 0.25)', accentColor: '#fbbf24', category: 'general' },
  { id: 'ummy_neon_night', name: 'Ummy Neon Night', url: '/themes/ummy_neon_night.png', isOfficial: true, seatColor: 'rgba(168, 85, 247, 0.25)', accentColor: '#a855f7', category: 'general' },
  { id: 'ummy_galaxy', name: 'Ummy Galaxy', url: '/themes/ummy_galaxy.png', isOfficial: true, seatColor: 'rgba(99, 102, 241, 0.25)', accentColor: '#6366f1', category: 'general', animationId: 'galaxy' },
  { id: 'ummy_spring_garden', name: 'Ummy Spring Garden', url: '/themes/ummy_spring_garden.png', isOfficial: true, seatColor: 'rgba(74, 222, 128, 0.25)', accentColor: '#4ade80', category: 'general' },
  { id: 'ummy_help_desk', name: 'Ummy Help Desk', url: '/themes/ummy_help_desk.png', isOfficial: true, seatColor: 'rgba(20, 184, 166, 0.25)', accentColor: '#14b8a6', category: 'help' },
  { id: 'ummy_help_guide', name: 'Ummy Help Guide', url: '/themes/ummy_help_guide.png', isOfficial: true, seatColor: 'rgba(167, 139, 250, 0.25)', accentColor: '#a78bfa', category: 'help' },

  // --- NEW SELECTED PREMIUM COLLECTION (Add-ons) ---
  {
    id: 'lights_festival_scenic_premium',
    name: 'Lights Festival',
    url: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2048',
    seatColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#fbbf24',
    category: 'entertainment'
  },
  {
    id: 'eid_special_scenic_premium',
    name: 'Eid Special',
    url: 'https://images.unsplash.com/photo-1594911772125-077551000f08?q=80&w=2000',
    seatColor: 'rgba(34, 197, 94, 0.2)',
    accentColor: '#22c55e',
    category: 'entertainment'
  },
  {
    id: 'birthday_special_scenic_premium',
    name: 'Birthday Special',
    url: 'https://images.unsplash.com/photo-1541280894840-06f157155639?q=80&w=2000',
    seatColor: 'rgba(236, 72, 153, 0.2)',
    accentColor: '#ec4899',
    category: 'entertainment'
  },
  {
    id: 'new_year_scenic_premium',
    name: 'New Year 2026',
    url: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=2000',
    seatColor: 'rgba(59, 130, 246, 0.2)',
    accentColor: '#3b82f6',
    category: 'entertainment'
  },
  {
    id: 'christmas_scenic_premium',
    name: 'Christmas Cozy',
    url: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=2000',
    seatColor: 'rgba(239, 68, 68, 0.2)',
    accentColor: '#ef4444',
    category: 'entertainment'
  },
  {
    id: 'holi_scenic_premium',
    name: 'Holi Festival',
    url: 'https://images.unsplash.com/photo-1590076215667-873d6f00918c?q=80&w=2000',
    seatColor: 'rgba(217, 70, 239, 0.2)',
    accentColor: '#d946ef',
    category: 'entertainment'
  },
  {
     id: 'beach_luxury_scenic_premium',
     name: 'Beach Luxury Lounge',
     url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000',
     seatColor: 'rgba(14, 165, 233, 0.2)',
     accentColor: '#0ea5e9',
     category: 'entertainment'
  },
  {
    id: 'scenic_neon_night_v3',
    name: 'Neon Night Scenic',
    url: '/themes/neon_night_scenic.png',
    seatColor: 'rgba(124, 58, 237, 0.2)',
    accentColor: '#8b5cf6',
    category: 'general'
  },
  {
    id: 'official_gold_scenic_premium',
    name: 'Official Ummy Gold',
    url: '/themes/official_ummy_v2.png',
    seatColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#fbbf24',
    category: 'general'
  }
];
