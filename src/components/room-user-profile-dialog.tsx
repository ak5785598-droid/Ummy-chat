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
 Zap,
 Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
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
  "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.3)] shrink-0",
  type === 'rich' ? "bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-600" : "bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-600"
 )}>
  <div className="bg-white/20 p-0.5 rounded-full">
    {type === 'rich' ? <Star className="h-2 w-2 fill-white text-white" /> : <Sparkles className="h-2 w-2 fill-white text-white" />}
  </div>
  <span className="text-[9px] font-black text-white italic tracking-tighter">{level}</span>
 </div>
);

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
 <div className={cn(
  "h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-lg border border-white/10",
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
 const firestore = useFirestore();
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
  if (!userId || !firestore) return;
  try {
    const { doc } = await import('firebase/firestore');
    const userRef = doc(firestore, 'users', userId);
    
    updateDocumentNonBlocking(userRef, {
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
   <DialogContent className="sm:max-w-[420px] border-none p-0 rounded-t-[3.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-[#1a1a1a] text-white font-sans animate-in slide-in-from-bottom-20 duration-700">
    <DialogHeader className="sr-only">
     <DialogTitle>User Profile</DialogTitle>
     <DialogDescription>Identity Sync</DialogDescription>
    </DialogHeader>

    {isLoading ? (
     <div className="h-[450px] flex items-center justify-center">
      <Loader className="animate-spin h-8 w-8 text-cyan-400" />
     </div>
    ) : profile ? (
     <div className="flex flex-col items-center relative overflow-hidden">
       {/* Ambient Glows */}
       <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] animate-pulse" />
       
       <div className="w-full flex justify-between p-7 pb-0 relative z-10">
         <button onClick={handleViewFullProfile} className="text-white/20 hover:text-white transition-colors">
          <MoreHorizontal className="h-6 w-6" />
         </button>
         <button className="text-white/20 hover:text-red-500 transition-colors">
          <AlertTriangle className="h-5 w-5" />
         </button>
       </div>

       <div className="mt-2 mb-6 relative z-10 scale-110 mb-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full" />
          <AvatarFrame frameId={profile.inventory?.activeFrame || 'None'} size="xl">
           <Avatar className="h-28 w-28 border-[3px] border-white/10 shadow-2xl">
             <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
             <AvatarFallback className="text-4xl font-bold bg-[#2a2a2a] text-cyan-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
           </Avatar>
          </AvatarFrame>
        </motion.div>
       </div>

       <div className="text-center space-y-3 mb-6 w-full px-8 relative z-10">
         <div className="flex flex-wrap justify-center items-center gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter truncate max-w-[240px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{profile.username}</h2>
          <GenderCircle gender={profile.gender} />
         </div>
         
         <div className="flex flex-wrap justify-center items-center gap-2 mt-1">
          <LevelBadge level={profile.level?.rich || 1} type="rich" />
          <LevelBadge level={profile.level?.charm || 1} type="charm" />
          {isOfficial && <OfficialTag size="sm" className="scale-90 origin-center" />}
          {isCSLeader && <CsLeaderTag size="sm" className="scale-90 origin-center" />}
          {isSeller && <SellerTag size="sm" className="scale-90 origin-center" />}
          {isCS && <CustomerServiceTag size="sm" className="scale-90 origin-center" />}
          {isBudget && <BudgetTag size="sm" className="scale-90 origin-center" />}
         </div>

         {profile.relationship && profile.relationship.type !== 'None' && (
           <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full mx-auto inline-flex animate-in zoom-in duration-500">
              <Heart className="h-4 w-4 text-rose-500 fill-current" />
              <span className="text-[10px] font-black uppercase text-rose-500 tracking-tight">
                {profile.relationship.type}: {profile.relationship.partnerName}
              </span>
           </div>
         )}
       </div>

       <div className="w-[85%] mb-10 overflow-hidden relative z-10">
          <div className="flex items-center justify-around bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/5 shadow-inner">
            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleCopyId}>
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Wafa ID</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-white/90">{profile.accountNumber}</span>
                <Copy className="h-2.5 w-2.5 text-white/20 group-hover:text-white transition-colors" />
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/5" />

            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Followers</span>
              <span className="text-sm font-black text-white/90">{profile.stats?.fans?.toLocaleString() || 0}</span>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Region</span>
              <div className="flex items-center gap-1">
                 <span className="text-sm font-black text-white/90 uppercase">{profile.country?.slice(0, 3) || 'IND'}</span>
                 <span className="text-xs">🇮🇳</span>
              </div>
            </div>
          </div>
       </div>

      <div className="w-full flex items-center justify-around px-8 mb-10 relative z-10">
        <button className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
         <div className="h-14 w-14 rounded-[1.4rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-pink-500/10 group-hover:border-pink-500/30 transition-all shadow-xl">
           <Heart className="h-7 w-7 text-pink-500 transition-colors" strokeWidth={2} />
         </div>
         <span className="font-bold text-[10px] uppercase text-white/40 tracking-tighter">Follow</span>
        </button>

        <button 
         onClick={() => onOpenChat?.(profile)}
         className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
        >
         <div className="h-14 w-14 rounded-[1.4rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all shadow-xl">
           <MessageSquare className="h-7 w-7 text-cyan-400" strokeWidth={2} />
         </div>
         <span className="font-bold text-[10px] uppercase text-white/40 tracking-tighter">Chat</span>
        </button>

        <button 
         onClick={() => onMention(profile.username)}
         className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
        >
         <div className="h-14 w-14 rounded-[1.4rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all shadow-xl">
           <AtSign className="h-7 w-7 text-white/80" strokeWidth={2.5} />
         </div>
         <span className="font-bold text-[10px] uppercase text-white/40 tracking-tighter">Mention</span>
        </button>

        <button 
         onClick={() => { onOpenChange(false); onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' }); }}
         className="relative h-16 w-16 rounded-[1.6rem] bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-[0_10px_25px_rgba(147,51,234,0.4)] active:scale-[0.85] transition-all border border-white/20"
        >
         <GiftIcon className="h-8 w-8 text-white fill-white" />
         <div className="absolute inset-0 bg-white/10 rounded-[1.6rem] opacity-0 hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {isMe && (
       <div className="w-full px-10 mb-8 flex flex-col gap-3 relative z-10">
         <button 
          onClick={handleRemoveFrame}
          className="w-full h-12 rounded-2xl bg-white/5 text-white/50 flex items-center justify-center gap-2 font-bold uppercase text-[10px] shadow-sm active:scale-95 transition-all border border-white/10 hover:bg-white/10"
         >
          <LogOut className="h-4 w-4" />
          Remove Frame
         </button>

         <button 
          onClick={() => onLeaveSeat(userId)}
          className="w-full h-15 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 text-white flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all py-3"
         >
          <span className="font-black uppercase text-lg tracking-tight">Leave Microphone</span>
          <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">End Session</span>
         </button>
       </div>
      )}

      {canManage && !isMe && (
       <div className="w-full border-t border-white/5 bg-black/20 backdrop-blur-sm py-5 px-8 relative z-10">
         <div className="flex items-center justify-around text-[10px] font-black uppercase tracking-widest text-white/30">
          <button onClick={() => onSilence(userId, isSilenced)} className="hover:text-cyan-400 transition-colors">{isSilenced ? 'Unmute' : 'Mute'}</button>
          <div className="h-4 w-px bg-white/5" />
          <button onClick={() => onLeaveSeat(userId)} className="hover:text-orange-400 transition-colors">Down</button>
          <div className="h-4 w-px bg-white/5" />
          <button onClick={() => { toast({ title: 'Slot Locked' }); onOpenChange(false); }} className="hover:text-amber-400 transition-colors">Lock</button>
          <div className="h-4 w-px bg-white/5" />
          <button onClick={() => onKick(userId, 10)} className="hover:text-red-500 transition-colors">Kick</button>
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
