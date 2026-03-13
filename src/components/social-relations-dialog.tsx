'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader, User as UserIcon, Star, Sparkles, ChevronLeft, Search } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfile } from '@/hooks/use-user-profile';

interface UserListItemProps {
  userId: string;
  onClick: () => void;
}

/**
 * High-Fidelity User List Item.
 * Matches the requested visual: Avatar, Username, Flag, Gender circle, and Dual Level Badges.
 */
const UserListItem = ({ userId, onClick }: UserListItemProps) => {
  const { userProfile: profile, isLoading } = useUserProfile(userId);

  if (isLoading) return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="h-14 w-14 bg-gray-100 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );

  if (!profile) return null;

  const firstLetter = (profile.username || 'U').charAt(0);

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0"
    >
      <Avatar className="h-16 w-16 border-2 border-white shadow-sm shrink-0">
        <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
        <AvatarFallback className="bg-slate-100 text-slate-400 font-black">{firstLetter}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h4 className="font-black text-[16px] text-gray-900 truncate uppercase tracking-tight mb-1">{profile.username}</h4>
        
        <div className="flex items-center gap-2">
          {/* Flag & Gender Signature */}
          <span className="text-base leading-none">🇮🇳</span>
          <div className={cn(
            "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-sm",
            profile.gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
          )}>
            {profile.gender === 'Female' ? '♀' : '♂'}
          </div>

          {/* Rich Level Badge (Cyan Diamond Style) */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 px-2.5 py-0.5 rounded-full border border-white/40 shadow-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
             <Star className="h-2 w-2 fill-white text-white drop-shadow-sm" />
             <span className="text-[9px] font-black text-white drop-shadow-sm leading-none">{profile.level?.rich || 1}</span>
          </div>

          {/* Charm Level Badge (Pink Heart Style) */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 px-2.5 py-0.5 rounded-full border border-white/40 shadow-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
             <Sparkles className="h-2 w-2 fill-white text-white drop-shadow-sm" />
             <span className="text-[9px] font-black text-white drop-shadow-sm leading-none">{profile.level?.charm || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SocialRelationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialTab?: 'followers' | 'following' | 'friends';
  username?: string;
}

/**
 * Social Relations Portal - High-Fidelity Social Graph.
 */
export function SocialRelationsDialog({ open, onOpenChange, userId, initialTab = 'followers', username }: SocialRelationsDialogProps) {
  const firestore = useFirestore();
  const router = useRouter();

  const followersQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'followers'), where('followingId', '==', userId));
  }, [firestore, userId]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'followers'), where('followerId', '==', userId));
  }, [firestore, userId]);

  const { data: followers, isLoading: isFollowersLoading } = useCollection(followersQuery);
  const { data: following, isLoading: isFollowingLoading } = useCollection(followingQuery);

  const friends = useMemo(() => {
    if (!followers || !following) return [];
    const followerIds = new Set(followers.map(f => f.followerId));
    return following.filter(f => followerIds.has(f.followingId));
  }, [followers, following]);

  const handleUserClick = (targetId: string) => {
    onOpenChange(false);
    router.push(`/profile/${targetId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] h-[85vh] md:h-[600px] p-0 border-none bg-white text-black rounded-t-[3rem] md:rounded-[2.5rem] flex flex-col font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
        <DialogHeader className="p-6 pt-10 border-b border-gray-50 flex flex-row items-center gap-4 shrink-0">
           <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
           <div className="flex-1">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter truncate">{username || 'Social Graph'}</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tribal Frequencies</DialogDescription>
           </div>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-white border-b border-gray-50 rounded-none p-0 h-14 justify-around gap-0 shrink-0">
            <TabsTrigger 
              value="followers" 
              className="flex-1 h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black uppercase italic text-xs text-gray-400 data-[state=active]:text-gray-900"
            >
              Fans ({followers?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="flex-1 h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black uppercase italic text-xs text-gray-400 data-[state=active]:text-gray-900"
            >
              Following ({following?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="friends" 
              className="flex-1 h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black uppercase italic text-xs text-gray-400 data-[state=active]:text-gray-900"
            >
              Friend ({friends?.length || 0})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="followers" className="h-full m-0">
              <ScrollArea className="h-full">
                {isFollowersLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4"><Loader className="animate-spin text-primary h-8 w-8" /><p className="text-[10px] font-black uppercase text-gray-300">Syncing Fans...</p></div>
                ) : followers && followers.length > 0 ? (
                  <div className="flex flex-col">
                    {followers.map(f => <UserListItem key={f.id} userId={f.followerId} onClick={() => handleUserClick(f.followerId)} />)}
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-20 italic">No fans detected in this frequency.</div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="following" className="h-full m-0">
              <ScrollArea className="h-full">
                {isFollowingLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4"><Loader className="animate-spin text-primary h-8 w-8" /><p className="text-[10px] font-black uppercase text-gray-300">Syncing Following...</p></div>
                ) : following && following.length > 0 ? (
                  <div className="flex flex-col">
                    {following.map(f => <UserListItem key={f.id} userId={f.followingId} onClick={() => handleUserClick(f.followingId)} />)}
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-20 italic">No following detected.</div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="friends" className="h-full m-0">
              <ScrollArea className="h-full">
                {friends.length > 0 ? (
                  <div className="flex flex-col">
                    {friends.map(f => <UserListItem key={f.id} userId={f.followingId} onClick={() => handleUserClick(f.followingId)} />)}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-20 italic">
                    <UserIcon className="h-12 w-12 mx-auto" />
                    <p className="font-bold text-sm">No mutual friend sync detected.</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}