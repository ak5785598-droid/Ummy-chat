'use client';

import * as React from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { query, collection, where } from 'firebase/firestore';

interface UnreadBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * ATOMIC STABILIZED UNREAD BADGE.
 * Prevents hydration crashes by deferring ALL Firebase hooks until after client mount.
 */
export const UnreadBadge = React.memo(({ className, size = 'md' }: UnreadBadgeProps) => {
  const [isHydrated, setIsHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Strict Mount Guard: Return null before checking hooks
  if (!isHydrated) return null;

  return <UnreadBadgeContent className={className} size={size} />;
});

/**
 * Internal logic component that only executes on the client.
 */
function UnreadBadgeContent({ className, size = 'md' }: UnreadBadgeProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const unreadChatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "privateChats"), where("participantIds", "array-contains", user.uid));
  }, [firestore, user?.uid]);

  const { data: chatsForUnread } = useCollection(unreadChatsQuery);

  const hasUnread = React.useMemo(() => {
    if (!chatsForUnread || !user) return false;
    return chatsForUnread.filter(Boolean).some((chat: any) => {
      const readBy = Array.isArray(chat?.lastMessageReadBy) ? chat.lastMessageReadBy : [];
      return chat.lastSenderId !== user.uid && !readBy.includes(user.uid);
    });
  }, [chatsForUnread, user?.uid]);

  if (!hasUnread) return null;

  const base = "bg-red-500 rounded-full animate-pulse shadow-sm";
  const dotSize = size === 'sm' ? "w-2 h-2 border border-[#1a0b2e]" : "w-2.5 h-2.5 border-2 border-[#140028]";
  
  return (
    <div className={`${base} ${dotSize} ${className || ''}`} />
  );
}

UnreadBadge.displayName = 'UnreadBadge';
