import { useState, useEffect } from 'react';
import { getCachedMediaUrl } from '@/lib/media-cache';

/**
 * Custom React hook to resolve high-speed cached media blob URLs.
 * Returns a high-speed local blob URL (loading in <0.1s) if cached, otherwise falls back to network loading.
 */
export function useCachedMedia(url: string | null | undefined): string {
  const [cachedUrl, setCachedUrl] = useState<string>('');

  useEffect(() => {
    if (!url) {
      setCachedUrl('');
      return;
    }

    let active = true;
    getCachedMediaUrl(url)
      .then((res) => {
        if (active) {
          setCachedUrl(res);
        }
      })
      .catch(() => {
        if (active) {
          setCachedUrl(url);
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  return cachedUrl || url || '';
}
