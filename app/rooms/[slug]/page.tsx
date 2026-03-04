'use client';

import { use, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Ban, Ghost, ShieldAlert } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useRoomContext } from '@/components/room-provider';
import { format } from 'date-fns';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { setActiveRoom, setIsMinimized } = useRoomContext();
  
  useEffect(() => { if (!isUserLoading && !currentUser) router.replace('/login'); }, [isUserLoading, currentUser, router]);

  const banDocRef = useMemoFirebase(() => (!firestore || !slug || isUserLoading || !currentUser ? null : doc(firestore, 'chatRooms', slug, 'bans', currentUser.uid)), [firestore, slug, isUserLoading, currentUser]);
  const { data: banData, isLoading: isBanLoading } = useDoc(banDocRef);

  const roomDocRef = useMemoFirebase(() => (!firestore || !slug || isUserLoading || !currentUser ? null : doc(firestore, 'chatRooms', slug)), [firestore, slug, isUserLoading, currentUser]);
  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);

  const bannedUntil = useMemo(() => { if (!banData) return null; const expires = banData.expiresAt?.toDate(); return (expires && expires > new Date()) ? expires : null; }, [banData]);

  const activeRoom: Room | null = useMemo(() => {
    if (firestoreRoom) return { id: firestoreRoom.id, roomNumber: firestoreRoom.roomNumber, slug: firestoreRoom.id, title: firestoreRoom.name || 'Frequency', topic: firestoreRoom.description || '', category: (firestoreRoom.category as any) || 'Chat', coverUrl: firestoreRoom.coverUrl || '', ownerId: firestoreRoom.ownerId, moderatorIds: firestoreRoom.moderatorIds || [], lockedSeats: firestoreRoom.lockedSeats || [], announcement: firestoreRoom.announcement || "Enjoy the vibe!", createdAt: firestoreRoom.createdAt, stats: firestoreRoom.stats || { totalGifts: 0, dailyGifts: 0 }, isChatMuted: firestoreRoom.isChatMuted, currentMusicUrl: firestoreRoom.currentMusicUrl, maxActiveMics: firestoreRoom.maxActiveMics, roomThemeId: firestoreRoom.roomThemeId } as any;
    if (slug === 'ummy-help-center') return { id: 'ummy-help-center', roomNumber: '0000', slug: 'ummy-help-center', title: 'Ummy Official Help', topic: 'Ask any app related question quick and fast.', category: 'Chat', coverUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1000', ownerId: CREATOR_ID, moderatorIds: [], lockedSeats: [], announcement: 'Welcome to official support! How can we help you today?', createdAt: new Date(), participantCount: 0, stats: { totalGifts: 0, dailyGifts: 0 }, maxActiveMics: 9, roomThemeId: 'royal' } as any;
    return null;
  }, [firestoreRoom, slug]);

  useEffect(() => { if (activeRoom && !bannedUntil) { setActiveRoom(activeRoom); setIsMinimized(false); } }, [activeRoom, setActiveRoom, setIsMinimized, bannedUntil]);

  if (bannedUntil) return (<AppLayout><div className="flex h-[60vh] flex-col items-center justify-center space-y-6 text-center px-6 animate-in zoom-in duration-500"><div className="h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center shadow-xl shadow-red-500/10 border-2 border-red-500/20"><Ban className="h-12 w-12 text-red-500" /></div><h1 className="text-3xl font-black uppercase tracking-tighter italic">Frequency Exclusion</h1><div className="space-y-2"><p className="text-muted-foreground font-body text-lg">You were kicked from this room.</p><p className="text-primary font-black uppercase text-xs tracking-widest bg-primary/10 px-4 py-2 rounded-full inline-block">Restricted until {format(bannedUntil, 'MMM d, HH:mm')}</p></div><button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Explore Others</button></div></AppLayout>);
  if (docError && slug !== 'ummy-help-center') return (<AppLayout><div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-6"><ShieldAlert className="h-16 w-16 text-destructive mb-2" /><h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1><p className="text-muted-foreground font-body text-base">You do not have permission to access this frequency.</p><button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase tracking-widest text-xs px-8 py-3 rounded-full shadow-lg">Explore Others</button></div></AppLayout>);
  if (isUserLoading || isBanLoading || (!!roomDocRef && isDocLoading && slug !== 'ummy-help-center')) return (<AppLayout><div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4"><Loader className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] text-muted-foreground animate-pulse font-black uppercase tracking-widest">Tuning Frequency...</p></div></AppLayout>);
  if (!activeRoom) return (<AppLayout><div className="flex h-[60vh] flex-col items-center justify-center space-y-6 text-center px-6 animate-in fade-in duration-700"><div className="h-24 w-24 bg-secondary/20 rounded-full flex items-center justify-center"><Ghost className="h-12 w-12 text-muted-foreground opacity-40" /></div><h1 className="text-3xl font-black uppercase tracking-tighter">Frequency Not Found</h1><p className="text-muted-foreground max-w-xs font-body text-lg">This tribe has disbanded or the frequency has been terminated by an Admin.</p><button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Back to Home</button></div></AppLayout>);

  return (<AppLayout hideSidebarOnMobile><RoomClient room={activeRoom} /></AppLayout>);
}
