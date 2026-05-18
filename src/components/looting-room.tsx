"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Clock, Gift, Coins, Badge, Palette, Sparkles } from "lucide-react";

interface LootReward {
  id: string;
  name: string;
  type: "coins" | "frame" | "badge" | "special" | "theme";
  rarity: "common" | "rare" | "epic" | "legendary";
  value: number;
  icon: string;
}

interface LootingItem {
  id: string;
  reward: LootReward;
  x: number;
  y: number;
  collected: boolean;
}

interface LootingRoomProps {
  active: boolean;
  rewards: LootReward[];
  timeRemaining: number;
  onCollect: (item: LootingItem) => void;
  onClose: () => void;
  collectedItems: LootingItem[];
}

const rarityColors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  common: {
    bg: "bg-slate-800/80",
    border: "border-slate-500/50",
    glow: "shadow-slate-500/20",
    text: "text-slate-300",
  },
  rare: {
    bg: "bg-blue-900/80",
    border: "border-blue-500/50",
    glow: "shadow-blue-500/30",
    text: "text-blue-300",
  },
  epic: {
    bg: "bg-purple-900/80",
    border: "border-purple-500/50",
    glow: "shadow-purple-500/30",
    text: "text-purple-300",
  },
  legendary: {
    bg: "bg-yellow-900/80",
    border: "border-yellow-500/50",
    glow: "shadow-yellow-500/40",
    text: "text-yellow-300",
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  coins: <Coins className="h-5 w-5" />,
  frame: <Badge className="h-5 w-5" />,
  badge: <Sparkles className="h-5 w-5" />,
  special: <Gift className="h-5 w-5" />,
  theme: <Palette className="h-5 w-5" />,
};

export function LootingRoom({
  active,
  rewards,
  timeRemaining,
  onCollect,
  onClose,
  collectedItems,
}: LootingRoomProps) {
  const [lootItems, setLootItems] = useState<LootingItem[]>([]);

  const generateLootItems = useCallback(() => {
    const items: LootingItem[] = [];
    const itemCount = Math.min(rewards.length * 3, 20);

    for (let i = 0; i < itemCount; i++) {
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      items.push({
        id: `loot-${Date.now()}-${i}`,
        reward,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        collected: false,
      });
    }

    return items;
  }, [rewards]);

  useEffect(() => {
    if (active && lootItems.length === 0) {
      setLootItems(generateLootItems());
    }
  }, [active, lootItems.length, generateLootItems]);

  const handleCollect = (item: LootingItem) => {
    if (item.collected) return;

    setLootItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, collected: true } : i))
    );
    onCollect(item);
  };

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-slate-950/95 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-bold text-xl">{timeRemaining}s</span>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2">
              <span className="text-purple-300 text-sm font-medium">
                {collectedItems.length} collected
              </span>
            </div>
          </div>
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Loot Items */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {lootItems.map((item) => {
            const colors = rarityColors[item.reward.rarity];

            return (
              <motion.div
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: item.collected ? 0 : 1,
                  opacity: item.collected ? 0 : 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: "absolute",
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                }}
                className="cursor-pointer"
                onClick={() => handleCollect(item)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl border-2 flex items-center justify-center shadow-lg transition-all",
                    colors.bg,
                    colors.border,
                    colors.glow
                  )}
                >
                  <div className={cn("text-white", colors.text)}>
                    {typeIcons[item.reward.type]}
                  </div>
                </div>
                <div className="mt-1 text-center">
                  <span className={cn("text-[10px] font-bold uppercase", colors.text)}>
                    {item.reward.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Collection Log */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {collectedItems.map((item, idx) => {
              const colors = rarityColors[item.reward.rarity];
              return (
                <motion.div
                  key={`${item.id}-${idx}`}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className={cn(
                    "shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center",
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="text-white">{typeIcons[item.reward.type]}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
