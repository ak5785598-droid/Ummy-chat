'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

/**
 * useBackButtonHandler
 * Intercepts the physical/gesture back button on Android.
 * Prevents the app from closing immediately and instead navigates back in the Next.js history.
 */
export function useBackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      // 1. Logic for specific pages that should exit the app (like Login or a clean Home state)
      const ROOT_PAGES = ['/login', '/rooms'];
      const isRoot = ROOT_PAGES.includes(pathname);

      if (isRoot) {
        // Option A: Exit the app
        App.exitApp();
      } else {
        // Option B: Go back in Next.js history
        router.back();
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, [router, pathname]);
}
