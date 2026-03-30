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
 Users,
 Zap
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
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { BudgetTag } from '@/components/budget-tag';

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
 onOpenChat?: (recipient: any) => void;
 onMention: (username: string) => void;
 isSilenced: boolean;
 isMe: boolean;
}

const LevelBadge = ({ level, type }: { level: number, type: 'rich' | 'charm' }) => (
 <div className={cn(
  "flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/20 shadow-sm shrink-0",
  type === 'rich' ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-pink-400 to-pink-600"
 )}>
  {type === 'rich' ? <Star className="h-2 w-2 fill-white text-white" /> : <Sparkles className="h-2 w-2 fill-white text-white" />}
  <span className="text-[8px] font-bold text-white">{level}</span>
 </div>
);

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
 <div className={cn(
  "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm",
  gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
 )}>
  {gender === 'Female' ? '♀' : '♂'}
 </div>
);

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
 onOpenChat,
 onMention,
 isSilenced,
 isMe
}: RoomUserProfileDialogProps) {
 const { userProfile: profile, isLoading } = useUserProfile(userId || undefined);
 const { toast } = useToast();
 const router = useRouter();
 const [showPropose, setShowPropose] = React.useState(false);

 if (!userId) return null;

 const handleCopyId = () => {
  const idToCopy = profile?.accountNumber || userId;
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
   navigator.clipboard.writeText(idToCopy).then(() => {
    toast({ title: 'ID Copied' });
   }).catch(() => {
    toast({ variant: 'destructive', title: 'Copy Failed' });
   });
  } else {
   toast({ variant: 'destructive', title: 'Clipboard Unavailable' });
  }
 };

 const handleViewFullProfile = () => {
  onOpenChange(false);
  router.push(`/profile/${userId}`);
 };

 const handleRemoveFrame = async () => {
  try {
    const { updateDocumentNonBlocking } = await import('@/lib/firebase/firestore-utils');
    await updateDocumentNonBlocking('users', userId, {
      'inventory.activeFrame': 'None'
    });
    toast({ title: 'Frame Removed' });
    onOpenChange(false);
  } catch (error) {
    toast({ variant: 'destructive', title: 'Action Failed' });
  }
 };

 const isOfficial = profile?.tags?.includes('Official');
 const isSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));
 const isCS = profile?.tags?.includes('Customer Service');
 const isCSLeader = profile?.tags?.includes('CS Leader');
 const isBudget = profile?.isBudgetId;

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[400px] border-none p-0 rounded-t-[3rem] md:rounded-3xl overflow-hidden shadow-2xl bg-white text-black font-sans animate-in slide-in-from-bottom-10 duration-500">
    <DialogHeader className="sr-only">
     <DialogTitle>User Profile</DialogTitle>
     <DialogDescription>Identity Sync</DialogDescription>
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
        <AvatarFrame frameId={profile.inventory?.activeFrame || 'None'} size="xl">
         <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-xl">
           <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
           <AvatarFallback className="text-3xl bg-slate-100 text-slate-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
         </Avatar>
        </AvatarFrame>
      </div>

      <div className="text-center space-y-2 mb-4 w-full px-6">
        <div className="flex flex-wrap justify-center items-center gap-2">
         <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
         <span className="text-lg leading-none">🇮🇳</span>
         <GenderCircle gender={profile.gender} />
         <LevelBadge level={profile.level?.rich || 1} type="rich" />
         <LevelBadge level={profile.level?.charm || 1} type="charm" />
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-1 mt-1.5">
         {isOfficial && <OfficialTag size="sm" className="scale-75 origin-center" />}
         {isCSLeader && <CsLeaderTag size="sm" className="scale-75 origin-center ml-1" />}
         {isSeller && <SellerTag size="sm" className="scale-75 origin-center ml-1" />}
         {isCS && <CustomerServiceTag size="sm" className="scale-75 origin-center ml-1" />}
         {isBudget && <BudgetTag size="sm" className="scale-75 origin-center ml-1" />}
         
         {profile.relationship && profile.relationship.type !== 'None' && (
           <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full animate-in zoom-in duration-300">
              <Heart className="h-3 w-3 text-rose-500 fill-current" />
              <span className="text-[9px] font-black uppercase text-rose-500 tracking-tight">
                {profile.relationship.type}: {profile.relationship.partnerName}
              </span>
           </div>
         )}
        </div>
      </div>

       <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-8">
        <div className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={handleCopyId}>
          <span>ID:{profile.accountNumber}</span>
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
         <span className="font-bold text-[10px] uppercase text-pink-500">Follow</span>
        </button>

        <button 
         onClick={() => onOpenChat?.(profile)}
         className="flex items-center gap-2 group active:scale-95 transition-transform"
        >
         <MessageSquare className="h-6 w-6 text-gray-800" strokeWidth={2.5} />
         <span className="font-bold text-[10px] uppercase text-gray-800">Chat</span>
        </button>

        <button 
         onClick={() => onMention(profile.username)}
         className="p-2 text-gray-800 hover:bg-gray-50 rounded-full transition-colors active:scale-90"
        >
         <AtSign className="h-6 w-6" strokeWidth={3} />
        </button>

        <button 
         onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
         className="relative h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
         <GiftIcon className="h-6 w-6 text-white fill-white" />
        </button>

        {!isMe && (!profile.relationship || profile.relationship.type === 'None') && (
          <button 
           onClick={() => setShowPropose(true)}
           className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
          >
           <Zap className="h-5 w-5 fill-current" />
          </button>
        )}
      </div>

      {isMe && (
       <div className="w-full px-10 mb-8 flex flex-col gap-3">
         <button 
          onClick={handleRemoveFrame}
          className="w-full h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center gap-2 font-bold uppercase text-[10px] shadow-sm active:scale-95 transition-all border border-slate-200"
         >
          <LogOut className="h-4 w-4" />
          Remove Frame
         </button>

         <button 
          onClick={() => onLeaveSeat(userId)}
          className="w-full h-14 rounded-full bg-[#00E676] text-white flex items-center justify-center gap-3 font-bold uppercase text-lg shadow-xl shadow-green-500/20 active:scale-95 transition-all"
         >
          <Mic className="h-6 w-6 rotate-180" />
          Seat leave
         </button>
       </div>
      )}

      {canManage && !isMe && (
       <div className="w-full border-t border-gray-50 py-6 px-8 animate-in fade-in duration-500">
         <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
          <button onClick={() => onSilence(userId, isSilenced)} className="hover:text-primary transition-colors">{isSilenced ? 'Unmute' : 'Mute'}</button>
          <span className="opacity-20 text-lg">|</span>
          <button onClick={() => onLeaveSeat(userId)} className="hover:text-orange-600 transition-colors">Leave</button>
          <span className="opacity-20 text-lg">|</span>
          <button onClick={() => { toast({ title: 'Slot Locked' }); onOpenChange(false); }} className="hover:text-indigo-600 transition-colors">Lock</button>
          <span className="opacity-20 text-lg">|</span>
          <button onClick={() => onKick(userId, 10)} className="hover:text-red-600 transition-colors">Kick out</button>
         </div>
       </div>
      )}
     </div>
    ) : null}
   </DialogContent>

   {profile && (
     <CPProposeDialog 
       isOpen={showPropose}
       onClose={() => setShowPropose(false)}
       targetUser={{
         uid: profile.id,
         username: profile.username,
         avatarUrl: profile.avatarUrl
       }}
     />
   )}
  </Dialog>
 );
}
