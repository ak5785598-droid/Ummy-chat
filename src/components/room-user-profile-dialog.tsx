'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  Copy, 
  MessageCircle, 
  UserPlus, 
  Gift as GiftIcon,
  MicOff,
  Ban,
  Star,
  Loader,
  LogOut,
  Mic,
  User,
  Heart,
  Plus,
  CheckCircle2,
  AtSign,
  Sparkles,
  ChevronRight,
  Flag,
  AlertTriangle,
  Lock,
  MessageSquare,
  MapPin,
  Users
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { OfficialTag } from '@/components/official-tag';
import { SellerTag } from '@/components/seller-tag';
import { CustomerServiceTag } from '@/components/customer-service-tag';
import { CsLeaderTag } from '@/components/cs-leader-tag';
import { useRouter } from 'next/navigation';
import { GoldCoinIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface RoomUserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  isOwner: boolean; 
  roomOwnerId: string;
  roomModeratorIds: string[];
  onSilence: (uid: string, current: boolean) => void;
  onKick: (uid: string, durationMinutes: number) => void;
  onLeaveSeat: (uid: string) => void;
  onToggleMod: (uid: string) => void;
  onOpenGiftPicker: (recipient: any) => void;
  isSilenced: boolean;
  isMe: boolean;
}

const LevelBadge = ({ level, type }: { level: number, type: 'rich' | 'charm' }) => (
  <div className={cn(
    "flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/20 shadow-sm shrink-0",
    type === 'rich' ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-pink-400 to-pink-600"
  )}>
    {type === 'rich' ? <Star className="h-2 w-2 fill-white text-white" /> : <Sparkles className="h-2 w-2 fill-white text-white" />}
    <span className="text-[8px] font-black text-white">{level}</span>
  </div>
);

/**
 * High-Fidelity Room User Profile Dialog.
 * Perfectly matches the provided white-theme blueprint.
 */
