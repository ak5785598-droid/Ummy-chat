export type User = {
  id: string;
  specialId: string; // Sequential numeric ID starting 1001
  name: string;
  username?: string;
  avatarUrl: string;
  bio?: string;
  isOnline?: boolean;
  coverUrl?: string;
  level?: {
    rich: number;
    charm: number;
  };
  frame?: 'CG' | 'Official' | 'Leader' | 'Seller' | 'None';
  tags?: string[];
  stats?: {
    sent?: number;
    followers?: number;
    fans?: number;
    totalGifts?: number;
  };
  wallet?: {
    coins: number;
    diamonds: number;
    totalSpent: number;
  };
  inventory?: {
    activeFrame?: string;
    activeBubble?: string;
    activeWave?: string;
    ownedItems: string[];
  };
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: any;
  type?: 'text' | 'gift' | 'entrance';
  giftId?: string;
  recipientName?: string;
};

export type RoomParticipant = {
  uid: string;
  name: string;
  avatarUrl: string;
  seatIndex: number;
  isMuted: boolean;
  isSilenced?: boolean; // Admin imposed silence
  joinedAt: any;
  activeFrame?: string;
  activeWave?: string;
};

export type Room = {
  id: string;
  roomNumber: string; // Sequential 4-digit ID starting 0001
  slug: string;
  title: string;
  topic: string;
  category: 'Popular' | 'Game' | 'Chat' | 'Singing';
  coverUrl: string;
  announcement?: string;
  ownerId: string;
  moderatorIds?: string[];
  lockedSeats?: number[];
  createdAt: any;
  stats?: {
    totalGifts: number;
  };
};

export type Gift = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  animationType: 'pulse' | 'bounce' | 'spin' | 'zoom';
};

export type Game = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  cost: number;
  imageHint: string;
};

export type CoinPackage = {
  id: string;
  amount: number;
  price: number;
  bonus?: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  coinReward: number;
  isCompleted: boolean;
  cta: {
      label: string;
      href: string;
  }
};

export type AdminLog = {
  id: string;
  adminId: string;
  adminName: string;
  targetId: string;
  action: string;
  details: any;
  createdAt: any;
};