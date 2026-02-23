import type { User, Room, Game, CoinPackage, Task } from './types';

// Production Logic: Mock data is removed to allow dynamic growth of the frequency.
const users: User[] = [];
const rooms: Room[] = []; 

const games: Game[] = [
  { id: 'g1', title: 'Ludo Party', slug: 'ludo', coverUrl: 'https://picsum.photos/seed/ludo/300/200', cost: 0, imageHint: 'ludo board' },
  { id: 'g2', title: 'Carrom Clash', slug: 'carrom', coverUrl: 'https://picsum.photos/seed/carrom/300/200', cost: 0, imageHint: 'carrom board' },
  { id: 'g3', title: '8 Ball Pool', slug: '8-ball-pool', coverUrl: 'https://picsum.photos/seed/pool/300/200', cost: 0, imageHint: 'billiards table' },
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
