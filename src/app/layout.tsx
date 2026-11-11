import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/features/settings/ThemeProvider';
import { ToastProvider } from '@/components/ui/toast';
import { WorldIdentityProvider } from '@/features/identity';
import { MusicProvider } from '@/engines/music';
import { InstallationProvider } from '@/engines/installation';
import { OfflineProvider } from '@/engines/offline';
import { APP_NAME, PRODUCT_IDENTITY } from '@/types/constants';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: PRODUCT_IDENTITY.name,
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  description: PRODUCT_IDENTITY.positioning,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0B0F' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-ui">
        <ThemeProvider>
          <ToastProvider>
            <WorldIdentityProvider>
              <MusicProvider>
                <InstallationProvider>
                  <OfflineProvider>{children}</OfflineProvider>
                </InstallationProvider>
              </MusicProvider>
            </WorldIdentityProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
