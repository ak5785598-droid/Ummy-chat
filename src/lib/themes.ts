/**
 * @fileOverview Centralized Room Theme Ledger - Final Clean Collection.
 * Total Themes: 34 (25 Originals + 9 User Provided Local Images)
 */

export interface RoomTheme {
  id: string;
  name: string;
  url: string;
  isOfficial?: boolean;
  seatColor?: string;
  accentColor?: string;
  category?: 'help' | 'entertainment' | 'general' | 'user_choice' | 'seasonal' | 'islamic';
  price?: number;
  durationDays?: number;
  animationId?: 'galaxy' | 'stars' | 'love' | 'rain';
}

export const ROOM_THEMES: RoomTheme[] = [
  // --- ORIGINAL 25 COLLECTION ---
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

  // --- USER PROVIDES 9 ONLY ---
  {
    id: 'user_mosque_moon_local',
    name: 'Moonlit Mosque',
    url: '/themes/user_mosque_moon.jpg',
    seatColor: 'rgba(59, 130, 246, 0.2)',
    accentColor: '#60a5fa',
    category: 'user_choice'
  },
  {
    id: 'user_mosque_lights_local',
    name: 'Festive Mosque Lights',
    url: '/themes/user_mosque_lights.jpg',
    seatColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#fbbf24',
    category: 'user_choice'
  },
  {
    id: 'user_mosque_cyber_local',
    name: 'Cyber Neon Mosque',
    url: '/themes/user_mosque_cyber.jpg',
    seatColor: 'rgba(217, 70, 239, 0.2)',
    accentColor: '#d946ef',
    category: 'user_choice'
  },
  {
    id: 'user_galaxy_campfire_local',
    name: 'Galaxy Campfire',
    url: '/themes/user_galaxy_campfire.jpg',
    seatColor: 'rgba(124, 58, 237, 0.2)',
    accentColor: '#8b5cf6',
    category: 'user_choice',
    animationId: 'stars'
  },
  {
    id: 'user_romantic_kiss_local',
    name: 'Romantic Silhouette',
    url: '/themes/user_romantic_kiss.jpg',
    seatColor: 'rgba(239, 68, 68, 0.2)',
    accentColor: '#ef4444',
    category: 'user_choice',
    animationId: 'love'
  },
  {
    id: 'user_christmas_village_local',
    name: 'Christmas Village',
    url: '/themes/user_christmas_village.jpg',
    seatColor: 'rgba(239, 68, 68, 0.2)',
    accentColor: '#ef4444',
    category: 'user_choice'
  },
  {
    id: 'user_beach_dinner_local',
    name: 'Beach Dinner',
    url: '/themes/user_beach_dinner.jpg',
    seatColor: 'rgba(251, 146, 60, 0.2)',
    accentColor: '#fb923c',
    category: 'user_choice'
  },
  {
    id: 'user_snowy_forest_local',
    name: 'Snowy Forest',
    url: '/themes/user_snowy_forest.jpg',
    seatColor: 'rgba(14, 165, 233, 0.2)',
    accentColor: '#0ea5e9',
    category: 'user_choice'
  },
  {
    id: 'user_group_campfire_local',
    name: 'Group Campfire',
    url: '/themes/user_group_campfire.jpg',
    seatColor: 'rgba(255, 255, 255, 0.2)',
    accentColor: '#ffffff',
    category: 'user_choice'
  }
];
