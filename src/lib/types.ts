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
  user: User;
  timestamp: string;
};

export type Room = {
  id: string;
  slug: string;
  title: string;
  topic: string;
  category: 'Popular' | 'Game' | 'Chat' | 'Singing' | 'Battle';
  coverUrl: string;
  announcement?: string;
  background?: string;
  isLocked?: boolean;
  ownerId?: string;
  moderatorIds?: string[];
  participants: User[];
  messages: Message[];
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

export type Contribution = {
    user: User;
    amount: number;
}

export type PkBattle = {
  id: string;
  room1: Room;
  room2: Room;
  score1: number;
  score2: number;
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
