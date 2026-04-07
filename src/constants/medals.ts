import { LucideIcon } from 'lucide-react';

export interface MedalConfig {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
}

export const MEDAL_REGISTRY: Record<string, MedalConfig> = {
  // Placeholder medals
  'top-gainer': {
    id: 'top-gainer',
    name: 'Top Gainer',
    imageUrl: '/images/medals/top_gainer.png',
    description: 'Awarded for top gains in a week',
    tier: 'epic'
  },
  'royal-donator': {
    id: 'royal-donator',
    name: 'Royal Donator',
    imageUrl: '/images/medals/royal_donator.png',
    description: 'Top supporter of the community',
    tier: 'legendary'
  },
  'loyal-member': {
    id: 'loyal-member',
    name: 'Loyal Member',
    imageUrl: '/images/medals/loyal_member.png',
    description: 'Member for over 1 year',
    tier: 'rare'
  }
};
