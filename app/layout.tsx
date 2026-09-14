// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StarMaker Recording Downloader',
  description: 'Download publicly accessible StarMaker recordings you own or have permission to save.',
  openGraph: {
    title: 'StarMaker Recording Downloader',
    description: 'Download publicly accessible StarMaker recordings you own or have permission to save.',
    images: [{ url: '/og-image.jpg' }]
  },
  viewport: 'width=device-width,initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-inter bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
