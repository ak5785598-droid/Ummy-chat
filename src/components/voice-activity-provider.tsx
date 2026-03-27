'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceActivityContextType {
  isSpeaking: boolean;
  intensity: number;
  setVoiceActivity: (isSpeaking: boolean, intensity: number) => void;
}

const VoiceActivityContext = createContext<VoiceActivityContextType | undefined>(undefined);

export function VoiceActivityProvider({ children }: { children: ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [intensity, setIntensity] = useState(0);

  const setVoiceActivity = (speaking: boolean, intensityLevel: number) => {
    setIsSpeaking(speaking);
    setIntensity(intensityLevel);
  };

  return (
    <VoiceActivityContext.Provider value={{ isSpeaking, intensity, setVoiceActivity }}>
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
