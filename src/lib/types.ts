export type User = {
  id: string;
  specialId: string | null; // Sequential numeric ID manually assigned by Admin
  accountNumber: string; // Automatic 8-digit unique signature
  specialIdColor?: string; // red or blue
  name: string;
  username?: string;
  avatarUrl: string;
  bio?: string;
  isOnline?: boolean;
  coverUrl?: string;
  gender?: 'Male' | 'Female' | null;
  country?: string | null;
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
    dailyGameWins?: number;
    friends?: number;
    following?: number;
  };
  wallet?: {
    coins: number;
    diamonds: number;
    totalSpent: number;
    dailySpent: number;
  };
  inventory?: {
    activeFrame?: string;
    activeFrameExpiresAt?: any; // Timestamp for 7-day expiration sync
    activeBubble?: string;
    activeWave?: string;
    ownedItems: string[];
  };
  banStatus?: {
    isBanned: boolean;
    bannedUntil: any;
    reason: string;
  };
  createdAt?: any;
  updatedAt?: any;
  lastSignInAt?: any;
  currentRoomId?: string | null;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: any;
  type?: 'text' | 'gift' | 'entrance' | 'leave' | 'emoji' | 'lucky-rain' | 'lucky-bag';
  giftId?: string;
  recipientName?: string;
  luckyWin?: { multiplier: number; winAmount: number } | null;
  bagId?: string;
  amount?: number;
};

export type PrivateChat = {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastSenderId: string;
  updatedAt: any;
};

export type PrivateMessage = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
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
  activeEmoji?: string | null;
  sessionGifts?: number; // REAL-TIME CALCULATOR SYNC
};

export type Room = {
  id: string;
  roomNumber: string; // Sequential 4-digit ID starting 0001
  slug: string;
  title: string;
  topic: string;
  category: 'Popular' | 'Game' | 'Chat' | 'Singing';
  coverUrl: string;
  backgroundUrl?: string;
  roomThemeId?: string;
  announcement?: string;
  password?: string;
  ownerId: string;
  moderatorIds?: string[];
  lockedSeats?: number[];
  createdAt: any;
  participantCount?: number;
  isChatMuted?: boolean;
  isCalculatorActive?: boolean; // 🔥 CALCULATOR TOGGLE
  currentMusicUrl?: string | null;
  maxActiveMics?: number;
  isSuperMic?: boolean;
  stats?: {
    totalGifts: number;
    dailyGifts: number;
  };
};

export type Game = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  backgroundUrl?: string;
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
