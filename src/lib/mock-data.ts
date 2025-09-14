
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
    stats: { sent: 6450359, followers: 8, fans: 44 },
    details: {
      age: 24,
      emotionalState: 'Keep secret',
      occupation: 'Anchor',
      hometown: 'Mumbai',
      personalitySignature: 'Happy every day'
    },
    wallet: {
      coins: 1250
    }
  },
  { 
    id: 'u2', 
    name: 'Rohan', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-2')?.imageUrl!, 
    isOnline: true,
    stats: { sent: 12345, followers: 120, fans: 88 },
     details: { hometown: 'Delhi' },
  },
  { 
    id: 'u3', 
    name: 'Anjali', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-3')?.imageUrl!, 
    isOnline: false,
    stats: { sent: 5432, followers: 230, fans: 150 },
     details: { hometown: 'Bangalore' },
  },
  { id: 'u4', 
    name: 'Vikram', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-4')?.imageUrl!, 
    isOnline: true,
    stats: { sent: 9876, followers: 50, fans: 25 },
     details: { hometown: 'Chennai' },
  },
  { 
    id: 'u5', 
    name: 'Sneha', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-5')?.imageUrl!, 
    isOnline: false,
    stats: { sent: 100, followers: 10, fans: 5 },
     details: { hometown: 'Kolkata' },
  },
  { id: 'u6', name: 'Arjun', avatarUrl: 'https://picsum.photos/seed/user6/200/200', isOnline: true, stats: { followers: 15, fans: 12 }, details: { hometown: 'Hyderabad' } },
  { id: 'u7', name: 'Neha', avatarUrl: 'https://picsum.photos/seed/user7/200/200', isOnline: false, stats: { followers: 88, fans: 42 }, details: { hometown: 'Pune' } },
  { id: 'u8', name: 'Karan', avatarUrl: 'https://picsum.photos/seed/user8/200/200', isOnline: true, stats: { followers: 123, fans: 99 }, details: { hometown: 'Ahmedabad' } },
  { id: 'u9', name: 'Pooja', avatarUrl: 'https://picsum.photos/seed/user9/200/200', isOnline: true, stats: { followers: 45, fans: 30 }, details: { hometown: 'Jaipur' } },
  { id: 'u10', name: 'Sameer', avatarUrl: 'https://picsum.photos/seed/user10/200/200', isOnline: false, stats: { followers: 78, fans: 60 }, details: { hometown: 'Lucknow' } },
  { id: 'u11', name: 'Support Bot', avatarUrl: 'https://picsum.photos/seed/support/200/200', isOnline: true, stats: { followers: 999, fans: 999 } },
  { id: 'u12', name: 'Deepika', avatarUrl: 'https://picsum.photos/seed/user12/200/200', isOnline: false, stats: { followers: 23, fans: 11 }, details: { hometown: 'Chandigarh' } },
  { id: 'u13', name: 'Rahul', avatarUrl: 'https://picsum.photos/seed/user13/200/200', isOnline: true, stats: { followers: 89, fans: 54 }, details: { hometown: 'Bhopal' } },
  { id: 'u14', name: 'Isha', avatarUrl: 'https://picsum.photos/seed/user14/200/200', isOnline: true, stats: { followers: 150, fans: 110 }, details: { hometown: 'Indore' } },
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
    participants: [users[0], users[1], users[3]],
    messages: messages,
  },
  { 
    id: 'r2', 
    slug: 'delhi-darbar', 
    title: 'Delhi Darbar', 
    topic: 'Food & History', 
    category: 'Popular',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-2')?.imageUrl!,
    participants: users.slice(0, 4),
    messages: [],
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
  },
  { 
    id: 'r4', 
    slug: 'chennai-super-chats', 
    title: 'Chennai Super Chats', 
    topic: 'Movies & Music', 
    category: 'Popular',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-4')?.imageUrl!,
    participants: [users[0], users[2], users[4]],
    messages: [],
  },
  {
    id: 'r5',
    slug: 'kolkata-connect',
    title: 'Kolkata Connect',
    topic: 'Art & Culture',
    category: 'Chat',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-5')?.imageUrl!,
    participants: [users[1], users[3], users[4]],
    messages: [],
  },
  {
    id: 'r6',
    slug: 'official-help-room',
    title: 'Official Help Room',
    topic: 'Support',
    category: 'Chat',
    coverUrl: 'https://picsum.photos/seed/support-room/400/225',
    participants: [users[10], users[0]],
    messages: [{ id: 'm5', text: 'Welcome! How can I help you today?', user: users[10], timestamp: '11:00 AM' }],
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
  },
  {
    id: 'r9',
    slug: 'pk-battle-arena',
    title: 'PK Battle Arena',
    topic: 'Battle',
    category: 'Battle',
    coverUrl: 'https://picsum.photos/seed/battle1/400/225',
    participants: users.slice(0, 2),
    messages: [],
  },
  {
    id: 'r10',
    slug: 'karaoke-club',
    title: 'Karaoke Club',
    topic: 'Singing',
    category: 'Singing',
    coverUrl: 'https://picsum.photos/seed/singing2/400/225',
    participants: users.slice(5, 10),
    messages: [],
  }
];

