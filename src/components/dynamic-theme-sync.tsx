'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

/**
 * DYNAMIC THEME SYNC ENGINE 🏁
 * 
 * This component listens to the global app configuration and applies
 * theme-level CSS variable overrides in real-time across the entire application.
 * 
 * UPDATED: Now includes Path-Aware Isolation to restrict designs to Social areas.
 */
export function DynamicThemeSync() {
  const firestore = useFirestore();
  const pathname = usePathname();
  
  const configRef = firestore ? doc(firestore, 'appConfig', 'global') : null;
  const { data: config } = useDoc(configRef);

  useEffect(() => {
    if (!config) return;

    // --- ISOLATION SHIELD ---
    // Only apply premium themes to these specific social/identity paths.
    // Everything else defaults to 'CLASSIC'.
    const THEMED_PATHS = [
      '/discover',
      '/messages',
      '/profile',
      '/me',
      '/moments',
      '/leaderboard',
      '/tasks',
      '/level'
    ];

    // Home page (/) check: exact match
    const isHome = pathname === '/';
    const isSocialPath = THEMED_PATHS.some(p => pathname?.startsWith(p)) || isHome;
    
    const theme = isSocialPath ? (config.appTheme || 'CLASSIC') : 'CLASSIC';
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    // --- THEME DEFINITIONS ---
    const themes = {
      'CLASSIC': {
        background: '280 40% 93%', 
        foreground: '270 100% 8%',
        primary: '291 64% 42%',
        statusBar: '#F8F9FE',
        navAccent: '#FFCC00',
        headerGradient: 'linear-gradient(to bottom, #F8F9FE 0%, #E8E9F5 100%)',
      },
      'STELLAR_PINK': {
        background: '340 100% 78%',
        foreground: '270 100% 8%',
        primary: '291 64% 42%',
        statusBar: '#FF91B5',
        navAccent: '#FF91B5',
        headerGradient: 'linear-gradient(to bottom, #FF91B5 0%, #FFB6D1 100%)',
      },
      'PURPLE_MAJESTY': {
        background: '260 40% 92%',
        foreground: '260 100% 8%',
        primary: '260 70% 55%',
        statusBar: '#F0F1FB',
        navAccent: '#8B5CF6',
        headerGradient: 'linear-gradient(to bottom, #F0F1FB 0%, #E0E2F6 100%)',
      },
      'ROSE_GLOW': {
        background: '335 50% 94%',
        foreground: '335 100% 8%',
        primary: '335 70% 60%',
        statusBar: '#FFF0F6',
        navAccent: '#EC4899',
        headerGradient: 'linear-gradient(to bottom, #FFF0F6 0%, #FFE4F0 100%)',
      },
      'GOLDEN_HOUR': {
        background: '28 75% 94%',
        foreground: '28 100% 8%',
        primary: '28 90% 60%',
        statusBar: '#FDF2EA',
        navAccent: '#F59E0B',
        headerGradient: 'linear-gradient(to bottom, #FDF2EA 0%, #FBDFCA 100%)',
      },
      'MIDNIGHT_MAROON': {
        background: '345 50% 8%',
        foreground: '0 0% 100%',
        primary: '345 80% 50%',
        statusBar: '#120409',
        navAccent: '#BE123C',
        headerGradient: 'linear-gradient(to bottom, #120409 0%, #2A0813 100%)',
      },
      'MAGENTA_FRENZY': {
        background: '315 80% 94%',
        foreground: '315 100% 8%',
        primary: '315 95% 55%',
        statusBar: '#FDECF9',
        navAccent: '#D946EF',
        headerGradient: 'linear-gradient(to bottom, #FDECF9 0%, #FBDBF4 100%)',
      },
      'OCEAN_VIOLET': {
        background: '230 40% 96%',
        foreground: '260 100% 8%',
        primary: '260 80% 40%',
        statusBar: '#F5F7FF',
        navAccent: '#4F46E5',
        headerGradient: 'linear-gradient(to bottom, #F5F7FF 0%, #E6E9FF 100%)',
      },
      'SKY_LAVENDER': {
        background: '300 40% 92%',
        foreground: '300 100% 8%',
        primary: '300 60% 60%',
        statusBar: '#F8F2F9',
        navAccent: '#A855F7',
        headerGradient: 'linear-gradient(to bottom, #F8F2F9 0%, #F1E2F5 100%)',
      },
      'GLOSSY': {
        background: '220 33% 98%', // Near white
        foreground: '222 47% 11%', // Slate 900
        primary: '222 47% 11%',    // Slate 900
        statusBar: '#FFFFFF',
        navAccent: '#0F172A',
        headerGradient: 'linear-gradient(to bottom, #FFFFFF 0%, #F4F7FE 100%)',
      }
    };

    const active = themes[theme as keyof typeof themes] || themes.CLASSIC;

    // Apply CSS Variable Overrides
    root.style.setProperty('--background', active.background);
    root.style.setProperty('--foreground', active.foreground);
    root.style.setProperty('--primary', active.primary);
    root.style.setProperty('--header-gradient', active.headerGradient);
    
    // Update Meta Theme Color for mobile browser address bars
    if (metaThemeColor) {
      let finalStatusBarColor = active.statusBar;
      
      // OPTIMIZATION FOR PWA SEAMLESS HEADERS:
      // If we are on the /rooms page, we force the status bar color to perfectly 
      // match the top of the newly added mountain gradient (#eef9ff)
      if (pathname === '/rooms' || pathname?.startsWith('/rooms/')) {
        finalStatusBarColor = '#eef9ff';
      }
      
      metaThemeColor.setAttribute('content', finalStatusBarColor);
    }

    // Optional: Add a class to body for specific CSS selectors if needed
    document.body.classList.remove('theme-classic', 'theme-stellar-pink', 'theme-glossy');
    if (theme === 'STELLAR_PINK') document.body.classList.add('theme-stellar-pink');
    else if (theme === 'GLOSSY') document.body.classList.add('theme-glossy');
    else document.body.classList.add('theme-classic');

    console.log(`[ThemeEngine] Path: ${pathname} | Theme: ${theme} 🏁`);
  }, [config, pathname]);

  return null; // Side-effect only component
}

