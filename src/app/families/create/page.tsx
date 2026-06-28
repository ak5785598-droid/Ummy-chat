'use client';

import React, { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import Image from 'next/image';
import { 
  Plus, 
  Users, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  ChevronLeft,
  TrendingUp,
  Loader,
  Camera,
  Heart,
  Crown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useFirestore, 
  useUser,
  useDoc,
  useStorage
} from '@/firebase';
import { 
  doc, 
  setDoc,
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { GoldCoinIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CreateFamilyPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bannerUrl: ''
  });

  const CREATE_COST = 500000;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `families/logos/${Date.now()}_${file.name}`);
      const uploadRes = await uploadBytes(storageRef, file, { cacheControl: 'public,max-age=31536000,immutable' });
      const downloadUrl = await getDownloadURL(uploadRes.ref);
      setFormData(prev => ({ ...prev, bannerUrl: downloadUrl }));
      toast({ title: 'Image Uploaded', description: 'Family insignia image successfully uploaded.' });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message || 'Failed to upload family insignia.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !firestore) return;

    if (formData.name.length < 3) {
      toast({ variant: 'destructive', title: 'Name too short', description: 'Family name must be at least 3 characters.' });
      return;
    }

    if ((userProfile.wallet?.coins || 0) < CREATE_COST) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: `You need ${CREATE_COST.toLocaleString()} coins to create a family.` });
      return;
    }

    setIsSubmitting(true);
    const familyId = `FAM_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', user.uid);
        const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
        const familyRef = doc(firestore, 'families', familyId);
        const walletRef = doc(firestore, 'walletTransactions', `create_fam_${Date.now()}`);

        // Deduct Coins
        transaction.update(userRef, { 
          'wallet.coins': increment(-CREATE_COST),
          familyId: familyId,
          updatedAt: serverTimestamp() 
        });
        transaction.update(profileRef, { 
          'wallet.coins': increment(-CREATE_COST),
          familyId: familyId,
          updatedAt: serverTimestamp() 
        });

        // Set Transaction
        transaction.set(walletRef, {
          userId: user.uid,
          amount: -CREATE_COST,
          type: 'family_creation',
          familyId,
          timestamp: serverTimestamp()
        });

        // Create Family
        transaction.set(familyRef, {
          id: familyId,
          name: formData.name,
          description: formData.description,
          bannerUrl: formData.bannerUrl || `https://picsum.photos/seed/${familyId}/400`,
          ownerId: user.uid,
          ownerName: userProfile.username || 'Founder',
          ownerAvatar: userProfile.avatarUrl || '',
          memberCount: 1,
          level: 1,
          totalWealth: 0,
          members: [user.uid],
          isVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      toast({ title: 'Family Established!', description: `Welcome to the ${formData.name} legacy.` });
      router.push(`/families/${familyId}`);
    } catch (err) {
      console.error("Family creation failed:", err);
      toast({ variant: 'destructive', title: 'Creation Failed', description: 'Something went wrong with the transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700 relative text-slate-800">
        {/* Top 30vh Purple Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-purple-500/15 via-purple-400/5 to-transparent pointer-events-none z-0" />

        <header className="px-6 pt-10 pb-6 flex items-center gap-4 relative z-10">
           <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 shadow-sm rounded-full hover:bg-slate-50 text-slate-700 transition-colors">
              <ChevronLeft className="h-6 w-6" />
           </button>
           <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Found a Legacy</h1>
        </header>

        <main className="px-6 space-y-8 relative z-10">
           <Card className="bg-white border-slate-100 overflow-hidden rounded-[2.5rem] shadow-sm">
              <CardContent className="p-8 space-y-6">
                  <div className="flex flex-col items-center text-center gap-4">
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                     />
                     <div 
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className="h-24 w-24 rounded-3xl bg-purple-50 border-2 border-purple-100 flex items-center justify-center relative group overflow-hidden cursor-pointer active:scale-95 transition-transform"
                     >
                        {isUploading ? (
                           <Loader className="animate-spin h-8 w-8 text-purple-600" />
                        ) : formData.bannerUrl ? (
                           <Image src={formData.bannerUrl} fill className="object-cover" alt="Banner" unoptimized />
                        ) : (
                           <Plus className="h-10 w-10 text-purple-600" />
                        )}
                        {!isUploading && (
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="h-6 w-6 text-white" />
                           </div>
                        )}
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Family Insignia</p>
                  </div>

                 <form className="space-y-6" onSubmit={handleCreate}>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-slate-500 ml-2">Family Name</label>
                       <Input 
                         required
                         value={formData.name}
                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                         placeholder="e.g. The Immortals"
                         className="h-14 bg-slate-50 border-slate-200/80 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:ring-purple-500/50"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-slate-500 ml-2">Legacy Motto</label>
                       <Input 
                         value={formData.description}
                         onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                         placeholder="What defines your family?"
                         className="h-14 bg-slate-50 border-slate-200/80 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:ring-purple-500/50"
                       />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                       <div className="flex items-center justify-between mb-8 px-2">
                          <div>
                             <p className="text-slate-800 font-bold">Creation Protocol</p>
                             <p className="text-slate-400 text-[10px] font-medium font-body mt-1 uppercase tracking-wider">Establishing a global identity cost</p>
                          </div>
                          <div className="bg-purple-100/50 p-4 py-2 rounded-2xl border border-purple-200/80 flex items-center gap-2">
                             <GoldCoinIcon className="h-6 w-6" />
                             <span className="text-purple-700 font-black text-xl">{CREATE_COST.toLocaleString()}</span>
                          </div>
                       </div>

                       <Button 
                         type="submit"
                         disabled={isSubmitting || (userProfile?.wallet?.coins || 0) < CREATE_COST}
                         className="w-full h-16 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                       >
                          {isSubmitting ? <Loader className="animate-spin h-6 w-6" /> : 'Protocolized Creation'}
                       </Button>
                    </div>
                 </form>
              </CardContent>
           </Card>

           {/* Rewards Legend */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center flex flex-col items-center gap-3 shadow-sm">
                 <ShieldCheck className="h-6 w-6 text-emerald-500" />
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Verified Badge</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center flex flex-col items-center gap-3 shadow-sm">
                 <Trophy className="h-6 w-6 text-yellow-500" />
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Global Leaderboard</p>
              </div>
           </div>
        </main>
      </div>
    </AppLayout>
  );
}
