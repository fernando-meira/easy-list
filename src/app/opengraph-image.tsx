import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#18181b',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <span style={{ fontSize: 64, fontWeight: 700 }}>Easy List</span>
        <span style={{ fontSize: 28, marginTop: 16, opacity: 0.7 }}>
          Sua lista de compras inteligente
        </span>
      </div>
    ),
    { ...size }
  );
}
