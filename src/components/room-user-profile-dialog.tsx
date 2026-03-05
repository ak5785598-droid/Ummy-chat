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
  Volume2,
  MicOff,
  Ban,
  Crown,
  ShieldCheck,
  Loader,
  LogOut,
  Mic,
  Clock,
  UserCheck,
  UserX
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
  isOwner: boolean; // Viewer is owner
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
 * High-Fidelity Room User Card.
 * Management row (Kick, Seat Leave, Mute) is strictly visible to Room Owner/Admin.
 * OWNER IMMUNITY: Admins cannot kick, mute, or force-remove the Room Owner.
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

  if (!userId) return null;

  const handleCopyId = () => {
    if (profile?.specialId) {
      navigator.clipboard.writeText(profile.specialId);
      toast({ title: 'ID Copied', description: 'Tribe ID secured to clipboard.' });
    }
  };

  const isTargetOwner = userId === roomOwnerId;
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
            {/* Top Action Bar */}
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
                     <DropdownMenuItem className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer">
                        <ShieldAlert className="h-4 w-4 text-gray-400" />
                        <span className="font-black uppercase text-[10px]">Report Identity</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            {/* Profile Content */}
            <div className="pt-16 pb-8 flex flex-col items-center w-full px-6">
               <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl" className="mb-4">
                  <Avatar className="h-28 w-28 border-4 border-white/10 shadow-2xl">
                     <AvatarImage src={profile.avatarUrl} />
                     <AvatarFallback className="text-3xl bg-slate-800">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
               </AvatarFrame>

               <h2 className="text-2xl font-black uppercase tracking-tighter drop-shadow-md">{profile.username}</h2>
               
               <div className="flex items-center gap-1 mt-1 mb-4" onClick={handleCopyId}>
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">ID:{profile.specialId}</span>
                  <Copy className="h-3 w-3 text-white/20 cursor-pointer" />
               </div>

               <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
                  <span className="text-sm">🇮🇳</span>
                  <div className="bg-cyan-500 rounded-full h-4 w-4 flex items-center justify-center text-[8px] font-black">♂</div>
                  <Badge className="bg-gradient-to-r from-cyan-400 to-blue-600 border-none h-4 text-[8px] font-black px-2 uppercase">Lv. {profile.level?.rich || 1}</Badge>
                  <Badge className="bg-gradient-to-r from-purple-400 to-pink-600 border-none h-4 text-[8px] font-black px-2 uppercase">Lv. {profile.level?.charm || 1}</Badge>
                  {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                  {profile.tags?.includes('Seller') && <SellerTag size="sm" />}
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

               {/* Achievement Rows */}
               <div className="w-full space-y-3 mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 group active:bg-white/10 transition-all cursor-pointer">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-white/60 uppercase">Badge · 0</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 border border-black/20 shadow-sm" />
                           ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/20" />
                     </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 group active:bg-white/10 transition-all cursor-pointer">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-white/60 uppercase">Gift · {(profile.stats?.fans || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                           {['🌹', '💖', '💍'].map((emoji, i) => (
                             <div key={i} className="h-6 w-6 rounded-full bg-black/40 flex items-center justify-center text-[10px] border border-white/10">{emoji}</div>
                           ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/20" />
                     </div>
                  </div>
               </div>

               {/* Bottom High-Fidelity Action Portals */}
               <div className="w-full space-y-4">
                  <div className="grid grid-cols-4 gap-4 px-2">
                    <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                       <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20 border border-white/10">
                          <UserPlus className="h-7 w-7 text-white" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Follow</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                       <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10">
                          <Bell className="h-7 w-7 text-white" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Reminder</span>
                    </div>

                    <DirectMessageDialog 
                      recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl }} 
                      trigger={
                        <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                           <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
                              <MessageCircle className="h-7 w-7 text-white" />
                           </div>
                           <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Message</span>
                        </div>
                      }
                    />

                    <div 
                      onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl }); }}
                      className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer"
                    >
                       <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
                          <GiftIcon className="h-7 w-7 text-white fill-current" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Send Gift</span>
                    </div>
                  </div>

                  {/* Management Row: OWNER IMMUNITY ENFORCED */}
                  {(canManage || isMe) && (
                    <div className="grid grid-cols-3 gap-4 px-2 pt-4 border-t border-white/10">
                       
                       {/* Mute: Admin only on non-owners */}
                       {canManage && !isMe && !isTargetOwner ? (
                         <div 
                           onClick={() => onSilence(userId, isSilenced)}
                           className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer"
                         >
                            <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10",
                              isSilenced ? "bg-gradient-to-br from-green-400 to-green-600" : "bg-gradient-to-br from-orange-400 to-orange-600"
                            )}>
                               {isSilenced ? <Mic className="h-7 w-7 text-white" /> : <MicOff className="h-7 w-7 text-white" />}
                            </div>
                            <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">{isSilenced ? 'Unmute' : 'Mute'}</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-2 opacity-20 pointer-events-none">
                            <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10">
                               <MicOff className="h-7 w-7 text-white/40" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-white/20 tracking-tight">Mute</span>
                         </div>
                       )}

                       {/* Seat Leave: Allowed for Self OR Admin on non-owners */}
                       {isMe || (canManage && !isTargetOwner) ? (
                         <div 
                           onClick={() => onLeaveSeat(userId)}
                           className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer"
                         >
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-white/10">
                               <LogOut className="h-7 w-7 text-black" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">
                              {isMe ? 'Leave Seat' : 'Seat Leave'}
                            </span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-2 opacity-20 pointer-events-none">
                            <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10">
                               <LogOut className="h-7 w-7 text-white/40" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-white/20 tracking-tight">Seat Leave</span>
                         </div>
                       )}

                       {/* Kick Out: Admin only on non-owners */}
                       {canManage && !isMe && !isTargetOwner ? (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <div className="flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer">
                                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
                                     <Ban className="h-7 w-7 text-white" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">Kick Out</span>
                               </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white rounded-[1.5rem] p-2 min-w-[160px] shadow-2xl">
                               <div className="px-3 py-2 border-b border-white/5 mb-1">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Exclusion Duration</p>
                               </div>
                               <DropdownMenuItem onClick={() => onKick(userId, 5)} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span className="font-black uppercase text-[10px]">5 Minutes</span>
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => onKick(userId, 60)} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer">
                                  <Clock className="h-4 w-4 text-orange-400" />
                                  <span className="font-black uppercase text-[10px]">1 Hour</span>
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => onKick(userId, 1440)} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer text-red-400">
                                  <Ban className="h-4 w-4" />
                                  <span className="font-black uppercase text-[10px]">24 Hours</span>
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                       ) : (
                         <div className="opacity-20 pointer-events-none flex flex-col items-center gap-2">
                            <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10">
                               <Ban className="h-7 w-7 text-white/40" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-white/20 tracking-tight">Kick Out</span>
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