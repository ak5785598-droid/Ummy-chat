'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface VoiceActivityContextType {
  speakingVolumes: Record<string, number>; // Map of hashed Numeric UID to intensity (0-100)
  setVolumes: (volumes: Record<string, number>) => void;
}

const VoiceActivityContext = createContext<VoiceActivityContextType | undefined>(undefined);

export function VoiceActivityProvider({ children }: { children: ReactNode }) {
  const [speakingVolumes, setSpeakingVolumes] = useState<Record<string, number>>({});

  const setVolumes = useCallback((volumes: Record<string, number>) => {
    setSpeakingVolumes(volumes);
  }, []);

  const value = useMemo(() => ({
    speakingVolumes,
    setVolumes
  }), [speakingVolumes, setVolumes]);

  return (
    <VoiceActivityContext.Provider value={value}>
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
