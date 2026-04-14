export type User = {
 id: string;
 accountNumber: string; // Sequential numeric ID
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
  dailyFans?: number; 
  dailyGiftsReceived?: number;
  weeklyGiftsReceived?: number;
  monthlyGiftsReceived?: number;
  dailyGameWins?: number;
  weeklyGameWins?: number;
  monthlyGameWins?: number;
  friends?: number;
  following?: number;
 };
 wallet?: {
  coins: number;
  diamonds: number;
  totalSpent: number;
  dailySpent: number;
  weeklySpent: number;
  monthlySpent: number;
 };
 inventory?: {
  activeFrame?: string;
  activeTheme?: string;
  activeBubble?: string;
  activeWave?: string;
  ownedItems: string[];
  expiries?: Record<string, any>; // itemId -> Timestamp for individual expiry
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
 isAdmin?: boolean;
 idColor?: 'red' | 'blue' | 'purple' | 'none';
 isBudgetId?: boolean;
 activityPoints?: number; // Total EXP from staying in rooms/tasks
 charmPoints?: number; // Total EXP from receiving gifts
 svip?: number; // SVIP Level (1-10)
 medals?: string[]; // Array of medal IDs
};

export type Message = {
 id: string;
 text: string;
 senderId: string;
 senderName: string;
 senderAvatar: string;
 senderBubble?: string | null;
 timestamp: any;
 type?: 'text' | 'gift' | 'entrance' | 'leave' | 'emoji' | 'lucky-rain' | 'lucky-bag';
 giftId?: string;
 recipientName?: string;
 luckyWin?: { multiplier: number; winAmount: number } | null;
 bagId?: string;
 amount?: number;
 imageUrl?: string | null;
 content?: string; // Standardizing field names
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
 imageUrl?: string | null;
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
 activeBubble?: string;
 activeEmoji?: string | null;
 sessionGifts?: number; // REAL-TIME CALCULATOR SYNC
 accountNumber?: string;
 lastSeen?: any;
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
 currentMusicTitle?: string | null;
 currentMusicId?: string | null;
 currentMusicOwnerId?: string | null;
 currentMusicType?: 'youtube' | 'upload' | null;
 musicUpdatedAt?: any;
 musicUpdatedBy?: string | null;
 musicCurrentTime?: number;
 musicStartedAt?: any; // Precise server timestamp for virtual clock
 musicStartOffset?: number; // Starting offset for playback in seconds
 isMusicPlaying?: boolean; // Music play/pause state for sync
 maxActiveMics?: number;
 isSuperMic?: boolean;
 stats?: {
  totalGifts: number;
  dailyGifts: number;
  weeklyGifts: number;
  monthlyGifts: number;
  lastWealthResetDate?: any;
 };
 levelPoints?: number; // Total room EXP from activity/gifting
 rocket?: {
  progress: number;
  target: number;
  countdownUntil: any | null; // Timestamp for event launch
  open?: boolean;
  lastLaunchTime?: any;
  lastResetDate?: string;
  level?: number;
 };
 language?: string;
 tags?: string[];
 isVoiceMuted?: boolean;
 mutedSeats?: number[];
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
}

export type PkBattle = {
  id: string;
  room1: Room & { participants: RoomParticipant[] };
  room2: Room & { participants: RoomParticipant[] };
  score1: number;
  score2: number;
  startTime: any;
  duration: number;
};

export type LudoPlayer = {
  uid: string;
  username: string;
  avatarUrl: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  isReady: boolean;
  isActive: boolean;
};

export type LudoPiece = {
  id: string;
  ownerUid: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  position: number; // 0: Home Base, 1-52: Path, 53-57: Path to Home, 58/100: Finished
};

export type LudoGameState = {
  id: string;
  roomId: string;
  players: LudoPlayer[];
  pieces: LudoPiece[];
  turn: string; // UID of current player
  dice: number | null;
  diceRolled: boolean;
  status: 'lobby' | 'playing' | 'ended';
  winner?: string;
  updatedAt: any;
};

export type CarromPiece = {
  id: string;
  type: 'white' | 'black' | 'queen' | 'striker';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isPocketed: boolean;
};

export type CarromPlayer = {
  uid: string;
  username: string;
  avatarUrl: string;
  score: number;
  isReady: boolean;
};

export type CarromGameState = {
  id: string;
  roomId: string;
  players: CarromPlayer[]; // Support up to 4
  turn: string; // UID of current player
  strikerPos: number; // 0-100 for side slider
  pieces: CarromPiece[];
  status: 'loading' | 'mode_select' | 'lobby' | 'playing' | 'ended';
  mode: 'freestyle' | 'professional' | 'none';
  winner?: string;
  updatedAt: any;
};

export type ChessPiece = {
  id: string;
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k'; // pawn, rook, knight, bishop, queen, king
  color: 'w' | 'b';
  position: string; // e.g. 'e2'
};

export type ChessGameState = {
  id: string;
  roomId: string;
  white: { uid: string; username: string; avatarUrl: string } | null;
  black: { uid: string; username: string; avatarUrl: string } | null;
  turn: 'w' | 'b';
  fen: string; // Standard Chess algebraic notation
  status: 'lobby' | 'playing' | 'checkmate' | 'draw';
  updatedAt: any;
};
