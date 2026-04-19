export interface VehicleConfig {
  id: string;
  name: string;
  icon: string;
  tier: 'elite' | 'luxury' | 'legendary';
  description: string;
  gradient?: string;
}

export const VEHICLE_REGISTRY: Record<string, VehicleConfig> = {
  'limo': {
    id: 'limo',
    name: 'Executive Limo',
    icon: '🚘',
    tier: 'elite',
    description: 'Arrive in classic corporate style.',
    gradient: 'from-slate-700 to-slate-900'
  },
  'sport-car': {
    id: 'sport-car',
    name: 'Pulse Racer',
    icon: '🏎️',
    tier: 'luxury',
    description: 'High-speed aerodynamic entrance.',
    gradient: 'from-red-500 to-red-700'
  },
  'private-jet': {
    id: 'private-jet',
    name: 'Sky Sovereign',
    icon: '🛩️',
    tier: 'legendary',
    description: 'Elite aerial arrival.',
    gradient: 'from-blue-500 to-blue-700'
  },
  'dragon': {
    id: 'dragon',
    name: 'Ancient Dragon',
    icon: '🐉',
    tier: 'legendary',
    description: 'Mythical beast of the ancients.',
    gradient: 'from-emerald-600 to-emerald-800'
  },
  'phoenix': {
    id: 'phoenix',
    name: 'Eternal Phoenix',
    icon: '🐦',
    tier: 'legendary',
    description: 'Rising from the sparks of fire.',
    gradient: 'from-orange-500 to-orange-700'
  }
};
