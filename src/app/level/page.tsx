'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, HelpCircle, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { calculateLevelProgress } from '@/lib/level-utils';
import { collection, query, orderBy } from 'firebase/firestore';

export default function UserLevelPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile } = useUserProfile(user?.uid);
  
  const [showRules, setShowRules] = useState(false);

  const stats = calculateLevelProgress(userProfile?.wallet?.totalSpent || 0);

  const levelsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "levels"), orderBy("updatedAt", "desc"));
  }, [firestore]);
  const { data: levels } = useCollection(levelsQuery);

  return (
    <AppLayout>
      <div className="relative min-h-screen bg-black font-sans pb-20 overflow-hidden text-white">
        
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-purple-800/50 via-purple-900/20 to-transparent pointer-events-none blur-xl" />

        <header className="relative z-10 p-6 pt-safe flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full transition-colors active:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-widest text-center flex-1 -ml-8">
            Levels
          </h1>
        </header>

        <div className="relative z-10 p-6 space-y-8">
          
          <div className="bg-[#005f73]/40 backdrop-blur-md border border-[#0a9396]/40 shadow-[0_0_20px_rgba(10,147,150,0.15)] rounded-2xl p-5">
            
            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-full bg-gray-700/50 overflow-hidden flex items-center justify-center border border-white/20">
                {userProfile && 'photoURL' in userProfile && userProfile.photoURL ? (
                  <img src={userProfile.photoURL as string} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="text-lg font-semibold tracking-wide text-white">
                {userProfile && 'name' in userProfile ? (userProfile.name as string) : 'Username'}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.progressPercent}%` }} 
                />
              </div>
              <span className="text-sm font-bold text-cyan-300 whitespace-nowrap">
                Lv.{stats.currentLevel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300 tracking-wide">
                Need {stats.remainingToLevelUp.toLocaleString()} Exp For Lv.{stats.nextLevel}
              </span>
              <button 
                onClick={() => setShowRules(true)} 
                className="p-1 rounded-full active:scale-95 transition-transform"
              >
                <HelpCircle className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-wider text-gray-200">Budget</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {levels && levels.length > 0 ? (
                levels.map((level: any, idx: number) => (
                  <div 
                    key={level.id || idx} 
                    className="relative h-24 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex flex-col items-start overflow-hidden"
                  >
                    {level.imageUrl && (
                      <img src={level.imageUrl} alt={level.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    )}
                    <span className="text-[10px] font-semibold text-gray-400 tracking-wider relative z-10">
                      {level.range || `Lv.${idx}`}
                    </span>
                    {level.budget && (
                      <span className="text-[9px] font-bold text-cyan-300 relative z-10 mt-1">
                        {level.budget}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                [
                  'Lv.0 - Lv.10',
                  'Lv.20 - Lv.35',
                  'Lv.40 - Lv.56',
                  'Lv.63 - Lv.75',
                  'Lv.78 - Lv.87',
                  'Lv.88 - Lv.99'
                ].map((range, idx) => (
                  <div 
                    key={idx} 
                    className="relative h-24 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex flex-col items-start"
                  >
                    <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                      {range}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rewards Section (6 Cards) - Naya Add Kiya Hai */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-wider text-gray-200">Rewards</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                'Lv.0 - Lv.10',
                'Lv.20 - Lv.35',
                'Lv.40 - Lv.56',
                'Lv.63 - Lv.75',
                'Lv.78 - Lv.87',
                'Lv.88 - Lv.99'
              ].map((range, idx) => (
                <div 
                  key={idx} 
                  className="relative h-24 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex flex-col items-start"
                >
                  <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                    {range}
                  </span>
                  {/* Aap in cards ke andar future me koi data dalna chaho to yahan daal sakte ho */}
                </div>
              ))}
            </div>
          </div>

          {/* Frames Section (6 Cards) - Naya Add Kiya Hai */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-wider text-gray-200">Frames</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                'Lv.0 - Lv.10',
                'Lv.20 - Lv.35',
                'Lv.40 - Lv.56',
                'Lv.63 - Lv.75',
                'Lv.78 - Lv.87',
                'Lv.88 - Lv.99'
              ].map((range, idx) => (
                <div 
                  key={idx} 
                  className="relative h-24 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex flex-col items-start"
                >
                  <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                    {range}
                  </span>
                  {/* Aap in cards ke andar future me koi data dalna chaho to yahan daal sakte ho */}
                </div>
              ))}
            </div>
          </div>

        </div>

        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#005f73]/70 backdrop-blur-xl border border-[#0a9396]/50 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-4 border-b border-white/10 flex items-center">
                <button 
                  onClick={() => setShowRules(false)} 
                  className="p-1 -ml-1 rounded-full"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center -ml-6">Rules</h2>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
                
                <div className="space-y-2">
                  <h3 className="text-sm text-cyan-100">Gift coins consumption</h3>
                  <p className="text-xs text-yellow-500 font-medium">5 coins = 1 Exp</p>
                  <div className="bg-yellow-600/20 text-yellow-300 text-[11px] p-2 rounded-lg border border-yellow-500/30">
                    Svip2 privilege: 5coins = 1.2EXP
                  </div>
                  <div className="bg-yellow-600/20 text-yellow-300 text-[11px] p-2 rounded-lg border border-yellow-500/30">
                    Svip7 privilege: 5coins = 1.3EXP
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-cyan-100">Enter the room</h3>
                  <p className="text-xs text-yellow-500 font-medium">2000 Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-cyan-100">Share the room</h3>
                  <p className="text-xs text-yellow-500 font-medium">2000 Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-cyan-100">Stay in your own room (Limited Time)</h3>
                  <p className="text-xs text-yellow-500 font-medium">10mins = 1000 Exp, 10000Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-cyan-100">Stay on other rooms (Limited Time)</h3>
                  <p className="text-xs text-yellow-500 font-medium">10mins = 1000 Exp, 20000 Exp/day</p>
                </div>

                <div className="space-y-1 pb-4">
                  <h3 className="text-sm text-cyan-100">Participate in activities</h3>
                  <p className="text-xs text-yellow-500 font-medium">Speed up upgrade</p>
                </div>

              </div>
            </div>
          </div>
        )}
        
      </div>
    </AppLayout>
  );
                  }
