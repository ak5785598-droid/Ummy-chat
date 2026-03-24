/**
 * @fileOverview Centralized Room Theme Ledger.
 * Defines the high-fidelity visual frequencies available for chat rooms.
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
}

export const ROOM_THEMES: RoomTheme[] = [
 // --- ENTERTAINMENT COLLECTION (From Blueprint) ---
 { 
  id: 'neon_universe', 
  name: 'Neon Chat Universe', 
  url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2000',
  seatColor: 'rgba(147, 51, 234, 0.2)',
  accentColor: '#d946ef',
  category: 'entertainment'
 },
 { 
  id: 'emoji_party', 
  name: 'Fun Emoji Party', 
  url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2000',
  seatColor: 'rgba(251, 191, 36, 0.2)',
  accentColor: '#fbbf24',
  category: 'entertainment'
 },
 { 
  id: 'coding_hacker', 
  name: 'Coding Hacker Room', 
  url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000',
  seatColor: 'rgba(34, 197, 94, 0.15)',
  accentColor: '#22c55e',
  category: 'entertainment'
 },
 { 
  id: 'gaming_arcade', 
  name: 'Gaming Arcade Room', 
  url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000',
  seatColor: 'rgba(59, 130, 246, 0.2)',
  accentColor: '#3b82f6',
  category: 'entertainment'
 },
 { 
  id: 'heartbeat_arcade', 
  name: 'Heartbeat Arcade Room', 
  url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000',
  seatColor: 'rgba(236, 72, 153, 0.2)',
  accentColor: '#ec4899',
  category: 'entertainment'
 },
 { 
  id: 'gentle_lounge', 
  name: 'Gentle Lounge Chat Room', 
  url: 'https://images.unsplash.com/photo-1574091237482-0afea70accb1?q=80&w=2000',
  seatColor: 'rgba(255, 255, 255, 0.1)',
  accentColor: '#f8fafc',
  category: 'entertainment'
 },

 // --- HELP HUB COLLECTION (From Blueprint) ---
 { 
  id: 'support_center', 
  name: 'Support Center', 
  url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2000',
  isOfficial: true,
  seatColor: 'rgba(59, 130, 246, 0.1)',
  accentColor: '#3b82f6',
  category: 'help'
 },
 { 
  id: 'knowledge_hub', 
  name: 'Knowledge Hub', 
  url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000',
  isOfficial: true,
  seatColor: 'rgba(120, 113, 108, 0.1)',
  accentColor: '#78716c',
  category: 'help'
 },
 { 
  id: 'summary_guide', 
  name: 'Summary Guide', 
  url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=2000',
  isOfficial: true,
  seatColor: 'rgba(14, 165, 233, 0.1)',
  accentColor: '#0ea5e9',
  category: 'help'
 },
 { 
  id: 'friendly_guide', 
  name: 'Friendly Guide', 
  url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2000',
  isOfficial: true,
  seatColor: 'rgba(34, 197, 94, 0.1)',
  accentColor: '#22c55e',
  category: 'help'
 },
 { 
  id: 'community_help', 
  name: 'Community Help', 
  url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2000',
  isOfficial: true,
  seatColor: 'rgba(244, 114, 182, 0.1)',
  accentColor: '#f472b6',
  category: 'help'
 },
 { 
  id: 'minimal_help_ui', 
  name: 'Minimal Help UI', 
  url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000',
  isOfficial: true,
  seatColor: 'rgba(100, 116, 139, 0.1)',
  accentColor: '#64748b',
  category: 'help'
 },

 // --- BRAND PREMIUM ---
 { 
  id: 'official_ummy', 
  name: 'Official Ummy', 
  url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000', 
  isOfficial: true, 
  seatColor: 'rgba(255, 204, 0, 0.2)', 
  accentColor: '#FFCC00', 
  category: 'general' 
 },
];
