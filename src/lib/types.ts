export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  isOnline?: boolean;
  coverUrl?: string;
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
  coverUrl: string;
  participants: User[];
  messages: Message[];
};

export type Game = {
  id: string;
  title: string;
  coverUrl: string;
  cost: number; // 0 for free games
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
