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
      <div className="min-h-screen pb-32 animate-in fade-in duration-700">
        {/* Header Section */}
        <header className="px-6 pt-10 pb-6 relative overflow-hidden bg-gradient-to-b from-indigo-950 to-ummy-gradient">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users className="h-40 w-40 text-white" />
           </div>
           
           <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Social Kings</h1>
                    <p className="text-white/60 text-sm font-medium mt-1">Conquer the leaderboard with your family.</p>
                 </div>
                 <Button 
                   onClick={() => router.push('/families/create')}
                   className="rounded-full bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs px-6 py-6 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                 >
                    <Plus className="mr-2 h-5 w-5" /> Create
                 </Button>
              </div>

              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                 <Input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search Families by name or ID..."
                   className="w-full bg-white/5 border-white/10 rounded-2xl pl-12 h-14 text-white placeholder:text-white/20 focus:ring-primary/50"
                 />
              </div>
           </div>
        </header>

        <section className="px-6 py-8 space-y-8">
           {/* Top Ranking (Hiddne if no families) */}
           {filteredFamilies.length > 0 && !isLoading && (
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-sm font-black text-white/90 uppercase tracking-widest">Global Power Rankings</h2>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {filteredFamilies.map((family, idx) => (
                       <Card 
                         key={family.id}
                         onClick={() => router.push(`/families/${family.id}`)}
                         className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/[0.08] transition-all cursor-pointer group active:scale-[0.98]"
                       >
                          <CardContent className="p-0">
                             <div className="flex items-center p-4 gap-4">
                                <div className="shrink-0 relative">
                                   <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg">
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
                                        "absolute -top-2 -left-2 h-7 w-7 rounded-full flex items-center justify-center font-black text-xs shadow-xl border-2 border-white/20",
                                        idx === 0 ? "bg-yellow-500 text-black" : 
                                        idx === 1 ? "bg-slate-300 text-black" : 
                                        "bg-orange-600 text-white"
                                      )}>
                                         {idx + 1}
                                      </div>
                                   )}
                                </div>

                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                      <h3 className="text-white font-bold text-lg truncate uppercase tracking-tight">{family.name}</h3>
                                      {family.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />}
                                   </div>
                                   <div className="flex items-center gap-3 mt-1">
                                      <div className="flex items-center gap-1">
                                         <Users className="h-3 w-3 text-white/40" />
                                         <span className="text-[10px] font-bold text-white/60">{family.memberCount || 0} Members</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                         <Trophy className="h-3 w-3 text-yellow-500" />
                                         <span className="text-[10px] font-bold text-white/60">Lv.{family.level || 1}</span>
                                      </div>
                                   </div>
                                </div>

                                <div className="text-right">
                                   <div className="flex items-center gap-1 justify-end">
                                      <Flame className="h-4 w-4 text-orange-500" />
                                      <span className="text-white font-black text-lg">{(family.totalWealth || 0).toLocaleString()}</span>
                                   </div>
                                   <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">Power Score</span>
                                </div>

                                <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-primary transition-colors" />
                             </div>
                          </CardContent>
                       </Card>
                    ))}
                 </div>
              </div>
           )}

           {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader className="h-8 w-8 text-primary animate-spin" />
                 <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Searching the clans...</p>
              </div>
           )}

           {!isLoading && filteredFamilies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                 <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Search className="h-10 w-10 text-white/20" />
                 </div>
                 <h3 className="text-white text-xl font-black uppercase tracking-tight">No Families Found</h3>
                 <p className="text-white/40 text-sm font-medium mt-2">Try searching with a different name or create your own legacy today.</p>
                 <Button 
                   onClick={() => router.push('/families/create')}
                   variant="outline"
                   className="mt-6 border-white/10 text-white hover:bg-white/5 font-bold uppercase rounded-xl"
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
