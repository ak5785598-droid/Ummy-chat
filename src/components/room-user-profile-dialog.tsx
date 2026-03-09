
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
  Flag
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
import { useRouter } from 'next/navigation';
import { GoldCoinIcon } from '@/components/icons';

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

const SpecialIdBadge = ({ id, color = 'red', onClick }: { id: string, color?: string | null, onClick?: () => void }) => {
  const theme = color === 'blue' 
    ? "from-blue-300 via-blue-500 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
    : "from-rose-300 via-rose-500 to-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]";

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden px-3 py-0.5 rounded-full border border-white/30 group animate-in fade-in duration-500 w-fit bg-gradient-to-r cursor-pointer active:scale-95 transition-transform",
        theme
      )}
    >
      <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
      <span className="relative z-10 text-[10px] font-black text-white uppercase italic tracking-widest drop-shadow-sm">ID: {id}</span>
    </div>
  );
};

/**
 * High-Fidelity Room User Profile Dialog.
 * Perfectly matches the production visual blueprint with dark-slate aesthetic.
 * Integrates the Sovereign Command Grid for administrative oversight.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-none p-0 rounded-[2.5rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Tribe Member Profile</DialogTitle>
          <DialogDescription>High-fidelity identity synchronization.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-[500px] flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : profile ? (
          <div className="relative flex flex-col items-center">
            
            <div className="w-full flex justify-end p-6 absolute top-0 right-0 z-50">
               <button onClick={handleViewFullProfile} className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5 shadow-xl">
                  <MoreHorizontal className="h-6 w-6" />
               </button>
            </div>

            <div className="pt-16 pb-6 flex flex-col items-center w-full">
               <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl" className="mb-4">
                  <Avatar className="h-28 w-28 border-4 border-white/10 shadow-2xl">
                     <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
                     <AvatarFallback className="text-3xl bg-slate-800">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
               </AvatarFrame>

               <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">{profile.username}</h2>
               
               <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg",
                    profile.gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
                  )}>
                    {profile.gender === 'Female' ? '♀' : '♂'}
                  </div>
                  <span className="text-lg">🇮🇳</span>
                  <SpecialIdBadge id={profile.specialId || profile.id.slice(0, 6)} color="red" onClick={handleCopyId} />
                  <OfficialTag size="sm" className="-ml-1" />
               </div>

               <div className="mb-8">
                  <div className="bg-[#00E676] px-5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,230,118,0.4)]">
                     <CheckCircle2 className="h-3.5 w-3.5 text-white fill-current" />
                     <span className="text-[11px] font-black text-white uppercase tracking-widest">Verified</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 w-full px-8 mb-10">
                  <div className="bg-gradient-to-br from-[#2563eb] to-[#1e1b4b] rounded-2xl p-4 text-white shadow-xl relative overflow-hidden group">
                     <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                              <Star className="h-3.5 w-3.5 fill-white text-white" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-white/60 uppercase leading-none">Rich</span>
                              <span className="text-sm font-black italic">Lv {profile.level?.rich || 0}</span>
                           </div>
                        </div>
                        <div className="h-px bg-white/10 w-full" />
                        <p className="text-[9px] font-black uppercase tracking-tighter text-white/40 italic">Mthly Send: 0</p>
                     </div>
                     <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                        <Star className="h-20 w-20 fill-current" />
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#db2777] to-[#4c0519] rounded-2xl p-4 text-white shadow-xl relative overflow-hidden group">
                     <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                              <Sparkles className="h-3.5 w-3.5 fill-white text-white" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-white/60 uppercase leading-none">Charm</span>
                              <span className="text-sm font-black italic">Lv {profile.level?.charm || 0}</span>
                           </div>
                        </div>
                        <div className="h-px bg-white/10 w-full" />
                        <p className="text-[9px] font-black uppercase tracking-tighter text-white/40 italic">Mthly Received: 0</p>
                     </div>
                     <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                        <Heart className="h-20 w-20 fill-current" />
                     </div>
                  </div>
               </div>

               {canManage && (
                 <div className="w-full px-8 mb-10 animate-in fade-in zoom-in duration-500">
                    <div className="grid grid-cols-3 gap-3">
                       <button 
                         onClick={() => onSilence(userId, isSilenced)}
                         className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all shadow-lg"
                       >
                          <MicOff className={cn("h-6 w-6", isSilenced ? "text-green-500" : "text-white/60")} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Turn off</span>
                       </button>
                       
                       <button 
                         onClick={() => onLeaveSeat(userId)}
                         className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all shadow-lg"
                       >
                          <LogOut className="h-6 w-6 text-white/60" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Seat Leave</span>
                       </button>

                       <button 
                         onClick={() => onKick(userId, 10)}
                         disabled={isMe}
                         className={cn(
                           "flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all shadow-lg",
                           isMe && "opacity-20 grayscale"
                         )}
                       >
                          <Ban className="h-6 w-6 text-red-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-500/80">Kick out</span>
                       </button>
                    </div>
                 </div>
               )}

               <div className="w-full border-t border-white/5 bg-black/40 px-10 py-8 flex items-center justify-between mt-auto">
                  <button className="flex flex-col items-center gap-2 group active:scale-90 transition-transform">
                     <AtSign className="h-7 w-7 text-white/40 group-hover:text-white transition-colors" />
                     <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white">at</span>
                  </button>

                  <button className="flex flex-col items-center gap-2 group active:scale-90 transition-transform">
                     <Plus className="h-7 w-7 text-white/40 group-hover:text-white transition-colors" strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white">Follow</span>
                  </button>

                  <button className="flex flex-col items-center gap-2 group active:scale-90 transition-transform">
                     <MessageCircle className="h-7 w-7 text-white/40 group-hover:text-white transition-colors" />
                     <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white">Chat</span>
                  </button>

                  <button 
                    onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
                    className="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
                  >
                     <div className="relative">
                        <GiftIcon className="h-7 w-7 text-yellow-500 fill-yellow-500 animate-reaction-heartbeat" />
                        <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-20" />
                     </div>
                     <span className="text-[10px] font-black uppercase text-yellow-500">Gift</span>
                  </button>
               </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
