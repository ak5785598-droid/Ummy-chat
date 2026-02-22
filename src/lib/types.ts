export type User = {
  id: string;
  name: string;
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
  details?: {
    age?: number;
    emotionalState?: string;
    occupation?: string;
    hometown?: string;
    personalitySignature?: string;
  };
  wallet?: {
    coins: number;
    diamonds: number;
  };
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: any;
};

export type RoomParticipant = {
  uid: string;
  name: string;
  avatarUrl: string;
  seatIndex: number; // 0 for sofa, 1-10 for seats
  isMuted: boolean;
  joinedAt: any;
};

export type Room = {
  id: string;
  slug: string;
  title: string;
  topic: string;
  category: 'Popular' | 'Game' | 'Chat' | 'Singing' | 'Battle';
  coverUrl: string;
  announcement?: string;
  ownerId: string;
  moderatorIds?: string[];
  lockedSeats?: number[];
  createdAt: any;
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
