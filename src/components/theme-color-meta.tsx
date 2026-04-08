'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * PWA & Native Status Bar Sync
 * Dynamically strictly controls both the Android/iOS meta theme-color per-component
 * AND the Native APK Hardware Status Bar via Capacitor bridge for a true edge-to-edge illusion.
 */
export function ThemeColorMeta({ color }: { color: string }) {
  useEffect(() => {
    // 1. UPDATE PWA WEB META TAG (For standard browsers / homescreen apps)
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
    
    // 2. UPDATE NATIVE APK STATUS BAR (If running built via Capacitor Android/iOS)
    const updateNativeStatusBar = async () => {
      try {
        if (!color || typeof color !== 'string') return;
        
        if (Capacitor.isNativePlatform()) {
          // Calculate brightness to set text icon color (black or white icons)
          // Basic hex to rgb conversion to check luma
          const hex = color.startsWith('#') ? color.replace('#', '') : color;
          if (hex.length < 6) return; // Fallback for shortened or non-hex colors
          
          const r = parseInt(hex.substring(0, 2), 16) || 255;
          const g = parseInt(hex.substring(2, 4), 16) || 255;
          const b = parseInt(hex.substring(4, 6), 16) || 255;
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; 
          
          // Enable Overlay for true edge-to-edge (Transparent Status Bar)
          await StatusBar.setOverlaysWebView({ overlay: true });
          // Optional: Some devices need a transparent background explicitly
          await StatusBar.setBackgroundColor({ color: '#00000000' }); 
          await StatusBar.setStyle({ style: luma < 128 ? Style.Dark : Style.Light });
        }
      } catch (err) {
        console.warn('Native StatusBar sync unsupported on this device', err);
      }
    };

    updateNativeStatusBar();
  }, [color]);

  return null;
}