export function RoomUserProfileDialog({ 
  userId, 
  open, 
  onOpenChange, 
  canManage, 
  isOwner,
  roomOwnerId,
  roomModeratorIds,
  onSilence,
  onKick,
  onLeaveSeat,
  onToggleMod,
  onOpenGiftPicker,
  isSilenced,
  isMe
}: RoomUserProfileDialogProps) {
  const { userProfile: profile, isLoading } = useUserProfile(userId || undefined);
  const { toast } = useToast();
  const router = useRouter();

  if (!userId) return null;

  const handleCopyId = () => {
    const idToCopy = profile?.specialId || userId;
    navigator.clipboard.writeText(idToCopy);
    toast({ title: 'ID Copied' });
  };

  const handleViewFullProfile = () => {
    onOpenChange(false);
    router.push(`/profile/${userId}`);
  };

  const isOfficial = profile?.tags?.includes('Official');
  const isSeller = profile?.tags?.includes('Seller') || profile?.tags?.includes('Coin Seller');
  const isCS = profile?.tags?.includes('Customer Service');
  const isCSLeader = profile?.tags?.includes('CS Leader');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-none p-0 rounded-t-[3rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white text-black font-headline animate-in slide-in-from-bottom-10 duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>Identity Frequency Synchronization</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between p-6 pb-0">
               <button onClick={handleViewFullProfile} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <MoreHorizontal className="h-6 w-6" />
               </button>
               <button className="text-gray-300 hover:text-red-500 transition-colors">
                  <AlertTriangle className="h-5 w-5" />
               </button>
            </div>

            <div className="mt-2 mb-4">
               <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl">
                  <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-xl">
                     <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
                     <AvatarFallback className="text-3xl bg-slate-100 text-slate-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
               </AvatarFrame>
            </div>

            <div className="text-center space-y-2 mb-4 w-full px-6">
               <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile.username}</h2>
               <div className="flex flex-wrap justify-center items-center gap-1.5">
                  <LevelBadge level={profile.level?.rich || 1} type="rich" />
                  <LevelBadge level={profile.level?.charm || 1} type="charm" />
                  
                  {isOfficial && <OfficialTag size="sm" className="scale-75 origin-center ml-1" />}
                  {isCSLeader && <CsLeaderTag size="sm" className="scale-75 origin-center ml-1" />}
                  {isSeller && <SellerTag size="sm" className="scale-75 origin-center -ml-6" />}
                  {isCS && <CustomerServiceTag size="sm" className="scale-75 origin-center -ml-6" />}
               </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-8">
               <div className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={handleCopyId}>
                  {profile.specialId && profile.specialIdColor ? (
                    <div className={cn(
                      "relative overflow-hidden px-2 py-0.5 rounded-full border border-white/30 group animate-in fade-in duration-500 w-fit bg-gradient-to-r shadow-md",
                      profile.specialIdColor === 'blue' 
                        ? "from-blue-400 via-blue-500 to-blue-400"
                        : "from-rose-400 via-rose-500 to-rose-400"
                    )}>
                      <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
                      <span className="relative z-10 text-[8px] font-black text-white uppercase italic tracking-widest leading-none">ID:{profile.specialId}</span>
                    </div>
                  ) : (
                    <span>ID:{profile.specialId || profile.id.slice(0, 8)}</span>
                  )}
                  <Copy className="h-2.5 w-2.5 opacity-40" />
               </div>
               <span className="opacity-20 text-lg">|</span>
               <div className="flex items-center gap-1">
                  <span>{profile.stats?.fans || 0} Fans</span>
               </div>
               <span className="opacity-20 text-lg">|</span>
               <div className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{profile.country || 'India'}</span>
               </div>
            </div>

            <div className="w-full flex items-center justify-between px-10 mb-6">
               <button className="flex items-center gap-2 group active:scale-95 transition-transform">
                  <Heart className="h-6 w-6 text-pink-500 group-hover:fill-pink-500 transition-colors" strokeWidth={2.5} />
                  <span className="text-sm font-black text-pink-500 uppercase">Follow</span>
               </button>

               <button className="flex items-center gap-2 group active:scale-95 transition-transform">
                  <MessageSquare className="h-6 w-6 text-gray-800" strokeWidth={2.5} />
                  <span className="text-sm font-black text-gray-800 uppercase">Chat</span>
               </button>

               <button className="p-2 text-gray-800 hover:bg-gray-50 rounded-full transition-colors active:scale-90">
                  <AtSign className="h-6 w-6" strokeWidth={3} />
               </button>

               <button 
                 onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
                 className="relative h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
               >
                  <GiftIcon className="h-6 w-6 text-white fill-white" />
               </button>
            </div>

            {isMe && (
              <div className="w-full px-10 mb-8">
                 <button 
                   onClick={() => onLeaveSeat(userId)}
                   className="w-full h-14 rounded-full bg-[#00E676] text-white flex items-center justify-center gap-3 font-black uppercase text-lg shadow-xl shadow-green-500/20 active:scale-95 transition-all"
                 >
                    <Mic className="h-6 w-6 rotate-180" />
                    Seat leave
                 </button>
              </div>
            )}

            {canManage && !isMe && (
              <div className="w-full border-t border-gray-50 py-6 px-8 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <button 
                      onClick={() => onSilence(userId, isSilenced)}
                      className="hover:text-primary transition-colors active:scale-95"
                    >
                       {isSilenced ? 'Unmute' : 'Mute'}
                    </button>
                    <span className="opacity-20 text-lg">|</span>
                    <button 
                      onClick={() => onLeaveSeat(userId)}
                      className="hover:text-orange-600 transition-colors active:scale-95"
                    >
                       Leave
                    </button>
                    <span className="opacity-20 text-lg">|</span>
                    <button 
                      onClick={() => { toast({ title: 'Slot Locked' }); onOpenChange(false); }}
                      className="hover:text-indigo-600 transition-colors active:scale-95"
                    >
                       Lock
                    </button>
                    <span className="opacity-20 text-lg">|</span>
                    <button 
                      onClick={() => onKick(userId, 10)}
                      className="hover:text-red-600 transition-colors active:scale-95"
                    >
                       Kick out
                    </button>
                 </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
