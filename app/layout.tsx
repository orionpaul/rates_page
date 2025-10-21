import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Talk&Pay - Exchange Rates",
  description: "Real-time currency exchange rates board",
  icons: {
    icon: '/logo.png',
  },
};

// Viewport configuration for all devices (mobile, tablet, desktop, TV)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#003A70',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Polyfills for old browsers (IE10+, old Smart TVs, Windows Explorer) - MUST LOAD FIRST */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/polyfills.js"></script>
        {/* TV-specific optimizations for Hisense, TCL, and Chinese TVs */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/tv-loader.js"></script>
        {/* Device detection script for optimal compatibility */}
        <script src="/device-detect.js" defer></script>
        {/* Additional meta tags for device compatibility */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Talk&Pay Rates" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* DNS prefetch for faster loading on slow TV connections */}
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {/* Fallback for TVs with JavaScript disabled */}
        <noscript>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#003A70',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '20px',
            textAlign: 'center',
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            zIndex: 9999
          }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Talk&amp;Pay Exchange Rates</h1>
            <p style={{ fontSize: '28px', marginBottom: '20px' }}>
              This application requires JavaScript to display real-time exchange rates.
            </p>
            <p style={{ fontSize: '20px', color: '#00A8E8' }}>
              Please enable JavaScript in your browser or TV settings.
            </p>
          </div>
        </noscript>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
