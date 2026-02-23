'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Loader, Camera, Gem, Award, ShieldCheck, Sparkles, Store, ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useUserProfile, useProfilePictureUpload } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Link from 'next/link';

/**
 * Premium Profile Page.
 * Displays user identity, assets, and tribe stats with high-impact visuals.
 */
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) router.replace('/login');
  }, [currentUser, isAuthLoading, router]);

  useEffect(() => {
    if (!isUploading) setLocalAvatarPreview(null);
  }, [isUploading]);

  if (isAuthLoading || (isProfileLoading && !profile)) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="animate-spin text-primary h-10 w-10" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Frequency...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile && !isProfileLoading) {
    notFound();
    return null;
  }

  if (!profile || !currentUser) return null;

  const isOwnProfile = currentUser.uid === profileId;
  const isAdmin = profile.tags?.includes('Admin') || profile.tags?.includes('Official');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return;
      setLocalAvatarPreview(URL.createObjectURL(file));
      uploadProfilePicture(file);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-32 animate-in fade-in duration-700">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between px-2">
           <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-all">
              <ChevronLeft className="h-6 w-6" />
           </button>
           <h2 className="font-headline text-xl font-black uppercase italic tracking-tighter">Identity Card</h2>
           <div className="w-10" /> {/* Spacer */}
        </header>

        <Card className="overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white relative">
          {/* Header Banner */}
          <div className="relative h-64 w-full group">
            <Image 
              src={profile.coverUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"} 
              alt="Cover" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {isOwnProfile && (
              <div className="absolute top-6 right-6 z-10 flex gap-3">
                <Button asChild size="sm" className="rounded-full bg-primary text-black font-black uppercase text-[10px] h-10 px-6 shadow-xl hover:scale-105 transition-transform border-2 border-white/20">
                  <Link href="/store"><Store className="mr-2 h-4 w-4" /> Boutique</Link>
                </Button>
                <EditProfileDialog profile={profile} />
              </div>
            )}
          </div>

          <div className="p-10 pt-0 relative">
            <div className="relative flex flex-col md:flex-row -mt-20 items-center md:items-end gap-8 text-center md:text-left">
               <div className="relative group shrink-0">
                  <div className={cn(
                    "p-1.5 rounded-full bg-white shadow-2xl transition-all duration-500",
                    isAdmin ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-pulse scale-105" : "hover:scale-105"
                  )}>
                    <Avatar className="h-40 w-40 border-4 border-white shadow-inner">
                      <AvatarImage src={localAvatarPreview || profile.avatarUrl} />
                      <AvatarFallback className="text-5xl font-black bg-secondary">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  {isOwnProfile && (
                     <div 
                        className="absolute inset-2 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                        onClick={() => fileInputRef.current?.click()}
                     >
                        {isUploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white h-8 w-8" />}
                     </div>
                  )}
               </div>

              <div className="flex-1 space-y-3 pb-2">
                   <div className="flex items-center justify-center md:justify-start gap-3">
                     <h1 className="font-headline text-5xl font-black italic uppercase text-gray-900 drop-shadow-sm tracking-tighter">
                        {profile.username}
                     </h1>
                     {isAdmin && (
                        <div className="bg-primary p-1 rounded-full shadow-lg">
                           <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                     )}
                   </div>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <Badge className="bg-primary text-black font-black px-4 py-1 text-xs rounded-full shadow-md">
                         Lv.{profile.level?.rich || 1} Wealth
                      </Badge>
                      <Badge variant="outline" className="border-2 border-pink-200 text-pink-500 font-black px-4 py-1 text-xs rounded-full">
                         Lv.{profile.level?.charm || 1} Charm
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono bg-secondary/50 px-3 py-1 rounded-full border border-gray-100">
                         ID: {profile.id.substring(0, 8).toUpperCase()}
                      </span>
                   </div>
                   {profile.bio && (
                      <p className="text-sm text-muted-foreground font-body italic max-w-md line-clamp-2">
                         "{profile.bio}"
                      </p>
                   )}
              </div>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Asset Column */}
          <Card className="rounded-[3rem] border-none shadow-xl bg-white p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
               <h2 className="font-headline text-2xl font-black uppercase italic text-gray-800 flex items-center gap-2">
                  <Award className="text-primary h-6 w-6" /> Vault
               </h2>
               <Sparkles className="h-5 w-5 text-yellow-400" />
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-5 bg-gradient-to-br from-yellow-50 to-transparent rounded-[2rem] border border-yellow-100 shadow-sm group hover:shadow-md transition-all">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                       <Gem className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-black text-sm uppercase text-gray-600">Coins</span>
                 </div>
                 <span className="font-black text-2xl italic">{(profile.wallet?.coins || 0).toLocaleString()}</span>
               </div>

               <div className="flex items-center justify-between p-5 bg-gradient-to-br from-blue-50 to-transparent rounded-[2rem] border border-blue-100 shadow-sm group hover:shadow-md transition-all">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                       <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-black text-sm uppercase text-gray-600">Diamonds</span>
                 </div>
                 <span className="font-black text-2xl italic text-blue-600">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
               </div>
            </div>

            {isOwnProfile && (
               <Button asChild variant="outline" className="w-full rounded-2xl border-2 border-dashed h-12 font-black uppercase text-xs hover:bg-primary/5">
                  <Link href="/settings">Manage Wallet & Top-up</Link>
               </Button>
            )}
          </Card>

          {/* Stats Column */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent rounded-[3rem] p-10 flex flex-col items-center justify-center border-2 border-yellow-400/5 shadow-inner group">
              <div className="h-16 w-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                 <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
              <span className="text-6xl font-black italic tracking-tighter">{(profile.stats?.followers || 0).toLocaleString()}</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Loyal Tribe Members</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-transparent rounded-[3rem] p-10 flex flex-col items-center justify-center border-2 border-pink-500/5 shadow-inner group">
              <div className="h-16 w-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
                 <Award className="h-8 w-8 text-pink-500" />
              </div>
              <span className="text-6xl font-black italic tracking-tighter">{(profile.stats?.fans || 0).toLocaleString()}</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Total Charm Impact</p>
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
