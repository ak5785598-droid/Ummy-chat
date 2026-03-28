'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * useVoiceActivity - ENHANCED VERSION
 * Real-time volume analysis with intensity levels for dynamic wave animations
 * Returns both speaking state and intensity level (0-100)
 */
export function useVoiceActivity(stream: MediaStream | null, audioContext: AudioContext | null) {
 const [isSpeaking, setIsSpeaking] = useState(false);
 const [intensity, setIntensity] = useState(0); // 0-100 intensity level
 const analyserRef = useRef<AnalyserNode | null>(null);
 const rafId = useRef<number | null>(null);

 useEffect(() => {
  if (!stream || !audioContext) {
   setIsSpeaking(false);
   setIntensity(0);
   return;
  }

  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;

  try {
   if (audioContext.state === 'closed') return;
   
   analyser = audioContext.createAnalyser();
   analyser.fftSize = 512; // Increased for better frequency resolution
   analyser.smoothingTimeConstant = 0.3; // Reduced for more responsive detection
   
   source = audioContext.createMediaStreamSource(stream);
   source.connect(analyser);
   
   const dataArray = new Uint8Array(analyser.frequencyBinCount);

   let silenceCount = 0;
   let peakIntensity = 0;
   
   const checkVolume = () => {
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for accurate volume measurement
    let sum = 0;
    let peakValue = 0;
    for (let i = 0; i < dataArray.length; i++) {
     const value = dataArray[i];
     sum += value * value;
     if (value > peakValue) peakValue = value;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    
    // Dynamic threshold based on ambient noise
    const baseThreshold = 12; // Increased from 8 to ignore low-level ambient noise
    const adaptiveThreshold = Math.max(baseThreshold, peakValue * 0.12);
    
    // Calculate intensity (0-100 scale)
    const maxPossibleValue = 255;
    // Reduced from * 3 to * 1.5 for more realistic sensitivity
    let currentIntensity = Math.min(100, (rms / maxPossibleValue) * 100 * 1.5); 
    
    // Smooth intensity changes to prevent flickering
    currentIntensity = Math.max(0, currentIntensity - 2); // Minimum threshold filter
    
    const isCurrentlySpeaking = rms > adaptiveThreshold;
    
    // Update peak intensity for visual feedback
    if (currentIntensity > peakIntensity) {
     peakIntensity = currentIntensity;
    } else {
     peakIntensity *= 0.95; // Decay factor
    }

    if (isCurrentlySpeaking) {
     silenceCount = 0;
     setIsSpeaking(true);
     setIntensity(currentIntensity);
    } else {
     silenceCount++;
     // Hold intensity for a moment before fading out
     if (silenceCount > 10) {
      setIsSpeaking(false);
      setIntensity(0);
     } else {
      // Fade out intensity
      setIntensity(prev => Math.max(0, prev * 0.8));
     }
    }
    
    rafId.current = requestAnimationFrame(checkVolume);
   };

   checkVolume();
  } catch (err) {
   console.warn('[VAD] Failed to initialize volume analyzer:', err);
   setIsSpeaking(false);
   setIntensity(0);
  }

  return () => {
   if (rafId.current) cancelAnimationFrame(rafId.current);
   if (source) try { source.disconnect(); } catch (e) {}
   if (analyser) try { analyser.disconnect(); } catch (e) {}
   setIsSpeaking(false);
   setIntensity(0);
  };
 }, [stream, audioContext]);

 return { isSpeaking, intensity };
}
