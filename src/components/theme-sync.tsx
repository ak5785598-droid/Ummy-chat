'use client';

import { useEffect } from 'react';

interface ThemeSyncProps {
  color?: string;
  imageUrl?: string;
}

/**
 * ThemeSync - Performance-tuned client-side metadata synchronization.
 * Updates the global theme state (meta tags and root variables) to match the room aesthetic.
 */
export function ThemeSync({ color, imageUrl }: ThemeSyncProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;
    
    // Save original values for restoration
    const originalBg = body.style.backgroundColor;
    const originalAppBg = root.style.getPropertyValue('--app-bg');
    const originalOverscroll = body.style.overscrollBehavior;
    
    // Find theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content') || '#FF91B5';

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    // Apply new theme
    if (color) {
      root.style.setProperty('--app-bg', color);
      body.style.backgroundColor = color;
      body.style.overscrollBehavior = 'none'; // FIX: "Screen bhag jata hai" (overscroll bounce)
      metaThemeColor.setAttribute('content', color);
    }

    // CLEANUP: Restore original theme on unmount
    return () => {
      root.style.setProperty('--app-bg', originalAppBg || '#FF91B5');
      body.style.backgroundColor = originalBg;
      body.style.overscrollBehavior = originalOverscroll;
      metaThemeColor?.setAttribute('content', originalThemeColor);
    };
  }, [color, imageUrl]);

  return null;
}
