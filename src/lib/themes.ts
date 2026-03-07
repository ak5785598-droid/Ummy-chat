
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
}

export const ROOM_THEMES: RoomTheme[] = [
  // Haza-Inspired Premium Collection
  { 
    id: 'haza_summer', 
    name: 'Haza Summer', 
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000',
    seatColor: 'rgba(255, 255, 255, 0.15)',
    accentColor: '#0ea5e9',
    category: 'general'
  },
  { 
    id: 'haza_aurora', 
    name: 'Haza Aurora', 
    url: 'https://images.unsplash.com/photo-1531366930077-511778400463?q=80&w=2000',
    seatColor: 'rgba(22, 163, 74, 0.15)',
    accentColor: '#4ade80',
    category: 'general'
  },
  { 
    id: 'haza_tiger', 
    name: 'Haza Gold Tiger', 
    url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=2000',
    seatColor: 'rgba(184, 138, 68, 0.2)',
    accentColor: '#fbbf24',
    category: 'general'
  },
  { 
    id: 'haza_azure', 
    name: 'Haza Azure Ocean', 
    url: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=2000',
    seatColor: 'rgba(14, 165, 233, 0.15)',
    accentColor: '#38bdf8',
    category: 'general'
  },
  { 
    id: 'haza_dream', 
    name: 'Haza Crystal Dream', 
    url: 'https://images.unsplash.com/photo-1502759683299-cdcd6974244f?q=80&w=2000',
    seatColor: 'rgba(147, 51, 234, 0.15)',
    accentColor: '#d946ef',
    category: 'general'
  },

  // Base Collection
  { 
    id: 'misty', 
    name: 'Misty Forest', 
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000',
    seatColor: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#4ade80',
    category: 'general'
  },
  { 
    id: 'neon', 
    name: 'Neon Party', 
    url: 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=2000',
    seatColor: 'rgba(147, 51, 234, 0.2)',
    accentColor: '#d946ef',
    category: 'general'
  },
  { 
    id: 'royal', 
    name: 'Royal Palace', 
    url: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2000',
    seatColor: 'rgba(184, 138, 68, 0.2)',
    accentColor: '#fbbf24',
    category: 'general'
  },
  { id: 'sakura', name: 'Sakura Blossom', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2000', seatColor: 'rgba(244, 114, 182, 0.2)', accentColor: '#f472b6', category: 'general' },
  { id: 'crystal', name: 'Crystal Cave', url: 'https://images.unsplash.com/photo-1502759683299-cdcd6974244f?q=80&w=2000', seatColor: 'rgba(103, 232, 249, 0.2)', accentColor: '#22d3ee', category: 'general' },
  { id: 'cyber', name: 'Cyber Punk', url: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=2000', seatColor: 'rgba(239, 68, 68, 0.2)', accentColor: '#f87171', category: 'general' },
  
  // Official Entertainment Themes
  { id: 'ent_glitz', name: 'Glitz & Glamour', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000', isOfficial: true, seatColor: 'rgba(255, 215, 0, 0.1)', accentColor: '#fbbf24', category: 'entertainment' },
  { id: 'ent_concert', name: 'Grand Stage', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2000', isOfficial: true, seatColor: 'rgba(255, 255, 255, 0.1)', accentColor: '#60a5fa', category: 'entertainment' },
  { id: 'ent_cinema', name: 'Movie Magic', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2000', isOfficial: true, seatColor: 'rgba(220, 38, 38, 0.1)', accentColor: '#ef4444', category: 'entertainment' },
  { id: 'ent_lounge', name: 'Velvet Lounge', url: 'https://images.unsplash.com/photo-1574091237482-0afea70accb1?q=80&w=2000', isOfficial: true, seatColor: 'rgba(147, 51, 234, 0.1)', accentColor: '#a855f7', category: 'entertainment' },
  { id: 'ent_festival', name: 'Carnival Night', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2000', isOfficial: true, seatColor: 'rgba(236, 72, 153, 0.1)', accentColor: '#ec4899', category: 'entertainment' },

  // Ummy Help Hub Only Themes
  { id: 'help_station', name: 'Support Station', url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2000', isOfficial: true, seatColor: 'rgba(59, 130, 246, 0.1)', accentColor: '#3b82f6', category: 'help' },
  { id: 'help_library', name: 'Knowledge Hub', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000', isOfficial: true, seatColor: 'rgba(120, 113, 108, 0.1)', accentColor: '#78716c', category: 'help' },
  { id: 'help_garden', name: 'Serene Support', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2000', isOfficial: true, seatColor: 'rgba(34, 197, 94, 0.1)', accentColor: '#22c55e', category: 'help' },
  { id: 'help_center_v2', name: 'Tech Center', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000', isOfficial: true, seatColor: 'rgba(100, 116, 139, 0.1)', accentColor: '#64748b', category: 'help' },
  { id: 'help_sky', name: 'Blue Horizons', url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=2000', isOfficial: true, seatColor: 'rgba(14, 165, 233, 0.1)', accentColor: '#0ea5e9', category: 'help' },

  // Original Official Themes
  { id: 'official_ummy', name: 'Official Ummy', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000', isOfficial: true, seatColor: 'rgba(255, 204, 0, 0.2)', accentColor: '#FFCC00', category: 'general' },
  { id: 'help_center', name: 'Support Blue', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000', isOfficial: true, seatColor: 'rgba(33, 150, 243, 0.2)', accentColor: '#2196F3', category: 'help' },
];
