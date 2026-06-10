import { ImageResponse } from 'next/og';

import { getCategoryNameByToken } from '@/lib/share';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const name = await getCategoryNameByToken(token);

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
        <span style={{ fontSize: 24, opacity: 0.6 }}>Lista compartilhada</span>
        <strong style={{ fontSize: 56, fontWeight: 700, marginTop: 12 }}>
          {name ?? 'Easy List'}
        </strong>
        <span style={{ fontSize: 24, marginTop: 16, opacity: 0.5 }}>Toque para entrar</span>
      </div>
    ),
    { ...size }
  );
}
