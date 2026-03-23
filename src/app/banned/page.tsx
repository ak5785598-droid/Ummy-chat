'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ShieldAlert, LogOut, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

/**
 * Sanctuary of Exclusion - High-Fidelity Banned Page.
 */
export default function BannedPage() {
  const { user } = useUser();
  const { userProfile, isLoading } = useUserProfile(user?.uid);
  const auth = useAuth();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !userProfile?.banStatus?.isBanned) {
      router.replace('/rooms');
    }
  }, [userProfile, isLoading, router]);

  useEffect(() => {
    const updateTime = () => {
      if (userProfile?.banStatus?.bannedUntil) {
        const until = userProfile.banStatus.bannedUntil.toDate();
        const diff = until.getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('Frequency Restoring...');
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft('Permanent Exclusion');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      window.location.href = '/login';
    }
  };

  if (isLoading) return (
    <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
       <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-8 font-headline text-white overflow-hidden relative">
      {/* Background Radiance */}
      <div className="absolute inset-0 bg-red-900/10 blur-[150px] rounded-full scale-150 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-10 animate-in fade-in zoom-in duration-1000">
         <div className="relative">
            <div className="absolute inset-0 bg-red-600/20 blur-3xl animate-pulse rounded-full" />
            <div className="h-32 w-32 rounded-[3rem] bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center border-4 border-white/5 shadow-[0_0_50px_rgba(220,38,38,0.3)] relative z-10">
               <Ban className="h-16 w-16 text-white" />
            </div>
         </div>

         <div className="space-y-4 px-2">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-red-500 leading-none">Identity Blocked</h1>
            <p className="text-white/80 font-body text-xl italic leading-relaxed">
               You have ban ({timeLeft}). Contact ummy official team for any support.
            </p>
         </div>

         <div className="w-full p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border-2 border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <div className="flex items-center gap-3 text-red-400">
                  <Clock className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Time Remaining</span>
               </div>
               <span className="text-xl font-black italic">{timeLeft}</span>
            </div>
            
            <div className="space-y-2">
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-left ml-1">Restricted Member</p>
               <div className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                  <Avatar className="h-10 w-10 border-2 border-white/10">
                    <AvatarImage src={userProfile?.avatarUrl || undefined} />
                  </Avatar>
                  <div className="text-left">
                     <p className="font-black text-sm uppercase truncate">{userProfile?.username}</p>
                     <p className="text-[8px] font-bold text-white/40 uppercase">ID: {userProfile?.accountNumber || 'Syncing...'}</p>
                  </div>
               </div>
            </div>
         </div>

         <Button 
           onClick={handleLogout}
           variant="outline" 
           className="w-full h-16 rounded-[1.5rem] bg-white/5 border-white/10 text-white font-black uppercase italic text-lg shadow-xl hover:bg-white/10"
         >
            <LogOut className="mr-2 h-6 w-6" /> Exit Portal
         </Button>

         <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20">Ummy Sovereign Defense System Synchronized</p>
      </div>
    </div>
  );
}
