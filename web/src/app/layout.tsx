import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Optimized font loading with display: swap for better performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

// Monospace font for code blocks
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'DevLog Hub',
    template: '%s | DevLog Hub',
  },
  description: '개발 활동을 자동으로 수집하고 중앙에서 관리하는 플랫폼',
  keywords: ['development', 'logging', 'productivity', 'devlog', 'git', 'activity'],
  authors: [{ name: 'DevLog Hub Team' }],
  creator: 'DevLog Hub',
  publisher: 'DevLog Hub',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3020'
  ),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: 'DevLog Hub',
    description: '개발 활동을 자동으로 수집하고 중앙에서 관리하는 플랫폼',
    siteName: 'DevLog Hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevLog Hub',
    description: '개발 활동을 자동으로 수집하고 중앙에서 관리하는 플랫폼',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS Prefetch for API server */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || ''} />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/favicon.ico"
          as="image"
          type="image/x-icon"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
