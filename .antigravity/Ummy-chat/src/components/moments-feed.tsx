'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

/**
 * High-Fidelity Moments Feed.
 * Displays the latest status updates and broadcasts from the social graph.
 * Features safe date formatting to prevent hydration sync errors.
 */
export function MomentsFeed() {
 const firestore = useFirestore();
 const { user } = useUser();

 const momentsQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(collection(firestore, 'moments'), orderBy('createdAt', 'desc'), limit(20));
 }, [firestore, user]);

 const { data: moments, isLoading } = useCollection(momentsQuery);

 if (isLoading) {
  return (
   <div className="flex flex-col items-center py-20 gap-4">
    <Loader className="animate-spin text-primary h-8 w-8" />
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tuning Social Frequencies...</p>
   </div>
  );
 }

 if (!moments || moments.length === 0) {
  return (
   <div className="py-20 text-center space-y-4 opacity-40 ">
    <MessageCircle className="h-12 w-12 mx-auto" />
    <p className="font-sans text-lg uppercase tracking-wider">No moments have been published yet.</p>
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {moments.map((moment) => (
    <Card key={moment.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
     <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
      <div className="flex items-center gap-3">
       <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
        <AvatarImage src={moment.avatarUrl || undefined} />
        <AvatarFallback>{moment.username?.charAt(0) || 'U'}</AvatarFallback>
       </Avatar>
       <div>
        <p className="font-bold text-sm uppercase tracking-tight">{moment.username}</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
         {moment.createdAt ? format(moment.createdAt.toDate(), 'MMM d, HH:mm') : 'Syncing...'}
        </p>
       </div>
      </div>
      <button className="text-gray-300 hover:text-gray-600 transition-colors">
       <MoreHorizontal className="h-5 w-5" />
      </button>
     </CardHeader>
     <CardContent className="p-0">
      <div className="px-6 pb-4">
       <p className="text-sm font-body leading-relaxed text-gray-800 whitespace-pre-wrap">{moment.content}</p>
      </div>
      {moment.imageUrl && (
       <div className="relative aspect-square w-full bg-slate-50">
        <Image 
         src={moment.imageUrl || undefined} 
         alt="Moment vibe" 
         fill 
         className="object-cover"
         sizes="(max-width: 768px) 100vw, 50vw"
        />
       </div>
      )}
      <div className="p-6 flex items-center justify-between border-t border-gray-50">
       <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors group">
         <Heart className="h-5 w-5 group-active:scale-125 transition-transform" />
         <span className="text-xs font-bold ">{moment.likes || 0}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors">
         <MessageCircle className="h-5 w-5" />
         <span className="text-xs font-bold ">Reply</span>
        </button>
       </div>
       <button className="text-gray-400 hover:text-gray-600 transition-colors">
        <Share2 className="h-5 w-5" />
       </button>
      </div>
     </CardContent>
    </Card>
   ))}
  </div>
 );
}
