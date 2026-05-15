'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CordovaAudioRoute } from '@/native/audio-route';

const isNativePlatform = Capacitor.isNativePlatform();
const NativeAudioRoute = isNativePlatform ? CordovaAudioRoute : null;

export function useScreenWakeLock(shouldKeepAwake: boolean) {
  useEffect(() => {
    const acquireWakeLock = async () => {
      try {
        if (NativeAudioRoute?.isAvailable()) {
          await NativeAudioRoute.keepAwake();
        } else if ('wakeLock' in navigator) {
          await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Silent fail — wake lock is best-effort
      }
    };

    const releaseWakeLock = async () => {
      try {
        if (NativeAudioRoute?.isAvailable()) {
          await NativeAudioRoute.allowSleep();
        }
      } catch {
        // Silent fail
      }
    };

    if (shouldKeepAwake) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldKeepAwake) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!shouldKeepAwake) {
        releaseWakeLock();
      }
    };
  }, [shouldKeepAwake]);
}
