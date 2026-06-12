'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Users, 
  Search, 
  Plus, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Loader
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useFirestore, 
  useCollection 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function FamiliesPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const familiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'families'),
      orderBy('totalWealth', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: families, isLoading } = useCollection<any>(familiesQuery);

  const filteredFamilies = useMemo(() => {
    if (!families) return [];
    return families.filter(f => 
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [families, searchQuery]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] pb-32 animate-in fade-in duration-700 relative">
        {/* Top 30vh Purple Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-purple-500/15 via-purple-400/5 to-transparent pointer-events-none" />
        
        {/* Header Section */}
        <header className="px-6 pt-safe pb-6 relative overflow-hidden bg-transparent">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Users className="h-40 w-40 text-purple-900" />
           </div>
           
           <div className="relative z-10 flex flex-col gap-6 pt-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors md:hidden">
                       <ChevronLeft className="h-6 w-6 text-slate-800" />
                    </button>
                    <div>
                       <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Social Kings</h1>
                       <p className="text-slate-500 text-sm font-medium mt-1">Conquer the leaderboard with your family.</p>
                    </div>
                 </div>
                 <Button 
                   onClick={() => router.push('/families/create')}
                   className="rounded-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs px-6 py-6 shadow-lg shadow-purple-500/20"
                 >
                    <Plus className="mr-2 h-5 w-5" /> Create
                 </Button>
              </div>

              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                 <Input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search Families by name or ID..."
                   className="w-full bg-white border-slate-200/80 rounded-2xl pl-12 h-14 text-slate-800 placeholder:text-slate-400 focus:ring-purple-500/50 shadow-sm"
                 />
              </div>
           </div>
        </header>

        <section className="px-6 py-8 space-y-8 relative z-10">
           {/* Top Ranking (Hidden if no families) */}
           {filteredFamilies.length > 0 && !isLoading && (
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest">Global Power Rankings</h2>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {filteredFamilies.map((family, idx) => (
                       <Card 
                         key={family.id}
                         onClick={() => router.push(`/families/${family.id}`)}
                         className="bg-white border-slate-100 overflow-hidden hover:bg-slate-50/50 transition-all cursor-pointer group active:scale-[0.98] shadow-sm rounded-2xl"
                       >
                          <CardContent className="p-0">
                             <div className="flex items-center p-4 gap-4">
                                <div className="shrink-0 relative">
                                   <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                                      <Image 
                                        src={family.bannerUrl || `https://picsum.photos/seed/${family.id}/200`} 
                                        alt="Family Banner" 
                                        fill 
                                        className="object-cover"
                                        unoptimized
                                      />
                                   </div>
                                   {idx < 3 && (
                                      <div className={cn(
                                        "absolute -top-2 -left-2 h-7 w-7 rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white",
                                        idx === 0 ? "bg-yellow-400 text-yellow-950" : 
                                        idx === 1 ? "bg-slate-300 text-slate-900" : 
                                        "bg-orange-400 text-white"
                                      )}>
                                         {idx + 1}
                                      </div>
                                   )}
                                </div>

                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                      <h3 className="text-slate-800 font-bold text-lg truncate uppercase tracking-tight">{family.name}</h3>
                                      {family.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />}
                                   </div>
                                   <div className="flex items-center gap-3 mt-1">
                                      <div className="flex items-center gap-1">
                                         <Users className="h-3 w-3 text-slate-400" />
                                         <span className="text-[10px] font-bold text-slate-500">{family.memberCount || 0} Members</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                         <Trophy className="h-3 w-3 text-yellow-500" />
                                         <span className="text-[10px] font-bold text-slate-500">Lv.{family.level || 1}</span>
                                      </div>
                                   </div>
                                </div>

                                <div className="text-right">
                                   <div className="flex items-center gap-1 justify-end">
                                      <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                                      <span className="text-slate-900 font-black text-lg">{(family.totalWealth || 0).toLocaleString()}</span>
                                   </div>
                                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Power Score</span>
                                </div>

                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                             </div>
                          </CardContent>
                       </Card>
                    ))}
                 </div>
              </div>
           )}

           {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader className="h-8 w-8 text-purple-600 animate-spin" />
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Searching the clans...</p>
              </div>
           )}

           {!isLoading && filteredFamilies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                 <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <Search className="h-10 w-10 text-slate-300" />
                 </div>
                 <h3 className="text-slate-800 text-xl font-black uppercase tracking-tight">No Families Found</h3>
                 <p className="text-slate-400 text-sm font-medium mt-2">Try searching with a different name or create your own legacy today.</p>
                 <Button 
                   onClick={() => router.push('/families/create')}
                   className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase rounded-xl"
                 >
                    Found a New Family
                 </Button>
              </div>
           )}
        </section>
      </div>
    </AppLayout>
  );
}
