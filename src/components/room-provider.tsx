'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Room } from '@/lib/types';

interface RoomContextType {
  activeRoom: Room | null;
  setActiveRoom: (room: Room | null) => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  // PERSISTENT MUSIC FREQUENCY
  roomPlaylist: File[];
  setRoomPlaylist: React.Dispatch<React.SetStateAction<File[]>>;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (val: boolean) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

/**
 * Manages the global state of the active chat room frequency.
 * Now hosts the persistent session playlist and music controls.
 */
export function RoomProvider({ children }: { children: ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomPlaylist, setRoomPlaylist] = useState<File[]>([]);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);

  return (
    <RoomContext.Provider value={{ 
      activeRoom, 
      setActiveRoom, 
      isMinimized, 
      setIsMinimized,
      roomPlaylist,
      setRoomPlaylist,
      isMusicEnabled,
      setIsMusicEnabled
    }}>
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
