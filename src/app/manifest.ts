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
  background_color: '#ff8ebb',
  theme_color: '#ff8ebb',
  icons: [
   {
    src: '/images/ummy-logon.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any',
   },
   {
    src: '/images/ummy-logon.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any',
   },
  ],
 };
}
