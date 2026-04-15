'use client';

import { useState, useMemo } from 'react';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle,
 DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
 Loader, 
 Users, 
 Star, 
 Sparkles, 
 ChevronRight, 
 Home, 
 X, 
 MoreVertical,
 ShieldCheck,
 UserMinus,
 UserPlus
} from 'lucide-react';
import { 
 useFirestore, 
 useCollection, 
 useMemoFirebase, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { 
 collection, 
 query, 
 orderBy, 
 limit, 
 doc, 
 arrayUnion, 
 arrayRemove 
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 DropdownMenu, 
 DropdownMenuContent, 
 DropdownMenuItem, 
 DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface RoomInfoDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 room: any;
 isOwner: boolean;
 isAdmin: boolean;
}

const UserRow = ({ 
 uid, 
 role, 
 isOwnerUser, 
 onToggleAdmin 
}: { 
 uid: string, 
 role?: 'owner' | 'admin' | 'follower', 
 isOwnerUser: boolean,
 onToggleAdmin?: (uid: string, isCurrentlyAdmin: boolean) => void 
}) => {
 const { userProfile: profile, isLoading } = useUserProfile(uid);

 if (isLoading) return <div className="h-16 w-full bg-gray-50/50 animate-pulse rounded-xl mb-1" />;
 if (!profile) return null;

 const isModerator = role === 'admin';

 return (
  <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-all rounded-2xl group">
   <div className="flex items-center gap-3">
    <Avatar className={cn(
     "h-12 w-12 border-2",
     role === 'owner' ? "border-yellow-400" : role === 'admin' ? "border-purple-400" : "border-white"
    )}>
     <AvatarImage src={profile.avatarUrl || undefined} />
     <AvatarFallback>{(profile.username || 'U').charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
     <div className="flex items-center gap-1.5">
      <span className="font-bold text-sm text-gray-900 truncate max-w-[120px]">{profile.username}</span>
      {role === 'owner' && <span className="bg-yellow-400 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Owner</span>}
      {role === 'admin' && <span className="bg-purple-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Admin</span>}
     </div>
     <div className="flex items-center gap-1 mt-0.5">
       <div className={cn("h-3 w-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white", profile.gender === 'Female' ? "bg-pink-400" : "bg-blue-400")}>
        {profile.gender === 'Female' ? '♀' : '♂'}
       </div>
       <div className="bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full">
        <Star className="h-2 w-2 text-white fill-current" />
        <span className="text-[7px] font-black text-white italic">Lv.{profile.level?.rich || 1}</span>
       </div>
     </div>
    </div>
   </div>

   {isOwnerUser && role !== 'owner' && (
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><MoreVertical className="h-4 w-4 text-gray-400" /></button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-gray-100">
      <DropdownMenuItem 
        onClick={() => onToggleAdmin?.(uid, isModerator)}
        className="flex items-center gap-2 p-2 focus:bg-primary/5 focus:text-primary rounded-lg cursor-pointer"
      >
        {isModerator ? (
          <><UserMinus className="h-4 w-4" /> <span className="text-sm font-bold">Remove Admin</span></>
        ) : (
          <><UserPlus className="h-4 w-4" /> <span className="text-sm font-bold">Set as Admin</span></>
        )}
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   )}
  </div>
 );
};

export function RoomInfoDialog({ open, onOpenChange, room, isOwner, isAdmin }: RoomInfoDialogProps) {
 const firestore = useFirestore();

 // Level Calculation Logic
 const currentExp = room.levelPoints || 0;
 const currentLevel = Math.floor(Math.sqrt(currentExp / 100)) + 1;
 const nextLevelExp = Math.pow(currentLevel, 2) * 100;
 const prevLevelExp = Math.pow(currentLevel - 1, 2) * 100;
 const progress = ((currentExp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100;

 const followersQuery = useMemoFirebase(() => {
  if (!firestore || !room.id) return null;
  return query(collection(firestore, 'chatRooms', room.id, 'followers'), orderBy('followedAt', 'desc'), limit(100));
 }, [firestore, room.id]);

 const { data: followers, isLoading } = useCollection(followersQuery);

 const handleToggleAdmin = (uid: string, isCurrentlyAdmin: boolean) => {
  if (!firestore || !room.id || !isOwner) return;
  const roomRef = doc(firestore, 'chatRooms', room.id);
  updateDocumentNonBlocking(roomRef, {
   moderatorIds: isCurrentlyAdmin ? arrayRemove(uid) : arrayUnion(uid)
  });
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent hideClose={true} className="max-w-full sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] border-none shadow-2xl overflow-hidden font-sans bottom-0 top-auto fixed translate-y-0 animate-in slide-in-from-bottom duration-500">
    
    <Tabs defaultValue="profile" className="w-full">
     <div className="relative border-b border-gray-50 flex items-center justify-center pt-8 pb-4">
      <TabsList className="bg-transparent gap-8">
       <TabsTrigger value="profile" className="text-lg font-bold p-0 bg-transparent data-[state=active]:text-black data-[state=inactive]:text-gray-300 border-none shadow-none">Profile</TabsTrigger>
       <TabsTrigger value="member" className="text-lg font-bold p-0 bg-transparent data-[state=active]:text-black data-[state=inactive]:text-gray-300 border-none shadow-none">Member</TabsTrigger>
      </TabsList>
      <button onClick={() => onOpenChange(false)} className="absolute right-6 top-8 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6 text-gray-400" /></button>
     </div>

     <div className="max-h-[70vh] min-h-[50vh] overflow-hidden">
      <TabsContent value="profile" className="p-6 m-0 focus-visible:ring-0">
       <div className="flex items-start gap-5 mb-8">
        <Avatar className="h-24 w-24 rounded-3xl shadow-2xl border-2 border-white">
         <AvatarImage src={room.coverUrl || undefined} className="object-cover" />
         <AvatarFallback>UM</AvatarFallback>
        </Avatar>
        <div className="flex-1 pt-2">
         <h2 className="text-xl font-black text-gray-900 leading-none mb-2">{room.title}</h2>
         <div className="space-y-1">
          <div className="flex justify-between items-end mb-1">
           <span className="text-cyan-500 font-black italic text-xs leading-none">Lv.{currentLevel}</span>
           <span className="text-[10px] font-bold text-gray-400 italic leading-none">Lv.{currentLevel + 1}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
           <div className="h-full bg-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[9px] font-black text-gray-300 tracking-tighter text-right uppercase">{currentExp} / {nextLevelExp}</p>
         </div>
        </div>
       </div>

       <div className="space-y-6">
        <div>
         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Member</label>
         <p className="text-sm font-black text-gray-800 tracking-tight">{room.participantCount || 0}</p>
        </div>

        <div>
         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Announcement:</label>
         <p className="text-xs font-normal text-gray-600 leading-relaxed whitespace-pre-wrap">{room.announcement || "No announcement set."}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Tag</label>
          <p className="text-sm font-black text-gray-800 tracking-tight">{room.category || 'Game'}</p>
         </div>
         <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Room Language</label>
          <p className="text-sm font-black text-gray-800 tracking-tight">{room.language || 'Hindi'}</p>
         </div>
        </div>
       </div>
      </TabsContent>

      <TabsContent value="member" className="m-0 h-full flex flex-col focus-visible:ring-0">
       <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">RoomAdmin Number: <span className="text-black">{(room.moderatorIds?.length || 0)}/10</span></span>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Member: <span className="text-black">{followers?.length || 0}</span></span>
       </div>
       <ScrollArea className="flex-1 p-3">
        <div className="space-y-0.5">
         <UserRow uid={room.ownerId} role="owner" isOwnerUser={isOwner} />
         {room.moderatorIds?.filter((mid: string) => mid !== room.ownerId).map((mid: string) => (
          <UserRow key={mid} uid={mid} role="admin" isOwnerUser={isOwner} onToggleAdmin={handleToggleAdmin} />
         ))}
         {isLoading ? (
          <div className="py-20 flex justify-center w-full"><Loader className="animate-spin text-primary h-8 w-8" /></div>
         ) : followers?.filter(f => f.uid !== room.ownerId && !room.moderatorIds?.includes(f.uid)).map(f => (
          <UserRow key={f.uid} uid={f.uid} role="follower" isOwnerUser={isOwner} onToggleAdmin={handleToggleAdmin} />
         ))}
        </div>
       </ScrollArea>
      </TabsContent>
     </div>
    </Tabs>
   </DialogContent>
  </Dialog>
 );
}
