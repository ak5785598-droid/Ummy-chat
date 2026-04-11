'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceActivityContextType {
  speakingVolumes: Record<string, number>; // Map of hashed Numeric UID to intensity (0-100)
  setVolumes: (volumes: Record<string, number>) => void;
}

const VoiceActivityContext = createContext<VoiceActivityContextType | undefined>(undefined);

export function VoiceActivityProvider({ children }: { children: ReactNode }) {
  const [speakingVolumes, setSpeakingVolumes] = useState<Record<string, number>>({});

  const setVolumes = (volumes: Record<string, number>) => {
    setSpeakingVolumes(volumes);
  };

  return (
    <VoiceActivityContext.Provider value={{ speakingVolumes, setVolumes }}>
      {children}
    </VoiceActivityContext.Provider>
  );
}

export function useVoiceActivityContext() {
  const context = useContext(VoiceActivityContext);
  if (context === undefined) {
    throw new Error('useVoiceActivityContext must be used within a VoiceActivityProvider');
  }
  return context;
}
