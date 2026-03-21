import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111827',
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 40 40" fill="none">
          <path d="M13 9h9.5c3.6 0 6.5 2.5 6.5 6 0 2.8-1.8 5-4.5 5.7L29 31h-5.5l-3.8-9.5H18V31h-5V9zm5 4.5v4.5h4c1.5 0 2.5-1 2.5-2.3 0-1.3-1-2.2-2.5-2.2h-4z" fill="white"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
