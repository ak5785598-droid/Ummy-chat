import { 
  Mic, 
  UserPlus, 
  Gift, 
  Users, 
  Share2, 
  UserCheck,
  TrendingUp,
  Clock,
  UserRoundPlus
} from 'lucide-react';

export interface RoomTask {
  id: string;
  title: string;
  target: number;
  reward: number;
  category: 'mic' | 'invite' | 'gift' | 'traffic' | 'follow' | 'share';
  unit?: string;
}

export const ROOM_TASKS: RoomTask[] = [
  { id: 'mic_10', title: 'On mic for 10 Minutes', target: 10, reward: 2500, category: 'mic', unit: 'min' },
  { id: 'mic_30', title: 'On mic for 30 Minutes', target: 30, reward: 10000, category: 'mic', unit: 'min' },
  { id: 'mic_60', title: 'On mic for 60 Minute', target: 60, reward: 25000, category: 'mic', unit: 'min' },
  { id: 'invite_1', title: 'Successfully invited 1 user on mic', target: 1, reward: 2500, category: 'invite' },
  { id: 'invite_10', title: 'Successfully Invited 10 user on mic', target: 10, reward: 25000, category: 'invite' },
  { id: 'invite_new_3', title: 'Successfully invited 3 New user on mic', target: 3, reward: 2000, category: 'invite' },
  { id: 'gift_once', title: 'Send gift once', target: 1, reward: 500, category: 'gift' },
  { id: 'traffic_consecutive', title: 'more then 5 user enter Your room for 2 Consecutive days', target: 2, reward: 20000, category: 'traffic', unit: 'days' },
  { id: 'sim_mic_1', title: '3 User on mic at the same time for 1 minutes', target: 1, reward: 5000, category: 'mic', unit: 'min' },
  { id: 'sim_mic_10', title: '3 user on mic at the same time for 10 minutes', target: 10, reward: 10000, category: 'mic', unit: 'min' },
  { id: 'sim_mic_new_5', title: '3 New user on mice at the same time for 5 minutes', target: 5, reward: 10000, category: 'mic', unit: 'min' },
  { id: 'new_user_gift_3', title: '3 New user send gifts in the room', target: 3, reward: 5000, category: 'gift' },
  { id: 'follow_1', title: '1 New follower', target: 1, reward: 1000, category: 'follow' },
  { id: 'follow_10', title: '10 New follower', target: 10, reward: 5000, category: 'follow' },
  { id: 'follow_new_3', title: '3 New follower From new user', target: 3, reward: 2500, category: 'follow' },
  { id: 'share_whatsapp', title: 'Successfully Shared room link to whatsApp', target: 1, reward: 5000, category: 'share' },
  { id: 'entry_10', title: '10 User enter the room', target: 10, reward: 10000, category: 'traffic' },
  { id: 'entry_3', title: '3 User enter the room', target: 3, reward: 2500, category: 'traffic' }
];
