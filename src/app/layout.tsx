import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/features/settings/ThemeProvider';
import { ToastProvider } from '@/components/ui/toast';

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
  title: 'Peshie — Her World',
  description: 'A little corner of the internet that belongs to her.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Peshie',
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
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
