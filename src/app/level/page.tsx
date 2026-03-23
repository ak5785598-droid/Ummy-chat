'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Star, Moon, Sun, Diamond, Shield, Crown } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Progress } from '@/components/ui/progress';
import { calculateLevelProgress, LEVEL_RANGES } from '@/lib/level-utils';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

const LevelBadge = ({ level, type, colorClass }: { level: number | string, type: string, colorClass: string }) => {
  const getIcon = () => {
    const iconClass = "h-2.5 w-2.5 fill-white text-white drop-shadow-sm";
    switch (type) {
      case 'star': return <Star className={iconClass} />;
      case 'moon': return <Moon className={iconClass} />;
      case 'sun': return <Sun className={iconClass} />;
      case 'diamond': return <Diamond className={iconClass} />;
      case 'shield': return <Shield className={iconClass} />;
      case 'crown-white': return <Crown className={iconClass} />;
      case 'crown-gold': return <Crown className={cn(iconClass, "text-yellow-200 fill-yellow-200")} />;
      case 'crown-ultimate': return <Crown className={cn(iconClass, "text-yellow-100 fill-yellow-100")} />;
      default: return <Star className={iconClass} />;
    }
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full shadow-md border border-white/30 relative overflow-hidden",
      colorClass
    )}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 pointer-events-none" />
      {getIcon()}
      <span className="text-[10px] font-black text-white leading-none drop-shadow-sm relative z-10">{level}</span>
    </div>
  );
};

const LevelEntryStrip = ({ type }: { type?: string }) => {
  if (!type) return <div className="h-5 w-32 bg-transparent" />;

  const gradients: Record<string, string> = {
    cyan: "from-[#00E5FF] via-[#2196F3] to-transparent",
    green: "from-[#4CAF50] via-[#81C784] to-transparent",
    orange: "from-[#FF9800] via-[#FFB74D] to-transparent",
    red: "from-[#F44336] via-[#E57373] to-transparent",
    pink: "from-[#E91E63] via-[#F06292] to-transparent",
    'gold-purple': "from-[#FFD700] via-[#BA68C8] to-transparent",
    ultimate: "from-[#FFD700] via-[#FFF176] to-[#FFD700] border border-yellow-200/50",
  };

  return (
    <div className={cn(
      "h-5 w-32 rounded-full bg-gradient-to-r shadow-lg relative overflow-hidden",
      gradients[type]
    )}>
       <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
       {type === 'ultimate' && (
         <div className="absolute left-1 top-1/2 -translate-y-1/2">
            <Crown className="h-2.5 w-2.5 text-yellow-700 fill-current" />
         </div>
       )}
    </div>
  );
};

export default function UserLevelPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);

  const stats = calculateLevelProgress(userProfile?.wallet?.totalSpent || 0);

  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-full bg-white font-headline pb-20 animate-in fade-in duration-700">
        <header className="p-6 pt-10 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight text-center flex-1 -ml-8">User level</h1>
        </header>

        <div className="p-6 space-y-10">
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
               <span className="text-sm font-black">Lv.{stats.currentLevel}</span>
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                  <GoldCoinIcon className="h-3 w-3 text-yellow-500" />
                  <span>{stats.remainingToLevelUp.toLocaleString()} to level up</span>
               </div>
               <span className="text-sm font-black">Lv.{stats.nextLevel}</span>
            </div>
            <Progress value={stats.progressPercent} className="h-3 bg-yellow-100 rounded-full [&>div]:bg-[#FFCC00]" />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-1 h-5 bg-[#FFCC00] rounded-full" />
               <h2 className="text-lg font-black uppercase tracking-tight">Level Description</h2>
            </div>
            <div className="space-y-4 text-sm font-body text-gray-600 leading-relaxed">
               <p>1. Upgrading experience will be gained through behaviors such as recharging and consuming on the platform</p>
               <p>2. The higher the level, the corresponding level will have different styles of identification. Your wealth level identification will be displayed in the room, and the identification will become cool as the level increases, highlighting your uniqueness</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-1 h-5 bg-[#FFCC00] rounded-full" />
               <h2 className="text-lg font-black uppercase tracking-tight">Level Icon</h2>
            </div>
            <div className="overflow-hidden border border-yellow-100 rounded-xl shadow-sm">
               <table className="w-full text-center border-collapse">
                  <thead className="bg-[#fff9e6]">
                     <tr className="border-b border-yellow-100">
                        <th className="py-4 px-2 text-[10px] font-black uppercase text-orange-800 leading-tight border-r border-yellow-100">Grade<br/>(Recharge coins / level)</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase text-orange-800 border-r border-yellow-100">Icon</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase text-orange-800">Entry Strip</th>
                     </tr>
                  </thead>
                  <tbody>
                     {LEVEL_RANGES.map((item, idx) => {
                       const startLevel = item.range.split('~')[0].replace('Lv.', '');
                       return (
                         <tr key={idx} className="border-b border-yellow-50 last:border-0 hover:bg-yellow-50/20 transition-colors">
                            <td className="py-4 px-2 border-r border-yellow-50">
                               <p className="text-xs font-black text-gray-800">{item.range}</p>
                               <p className="text-[10px] font-bold text-gray-400 italic">({item.cost})</p>
                            </td>
                            <td className="py-4 px-2 border-r border-yellow-50">
                               <LevelBadge level={startLevel} type={item.type} colorClass={item.color} />
                            </td>
                            <td className="py-4 px-2 flex justify-center items-center">
                               <LevelEntryStrip type={item.strip} />
                            </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
