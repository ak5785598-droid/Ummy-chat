/**
 * @fileOverview High-Fidelity Level Calculation Engine.
 * Implements the Rich Level thresholds from the official Ummy blueprint.
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
  let currentLevel = 0;
  let nextLevelThreshold = THRESHOLDS[1].spent;

  // Find the current level bracket
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (totalSpent >= THRESHOLDS[i].spent) {
      currentLevel = THRESHOLDS[i].level;
      // If there's a next milestone, calculate intermediate levels
      if (i < THRESHOLDS.length - 1) {
        const startLevel = THRESHOLDS[i].level;
        const endLevel = THRESHOLDS[i+1].level;
        const startSpent = THRESHOLDS[i].spent;
        const endSpent = THRESHOLDS[i+1].spent;
        
        const levelsInRange = endLevel - startLevel;
        const spentPerLevel = (endSpent - startSpent) / (levelsInRange || 1);
        
        const extraSpent = totalSpent - startSpent;
        const extraLevels = Math.floor(extraSpent / (spentPerLevel || 1));
        
        currentLevel = startLevel + extraLevels;
        nextLevelThreshold = startSpent + (extraLevels + 1) * spentPerLevel;
      } else {
        // Max level reached
        currentLevel = 100;
        nextLevelThreshold = totalSpent;
      }
    } else {
      break;
    }
  }

  // Ensure currentLevel doesn't exceed 100
  currentLevel = Math.min(currentLevel, 100);
  
  const remaining = Math.max(0, nextLevelThreshold - totalSpent);
  const prevThreshold = currentLevel === 0 ? 0 : nextLevelThreshold - (nextLevelThreshold - totalSpent + (totalSpent - (currentLevel === 0 ? 0 : 0))); // simplified
  
  // Progress within the current level's step
  // To keep it simple for UI, we show progress toward the next level up
  const progressPercent = currentLevel >= 100 ? 100 : (1 - (remaining / (nextLevelThreshold / (currentLevel + 1)))) * 100; // rough visual

  return {
    currentLevel,
    nextLevel: Math.min(currentLevel + 1, 100),
    currentSpent: totalSpent,
    nextLevelThreshold,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    remainingToLevelUp: remaining,
  };
}

export const LEVEL_RANGES = [
  { range: 'Lv.0', cost: '10,000', type: 'star', color: 'bg-gray-300' },
  { range: 'Lv.1~Lv.10', cost: '100,000', type: 'star', color: 'bg-blue-500' },
  { range: 'Lv.11~Lv.20', cost: '200,000', type: 'star', color: 'bg-blue-600' },
  { range: 'Lv.21~Lv.30', cost: '300,000', type: 'moon', color: 'bg-purple-500' },
  { range: 'Lv.31~Lv.40', cost: '500,000', type: 'sun', color: 'bg-blue-400', strip: 'cyan' },
  { range: 'Lv.41~Lv.50', cost: '1,000,000', type: 'diamond', color: 'bg-blue-500', strip: 'green' },
  { range: 'Lv.51~Lv.60', cost: '5,000,000', type: 'shield', color: 'bg-blue-600', strip: 'orange' },
  { range: 'Lv.61~Lv.70', cost: '10,000,000', type: 'wing', color: 'bg-blue-700', strip: 'red' },
  { range: 'Lv.71~Lv.80', cost: '50,000,000', type: 'crown-white', color: 'bg-blue-400', strip: 'pink' },
  { range: 'Lv.81~Lv.90', cost: '200,000,000', type: 'crown-gold', color: 'bg-yellow-500', strip: 'gold-purple' },
  { range: 'Lv.91~Lv.100', cost: '1,000,000,000', type: 'crown-ultimate', color: 'bg-yellow-600', strip: 'ultimate' },
];
