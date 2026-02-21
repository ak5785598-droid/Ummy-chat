import type { User, Room, Message, Game, CoinPackage, Contribution, PkBattle, Task } from './types';
import { PlaceHolderImages } from './placeholder-images';

const users: User[] = [
  { 
    id: 'u1', 
    name: 'Priya', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-1')?.imageUrl!, 
    isOnline: true, 
    bio: 'Just vibing and connecting with new people! Music and art lover.',
    coverUrl: PlaceHolderImages.find(i => i.id === 'profile-header')?.imageUrl,
    level: { rich: 45, charm: 32 },
    frame: 'Official',
    tags: ['Admin', 'Official'],
    specialId: '10001',
    stats: { sent: 6450359, followers: 8, fans: 44 },
    details: {
      age: 24,
      emotionalState: 'Keep secret',
      occupation: 'Anchor',
      hometown: 'Mumbai',
      personalitySignature: 'Happy every day'
    },
    wallet: {
      coins: 1250,
      diamonds: 450
    }
  },
  { 
    id: 'u2', 
    name: 'Rohan', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-2')?.imageUrl!, 
    isOnline: true,
    level: { rich: 12, charm: 8 },
    frame: 'CG',
    tags: ['VIP'],
    stats: { sent: 12345, followers: 120, fans: 88 },
     details: { hometown: 'Delhi' },
  },
  { 
    id: 'u3', 
    name: 'Anjali', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-3')?.imageUrl!, 
    isOnline: false,
    level: { rich: 5, charm: 15 },
    stats: { sent: 5432, followers: 230, fans: 150 },
     details: { hometown: 'Bangalore' },
  },
  { id: 'u4', 
    name: 'Vikram', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-4')?.imageUrl!, 
    isOnline: true,
    level: { rich: 30, charm: 22 },
    frame: 'Leader',
    stats: { sent: 9876, followers: 50, fans: 25 },
     details: { hometown: 'Chennai' },
  },
  { 
    id: 'u5', 
    name: 'Sneha', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-5')?.imageUrl!, 
    isOnline: false,
    level: { rich: 1, charm: 2 },
    stats: { sent: 100, followers: 10, fans: 5 },
     details: { hometown: 'Kolkata' },
  },
  { id: 'u6', name: 'Arjun', avatarUrl: 'https://picsum.photos/seed/user6/200/200', isOnline: true, stats: { followers: 15, fans: 12 }, level: { rich: 2, charm: 5 } },
  { id: 'u7', name: 'Neha', avatarUrl: 'https://picsum.photos/seed/user7/200/200', isOnline: false, stats: { followers: 88, fans: 42 }, level: { rich: 10, charm: 12 } },
  { id: 'u8', name: 'Karan', avatarUrl: 'https://picsum.photos/seed/user8/200/200', isOnline: true, stats: { followers: 123, fans: 99 }, level: { rich: 15, charm: 10 } },
];

const messages: Message[] = [
    { id: 'm1', text: 'Hey everyone! Excited to be here.', user: users[0], timestamp: '10:30 AM' },
    { id: 'm2', text: 'Welcome, Priya! What are your favorite genres?', user: users[1], timestamp: '10:31 AM' },
    { id: 'm3', text: 'I love indie and lo-fi beats. Perfect for chilling.', user: users[0], timestamp: '10:32 AM' },
    { id: 'm4', text: 'Nice! Anyone have recommendations for a good lo-fi playlist?', user: users[3], timestamp: '10:33 AM' },
];

const rooms: Room[] = [
  { 
    id: 'r1', 
    slug: 'mumbai-adda', 
    title: 'Mumbai Adda', 
    topic: 'Bollywood & Gup-Shup', 
    category: 'Popular',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-1')?.imageUrl!,
    participants: [users[1], users[2], users[3], users[4]],
    messages: messages,
    announcement: 'Welcome to the biggest Mumbai Adda! No toxicity allowed.',
    ownerId: '901piBzTQ0VzCtAvlyyobwvAaTs1' // Mock owner matching default user or admin UID
  },
  { 
    id: 'r2', 
    slug: 'delhi-darbar', 
    title: 'Delhi Darbar', 
    topic: 'Food & History', 
    category: 'Popular',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-2')?.imageUrl!,
    participants: users.slice(1, 4),
    messages: [],
    ownerId: 'u2'
  },
  { 
    id: 'r3', 
    slug: 'bangalore-startup-cafe', 
    title: 'Bangalore Startup Cafe', 
    topic: 'Tech & Innovation', 
    category: 'Popular',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-3')?.imageUrl!,
    participants: users.slice(1, 5),
    messages: [],
    ownerId: 'u3'
  },
  {
    id: 'r7',
    slug: 'antakshari-night',
    title: 'Antakshari Night',
    topic: 'Singing',
    category: 'Singing',
    coverUrl: 'https://picsum.photos/seed/singing1/400/225',
    participants: users.slice(2, 8),
    messages: [],
    ownerId: 'u1'
  },
  {
    id: 'r8',
    slug: 'ludo-champs',
    title: 'Ludo Champs',
    topic: 'Gaming',
    category: 'Game',
    coverUrl: 'https://picsum.photos/seed/game1/400/225',
    participants: users.slice(4, 9),
    messages: [],
    ownerId: 'u4'
  }
];

