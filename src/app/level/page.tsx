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
      {/* Glossy Black Background with Purple Top */}
      <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 font-sans pb-20 overflow-hidden text-white">
        
        {/* Top 30vh Purple Glossy Effect */}
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-purple-600/30 via-purple-500/20 to-transparent pointer-events-none blur-2xl" />
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-br from-purple-700/20 via-fuchsia-600/15 to-transparent pointer-events-none" />
        
        {/* Bottom Glossy Effects */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 p-6 pt-safe flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full transition-all duration-200 active:bg-white/10 hover:bg-white/5"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-[0.3em] text-center flex-1 -ml-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-200">
            Levels
          </h1>
        </header>

        <div className="relative z-10 p-6 space-y-8">
          
          {/* User Profile Card - Glossy Purple */}
          <div className="relative bg-gradient-to-br from-purple-500/20 via-fuchsia-600/10 to-purple-400/10 backdrop-blur-2xl border border-purple-400/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(168,85,247,0.2)] overflow-hidden">
            
            {/* Card ke andar glossy highlight */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl" />
            
            {/* User Info Section */}
            <div className="relative flex items-center gap-4 mb-5">
              {/* Profile Avatar */}
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-black/40">
                  {userProfile && 'photoURL' in userProfile && userProfile.photoURL ? (
                    <img 
                      src={userProfile.photoURL as string} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <User className="h-7 w-7 text-purple-300" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* User Name */}
              <div>
                <p className="text-xs text-purple-300/80 tracking-wider">WELCOME BACK</p>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {userProfile && 'name' in userProfile ? (userProfile.name as string) : 'Username'}
                </h2>
              </div>
            </div>

            {/* Progress Bar Section */}
            <div className="relative space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-300 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                    style={{ width: `${stats.progressPercent}%` }} 
                  />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent whitespace-nowrap">
                  Lv.{stats.currentLevel}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400 tracking-wide">
                  Need <span className="text-purple-300 font-bold">{stats.remainingToLevelUp.toLocaleString()}</span> Exp For Lv.{stats.nextLevel}
                </span>
                <button 
                  onClick={() => setShowRules(true)} 
                  className="p-1.5 rounded-full active:scale-95 transition-all duration-200 hover:bg-white/5"
                >
                  <HelpCircle className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </button>
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold tracking-[0.2em] text-gray-300 uppercase">
              Budget
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              {levels && levels.length > 0 ? (
                levels.map((level: any, idx: number) => (
                  <div 
                    key={level.id || idx} 
                    className="relative h-28 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col justify-between overflow-hidden hover:border-purple-400/20 transition-all duration-300 group"
                  >
                    {/* Image background mein brightness normal rakhi hai */}
                    {level.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                        <img 
                          src={level.imageUrl} 
                          alt={level.name} 
                          className="w-16 h-16 object-contain brightness-100"
                        />
                      </div>
                    )}
                    
                    {/* Level Range Text */}
                    <span className="text-[10px] font-semibold text-gray-400 tracking-wider relative z-10">
                      {level.range || `Lv.${idx}`}
                    </span>
                  </div>
                ))
              ) : (
                // Default Cards jab koi levels data na ho
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
                    className="relative h-28 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col justify-start hover:border-purple-400/20 transition-all duration-300"
                  >
                    <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                      {range}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rewards Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-[0.2em] text-gray-300 uppercase">Rewards</h2>
            
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
                  className="relative h-28 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col justify-start hover:border-purple-400/20 transition-all duration-300"
                >
                  <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                    {range}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Frames Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-[0.2em] text-gray-300 uppercase">Frames</h2>
            
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
                  className="relative h-28 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col justify-start hover:border-purple-400/20 transition-all duration-300"
                >
                  <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                    {range}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-purple-400/20 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-4 border-b border-white/10 flex items-center bg-gradient-to-r from-purple-500/10 to-transparent">
                <button 
                  onClick={() => setShowRules(false)} 
                  className="p-1 -ml-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center -ml-6 bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Rules
                </h2>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
                
                <div className="space-y-2">
                  <h3 className="text-sm text-purple-200 font-semibold">Gift coins consumption</h3>
                  <p className="text-xs text-yellow-500 font-medium">5 coins = 1 Exp</p>
                  <div className="bg-yellow-500/10 text-yellow-300 text-[11px] p-2.5 rounded-lg border border-yellow-500/20 backdrop-blur-sm">
                    Svip2 privilege: 5coins = 1.2EXP
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-300 text-[11px] p-2.5 rounded-lg border border-yellow-500/20 backdrop-blur-sm">
                    Svip7 privilege: 5coins = 1.3EXP
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-200 font-semibold">Enter the room</h3>
                  <p className="text-xs text-yellow-500 font-medium">2000 Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-200 font-semibold">Share the room</h3>
                  <p className="text-xs text-yellow-500 font-medium">2000 Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-200 font-semibold">Stay in your own room (Limited Time)</h3>
                  <p className="text-xs text-yellow-500 font-medium">10mins = 1000 Exp, 10000Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-200 font-semibold">Stay on other rooms (Limited Time)</h3>
                  <p className="text-xs text-yellow-500 font-medium">10mins = 1000 Exp, 20000 Exp/day</p>
                </div>

                <div className="space-y-1 pb-4">
                  <h3 className="text-sm text-purple-200 font-semibold">Participate in activities</h3>
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
