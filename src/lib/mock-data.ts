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
  { id: 'dt1', title: 'Daily Check-in', description: 'Access any frequency today.', coinReward: 5000, isCompleted: false, cta: { label: 'Explore', href: '/rooms' } },
  { id: 'dt2', title: 'Send gift once', description: 'Dispatch a gift to any tribe member.', coinReward: 500, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'dt3', title: '1 New follower', description: 'Gain 1 new follower today.', coinReward: 1000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'dt4', title: '3 User enter the room', description: 'Have 3 members visit your frequency.', coinReward: 2500, isCompleted: false, cta: { label: 'Launch', href: '/rooms' } },
  { id: 'dt5', title: '10 User enter the room', description: 'Have 10 members visit your frequency.', coinReward: 10000, isCompleted: false, cta: { label: 'Launch', href: '/rooms' } },
  { id: 'dt6', title: 'Share room link', description: 'Successfully Share room link to WhatsApp.', coinReward: 5000, isCompleted: false, cta: { label: 'Share', href: '/rooms' } },
];

const achievementTasks: Task[] = [
  { id: 'at1', title: 'On mic for 10 Minutes', description: 'Broadcast your voice for 10 minutes.', coinReward: 2500, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at2', title: 'On mic 30 minutes', description: 'Broadcast your voice for 30 minutes.', coinReward: 10000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at3', title: 'On mic 60Minute', description: 'Broadcast your voice for 60 minutes.', coinReward: 25000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at4', title: 'Invite 1 user on mic', description: 'Successfully invited 1 user on mic.', coinReward: 2500, isCompleted: false, cta: { label: 'Invite', href: '/rooms' } },
  { id: 'at5', title: 'Invite 10 user on mic', description: 'Successfully Invited 10user on mic.', coinReward: 25000, isCompleted: false, cta: { label: 'Invite', href: '/rooms' } },
  { id: 'at6', title: 'Invite 3 New users', description: 'Successfully invited 3 New user on mic.', coinReward: 2000, isCompleted: false, cta: { label: 'Invite', href: '/rooms' } },
  { id: 'at7', title: 'Room Loyalty', description: 'More than 5 user enter Your room for 2 Consecutive days.', coinReward: 20000, isCompleted: false, cta: { label: 'Launch', href: '/rooms' } },
  { id: 'at8', title: 'Trio Sync (1m)', description: '3 User on mic at the same time for 1 minutes.', coinReward: 5000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at9', title: 'Trio Sync (10m)', description: '3 user on mic at the same time for 10 minutes.', coinReward: 10000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at10', title: 'New Trio Sync (5m)', description: '3 New user on mic at the same time for 5 minutes.', coinReward: 10000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at11', title: 'New User Gifts', description: '3 New user send gifts in the room.', coinReward: 5000, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'at12', title: '10 New follower', description: 'Grow your tribe by 10 new followers.', coinReward: 5000, isCompleted: false, cta: { label: 'Profile', href: '/profile' } },
  { id: 'at13', title: '3 New New-User followers', description: '3 New follower From new user.', coinReward: 2500, isCompleted: false, cta: { label: 'Profile', href: '/profile' } },
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
