'use client';

import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { getOptimizedMediaUrl } from '@/lib/media-proxy';
import { 
  Users, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Crown,
  Share2,
  Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  useFirestore, 
  useUser,
  useDoc,
  useCollection
} from '@/firebase';
import { 
  doc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  serverTimestamp,
  runTransaction,
  collection,
  query,
  where
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function FamilyHQPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.id as string;
  
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const familyRef = useMemo(() => !firestore ? null : doc(firestore, 'families', familyId), [firestore, familyId]);
  const { data: family, isLoading: isFamilyLoading } = useDoc<any>(familyRef);

  // Fetch Member Profiles
  const membersQuery = useMemo(() => {
    if (!firestore || !family?.members?.length) return null;
    return query(
      collection(firestore, 'users'),
      where('uid', 'in', family.members.slice(0, 10)) // Limit for now to prevent heavy reads
    );
  }, [firestore, family?.members]);

  const { data: memberProfiles, isLoading: isMembersLoading } = useCollection<any>(membersQuery);

  const isMember = useMemo(() => user && family?.members?.includes(user.uid), [user, family?.members]);
  const isOwner = useMemo(() => user && family?.ownerId === user.uid, [user, family?.ownerId]);

  const handleJoin = async () => {
    if (!user || !userProfile || !firestore || !family) return;

    if (userProfile.familyId) {
      toast({ variant: 'destructive', title: 'Already in a Family', description: 'You must leave your current family before joining a new one.' });
      return;
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', user.uid);
        const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
        
        transaction.update(userRef, { familyId, updatedAt: serverTimestamp() });
        transaction.update(profileRef, { familyId, updatedAt: serverTimestamp() });

        transaction.update(familyRef!, {
          members: arrayUnion(user.uid),
          memberCount: increment(1),
          updatedAt: serverTimestamp()
        });
      });

      toast({ title: 'Welcome to the Family!', description: `You have joined ${family.name}.` });
    } catch (err) {
      console.error("Join failed:", err);
      toast({ variant: 'destructive', title: 'Join Failed', description: 'Transaction error.' });
    }
  };

  const handleLeave = async () => {
    if (!user || !firestore || !family || isOwner) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', user.uid);
        const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
        
        transaction.update(userRef, { familyId: null, updatedAt: serverTimestamp() });
        transaction.update(profileRef, { familyId: null, updatedAt: serverTimestamp() });

        transaction.update(familyRef!, {
          members: arrayRemove(user.uid),
          memberCount: increment(-1),
          updatedAt: serverTimestamp()
        });
      });

      toast({ title: 'You left the family' });
    } catch (err) {
      console.error("Leave failed:", err);
    }
  };
  const isVideoBanner = (url: string) => {
    return url && (
      url.includes('.mp4') || 
      url.includes('.webm') || 
      url.includes('video')
    );
  };

  if (isFamilyLoading) return null;
  if (!family) return <AppLayout><div className="flex h-screen items-center justify-center bg-ummy-gradient text-white">Family Registry Not Found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] pb-32 animate-in fade-in duration-1000 relative text-slate-800">
        {/* Top 30vh Purple Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-purple-500/15 via-purple-400/5 to-transparent pointer-events-none z-0" />

        {/* HERO BANNER SECTION */}
        <section className="relative h-80 w-full overflow-hidden z-10">
           {isVideoBanner(family.bannerUrl) ? (
             <video 
               src={family.bannerUrl} 
               className="absolute inset-0 w-full h-full object-cover scale-105 blur-[2px] opacity-40 z-0" 
               muted 
               autoPlay 
               loop 
             />
           ) : (
             <Image 
               src={getOptimizedMediaUrl(family.bannerUrl) || `https://picsum.photos/seed/${family.id}/800`} 
               alt="HQ Banner" 
               fill 
               className="object-cover scale-105 blur-[2px] opacity-40"
               unoptimized
             />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
           
           <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="flex items-center gap-6">
                 <div className="h-24 w-24 rounded-[2rem] border-4 border-white overflow-shadow shadow-2xl relative bg-slate-900 flex items-center justify-center">
                    {isVideoBanner(family.bannerUrl) ? (
                      <video src={getOptimizedMediaUrl(family.bannerUrl)} className="w-full h-full object-cover" muted autoPlay loop />
                    ) : (
                      <Image src={getOptimizedMediaUrl(family.bannerUrl) || `https://picsum.photos/seed/${family.id}/200`} fill className="object-cover" alt="Family" unoptimized />
                    )}
                 </div>
                 <div className="mb-2">
                    <div className="flex items-center gap-2">
                       <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{family.name}</h1>
                       {family.isVerified && <ShieldCheck className="h-5 w-5 text-emerald-500" />}
                    </div>
                    <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                       <Crown className="h-3.5 w-3.5 text-yellow-600" /> Founder: {family.ownerName}
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                 <button className="h-12 w-12 rounded-full bg-white backdrop-blur-md border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-sm active:scale-90 transition-transform"><Share2 className="h-5 w-5" /></button>
                 {isMember ? (
                   !isOwner && <Button onClick={handleLeave} variant="outline" className="rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold uppercase text-xs h-12 px-6">Leave</Button>
                 ) : (
                   <Button 
                     onClick={handleJoin}
                     className="rounded-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs h-12 px-8 shadow-xl shadow-purple-500/20"
                   >
                     Join Family
                   </Button>
                 )}
              </div>
           </div>
        </section>

        {/* STATS & PROGRESS SECTION */}
        <main className="px-6 space-y-8 mt-6 relative z-10">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center gap-2 text-center group transition-all hover:border-purple-200">
                 <Flame className="h-7 w-7 text-orange-500 animate-pulse" />
                 <span className="text-2xl font-black text-slate-800">{(family.totalWealth || 0).toLocaleString()}</span>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Power</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center gap-2 text-center group transition-all hover:border-purple-200">
                 <Users className="h-7 w-7 text-emerald-500" />
                 <span className="text-2xl font-black text-slate-800">{family.memberCount || 0}</span>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Members</p>
              </div>
           </div>

           {/* Experience Progress */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <div>
                       <h3 className="text-slate-800 font-bold text-lg uppercase tracking-tight">Family Reputation</h3>
                       <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Level {family.level || 1} Elite Clan</p>
                    </div>
                 </div>
                 {isOwner && <Badge className="bg-yellow-500/10 text-yellow-600 border-none font-bold uppercase text-[9px] tracking-widest">Management</Badge>}
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-bold text-slate-400">EXP Progress</span>
                    <span className="text-[14px] font-black text-slate-700">65% <span className="text-[9px] text-slate-400 ml-1">to Lv.{ (family.level || 1) + 1 }</span></span>
                 </div>
                 <Progress value={65} className="h-2.5 bg-slate-100" />
              </div>
           </div>

           {/* MEMBER LIST */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Elite Roster</h2>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing Top 10</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {memberProfiles?.map((profile: any) => (
                    <div 
                      key={profile.uid} 
                      onClick={() => router.push(`/profile/${profile.uid}`)}
                      className="flex items-center p-3 bg-white border border-slate-100 shadow-sm rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group"
                    >
                       <Avatar className="h-10 w-10 border border-slate-200 shadow-sm shrink-0">
                          <AvatarImage src={profile.avatarUrl} />
                          <AvatarFallback className="text-[10px]">{profile.username?.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 ml-3 min-w-0">
                          <div className="flex items-center gap-1.5">
                             <p className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight">{profile.username}</p>
                             {profile.uid === family.ownerId && <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Lv.{profile.level || 1} Warrior</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-3">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          <span className="text-slate-800 font-black text-sm">{ (profile.wealthValue || 0).toLocaleString() }</span>
                       </div>
                    </div>
                 ))}
                 
                 {isMembersLoading && (
                    <div className="flex items-center justify-center py-10">
                       <Loader className="animate-spin text-purple-600 h-5 w-5" />
                    </div>
                 )}
              </div>
           </div>
        </main>
      </div>
    </AppLayout>
  );
}
