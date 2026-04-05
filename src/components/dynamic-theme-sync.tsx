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
