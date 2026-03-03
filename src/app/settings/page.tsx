'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Loader,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  Store,
  ChevronLeft,
  ShieldCheck,
  Bell,
  HelpCircle,
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

const MenuItem = ({ icon: Icon, label, href, extra, iconColor, onClick }: any) => {
  const router = useRouter();
  return (
    <div 
      className="flex items-center justify-between py-5 border-b border-gray-50 last:border-0 px-6 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all" 
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
      }}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-2xl", iconColor?.replace('text-', 'bg-') || "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", iconColor || "text-primary")} />
        </div>
        <span className="font-black text-gray-800 text-sm uppercase italic tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra && <span className="text-[10px] font-black text-muted-foreground italic uppercase">{extra}</span>}
        <ChevronRight className="h-4 w-4 text-gray-300" />
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
      // 1. Pro-active Identity Disconnect Handshake
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const userSnap = await getDoc(userRef);
      const currentRoomId = userSnap.data()?.currentRoomId;

      const batch = writeBatch(firestore);
      
      // 2. Set Identity to Completely Off
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

      // 3. Atomic Removal from Frequencies
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
      console.error("[Identity Sync] Logout Cleanup Error:", e);
      // Fallback: Hard sign out regardless of cleanup success
      await signOut(auth);
      window.location.href = '/login';
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout>
        <div className="flex h-dvh items-center justify-center">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="min-h-full bg-white font-headline pb-32 animate-in fade-in duration-700">
        <header className="px-6 pt-10 pb-6 flex items-center gap-4 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
           <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
           <h1 className="text-3xl font-black uppercase italic tracking-tighter">Settings</h1>
        </header>

        <div className="p-4 space-y-6">
           <section className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Tribal Identity</p>
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                 <MenuItem icon={SettingsIcon} label="Modify Persona" href={`/profile/${user.uid}`} />
                 <MenuItem icon={ShieldCheck} label="Account Security" extra="Verified" iconColor="text-green-500" />
                 <MenuItem icon={Bell} label="Notifications" extra="Active" iconColor="text-blue-500" />
              </Card>
           </section>

           <section className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Resources</p>
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                 <MenuItem icon={Store} label="Ummy Boutique" href="/store" iconColor="text-pink-500" />
                 <MenuItem icon={HelpCircle} label="Help Center" href="/help-center" iconColor="text-orange-500" />
                 <MenuItem icon={Globe} label="Language" extra="English" />
              </Card>
           </section>

           <section className="pt-4 px-2">
              <Button 
                onClick={handleLogout}
                variant="destructive"
                className="w-full h-16 rounded-[1.5rem] bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 shadow-none font-black uppercase italic text-lg"
              >
                <LogOut className="h-6 w-6 mr-2" />
                Exit Frequency (Sign Out)
              </Button>
              <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 mt-4 italic">
                Ummy Secure Protocol v1.4.2 • India Official
              </p>
           </section>
        </div>
      </div>
    </AppLayout>
  );
}
