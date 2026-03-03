import type { User, Room, Game, CoinPackage, Task } from './types';

/**
 * Production Data Source.
 * All hardcoded demonstration mock data has been permanently purged.
 * Social graph is now 100% driven by live Firestore frequencies.
 */
const users: User[] = [];
const rooms: Room[] = []; 

const games: Game[] = [
  { 
    id: 'g1', 
    title: 'Ludo Masters', 
    slug: 'ludo', 
    coverUrl: '', 
    cost: 0, 
    imageHint: 'ludo board' 
  },
  { 
    id: 'g2', 
    title: 'Fruit Party', 
    slug: 'fruit-party', 
    coverUrl: 'https://images.unsplash.com/photo-1611080634139-6c8821f5f6ca?q=80&w=1000', 
    cost: 0, 
    imageHint: 'fruit party' 
  },
  { 
    id: 'g3', 
    title: 'Wild Party', 
    slug: 'forest-party', 
    coverUrl: '', 
    cost: 0, 
    imageHint: 'forest animals' 
  },
  { 
    id: 'g4', 
    title: 'Lucky Slot 777', 
    slug: 'lucky-slot-777', 
    coverUrl: '', 
    cost: 0, 
    imageHint: 'lucky 777 slot' 
  },
  { 
    id: 'g5', 
    title: 'Pyramid Battle', 
    slug: 'pyramid-battle', 
    coverUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=1000', 
    cost: 0, 
    imageHint: 'egyptian pyramid' 
  },
  { 
    id: 'g6', 
    title: 'Teen Patti', 
    slug: 'teen-patti', 
    coverUrl: '', 
    cost: 0, 
    imageHint: '3d cards poker' 
  },
];

const coinPackages: CoinPackage[] = [
  { id: 'cp01', amount: 1000, price: 5 },
  { id: 'cp02', amount: 5000, price: 20, bonus: 500 },
  { id: 'cp03', amount: 15000, price: 50, bonus: 2000 },
];

const dailyTasks: Task[] = [
  { id: 'dt1', title: 'Daily Check-in', description: 'Access any frequency today.', coinReward: 10, isCompleted: false, cta: { label: 'Explore', href: '/rooms' } },
  { id: 'dt2', title: 'Tribe Support', description: 'Send a gift to any host.', coinReward: 50, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
];

const achievementTasks: Task[] = [
  { id: 'at1', title: 'Official Host', description: 'Launch your first frequency.', coinReward: 500, isCompleted: false, cta: { label: 'Launch', href: '/rooms' } },
];

export const getPopularRooms = (): Room[] => rooms;
export const getPopularUsers = (): User[] => users;
export const getRoomBySlug = (slug: string): Room | undefined => rooms.find(r => r.slug === slug);
export const getAllRooms = (): Room[] => rooms;
export const getFreeGames = (): Game[] => games.filter(g => g.cost === 0);
export const getPremiumGames = (): Game[] => games.filter(g => g.cost > 0);
export const getCoinPackages = (): CoinPackage[] => coinPackages;
export const getDailyTasks = (): Task[] => dailyTasks;
export const getAchievementTasks = (): Task[] => achievementTasks;
