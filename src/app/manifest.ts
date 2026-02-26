
import type { MetadataRoute } from 'next';

/**
 * Official Ummy PWA Manifest.
 * Configures high-fidelity standalone behavior for Android and iOS.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ummy - Connect Your Tribe',
    short_name: 'Ummy',
    description: 'Elite real-time social voice chat frequency.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFCC00',
    theme_color: '#FFCC00',
    icons: [
      {
        src: 'https://picsum.photos/seed/ummy-icon/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/ummy-icon/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
