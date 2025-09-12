import type { User, Room, Message, Game, CoinPackage } from './types';
import { PlaceHolderImages } from './placeholder-images';

const users: User[] = [
  { 
    id: 'u1', 
    name: 'Alina', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-1')?.imageUrl!, 
    isOnline: true, 
    bio: 'Just vibing and connecting with new people! Music and art lover.',
    coverUrl: PlaceHolderImages.find(i => i.id === 'profile-header')?.imageUrl,
    stats: { sent: 6450359, followers: 8, fans: 44 },
    details: {
      age: 25,
      emotionalState: 'Keep secret',
      occupation: 'Anchor',
      hometown: 'Beijing',
      personalitySignature: 'Happy every day'
    },
    wallet: {
      coins: 1250
    }
  },
  { 
    id: 'u2', 
    name: 'Ben', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-2')?.imageUrl!, 
    isOnline: true,
    stats: { sent: 12345, followers: 120, fans: 88 },
  },
  { 
    id: 'u3', 
    name: 'Chloe', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-3')?.imageUrl!, 
    isOnline: false,
    stats: { sent: 5432, followers: 230, fans: 150 },
  },
  { 
    id: 'u4', 
    name: 'David', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-4')?.imageUrl!, 
    isOnline: true,
    stats: { sent: 9876, followers: 50, fans: 25 },
  },
  { 
    id: 'u5', 
    name: 'Eva', 
    avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-5')?.imageUrl!, 
    isOnline: false,
    stats: { sent: 100, followers: 10, fans: 5 },
  },
  { id: 'u6', name: 'Frank', avatarUrl: 'https://picsum.photos/seed/user6/200/200', isOnline: true, stats: { followers: 15, fans: 12 } },
  { id: 'u7', name: 'Grace', avatarUrl: 'https://picsum.photos/seed/user7/200/200', isOnline: false, stats: { followers: 88, fans: 42 } },
  { id: 'u8', name: 'Henry', avatarUrl: 'https://picsum.photos/seed/user8/200/200', isOnline: true, stats: { followers: 123, fans: 99 } },
  { id: 'u9', name: 'Ivy', avatarUrl: 'https://picsum.photos/seed/user9/200/200', isOnline: true, stats: { followers: 45, fans: 30 } },
  { id: 'u10', name: 'Jack', avatarUrl: 'https://picsum.photos/seed/user10/200/200', isOnline: false, stats: { followers: 78, fans: 60 } },
];

const messages: Message[] = [
    { id: 'm1', text: 'Hey everyone! Excited to be here.', user: users[0], timestamp: '10:30 AM' },
    { id: 'm2', text: 'Welcome, Alina! What are your favorite genres?', user: users[1], timestamp: '10:31 AM' },
    { id: 'm3', text: 'I love indie and lo-fi beats. Perfect for chilling.', user: users[0], timestamp: '10:32 AM' },
    { id: 'm4', text: 'Nice! Anyone have recommendations for a good lo-fi playlist?', user: users[3], timestamp: '10:33 AM' },
];

const rooms: Room[] = [
  { 
    id: 'r1', 
    slug: 'late-night-vibes', 
    title: 'Late Night Vibes', 
    topic: 'Music & Chill', 
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-1')?.imageUrl!,
    participants: [users[0], users[1], users[3]],
    messages: messages,
  },
  { 
    id: 'r2', 
    slug: 'coffee-corner', 
    title: 'Coffee Corner', 
    topic: 'Casual Chats', 
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-2')?.imageUrl!,
    participants: users.slice(0, 4),
    messages: [],
  },
  { 
    id: 'r3', 
    slug: 'game-on', 
    title: 'Game On!', 
    topic: 'Gaming & Fun', 
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-3')?.imageUrl!,
    participants: users.slice(1, 5),
    messages: [],
  },
  { 
    id: 'r4', 
    slug: 'bookworms-unite', 
    title: 'Bookworms Unite', 
    topic: 'Literature', 
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-4')?.imageUrl!,
    participants: [users[0], users[2], users[4]],
    messages: [],
  },
  {
    id: 'r5',
    slug: 'adventure-awaits',
    title: 'Adventure Awaits',
    topic: 'Travel & Exploration',
    coverUrl: PlaceHolderImages.find(i => i.id === 'room-cover-5')?.imageUrl!,
    participants: [users[1], users[3], users[4]],
    messages: [],
  }
];

const games: Game[] = [
  { id: 'g1', title: 'Ludo Party', coverUrl: 'https://picsum.photos/seed/ludo/300/200', cost: 0, imageHint: 'ludo board' },
  { id: 'g2', title: 'Carrom Clash', coverUrl: 'https://picsum.photos/seed/carrom/300/200', cost: 0, imageHint: 'carrom board' },
  { id: 'g3', title: 'Chess Masters', coverUrl: 'https://picsum.photos/seed/chess/300/200', cost: 0, imageHint: 'chess game' },
  { id: 'g4', title: 'Bubble Shooter', coverUrl: 'https://picsum.photos/seed/bubble/300/200', cost: 0, imageHint: 'colorful bubbles' },
  { id: 'g5', title: 'Rummy Riches', coverUrl: 'https://picsum.photos/seed/rummy/300/200', cost: 100, imageHint: 'playing cards' },
  { id: 'g6', title: 'Poker Pro', coverUrl: 'https://picsum.photos/seed/poker/300/200', cost: 500, imageHint: 'poker chips' },
  { id: 'g7', title: 'Teen Patti Gold', coverUrl: 'https://picsum.photos/seed/teenpatti/300/200', cost: 200, imageHint: 'card game' },
  { id: 'g8', title: '8 Ball Pool', coverUrl: 'https://picsum.photos/seed/pool/300/200', cost: 50, imageHint: 'billiards table' },
];

const coinPackages: CoinPackage[] = [
  { id: 'cp1', amount: 100, price: 0.99, bonus: 10 },
  { id: 'cp2', amount: 500, price: 4.99, bonus: 75 },
  { id: 'cp3', amount: 1000, price: 9.99, bonus: 200 },
  { id: 'cp4', amount: 2500, price: 24.99, bonus: 625 },
  { id: 'cp5', amount: 5000, price: 49.99, bonus: 1500 },
  { id: 'cp6', amount: 10000, price: 99.99, bonus: 3500 },
];

export const getPopularRooms = (): Room[] => {
    return rooms.slice(0, 4);
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
  return coinPackages;
}
