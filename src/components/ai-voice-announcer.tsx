"use client";

import { useEffect, useRef, useCallback } from "react";

interface AiVoiceAnnouncerProps {
  enabled?: boolean;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function AiVoiceAnnouncer({
  enabled = true,
  language = "hi-IN",
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
}: AiVoiceAnnouncerProps) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = synthRef.current!.getVoices();
        const hindiVoice = voices.find(
          (v) => v.lang.startsWith("hi") || v.lang.includes("hi-IN")
        );
        if (hindiVoice) {
          voiceRef.current = hindiVoice;
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        synthRef.current?.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !synthRef.current || !text) return;

      queueRef.current.push(text);

      if (!isSpeakingRef.current) {
        processQueue();
      }
    },
    [enabled]
  );

  const processTextForSpeech = useCallback((text: string): string => {
    // Fix alphanumeric spelling issues (e.g., "C A R" -> "Car")
    let processed = text.replace(/([A-Za-z])\s+(?=[A-Za-z])/g, '$1');
    
    // Common Hinglish/English phonetic mappings for better TTS
    const replacements: Record<string, string> = {
      "Aeroplane": "Airplane",
      "Loot": "Loot",
      "Gate": "Gate",
      "Level": "Level"
    };
    
    Object.entries(replacements).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(key, 'gi'), value);
    });
    
    return processed;
  }, []);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0 || !synthRef.current) {
      isSpeakingRef.current = false;
      return;
    }

    isSpeakingRef.current = true;
    const rawText = queueRef.current.shift()!;
    const text = processTextForSpeech(rawText);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.onend = () => {
      processQueue();
    };

    utterance.onerror = () => {
      processQueue();
    };

    synthRef.current.speak(utterance);
  }, [language, rate, pitch, volume, processTextForSpeech]);

  useEffect(() => {
    (window as any).__announceLoot = speak;
    return () => {
      delete (window as any).__announceLoot;
    };
  }, [speak]);

  return null;
}