const games: Game[] = [
  { id: 'g1', title: 'Ludo Party', coverUrl: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9', cost: 0, imageHint: 'ludo board' },
  { id: 'g2', title: 'Carrom Clash', coverUrl: 'https://picsum.photos/seed/carrom-board/300/200', cost: 0, imageHint: 'carrom board' },
  { id: 'g3', title: 'Chess Masters', coverUrl: 'https://picsum.photos/seed/chess-set/300/200', cost: 0, imageHint: 'chess set' },
  { id: 'g4', title: 'Bubble Shooter', coverUrl: 'https://picsum.photos/seed/arcade-game/300/200', cost: 0, imageHint: 'arcade game' },
  { id: 'g9', title: 'Crazy Alpaca', coverUrl: 'https://picsum.photos/seed/funny-alpaca/300/200', cost: 0, imageHint: 'funny alpaca' },
  { id: 'g10', title: 'Carrom', coverUrl: 'https://picsum.photos/seed/carrom-game/300/200', cost: 0, imageHint: 'carrom game' },
  { id: 'g11', title: 'Monster Crush', coverUrl: 'https://picsum.photos/seed/cute-monster/300/200', cost: 0, imageHint: 'cute monster' },
  { id: 'g5', title: 'Rummy Riches', coverUrl: 'https://picsum.photos/seed/playing-cards/300/200', cost: 100, imageHint: 'playing cards' },
  { id: 'g6', title: 'Poker Pro', coverUrl: 'https://picsum.photos/seed/poker-chips/300/200', cost: 500, imageHint: 'poker chips' },
  { id: 'g7', title: 'Teen Patti Gold', coverUrl: 'https://picsum.photos/seed/card-game/300/200', cost: 200, imageHint: 'card game' },
  { id: 'g8', title: '8 Ball Pool', coverUrl: 'https://picsum.photos/seed/billiards-table/300/200', cost: 50, imageHint: 'billiards table' },
];

const coinPackages: CoinPackage[] = [
  { id: 'cp01', amount: 2000, price: 25 },
  { id: 'cp02', amount: 4200, price: 50, bonus: 200 },
  { id: 'cp1', amount: 50000, price: 100, bonus: 5000 },
  { id: 'cp2', amount: 275000, price: 500, bonus: 25000 },
  { id: 'cp3', amount: 575000, price: 1000, bonus: 75000 },
  { id: 'cp4', amount: 1500000, price: 2500, bonus: 250000 },
  { id: 'cp5', amount: 3250000, price: 5000, bonus: 750000 },
  { id: 'cp6', amount: 7000000, price: 10000, bonus: 2000000 },
];

const contributions: Contribution[] = [
    { user: users[1], amount: 10500 },
    { user: users[3], amount: 8200 },
    { user: users[2], amount: 15300 },
    { user: users[4], amount: 500 },
    { user: users[5], amount: 4800 },
    { user: users[6], amount: 2300 },
    { user: users[7], amount: 100 },
]

const pkBattles: PkBattle[] = [
  {
    id: 'pk1',
    room1: rooms[0],
    room2: rooms[2],
    score1: 12500,
    score2: 11200,
  },
   {
    id: 'pk2',
    room1: rooms[1],
    room2: rooms[3],
    score1: 8900,
    score2: 9500,
  },
]

const dailyTasks: Task[] = [
    { id: 'dt1', title: 'Join a room', description: 'Spend at least 10 minutes in any public chat room.', coinReward: 50, isCompleted: true, cta: { label: 'Go', href: '/rooms'} },
    { id: 'dt2', title: 'Send a gift', description: 'Send a virtual gift to any user in a room.', coinReward: 100, isCompleted: false, cta: { label: 'Go', href: '/rooms'} },
    { id: 'dt3', title: 'Play a game', description: 'Play any game in the Game Center.', coinReward: 75, isCompleted: false, cta: { label: 'Go', href: '/games'} },
];

const achievementTasks: Task[] = [
    { id: 'at1', title: 'Follow 3 users', description: 'Expand your social circle by following three other users.', coinReward: 200, isCompleted: true, cta: { label: 'Explore', href: '/' } },
    { id: 'at2', title: 'Become a room host', description: 'Create and host your own chat room.', coinReward: 500, isCompleted: false, cta: { label: 'Create', href: '/rooms' } },
    { id: 'at3', title: 'Top Contributor', description: 'Become one of the top 3 contributors in any room.', coinReward: 1000, isCompleted: false, cta: { label: 'Explore', href: '/rooms'} },
    { id: 'at4', title: 'Win a PK Battle', description: 'Be the host of a winning room in a PK Battle.', coinReward: 1500, isCompleted: false, cta: { label: 'Battle', href: '/' } },
];


export const getPopularRooms = (): Room[] => {
    return rooms.filter(r => r.category === 'Popular');
}

export const getPopularUsers = (): User[] => {
    return users.slice(0, 10);
}

export const getRoomBySlug = (slug: string): Room | undefined => {
    return rooms.find(r => r.slug === slug);
}

export const getAllRooms = (): Room[] => {
    return rooms;
}

export const getCurrentUser = (): User => {
    return users[0];
}

export const getUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id);
}

export const getFriends = (): User[] => {
    return users.slice(1, 7);
}

export const getFreeGames = (): Game[] => {
  return games.filter(g => g.cost === 0);
}

export const getPremiumGames = (): Game[] => {
  return games.filter(g => g.cost > 0);
}

export const getCoinPackages = (): CoinPackage[] => {
  return coinPackages.sort((a,b) => a.price - b.price);
}

export const getTopContributors = (): Contribution[] => {
    return contributions.sort((a, b) => b.amount - a.amount);
}

export const getPkBattles = (): PkBattle[] => {
  return pkBattles;
}

export const getDailyTasks = (): Task[] => {
    return dailyTasks;
}

export const getAchievementTasks = (): Task[] => {
    return achievementTasks;
}

export const getProfileVisitors = (): User[] => {
    return users.slice(7, 14);
}
