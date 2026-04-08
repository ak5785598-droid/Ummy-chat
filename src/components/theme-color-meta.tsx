'use client';

import { useEffect } from 'react';

/**
 * PWA Status Bar Sync
 * Dynamically strictly controls the Android/iOS meta theme-color per-component.
 * Mount this component in any view to forcefully sync the OS boundary with the HTML UI.
 */
export function ThemeColorMeta({ color }: { color: string }) {
  useEffect(() => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
    
    return () => {
      // On unmount, we optionally could revert, but it's simpler to just let the next page mount its own.
    };
  }, [color]);

  return null;
}
