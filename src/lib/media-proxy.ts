/**
 * Utility to optimize and proxy media URLs to eliminate Firebase egress costs.
 */

export function getOptimizedMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If the URL is already a proxy or not a Firebase Storage URL, return as is.
  if (!url.includes('firebasestorage.googleapis.com')) {
    return url;
  }

  // Determine if it's a video. Videos cannot be proxied by Weserv image CDN.
  // We check the extension or if it explicitly says 'video'
  const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('video');
  
  if (isVideo) {
    // Return original URL for videos. The browser caching headers (Cache-Control) 
    // will handle cost reduction for videos.
    return url;
  }

  // For images, we proxy through images.weserv.nl for 100% free CDN caching and webp optimization.
  // We set q=80 (quality), output=webp, and n (no-redirect)
  const encodedUrl = encodeURIComponent(url);
  return `https://images.weserv.nl/?url=${encodedUrl}&output=webp&q=80`;
}
