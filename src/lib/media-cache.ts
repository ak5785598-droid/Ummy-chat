const CACHE_NAME = 'ummy-media-cache-v1';

/**
 * Programmatically caches any media file (image/video) locally in the browser's Cache Storage.
 * On subsequent loads, serves the file instantly from the cache as a local Blob URL.
 * Bypasses network request latency, reducing network data consumption to 0 and saving battery.
 * Returns the original URL immediately if caching is not supported or falls back silently on error.
 */
export async function getCachedMediaUrl(url: string | null | undefined): Promise<string> {
  if (typeof window === 'undefined' || !('caches' in window) || !url) {
    return url || '';
  }

  // Skip local blob URLs, data URIs, or non-http assets
  if (url.startsWith('blob:') || url.startsWith('data:') || !url.startsWith('http')) {
    return url;
  }

  try {
    const cache = await window.caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    // Fetch the asset over network and store it in cache
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      await cache.put(url, response.clone());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    // Fail silently in case of CORS restriction or network issues and return original url
    console.debug("Media cache fetch skipped for:", url, error);
  }

  return url;
}
