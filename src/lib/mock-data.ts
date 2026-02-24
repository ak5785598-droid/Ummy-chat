import type { User, Room, Game, CoinPackage, Task } from './types';

/**
 * Production Data Source.
 * All mock users, rooms, and prototype games have been permanently removed.
 */
const users: User[] = [];
const rooms: Room[] = []; 

const games: Game[] = [
  { 
    id: 'g1', 
    title: 'Ludo Masters', 
    slug: 'ludo', 
    coverUrl: 'https://picsum.photos/seed/ludo-pro/1200/600', 
    cost: 0, 
    imageHint: 'ludo board' 
  },
];

const coinPackages: CoinPackage[] = [
  { id: 'cp01', amount: 1000, price: 5 },
  { id: 'cp02', amount: 5000, price: 20, bonus: 500 },
  { id: 'cp03', amount: 15000, price: 50, bonus: 2000 },
];

const dailyTasks: Task[] = [
  { id: 'dt1', title: 'Daily Check-in', description: 'Enter any frequency today.', coinReward: 10, isCompleted: false, cta: { label: 'Explore', href: '/rooms' } },
  { id: 'dt2', title: 'Vibe Contributor', description: 'Send a gift to any host.', coinReward: 50, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
];

const achievementTasks: Task[] = [
  { id: 'at1', title: 'Tribe Founder', description: 'Create your very first frequency.', coinReward: 500, isCompleted: false, cta: { label: 'Create', href: '/rooms' } },
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
