'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * useVoiceActivity
 * Real-time volume analysis to detect active speech.
 * Threshold tuned for mobile microphones to isolate background noise.
 */
export function useVoiceActivity(stream: MediaStream | null, audioContext: AudioContext | null) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !audioContext) {
      setIsSpeaking(false);
      return;
    }

    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    try {
      if (audioContext.state === 'closed') return;
      
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let silenceCount = 0;
      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate root mean square or simple average for volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Tuned threshold: 12-15 is usually good for voice vs background
        const threshold = 18; 
        const isCurrentlySpeaking = average > threshold;

        if (isCurrentlySpeaking) {
          silenceCount = 0;
          setIsSpeaking(true);
        } else {
          silenceCount++;
          // Add a small "hold" time (approx 300ms) to prevent flickering
          if (silenceCount > 15) {
            setIsSpeaking(false);
          }
        }
        
        rafId.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('[VAD] Failed to initialize volume analyzer:', err);
    }

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (source) try { source.disconnect(); } catch (e) {}
      if (analyser) try { analyser.disconnect(); } catch (e) {}
    };
  }, [stream, audioContext]);

  return isSpeaking;
}
