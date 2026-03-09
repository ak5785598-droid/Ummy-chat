'use client';

import React from 'react';
import { 
  X, 
  MoreHorizontal, 
  Copy, 
  MessageCircle, 
  UserPlus, 
  Bell, 
  Gift as GiftIcon,
  ChevronRight,
  ShieldAlert,
  MicOff,
  Ban,
  Crown,
  ShieldCheck,
  Loader,
  LogOut,
  Mic,
  Clock,
  UserCheck,
  UserX,
  User,
  Heart,
  Plus,
  Check
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
import { DirectMessageDialog } from '@/components/direct-message-dialog';
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

const SpecialIdBadge = ({ id, color = 'red', onClick }: { id: string, color?: string, onClick?: () => void }) => {
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

const CenterTag = ({ label, gradient }: { label: string, gradient: string }) => (
  <div className={cn("px-3 py-0.5 rounded-full border border-white/30 shadow-lg animate-shimmer-gold relative overflow-hidden", gradient)}>
    <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
    <span className="text-[8px] font-black text-white uppercase italic tracking-tighter relative z-10">{label}</span>
  </div>
);

/**
 * High-Fidelity Tribe Member Identity Card.
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

  const isTargetPMod = roomModeratorIds.includes(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-none p-0 rounded-[2.5rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
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
            <div className="w-full flex justify-between items-center p-6 absolute top-0 left-0 z-50">
               <button onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white transition-colors">
                  <ChevronRight className="h-6 w-6 rotate-180" />
               </button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-white/40 hover:text-white transition-colors">
                       <MoreHorizontal className="h-6 w-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-white/5 text-card-foreground rounded-2xl p-2 w-48 shadow-2xl">
                     {isOwner && !isMe && (
                       <DropdownMenuItem onClick={() => onToggleMod(userId)} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl text-blue-400 cursor-pointer">
                          {isTargetPMod ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          <span className="font-black uppercase text-[10px]">{isTargetPMod ? 'Revoke Admin' : 'Make Admin'}</span>
                       </DropdownMenuItem>
                     )}
                     <DropdownMenuItem onClick={handleViewFullProfile} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-black uppercase text-[10px]">View Full Profile</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <div className="pt-16 pb-8 flex flex-col items-center w-full px-6">
               <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl" className="mb-4">
                  <button onClick={handleViewFullProfile}>
                    <Avatar className="h-28 w-28 border-4 border-white/10 shadow-2xl hover:scale-105 transition-transform">
                       <AvatarImage src={profile.avatarUrl || undefined} />
                       <AvatarFallback className="text-3xl bg-slate-800">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
               </AvatarFrame>

               <h2 className="text-2xl font-black uppercase tracking-tighter drop-shadow-md">{profile.username}</h2>
               
               <div className="flex flex-wrap items-center justify-center gap-2 mt-1 mb-4">
                  <div className="flex items-center gap-1">
                     {profile.specialId && <SpecialIdBadge id={profile.specialId} color={profile.specialIdColor} onClick={handleCopyId} />}
                     {!profile.specialId && (
                       <div className="flex items-center gap-1 cursor-pointer" onClick={handleCopyId}>
                          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">ID:{profile.id.slice(0, 6)}</span>
                          <Copy className="h-3 w-3 text-white/20" />
                       </div>
                     )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                     {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                     {profile.tags?.includes('Seller') && <SellerTag size="sm" />}
                     {profile.tags?.includes('Customer Service') && <CustomerServiceTag size="sm" />}
                     {profile.tags?.includes('Official center') && <CenterTag label="Official center" gradient="bg-gradient-to-r from-indigo-600 to-blue-800" />}
                     {profile.tags?.includes('Seller center') && <CenterTag label="Seller center" gradient="bg-gradient-to-r from-orange-600 to-red-800" />}
                  </div>
               </div>

               <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
                  <span className="text-sm">🇮🇳</span>
                  <Badge className="bg-gradient-to-r from-cyan-400 to-blue-600 border-none h-4 text-[8px] font-black px-2 uppercase shadow-sm">Lv. {profile.level?.rich || 1}</Badge>
               </div>

               <div className="w-full flex justify-around items-center mb-8 px-4">
                  <div className="text-center">
                     <p className="text-lg font-black tracking-tighter">0</p>
                     <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Friends</p>
                  </div>
                  <div className="text-center">
                     <p className="text-lg font-black tracking-tighter">0</p>
                     <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Following</p>
                  </div>
                  <div className="text-center">
                     <p className="text-lg font-black tracking-tighter">{profile.stats?.followers || 0}</p>
                     <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Followers</p>
                  </div>
               </div>

               <div className="w-full space-y-6">
                  <div className="grid grid-cols-4 gap-4 px-2">
                    <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                       <div className="h-14 w-14 rounded-2xl bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#14532d] flex items-center justify-center shadow-lg shadow-green-500/20 border border-white/10">
                          <UserPlus className="h-7 w-7 text-white fill-current" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Follow</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                       <div className="h-14 w-14 rounded-2xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10">
                          <Bell className="h-7 w-7 text-white" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Reminder</span>
                    </div>

                    <DirectMessageDialog 
                      recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} 
                      trigger={
                        <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                           <div className="h-14 w-14 rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
                              <MessageCircle className="h-7 w-7 text-white fill-current" />
                           </div>
                           <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Message</span>
                        </div>
                      }
                    />

                    <div 
                      onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
                      className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer"
                    >
                       <div className="h-14 w-14 rounded-2xl bg-gradient-to-b from-[#d946ef] via-[#9333ea] to-[#581c87] flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
                          <GiftIcon className="h-7 w-7 text-white fill-current animate-pulse" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Gift</span>
                    </div>
                  </div>

                  {!isMe && (
                    <div className="space-y-4 pt-6 border-t border-white/10 w-full">
                       {canManage && (
                         <div className="grid grid-cols-2 gap-4 px-2">
                            <Button 
                              onClick={() => onSilence(userId, isSilenced)}
                              className={cn(
                                "h-14 rounded-2xl font-black uppercase italic text-xs shadow-xl transition-all active:scale-95",
                                isSilenced ? "bg-gradient-to-r from-green-500 to-green-700 text-white" : "bg-gradient-to-r from-orange-500 to-orange-700 text-white"
                              )}
                            >
                               {isSilenced ? <Mic className="mr-2 h-5 w-5" /> : <MicOff className="mr-2 h-5 w-5" />}
                               {isSilenced ? 'Unmute' : 'Mute'}
                            </Button>
                            <Button onClick={() => onLeaveSeat(userId)} variant="outline" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white/60 font-black uppercase text-[10px] italic active:scale-95 transition-all">
                               <LogOut className="mr-2 h-4 w-4" />
                               Seat leave
                            </Button>
                         </div>
                       )}

                       <div className="px-2">
                          <Button 
                            onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
                            className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-black uppercase italic text-lg shadow-xl shadow-rose-500/30 active:scale-95 transition-all group"
                          >
                             <GiftIcon className="mr-3 h-7 w-7 fill-current animate-reaction-heartbeat" />
                             Send Gift
                          </Button>
                       </div>
                       
                       {canManage && (
                         <div className="px-2">
                            <Button onClick={() => onKick(userId, 5)} variant="outline" className="w-full h-12 rounded-2xl bg-red-500/10 border-red-500/20 text-red-500 font-black uppercase text-[10px] italic active:scale-95 transition-all">
                               <Ban className="mr-2 h-4 w-4" />
                               Kick out
                            </Button>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
