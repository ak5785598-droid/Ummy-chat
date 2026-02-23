'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Room } from '@/lib/types';

interface RoomContextType {
  activeRoom: Room | null;
  setActiveRoom: (room: Room | null) => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

/**
 * Manages the global state of the active chat room frequency.
 */
export function RoomProvider({ children }: { children: ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <RoomContext.Provider value={{ activeRoom, setActiveRoom, isMinimized, setIsMinimized }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
}
