'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Star, Moon, Sun, Diamond, Shield, Crown } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Progress } from '@/components/ui/progress';
import { calculateLevelProgress, LEVEL_RANGES } from '@/lib/level-utils';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * LevelBadge Component.
 * High-fidelity representation of the wealth level identification icons.
 */
const LevelBadge = ({ level, type, color }: { level: number | string, type: string, color: string }) => {
  const getIcon = () => {
    switch (type) {
      case 'star': return <Star className="h-2.5 w-2.5 fill-white text-white" />;
      case 'moon': return <Moon className="h-2.5 w-2.5 fill-white text-white" />;
      case 'sun': return <Sun className="h-2.5 w-2.5 fill-white text-white" />;
      case 'diamond': return <Diamond className="h-2.5 w-2.5 fill-white text-white" />;
      case 'shield': return <Shield className="h-2.5 w-2.5 fill-white text-white" />;
      case 'wing': return <Crown className="h-2.5 w-2.5 fill-white text-white" />;
      default: return <Crown className="h-2.5 w-2.5 fill-white text-white" />;
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full shadow-sm border border-white/20", color)}>
      {getIcon()}
      <span className="text-[10px] font-black text-white leading-none">{level}</span>
    </div>
  );
};

/**
 * LevelEntryStrip Component.
 * Simulates the colorful "Entry Strip" effects shown in the blueprint.
 */
const LevelEntryStrip = ({ type }: { type?: string }) => {
  if (!type) return <div className="h-6 w-32 bg-transparent" />;

  const gradients: Record<string, string> = {
    cyan: "from-cyan-300 via-blue-400 to-transparent",
    green: "from-green-300 via-emerald-400 to-transparent",
    orange: "from-yellow-300 via-orange-400 to-transparent",
    red: "from-orange-400 via-red-500 to-transparent",
    pink: "from-pink-300 via-purple-400 to-transparent",
    'gold-purple': "from-yellow-200 via-yellow-500 to-purple-600",
    ultimate: "from-amber-200 via-yellow-500 to-amber-200 border-2 border-yellow-400",
  };

  return (
    <div className={cn(
      "h-6 w-32 rounded-full bg-gradient-to-r shadow-inner relative overflow-hidden",
      gradients[type]
    )}>
       <div className="absolute inset-0 bg-white/20 animate-shine" />
       {type === 'ultimate' && (
         <div className="absolute -left-1 top-1/2 -translate-y-1/2">
            <Crown className="h-3 w-3 text-yellow-600 fill-current" />
         </div>
       )}
    </div>
  );
};

/**
 * User Level Page.
 * High-fidelity implementation of the level description and thresholds.
 */
export default function UserLevelPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);

  const stats = calculateLevelProgress(userProfile?.wallet?.totalSpent || 0);

  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-full bg-white font-headline pb-20 animate-in fade-in duration-700">
        {/* Header */}
        <header className="p-6 pt-10 flex items-center justify-between border-b border-gray-50">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight text-center flex-1 -ml-8">User level</h1>
        </header>

        <div className="p-6 space-y-10">
          {/* Progress Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
               <span className="text-sm font-black">Lv.{stats.currentLevel}</span>
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                  <GoldCoinIcon className="h-3 w-3" />
                  <span>{stats.remainingToLevelUp.toLocaleString()} to level up</span>
               </div>
               <span className="text-sm font-black">Lv.{stats.nextLevel}</span>
            </div>
            <Progress value={stats.progressPercent} className="h-3 bg-yellow-50 rounded-full" />
          </section>

          {/* Level Description */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
               <h2 className="text-lg font-black uppercase tracking-tight">Level Description</h2>
            </div>
            <div className="space-y-4 text-sm font-body italic text-gray-600 leading-relaxed pl-3">
               <p><span className="font-black text-gray-900 mr-2">1.</span>Upgrading experience will be gained through behaviors such as recharging and consuming on the platform</p>
               <p><span className="font-black text-gray-900 mr-2">2.</span>The higher the level, the corresponding level will have different styles of identification. Your wealth level identification will be displayed in the room, and the identification will become cool as the level increases, highlighting your uniqueness</p>
            </div>
          </section>

          {/* Level Icon Table */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
               <h2 className="text-lg font-black uppercase tracking-tight">Level Icon</h2>
            </div>
            
            <div className="overflow-hidden border border-yellow-100 rounded-[1.5rem] shadow-sm">
               <table className="w-full text-center border-collapse">
                  <thead className="bg-yellow-50/50">
                     <tr className="border-b border-yellow-100">
                        <th className="py-4 text-[10px] font-black uppercase text-orange-800 leading-tight border-r border-yellow-100">Grade<br/>(Recharge coins / level)</th>
                        <th className="py-4 text-[10px] font-black uppercase text-orange-800 border-r border-yellow-100">Icon</th>
                        <th className="py-4 text-[10px] font-black uppercase text-orange-800">Entry Strip</th>
                     </tr>
                  </thead>
                  <tbody>
                     {LEVEL_RANGES.map((item, idx) => (
                       <tr key={idx} className="border-b border-yellow-50 last:border-0 hover:bg-yellow-50/20 transition-colors">
                          <td className="py-4 px-2 border-r border-yellow-50">
                             <p className="text-xs font-black text-gray-800">{item.range}</p>
                             <p className="text-[10px] font-bold text-gray-400 italic">({item.cost})</p>
                          </td>
                          <td className="py-4 px-2 border-r border-yellow-50">
                             <LevelBadge level={item.range.split('~')[0].replace('Lv.', '')} type={item.type} color={item.color} />
                          </td>
                          <td className="py-4 px-2 flex justify-center items-center">
                             <LevelEntryStrip type={item.strip} />
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
