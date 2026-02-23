'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams, useRouter } from 'next/navigation';
import { User, Loader, Camera, Gem, Award, ShieldCheck, BadgeCheck, Sparkles, Layout, Store } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useUserProfile, useProfilePictureUpload } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) router.replace('/login');
  }, [currentUser, isAuthLoading, router]);

  useEffect(() => {
    if (!isUploading) setLocalAvatarPreview(null);
  }, [isUploading]);

  if (isAuthLoading || (isProfileLoading && !profile)) return <AppLayout><div className="flex h-full w-full items-center justify-center py-20"><Loader className="animate-spin text-primary" /></div></AppLayout>;
  if (!profile && !isProfileLoading) { notFound(); return null; }
  if (!profile || !currentUser) return null;

  const isOwnProfile = currentUser.uid === profileId;

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
      <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-700">
        <Card className="overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <div className="relative h-56 w-full">
            <Image src={profile.coverUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"} alt="Cover" fill className="object-cover" />
            {isOwnProfile && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button asChild size="sm" className="rounded-full bg-primary text-black font-black uppercase text-[10px] h-9 px-4 shadow-lg hover:scale-105 transition-transform">
                  <Link href="/store"><Store className="mr-1.5 h-3.5 w-3.5" /> Boutique</Link>
                </Button>
                <EditProfileDialog profile={profile} />
              </div>
            )}
          </div>
          <div className="p-8 relative">
            <div className="relative flex -mt-24 items-end gap-6">
               <div className="relative group">
                  <div className={cn("p-1.5 rounded-full bg-white shadow-2xl", profile.frame === 'Official' && "bg-gradient-to-br from-yellow-400 to-orange-500")}>
                    <Avatar className="h-32 w-32 border-4 border-white">
                      <AvatarImage src={localAvatarPreview || profile.avatarUrl} />
                      <AvatarFallback className="text-4xl">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  {isOwnProfile && (
                     <div className="absolute inset-2 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {isUploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white" />}
                     </div>
                  )}
               </div>
              <div className="flex-1 pb-4">
                   <div className="flex items-center gap-2">
                     <h1 className="font-headline text-4xl font-black italic uppercase text-gray-900">{profile.username}</h1>
                     {profile.tags?.includes('Admin') && <ShieldCheck className="h-7 w-7 text-primary" />}
                   </div>
                   <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary font-bold">Lv. {profile.level?.rich || 1}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">ID: {profile.id.substring(0, 8)}</span>
                   </div>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border-none shadow-sm p-6 space-y-4">
            <h2 className="font-headline text-lg flex items-center gap-2"><Award className="text-primary" /> Assets</h2>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
              <div className="flex items-center gap-2"><Gem className="text-primary" /> <span className="font-bold">Coins</span></div>
              <span className="font-black text-xl">{(profile.wallet?.coins || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
              <div className="flex items-center gap-2"><Sparkles className="text-blue-500" /> <span className="font-bold">Diamonds</span></div>
              <span className="font-black text-xl">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
            </div>
          </Card>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-3xl p-8 text-center border border-yellow-100">
              <span className="text-4xl font-black">{profile.stats?.followers || 0}</span>
              <p className="text-[10px] font-black text-gray-500 uppercase mt-2">Followers</p>
            </div>
            <div className="bg-pink-50 rounded-3xl p-8 text-center border border-pink-100">
              <span className="text-4xl font-black">{profile.stats?.fans || 0}</span>
              <p className="text-[10px] font-black text-gray-500 uppercase mt-2">Total Fans</p>
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}