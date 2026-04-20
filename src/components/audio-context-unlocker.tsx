'use client';

import { useEffect, useState } from 'react';

/**
 * AudioContextUnlocker
 * 
 * Ensures the browser's audio context is unlocked on the first user interaction.
 * This is critical for AI voice (SpeechSynthesis) and audio loops to work 
 * without being blocked by browser autoplay policies.
 */
export function AudioContextUnlocker() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (unlocked) return;

    const unlock = () => {
      // 1. Wake up SpeechSynthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        console.log("AI Voice: Audio Context Unlocked via interaction");
      }

      // 2. Play a silent sound if needed (Optional but robust)
      // We can also trigger a silent audio element here if we had a silent.mp3

      setUnlocked(true);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [unlocked]);

  return null; // Invisible global component
}