const games: Game[] = [
  { id: 'g1', title: 'Ludo Party', slug: 'ludo', coverUrl: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=2940&auto=format&fit=crop', cost: 0, imageHint: 'ludo board' },
  { id: 'g2', title: 'Carrom Clash', slug: 'carrom', coverUrl: 'https://images.unsplash.com/photo-1610839563032-353316138715?q=80&w=2832&auto=format&fit=crop', cost: 0, imageHint: 'carrom board' },
  { id: 'g3', title: 'Chess Masters', slug: 'chess', coverUrl: 'https://picsum.photos/seed/chess-set/300/200', cost: 0, imageHint: 'chess set' },
  { id: 'g15', title: '777 Lucky Slot', slug: 'lucky-slot', coverUrl: 'https://picsum.photos/seed/slot-machine/300/200', cost: 100, imageHint: 'slot machine' },
  { id: 'g4', title: 'Bubble Shooter', slug: 'bubble-shooter', coverUrl: 'https://picsum.photos/seed/arcade-game/300/200', cost: 0, imageHint: 'arcade game' },
  { id: 'g12', title: 'Fruit Greedy', slug: 'fruit-greedy', coverUrl: 'https://picsum.photos/seed/fruit-game/300/200', cost: 150, imageHint: 'fruit apple' },
  { id: 'g13', title: '8 Ball Pool', slug: '8-ball-pool', coverUrl: 'https://picsum.photos/seed/pool-ball/300/200', cost: 0, imageHint: 'pool ball' },
  { id: 'g14', title: 'Crazy Alpaca', slug: 'crazy-alpaca', coverUrl: 'https://picsum.photos/seed/alpaca/300/200', cost: 0, imageHint: 'alpaca' },
  { id: 'g16', title: 'Monster Crush', slug: 'monster-crush', coverUrl: 'https://picsum.photos/seed/monster/300/200', cost: 0, imageHint: 'monster' },
  { id: 'g17', title: 'Rummy Riches', slug: 'rummy', coverUrl: 'https://picsum.photos/seed/poker-cards/300/200', cost: 0, imageHint: 'poker cards' },
];

const coinPackages: CoinPackage[] = [
  { id: 'cp01', amount: 2000, price: 25 },
  { id: 'cp02', amount: 4200, price: 50, bonus: 200 },
];

const contributions: Contribution[] = [
    { user: users[1], amount: 10500 },
    { user: users[3], amount: 8200 },
    { user: users[2], amount: 15300 },
]

const pkBattles: PkBattle[] = [
  {
    id: 'pk1',
    room1: rooms[0],
    room2: rooms[1],
    score1: 45000,
    score2: 32000,
  },
  {
    id: 'pk2',
    room1: rooms[2],
    room2: rooms[3] || rooms[0],
    score1: 12000,
    score2: 15000,
  }
];

const dailyTasks: Task[] = [
  { id: 'dt1', title: 'Morning Check-in', description: 'Open the app today.', coinReward: 10, isCompleted: true, cta: { label: 'Go', href: '/tasks' } },
  { id: 'dt2', title: 'Gift Spreader', description: 'Send 3 gifts in any room.', coinReward: 50, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'dt3', title: 'Talkative', description: 'Send 10 messages in chat.', coinReward: 30, isCompleted: false, cta: { label: 'Go', href: '/rooms' } },
  { id: 'dt4', title: 'Watch Party', description: 'Watch a video for 5 mins.', coinReward: 100, isCompleted: false, cta: { label: 'Go', href: '/watch' } },
  { id: 'dt5', title: 'Game On', description: 'Play any free game.', coinReward: 40, isCompleted: true, cta: { label: 'Go', href: '/games' } },
];

const achievementTasks: Task[] = [
  { id: 'at1', title: 'First Room', description: 'Create your very first chat room.', coinReward: 500, isCompleted: false, cta: { label: 'Create', href: '/rooms' } },
  { id: 'at2', title: 'Influencer', description: 'Reach 100 followers.', coinReward: 1000, isCompleted: false, cta: { label: 'Profile', href: '/profile' } },
  { id: 'at3', title: 'High Roller', description: 'Reach Rich Level 10.', coinReward: 2000, isCompleted: false, cta: { label: 'Level Up', href: '/settings' } },
  { id: 'at4', title: 'Veteran', description: 'Stay active for 30 consecutive days.', coinReward: 5000, isCompleted: false, cta: { label: 'Check', href: '/tasks' } },
];

export const getPopularRooms = (): Room[] => rooms;
export const getPopularUsers = (): User[] => users;
export const getRoomBySlug = (slug: string): Room | undefined => rooms.find(r => r.slug === slug);
export const getAllRooms = (): Room[] => rooms;
export const getUserById = (id: string): User | undefined => users.find(u => u.id === id);
export const getFriends = (): User[] => users.slice(1, 7);
export const getFreeGames = (): Game[] => games.filter(g => g.cost === 0);
export const getPremiumGames = (): Game[] => games.filter(g => g.cost > 0);
export const getCoinPackages = (): CoinPackage[] => coinPackages;
export const getTopContributors = (): Contribution[] => contributions.sort((a, b) => b.amount - a.amount);
export const getPkBattles = (): PkBattle[] => pkBattles;
export const getDailyTasks = (): Task[] => dailyTasks;
export const getAchievementTasks = (): Task[] => achievementTasks;
export const getProfileVisitors = (): User[] => users.slice(4, 8);
