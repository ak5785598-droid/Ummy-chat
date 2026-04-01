/**
 * @fileOverview High-Fidelity Level Calculation Engine.
 * Implements Rich and Charm Level thresholds with updated coin values.
 */

export interface LevelProgress {
  currentLevel: number;
  nextLevel: number;
  currentSpent: number;
  nextLevelThreshold: number;
  progressPercent: number;
  remainingToLevelUp: number;
}

// --- NEW UPDATED THRESHOLDS ---

const RICH_THRESHOLDS = [
  { level: 0, spent: 0 },
  { level: 1, spent: 20000 },             // 20K
  { level: 10, spent: 350000000 },        // 350M
  { level: 20, spent: 10000000000 },      // 10000M
  { level: 30, spent: 100000000000 },     // 100000M
  { level: 40, spent: 2000000000000 },    // 2000000M
  { level: 50, spent: 25000000000000 },   // 25000000M
  { level: 60, spent: 350000500000000 },  // 350000500M
  { level: 70, spent: 5000002500000000 }, // 5000002500M
  { level: 80, spent: 70000000000000000 },// 70000000000M
  { level: 90, spent: 850000000000000000 },// 850000000000M
  { level: 100, spent: 1000000000000000000 } // 1000000000000M
];

const CHARM_THRESHOLDS = [
  { level: 0, spent: 0 },
  { level: 1, spent: 30000 },             // 30K
  { level: 10, spent: 450000000 },        // 450M
  { level: 20, spent: 10200000000 },      // 10200M
  { level: 30, spent: 100520000000 },     // 100520M
  { level: 40, spent: 20050999000000 },   // 20050999M
  { level: 50, spent: 259000000000000 },  // 259000000M
  { level: 60, spent: 3500005500000000 }, // 3500005500M
  { level: 70, spent: 50000020500000000 },// 50000020500M
  { level: 71, spent: 70000005000000000 },// 70000005000M
  { level: 81, spent: 850000000600000000 },// 850000000600M
  { level: 91, spent: 1000000450000000000 } // 1000000450000M
];

/**
 * Calculates level progress based on total coins.
 * @param totalSpent - Total coins consumed
 * @param type - Either 'rich' or 'charm'
 */
export function calculateLevelProgress(totalSpent: number = 0, type: 'rich' | 'charm' = 'rich'): LevelProgress {
  const THRESHOLDS = type === 'rich' ? RICH_THRESHOLDS : CHARM_THRESHOLDS;
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

// --- DISPLAY RANGES FOR UI ---

export const RICH_LEVEL_RANGES = [
  { range: 'Lv.0', cost: '20K', type: 'star', color: 'bg-[#cbd5e1]' },
  { range: 'Lv.1~Lv.10', cost: '350M', type: 'star', color: 'bg-[#3b82f6]' },
  { range: 'Lv.11~Lv.20', cost: '10000M', type: 'star', color: 'bg-[#2563eb]' },
  { range: 'Lv.21~Lv.30', cost: '100000M', type: 'moon', color: 'bg-[#8b5cf6]' },
  { range: 'Lv.31~Lv.40', cost: '2000000M', type: 'sun', color: 'bg-[#3b82f6]', strip: 'cyan' },
  { range: 'Lv.41~Lv.50', cost: '25000000M', type: 'diamond', color: 'bg-[#3b82f6]', strip: 'green' },
  { range: 'Lv.51~Lv.60', cost: '350000500M', type: 'diamond', color: 'bg-[#2563eb]', strip: 'orange' },
  { range: 'Lv.61~Lv.70', cost: '5000002500M', type: 'crown-white', color: 'bg-[#3b82f6]', strip: 'red' },
  { range: 'Lv.71~Lv.80', cost: '70000000000M', type: 'crown-white', color: 'bg-[#2563eb]', strip: 'pink' },
  { range: 'Lv.81~Lv.90', cost: '850000000000M', type: 'crown-gold', color: 'bg-[#f59e0b]', strip: 'gold-purple' },
  { range: 'Lv.91~Lv.100', cost: '1000000000000M', type: 'crown-ultimate', color: 'bg-[#d97706]', strip: 'ultimate' },
];

export const CHARM_LEVEL_RANGES = [
  { range: 'Lv.0', cost: '30K', type: 'star', color: 'bg-[#cbd5e1]' },
  { range: 'Lv.1~Lv.10', cost: '450M', type: 'star', color: 'bg-[#3b82f6]' },
  { range: 'Lv.11~Lv.20', cost: '10200M', type: 'star', color: 'bg-[#2563eb]' },
  { range: 'Lv.21~Lv.30', cost: '100520M', type: 'moon', color: 'bg-[#8b5cf6]' },
  { range: 'Lv.31~Lv.40', cost: '20050999M', type: 'sun', color: 'bg-[#3b82f6]', strip: 'cyan' },
  { range: 'Lv.41~Lv.50', cost: '259000000M', type: 'diamond', color: 'bg-[#3b82f6]', strip: 'green' },
  { range: 'Lv.51~Lv.60', cost: '3500005500M', type: 'diamond', color: 'bg-[#2563eb]', strip: 'orange' },
  { range: 'Lv.61~Lv.70', cost: '50000020500M', type: 'crown-white', color: 'bg-[#3b82f6]', strip: 'red' },
  { range: 'Lv.71~Lv.80', cost: '70000005000M', type: 'crown-white', color: 'bg-[#2563eb]', strip: 'pink' },
  { range: 'Lv.81~Lv.90', cost: '850000000600M', type: 'crown-gold', color: 'bg-[#f59e0b]', strip: 'gold-purple' },
  { range: 'Lv.91~Lv.100', cost: '1000000450000M', type: 'crown-ultimate', color: 'bg-[#d97706]', strip: 'ultimate' },
];
