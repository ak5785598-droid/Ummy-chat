
export type User = {
  id: string;
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
  specialId?: string;
  stats?: {
    sent?: number;
    followers?: number;
    fans?: number;
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
  type?: 'text' | 'gift';
  giftId?: string;
};

export type RoomParticipant = {
  uid: string;
  name: string;
  avatarUrl: string;
  seatIndex: number; // 0 for audience, 1 for host, 2-13 for seats
  isMuted: boolean;
  joinedAt: any;
  activeFrame?: string;
};

export type Room = {
  id: string;
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
