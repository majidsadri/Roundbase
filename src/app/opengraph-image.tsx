import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'RoundBase — AI-Powered Fundraising Platform for Startups';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #312e81 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <path d="M13 9h9.5c3.6 0 6.5 2.5 6.5 6 0 2.8-1.8 5-4.5 5.7L29 31h-5.5l-3.8-9.5H18V31h-5V9zm5 4.5v4.5h4c1.5 0 2.5-1 2.5-2.3 0-1.3-1-2.2-2.5-2.2h-4z" fill="#111827"/>
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          RoundBase
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#a5b4fc',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          AI-Powered Fundraising Platform for Startups
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 40,
          }}
        >
          {['Find Investors', 'AI Pitch Decks', 'Manage Pipeline', 'Track Outreach'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500,
          }}
        >
          www.roundbase.net
        </div>
      </div>
    ),
    { ...size }
  );
}
