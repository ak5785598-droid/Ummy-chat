import type { User, Room, Message } from './types';
import { PlaceHolderImages } from './placeholder-images';

const users: User[] = [
  { id: 'u1', name: 'Alina', avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-1')?.imageUrl!, isOnline: true, bio: 'Just vibing and connecting with new people! Music and art lover.' },
  { id: 'u2', name: 'Ben', avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-2')?.imageUrl!, isOnline: true },
  { id: 'u3', name: 'Chloe', avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-3')?.imageUrl!, isOnline: false },
  { id: 'u4', name: 'David', avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-4')?.imageUrl!, isOnline: true },
  { id: 'u5', name: 'Eva', avatarUrl: PlaceHolderImages.find(i => i.id === 'user-avatar-5')?.imageUrl!, isOnline: false },
  { id: 'u6', name: 'Frank', avatarUrl: 'https://picsum.photos/seed/user6/200/200', isOnline: true },
  { id: 'u7', name: 'Grace', avatarUrl: 'https://picsum.photos/seed/user7/200/200', isOnline: false },
  { id: 'u8', name: 'Henry', avatarUrl: 'https://picsum.photos/seed/user8/200/200', isOnline: true },
  { id: 'u9', name: 'Ivy', avatarUrl: 'https://picsum.photos/seed/user9/200/200', isOnline: true },
  { id: 'u10', name: 'Jack', avatarUrl: 'https://picsum.photos/seed/user10/200/200', isOnline: false },
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

export const getFriends = (): User[] => {
    return users.slice(1, 4);
}
