'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Flag, 
  Shield, 
  MessageSquareText, 
  ChevronRight, 
  Loader, 
  ChevronLeft, 
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, where, limitToLast } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';

const CategoryItem = ({ icon: Icon, label, subtext, date, colorClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0"
  >
    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center shadow-md shrink-0", colorClass)}>
      <Icon className="h-7 w-7 text-white" fill="white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="font-black text-[17px] text-gray-900 tracking-tight uppercase">{label}</h3>
        {date && <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tighter">{date}</span>}
      </div>
      {subtext && <p className="text-[13px] text-gray-400 truncate font-body italic">{subtext}</p>}
    </div>
  </div>
);

const ChatListItem = ({ chat, currentUid, onSelect }: any) => {
  const participantIds = chat?.participantIds || [];
  const otherUid = participantIds.find((id: string) => id !== currentUid) || currentUid;
  const { userProfile: otherUser, isLoading } = useUserProfile(otherUid);

  if (isLoading) return (
    <div className="px-6 py-4 flex gap-4 animate-pulse">
      <div className="h-14 w-14 bg-gray-100 rounded-full" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );

  if (!otherUser) return null;

  const displayTime = chat.updatedAt ? (
    isToday(chat.updatedAt.toDate()) 
      ? format(chat.updatedAt.toDate(), 'HH:mm') 
      : format(chat.updatedAt.toDate(), 'MMM d')
  ) : 'Syncing';

  return (
    <div 
      onClick={() => onSelect(chat.id, otherUser)}
      className="px-6 py-4 flex gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0"
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 border border-gray-100 shadow-sm">
          <AvatarImage src={otherUser.avatarUrl} />
          <AvatarFallback>{otherUser.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        {otherUser.isOnline && (
          <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-black text-[15px] text-gray-900 truncate tracking-tight">
            {otherUser.username}
          </h3>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            {displayTime}
          </span>
        </div>
        <p className="text-[13px] text-gray-400 truncate italic font-body">
          {chat.lastMessage || 'Sent a vibe'}
        </p>
      </div>
    </div>
  );
};

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [showOfficial, setShowOfficial] = useState(false);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'privateChats'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: rawChats, isLoading: isChatsLoading } = useCollection(chatsQuery);

  const chats = useMemo(() => {
    if (!rawChats) return null;
    return [...rawChats].sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  }, [rawChats]);

  const officialQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: officialMsgs } = useCollection(officialQuery);
  const latestOfficial = officialMsgs?.[0];

  return (
    <AppLayout>
      <div className="min-h-full bg-white flex flex-col relative font-headline animate-in fade-in duration-700">
        
        {/* Blueprint Header: Yellow-to-White Gradient */}
        <header className="relative shrink-0 pt-10 pb-6 px-6">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FFCC00] via-[#FFCC00]/40 to-white pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10" /> {/* Balancer */}
            <h1 className="text-3xl font-black text-black tracking-tight uppercase">Message</h1>
            <button className="text-black hover:scale-110 transition-transform p-1">
               <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 bg-white relative z-10">
          <div className="flex flex-col">
            {/* Activity Category: Exact matches the blueprint subtext and date */}
            <CategoryItem 
              icon={Flag} 
              label="Activity" 
              subtext={latestOfficial?.content || "🤩Yari's 1st Anniversary Special Of..."}
              date={latestOfficial?.timestamp ? format(latestOfficial.timestamp.toDate(), 'M/d/ yyyy') : "4/3/ 2026"}
              colorClass="bg-gradient-to-br from-[#FF6600] to-[#FF9900]"
              onClick={() => setShowOfficial(true)}
            />
            
            {/* Family Category */}
            <CategoryItem 
              icon={Shield} 
              label="Family" 
              colorClass="bg-gradient-to-br from-[#FFBB00] to-[#FFCC00]"
            />

            {/* Feedback Category */}
            <CategoryItem 
              icon={MessageSquareText} 
              label="Feedback" 
              colorClass="bg-gradient-to-br from-[#3366FF] to-[#00CCFF]"
            />

            {/* Chat List Separator */}
            {chats && chats.length > 0 && <div className="h-2 bg-gray-50/50" />}

            {/* Real-time Chats */}
            {isChatsLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader className="animate-spin text-primary h-8 w-8" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Syncing Frequencies...</p>
              </div>
            ) : (
              chats?.map(chat => (
                <ChatListItem 
                  key={chat.id} 
                  chat={chat} 
                  currentUid={user?.uid} 
                  onSelect={(id: string, other: any) => {}} 
                />
              ))
            )}
          </div>
        </div>

        {/* Official Notifications Dialog */}
        <Dialog open={showOfficial} onOpenChange={setShowOfficial}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
            <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
              <div className="h-14 w-14 bg-orange-500 rounded-[1.2rem] flex items-center justify-center text-white shrink-0">
                 <Flag className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Official Activities</DialogTitle>
                <DialogDescription className="sr-only">System messages and official broadcasts.</DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
               <div className="space-y-4">
                  {officialMsgs?.length === 0 ? (
                    <div className="py-10 text-center opacity-20 italic">No official broadcasts.</div>
                  ) : (
                    officialMsgs?.map((msg: any) => (
                      <div key={msg.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black uppercase text-sm">{msg.title || 'Official'}</h4>
                            <span className="text-[10px] text-gray-400 font-bold">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}</span>
                         </div>
                         <p className="text-sm font-body italic text-gray-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
               </div>
            </ScrollArea>
            <div className="p-8 pt-0">
              <button onClick={() => setShowOfficial(false)} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">Close</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
