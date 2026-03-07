
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
  User
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
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DirectMessageDialog } from '@/components/direct-message-dialog';

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
 * Re-engineered to include prominent Gift Dispatch portal.
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
    if (profile?.specialId) {
      navigator.clipboard.writeText(profile.specialId);
      toast({ title: 'ID Copied' });
    }
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
                  <DropdownMenuContent className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
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
               
               <div className="flex items-center gap-1 mt-1 mb-4" onClick={handleCopyId}>
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">ID:{profile.specialId}</span>
                  <Copy className="h-3 w-3 text-white/20 cursor-pointer" />
               </div>

               <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
                  <span className="text-sm">🇮🇳</span>
                  <Badge className="bg-gradient-to-r from-cyan-400 to-blue-600 border-none h-4 text-[8px] font-black px-2 uppercase shadow-sm">Lv. {profile.level?.rich || 1}</Badge>
                  {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
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

               <div className="w-full space-y-4">
                  {/* Primary Action Grid */}
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
                          <GiftIcon className="h-7 w-7 text-white fill-current" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Send Gift</span>
                    </div>
                  </div>

                  {/* Secondary Actions Protocol */}
                  <div className="grid grid-cols-4 gap-4 px-2 pt-4 border-t border-white/10">
                     {/* HIGH-FIDELITY GIFT OPTIMIZATION: Send Gift next to Mute */}
                     {!isMe && (
                       <div 
                         onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
                         className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer"
                       >
                          <div className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center shadow-lg border border-white/10">
                             <GiftIcon className="h-7 w-7 text-pink-400 fill-current animate-pulse" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Gift</span>
                       </div>
                     )}

                     {canManage && !isMe ? (
                       <div onClick={() => onSilence(userId, isSilenced)} className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10", isSilenced ? "bg-gradient-to-br from-green-400 to-green-600" : "bg-gradient-to-br from-orange-400 to-orange-600")}>
                             {isSilenced ? <Mic className="h-7 w-7 text-white" /> : <MicOff className="h-7 w-7 text-white" />}
                          </div>
                          <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">{isSilenced ? 'Unmute' : 'Mute'}</span>
                       </div>
                     ) : null}

                     {(isMe || (canManage && !isMe)) ? (
                       <div onClick={() => onLeaveSeat(userId)} className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-white/10">
                             <LogOut className="h-7 w-7 text-black" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">{isMe ? 'Leave' : 'Force'}</span>
                       </div>
                     ) : null}

                     {canManage && !isMe ? (
                       <div onClick={() => onKick(userId, 5)} className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
                             <Ban className="h-7 w-7 text-white" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Kick</span>
                       </div>
                     ) : null}
                  </div>
               </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
