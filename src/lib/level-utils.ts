/**
 * @fileOverview High-Fidelity Level Calculation Engine.
 * Implements the Rich Level thresholds from the official Ummy blueprint.
 * Hardened against division by zero and NaN results.
 */

export interface LevelProgress {
  currentLevel: number;
  nextLevel: number;
  currentSpent: number;
  nextLevelThreshold: number;
  progressPercent: number;
  remainingToLevelUp: number;
}

const THRESHOLDS = [
  { level: 0, spent: 0 },
  { level: 1, spent: 10000 },
  { level: 10, spent: 100000 },
  { level: 20, spent: 200000 },
  { level: 30, spent: 300000 },
  { level: 40, spent: 500000 },
  { level: 50, spent: 1000000 },
  { level: 60, spent: 5000000 },
  { level: 70, spent: 10000000 },
  { level: 80, spent: 50000000 },
  { level: 90, spent: 200000000 },
  { level: 100, spent: 1000000000 },
];

/**
 * Calculates the current level and progress metrics based on total coins spent.
 */
export function calculateLevelProgress(totalSpent: number = 0): LevelProgress {
  // Input sanitation
  const spent = isNaN(totalSpent) ? 0 : Math.max(0, totalSpent);
  
  let currentLevel = 0;
  let nextLevelThreshold = THRESHOLDS[1].spent;

  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (spent >= THRESHOLDS[i].spent) {
      currentLevel = THRESHOLDS[i].level;
      if (i < THRESHOLDS.length - 1) {
        const startLevel = THRESHOLDS[i].level;
        const endLevel = THRESHOLDS[i+1].level;
        const startSpent = THRESHOLDS[i].spent;
        const endSpent = THRESHOLDS[i+1].spent;
        
        const levelsInRange = endLevel - startLevel;
        const spentPerLevel = (endSpent - startSpent) / (levelsInRange || 1);
        
        const extraSpent = spent - startSpent;
        const extraLevels = Math.floor(extraSpent / (spentPerLevel || 1));
        
        currentLevel = startLevel + extraLevels;
        nextLevelThreshold = startSpent + (extraLevels + 1) * spentPerLevel;
      } else {
        currentLevel = 100;
        nextLevelThreshold = spent;
      }
    } else {
      break;
    }
  }

  currentLevel = Math.min(currentLevel, 100);
  const remaining = Math.max(0, nextLevelThreshold - spent);
  
  // High-fidelity progress sync
  const currentLevelBaseSpent = THRESHOLDS.find(t => t.level <= currentLevel && t.level + 10 > currentLevel)?.spent || 0;
  const rangeSpent = Math.max(1, nextLevelThreshold - currentLevelBaseSpent);
  const progressPercent = currentLevel >= 100 ? 100 : (1 - (remaining / rangeSpent)) * 100;

  return {
    currentLevel,
    nextLevel: Math.min(currentLevel + 1, 100),
    currentSpent: spent,
    nextLevelThreshold,
    progressPercent: isNaN(progressPercent) ? 0 : Math.min(100, Math.max(0, progressPercent)),
    remainingToLevelUp: remaining,
  };
}

export const LEVEL_RANGES = [
  { range: 'Lv.0', cost: '10,000', type: 'star', color: 'bg-[#cbd5e1]' },
  { range: 'Lv.1~Lv.10', cost: '100,000', type: 'star', color: 'bg-[#3b82f6]' },
  { range: 'Lv.11~Lv.20', cost: '200,000', type: 'star', color: 'bg-[#2563eb]' },
  { range: 'Lv.21~Lv.30', cost: '300,000', type: 'moon', color: 'bg-[#8b5cf6]' },
  { range: 'Lv.31~Lv.40', cost: '500,000', type: 'sun', color: 'bg-[#3b82f6]', strip: 'cyan' },
  { range: 'Lv.41~Lv.50', cost: '1,000,000', type: 'diamond', color: 'bg-[#3b82f6]', strip: 'green' },
  { range: 'Lv.51~Lv.60', cost: '5,000,000', type: 'diamond', color: 'bg-[#2563eb]', strip: 'orange' },
  { range: 'Lv.61~Lv.70', cost: '10,000,000', type: 'crown-white', color: 'bg-[#3b82f6]', strip: 'red' },
  { range: 'Lv.71~Lv.80', cost: '50,000,000', type: 'crown-white', color: 'bg-[#2563eb]', strip: 'pink' },
  { range: 'Lv.81~Lv.90', cost: '200,000,000', type: 'crown-gold', color: 'bg-[#f59e0b]', strip: 'gold-purple' },
  { range: 'Lv.91~Lv.100', cost: '1,000,000,000', type: 'crown-ultimate', color: 'bg-[#d97706]', strip: 'ultimate' },
];
