'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  Copy, 
  MessageCircle, 
  UserPlus, 
  Gift as GiftIcon,
  ChevronRight,
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
  AtSign
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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

/**
 * High-Fidelity Tribe Member Identity Card.
 * Re-engineered to match your exact blueprint visual.
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

  const handleMention = () => {
    toast({ title: 'Mention Synced', description: `@${profile?.username} added to draft.` });
    onOpenChange(false);
  };

  const isTargetPMod = roomModeratorIds.includes(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#050505] border-none p-0 rounded-[2.5rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Tribe Member Profile</DialogTitle>
          <DialogDescription>Identity synchronization card.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-[500px] flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : profile ? (
          <div className="relative flex flex-col items-center">
            {/* Top Action Header */}
            <div className="w-full flex justify-end p-6 absolute top-0 right-0 z-50">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                       <MoreHorizontal className="h-6 w-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
                     {isOwner && !isMe && (
                       <DropdownMenuItem onClick={() => onToggleMod(userId)} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl text-blue-400 cursor-pointer">
                          <UserCheck className="h-4 w-4" />
                          <span className="font-black uppercase text-[10px]">{isTargetPMod ? 'Revoke Admin' : 'Make Admin'}</span>
                       </DropdownMenuItem>
                     )}
                     <DropdownMenuItem onClick={handleViewFullProfile} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-black uppercase text-[10px]">Full Profile</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <div className="pt-16 pb-6 flex flex-col items-center w-full">
               {/* Center Avatar Identity */}
               <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl" className="mb-4">
                  <Avatar className="h-28 w-28 border-4 border-white/10 shadow-2xl">
                     <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
                     <AvatarFallback className="text-3xl bg-slate-800">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
               </AvatarFrame>

               <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{profile.username}</h2>
               
               <div className="flex items-center justify-center gap-3 mb-2">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg",
                    profile.gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
                  )}>
                    {profile.gender === 'Female' ? '♀' : '♂'}
                  </div>
                  <span className="text-lg">🇮🇳</span>
                  <div className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform" onClick={handleCopyId}>
                     <span className="text-sm font-bold text-white/60 uppercase tracking-widest">ID: {profile.specialId || profile.id.slice(0, 7)}</span>
                     <Copy className="h-3 w-3 text-white/20" />
                  </div>
               </div>

               {/* Verified Identity Badge */}
               <div className="mb-6">
                  <div className="bg-[#00E676] px-4 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                     <CheckCircle2 className="h-3 w-3 text-white fill-current" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Verified</span>
                  </div>
               </div>

               {/* High-Fidelity Level Cards */}
               <div className="grid grid-cols-2 gap-3 w-full px-6 mb-8">
                  {/* Rich Card */}
                  <div className="bg-gradient-to-br from-[#6a11cb] to-[#2575fc] rounded-2xl p-4 text-white shadow-xl relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col justify-between h-full gap-1">
                        <div className="flex items-center gap-2">
                           <Star className="h-6 w-6 text-white/40 fill-current" />
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase opacity-60">Rich</span>
                              <span className="text-sm font-black italic">Lv {profile.level?.rich || 0}</span>
                           </div>
                        </div>
                        <div className="h-px bg-white/10 w-full my-1" />
                        <p className="text-[8px] font-black uppercase tracking-tighter text-white/80">Mthly Send: 600</p>
                     </div>
                     <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                        <Star className="h-20 w-20 fill-current" />
                     </div>
                  </div>

                  {/* Charm Card */}
                  <div className="bg-gradient-to-br from-[#ff9a9e] via-[#fecfef] to-[#fbc2eb] rounded-2xl p-4 text-white shadow-xl relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col justify-between h-full gap-1">
                        <div className="flex items-center gap-2">
                           <div className="relative">
                              <div className="absolute inset-0 bg-white blur-md opacity-20" />
                              <span className="text-xl relative z-10 drop-shadow-md">✨</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase opacity-60 text-slate-900">Charm</span>
                              <span className="text-sm font-black italic text-slate-900">Lv {profile.level?.charm || 0}</span>
                           </div>
                        </div>
                        <div className="h-px bg-slate-900/10 w-full my-1" />
                        <p className="text-[8px] font-black uppercase tracking-tighter text-slate-900/80">Mthly Received: 2.8K</p>
                     </div>
                     <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                        <Heart className="h-20 w-20 fill-slate-900" />
                     </div>
                  </div>
               </div>

               {/* Admin Commander Section (Dynamic) */}
               {canManage && !isMe && (
                 <div className="w-full px-6 mb-8">
                    <div className="bg-white/5 rounded-3xl p-4 border border-white/5 space-y-4">
                       <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-center mb-2">Sovereign Commands</p>
                       <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => onSilence(userId, isSilenced)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                              isSilenced ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                            )}
                          >
                             {isSilenced ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                             <span className="text-[8px] font-black uppercase">Mute</span>
                          </button>
                          
                          <button 
                            onClick={() => onLeaveSeat(userId)}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 active:scale-95 transition-all"
                          >
                             <LogOut className="h-5 w-5" />
                             <span className="text-[8px] font-black uppercase">Seat leave</span>
                          </button>

                          <button 
                            onClick={() => onKick(userId, 10)}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
                          >
                             <Ban className="h-5 w-5" />
                             <span className="text-[8px] font-black uppercase">Kick out</span>
                          </button>
                       </div>
                    </div>
                 </div>
               )}

               {/* Bottom Action Bar Protocol */}
               <div className="w-full border-t border-white/5 bg-black/40 px-8 py-6 flex items-center justify-between mt-auto">
                  <button onClick={handleMention} className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform">
                     <AtSign className="h-6 w-6 text-white/40 group-hover:text-white transition-colors" />
                     <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white">at</span>
                  </button>

                  <button className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform">
                     <Plus className="h-6 w-6 text-white/40 group-hover:text-white transition-colors" strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white">Follow</span>
                  </button>

                  <button className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform">
                     <MessageCircle className="h-6 w-6 text-white/40 group-hover:text-white transition-colors" />
                     <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white">Chat</span>
                  </button>

                  <button 
                    onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
                    className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform"
                  >
                     <div className="relative">
                        <GiftIcon className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-reaction-heartbeat" />
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
