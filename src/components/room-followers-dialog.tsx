'use client';

import React, { useMemo } from 'react';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle,
 DialogDescription
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader, User as UserIcon, Star, Sparkles, ChevronLeft, Home } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/use-user-profile';

const RichLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Star className="h-2 w-2 fill-white text-white" />
  <span className="text-[8px] font-bold text-white">Lv.{level}</span>
 </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Sparkles className="h-2 w-2 fill-white text-white" />
  <span className="text-[8px] font-bold text-white">Lv.{level}</span>
 </div>
);

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
 <div className={cn(
  "h-3.5 w-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0 shadow-sm",
  gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
 )}>
  {gender === 'Female' ? '♀' : '♂'}
 </div>
);

const UserListItem = ({ uid, role, showBadges = false }: { uid: string, role?: 'owner' | 'admin' | 'follower', showBadges?: boolean }) => {
 const { userProfile: profile, isLoading } = useUserProfile(uid);

 if (isLoading) return (
  <div className="flex items-center gap-4 p-4 animate-pulse">
   <div className="h-12 w-12 bg-gray-100 rounded-full" />
   <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded w-1/3" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
  </div>
 );

 if (!profile) return null;

 return (
  <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
   <div className="relative shrink-0">
    <Avatar className={cn(
     "h-14 w-14 border-2 shadow-sm",
     role === 'owner' ? "border-yellow-400" : role === 'admin' ? "border-green-400" : "border-white"
    )}>
     <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
     <AvatarFallback className="bg-slate-100 text-slate-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
    </Avatar>
    {role === 'owner' && (
     <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white shadow-md">
       <Home className="h-3 w-3 text-white fill-current" />
     </div>
    )}
    {role === 'admin' && (
     <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow-md">
       <Home className="h-3 w-3 text-white fill-current" />
     </div>
    )}
   </div>

   <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1">
      <h4 className="font-bold text-sm text-gray-900 truncate uppercase tracking-tight">{profile.username}</h4>
      {showBadges && (
       <div className="flex items-center gap-1">
        <span className="text-xs">🇮🇳</span>
        <GenderCircle gender={profile.gender} />
       </div>
      )}
    </div>
    
    {showBadges && (
     <div className="flex items-center gap-1.5">
       <RichLevelBadge level={profile.level?.rich || 1} />
       <CharmLevelBadge level={profile.level?.charm || 1} />
     </div>
    )}
   </div>
  </div>
 );
};

interface RoomFollowersDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 room: any;
}

/**
 * High-Fidelity Room Follower Roster.
 */
export function RoomFollowersDialog({ open, onOpenChange, room }: RoomFollowersDialogProps) {
 const firestore = useFirestore();

 const followersQuery = useMemoFirebase(() => {
  if (!firestore || !room.id) return null;
  return query(collection(firestore, 'chatRooms', room.id, 'followers'), orderBy('followedAt', 'desc'), limit(100));
 }, [firestore, room.id]);

 const { data: followers, isLoading } = useCollection(followersQuery);

 const filteredFollowers = useMemo(() => {
  if (!followers) return [];
  // Exclude owner and moderators from the base follower list to avoid duplicates
  const staffIds = new Set([room.ownerId, ...(room.moderatorIds || [])]);
  return followers.filter(f => !staffIds.has(f.uid));
 }, [followers, room.ownerId, room.moderatorIds]);

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[450px] h-[80vh] md:h-[600px] p-0 border-none bg-white text-black rounded-t-[3rem] md:rounded-3xl flex flex-col font-sans shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-500">
    <DialogHeader className="p-6 pt-10 border-b border-gray-50 shrink-0">
      <div className="flex items-center gap-4">
       <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full">
         <ChevronLeft className="h-6 w-6 text-gray-800" />
       </button>
       <div>
         <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Followers</DialogTitle>
         <DialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tribal Hierarchy & Fans</DialogDescription>
       </div>
      </div>
    </DialogHeader>

    <ScrollArea className="flex-1">
      <div className="pb-10">
       {/* Room Owner Section */}
       <div className="px-4 py-2 bg-yellow-50/30 border-b border-yellow-100/50">
         <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-600/60 ml-2">Sovereign Owner</span>
       </div>
       <UserListItem uid={room.ownerId} role="owner" showBadges />

       {/* Room Admins Section */}
       {room.moderatorIds && room.moderatorIds.length > 0 && (
        <>
         <div className="px-4 py-2 bg-green-50/30 border-b border-green-100/50 mt-4">
           <span className="text-[9px] font-bold uppercase tracking-wider text-green-600/60 ml-2">Authority Protocol</span>
         </div>
         {room.moderatorIds.filter((mid: string) => mid !== room.ownerId).map((mid: string) => (
          <UserListItem key={mid} uid={mid} role="admin" showBadges />
         ))}
        </>
       )}

       {/* Followers Section */}
       <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 mt-4">
         <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 ml-2">Fans Dimension ({filteredFollowers.length})</span>
       </div>
       {isLoading ? (
        <div className="py-20 flex justify-center w-full"><Loader className="animate-spin text-primary h-8 w-8" /></div>
       ) : filteredFollowers.length > 0 ? (
        filteredFollowers.map(f => <UserListItem key={f.uid} uid={f.uid} role="follower" />)
       ) : (
        <div className="py-20 text-center opacity-20 ">No fans detected in this frequency.</div>
       )}
      </div>
    </ScrollArea>
   </DialogContent>
  </Dialog>
 );
}
