'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * DYNAMIC THEME SYNC ENGINE 🏁
 * 
 * This component listens to the global app configuration and applies
 * theme-level CSS variable overrides in real-time across the entire application.
 */
export function DynamicThemeSync() {
  const firestore = useFirestore();
  
  const configRef = firestore ? doc(firestore, 'appConfig', 'global') : null;
  const { data: config } = useDoc(configRef);

  useEffect(() => {
    if (!config) return;

    const theme = config.appTheme || 'CLASSIC';
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    // --- THEME DEFINITIONS ---
    const themes = {
      'CLASSIC': {
        background: '280 40% 93%', // Soft Lavender
        foreground: '270 100% 8%',
        primary: '291 64% 42%',
        statusBar: '#F8F9FE',
        navAccent: '#FFCC00',
      },
      'STELLAR_PINK': {
        background: '340 100% 78%', // Stellar Pink
        foreground: '270 100% 8%',
        primary: '291 64% 42%',
        statusBar: '#FF91B5',
        navAccent: '#FF91B5',
      },
      'PURPLE_MAJESTY': {
        background: '260 40% 92%',
        foreground: '260 100% 8%',
        primary: '260 70% 55%',
        statusBar: '#F0F1FB',
        navAccent: '#8B5CF6',
      },
      'ROSE_GLOW': {
        background: '335 50% 94%',
        foreground: '335 100% 8%',
        primary: '335 70% 60%',
        statusBar: '#FFF0F6',
        navAccent: '#EC4899',
      },
      'GOLDEN_HOUR': {
        background: '28 75% 94%',
        foreground: '28 100% 8%',
        primary: '28 90% 60%',
        statusBar: '#FDF2EA',
        navAccent: '#F59E0B',
      },
      'MIDNIGHT_MAROON': {
        background: '345 50% 8%',
        foreground: '0 0% 100%',
        primary: '345 80% 50%',
        statusBar: '#120409',
        navAccent: '#BE123C',
      },
      'MAGENTA_FRENZY': {
        background: '315 80% 94%',
        foreground: '315 100% 8%',
        primary: '315 95% 55%',
        statusBar: '#FDECF9',
        navAccent: '#D946EF',
      }
    };

    const active = themes[theme as keyof typeof themes] || themes.CLASSIC;

    // Apply CSS Variable Overrides
    root.style.setProperty('--background', active.background);
    root.style.setProperty('--foreground', active.foreground);
    root.style.setProperty('--primary', active.primary);
    
    // Update Meta Theme Color for mobile browser address bars
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', active.statusBar);
    }

    // Optional: Add a class to body for specific CSS selectors if needed
    document.body.classList.remove('theme-classic', 'theme-stellar-pink');
    document.body.classList.add(theme === 'STELLAR_PINK' ? 'theme-stellar-pink' : 'theme-classic');

    console.log(`[ThemeEngine] Synchronized to ${theme} mode. 🏁`);
  }, [config]);

  return null; // Side-effect only component
}
