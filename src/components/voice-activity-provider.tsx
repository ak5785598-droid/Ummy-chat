'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';

interface VoiceActivityContextType {
  speakingVolumes: Record<string, number>; // Map of hashed Numeric UID to intensity (0-100)
  setVolumes: (volumes: Record<string, number>) => void;
}

const VoiceActivityContext = createContext<VoiceActivityContextType | undefined>(undefined);

export function VoiceActivityProvider({ children }: { children: ReactNode }) {
  const [speakingVolumes, setSpeakingVolumes] = useState<Record<string, number>>({});
  const lastUpdateRef = useRef<number>(0);
  const nextVolumesRef = useRef<Record<string, number> | null>(null);

  const setVolumes = useCallback((volumes: Record<string, number>) => {
    // THROTTLE: Only update once every 100ms to save CPU
    const now = Date.now();
    nextVolumesRef.current = volumes;
    
    if (now - lastUpdateRef.current > 100) {
      setSpeakingVolumes(volumes);
      lastUpdateRef.current = now;
      nextVolumesRef.current = null;
    }
  }, []);

  // Flush any pending volume update on unmount
  useEffect(() => {
    return () => {
      if (nextVolumesRef.current) {
        setSpeakingVolumes(nextVolumesRef.current);
      }
    };
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
