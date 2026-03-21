import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RoundBase — AI-Powered Fundraising Platform for Startups | Find Investors & Close Rounds',
    template: '%s | RoundBase',
  },
  description: 'RoundBase helps startups find the right investors, manage their fundraising pipeline, generate AI pitch decks, and send personalized outreach. Free tool for founders raising pre-seed, seed, or Series A rounds.',
  keywords: [
    'investor pipeline', 'fundraising tracker', 'VC CRM', 'startup fundraising',
    'investor outreach', 'seed round', 'series a', 'venture capital',
    'investor management', 'fundraising tool', 'startup tool', 'RoundBase',
    'find investors', 'AI pitch deck', 'investor matching', 'fundraising platform',
    'startup investor database', 'VC finder', 'raise capital', 'pre-seed funding',
    'investor email outreach', 'pitch deck generator', 'fundraise faster',
    'investor CRM for startups', 'venture capital database', 'startup fundraising software',
  ],
  authors: [{ name: 'RoundBase' }],
  creator: 'RoundBase',
  publisher: 'RoundBase',
  metadataBase: new URL('https://www.roundbase.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.roundbase.net',
    siteName: 'RoundBase',
    title: 'RoundBase — AI-Powered Fundraising Platform for Startups',
    description: 'Find matched investors, manage your pipeline, generate AI pitch decks, and send personalized outreach. Free for founders.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoundBase — AI-Powered Fundraising for Startups',
    description: 'Find matched investors, manage your pipeline, generate AI pitch decks, and close your round faster.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RoundBase',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HF8FXFTZZX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HF8FXFTZZX');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
