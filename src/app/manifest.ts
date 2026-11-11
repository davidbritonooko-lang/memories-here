import type { MetadataRoute } from 'next';
import { APP_NAME, PRODUCT_IDENTITY } from '@/types/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_IDENTITY.name,
    short_name: APP_NAME,
    description: PRODUCT_IDENTITY.positioning,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F5F2',
    theme_color: '#B96F91',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
