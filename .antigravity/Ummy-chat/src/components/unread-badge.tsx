'use client';

import * as React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { query, collection, where, getDocs } from 'firebase/firestore';

interface UnreadBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const UnreadBadge = React.memo(({ className, size = 'md' }: UnreadBadgeProps) => {
  const [isHydrated, setIsHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  return <UnreadBadgeContent className={className} size={size} />;
});

function UnreadBadgeContent({ className, size = 'md' }: UnreadBadgeProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [hasUnread, setHasUnread] = React.useState(false);

  React.useEffect(() => {
    if (!firestore || !user) return;
    const checkUnread = async () => {
      try {
        const q = query(collection(firestore, "privateChats"), where("participantIds", "array-contains", user.uid));
        const snap = await getDocs(q);
        const unread = snap.docs.some(docSnap => {
          const chat = docSnap.data();
          const readBy = Array.isArray(chat?.lastMessageReadBy) ? chat.lastMessageReadBy : [];
          return chat.lastSenderId !== user.uid && !readBy.includes(user.uid);
        });
        setHasUnread(unread);
      } catch (e) {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 60000); // 1 min poll (was realtime)
    return () => clearInterval(interval);
  }, [firestore, user?.uid]);

  if (!hasUnread) return null;

  const base = "bg-red-500 rounded-full animate-pulse shadow-sm";
  const dotSize = size === 'sm' ? "w-2 h-2 border border-[#1a0b2e]" : "w-2.5 h-2.5 border-2 border-[#140028]";
  
  return (
    <div className={`${base} ${dotSize} ${className || ''}`} />
  );
}

UnreadBadge.displayName = 'UnreadBadge';
