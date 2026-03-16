'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Loader,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserX,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  useAuth, 
  useUser, 
  useFirestore
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { signOut } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

const MenuItem = ({ icon: Icon, label, href, extra, onClick }: any) => {
  const router = useRouter();
  return (
    <div 
      className="flex items-center justify-between py-5 px-6 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all" 
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
      }}
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-full bg-purple-50 text-purple-600">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-black text-gray-800 text-sm uppercase italic tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra && <span className="text-[10px] font-black text-muted-foreground italic uppercase">{extra}</span>}
        <ChevronRight className="h-4 w-4 text-gray-200" />
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth || !user || !firestore) return;
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const userSnap = await getDoc(userRef);
      const currentRoomId = userSnap.data()?.currentRoomId;

      const batch = writeBatch(firestore);
      
      batch.update(userRef, { 
        isOnline: false, 
        currentRoomId: null, 
        updatedAt: serverTimestamp() 
      });
      batch.update(profileRef, { 
        isOnline: false, 
        currentRoomId: null, 
        updatedAt: serverTimestamp() 
      });

      if (currentRoomId) {
        const roomRef = doc(firestore, 'chatRooms', currentRoomId);
        const participantRef = doc(firestore, 'chatRooms', currentRoomId, 'participants', user.uid);
        batch.delete(participantRef);
        batch.update(roomRef, { 
          participantCount: increment(-1),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      await signOut(auth);
      window.location.href = '/login';
    } catch (e: any) {
      await signOut(auth);
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to PERMANENTLY DELETE your account? This action cannot be undone.")) {
      toast({ variant: 'destructive', title: 'Action Restricted', description: 'Account deletion requires manual tribal authority review.' });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout hideSidebarOnMobile>
        <div className="flex h-screen items-center justify-center bg-white">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout hideSidebarOnMobile hideBottomNav>
      <div className="min-h-full bg-white font-headline flex flex-col animate-in fade-in duration-700">
        
        <header className="px-6 pt-10 pb-10">
           <button onClick={() => router.back()} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all shadow-sm">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
        </header>

        <div className="px-6 space-y-10">
           <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">TRIBAL IDENTITY</p>
              <Card className="rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden bg-white">
                 <MenuItem icon={Globe} label="LANGUAGE" />
              </Card>
           </section>

           <section className="space-y-6 flex flex-col items-center">
              <button 
                onClick={handleLogout}
                className="w-full h-20 rounded-[2rem] bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 shadow-none font-black uppercase italic text-xl flex items-center justify-center gap-4 transition-all active:scale-95"
              >
                <LogOut className="h-6 w-6" />
                EXIT FREQUENCY (SIGN OUT)
              </button>

              <button 
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 text-red-400 font-black uppercase italic text-xs hover:text-red-500 transition-colors py-4"
              >
                <UserX className="h-4 w-4" />
                DELETE ACCOUNT
              </button>
           </section>
        </div>
      </div>
    </AppLayout>
  );
}
