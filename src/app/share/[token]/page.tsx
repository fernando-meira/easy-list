import type { Metadata } from 'next';

import { getCategoryNameByToken } from '@/lib/share';

import { ShareClient } from './share-client';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const name = await getCategoryNameByToken(token);

  const title = name ? `Lista: ${name} — Easy List` : 'Easy List';
  const description = name
    ? `Você foi convidado para a lista "${name}". Abra para entrar.`
    : 'Você recebeu um convite para uma lista no Easy List.';

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'pt_BR' },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  return <ShareClient token={token} />;
}
