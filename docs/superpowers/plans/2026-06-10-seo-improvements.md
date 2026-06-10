# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar metadata completa, OG images dinâmicas, robots.txt e sitemap ao Easy List para melhorar discoverabilidade no Google e previews sociais no WhatsApp.

**Architecture:** Converter páginas `'use client'` desnecessárias para Server Components para habilitar `metadata`/`generateMetadata`. Criar endpoint GET para lookup do nome da categoria por share token (sem consumir o token). Gerar OG images via `ImageResponse` no edge runtime, usando fetch com URL absoluta para acessar o Firestore indiretamente.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Firebase Admin SDK (Firestore), `next/og` (ImageResponse), edge runtime

---

## File Map

| Action | File | Responsabilidade |
|---|---|---|
| Modify | `src/lib/firestore-domain.ts` | Adicionar `lookupShareToken` (read-only) |
| Modify | `src/app/api/share/[token]/route.ts` | Adicionar handler GET |
| Create | `src/lib/share.ts` | Utility `getCategoryNameByToken` (edge-safe) |
| Create | `src/app/share/[token]/share-client.tsx` | Lógica de join extraída da share page |
| Modify | `src/app/share/[token]/page.tsx` | Server Component + `generateMetadata` |
| Modify | `src/app/page.tsx` | Remover `'use client'` + `metadata` |
| Modify | `src/app/category/page.tsx` | Remover `'use client'` + `robots: { index: false }` |
| Create | `src/app/(auth)/layout.tsx` | Layout server com `robots: { index: false }` para rotas de auth |
| Create | `src/app/opengraph-image.tsx` | OG image estática da home |
| Create | `src/app/share/[token]/opengraph-image.tsx` | OG image dinâmica das share pages |
| Create | `src/app/robots.ts` | robots.txt |
| Create | `src/app/sitemap.ts` | sitemap.xml |
| Modify | `.env.local` | Adicionar `NEXT_PUBLIC_BASE_URL` |

---

## Task 1: Adicionar `NEXT_PUBLIC_BASE_URL` ao `.env.local`

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Adicionar variável ao `.env.local`**

Abrir `.env.local` e adicionar no final:

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Em produção, substituir pelo URL real (ex: `https://easy-list.app`) na plataforma de deploy (Vercel, etc).

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add NEXT_PUBLIC_BASE_URL env variable"
```

---

## Task 2: Adicionar `lookupShareToken` ao `firestore-domain.ts`

**Files:**
- Modify: `src/lib/firestore-domain.ts`

Essa função faz lookup read-only por token — não faz join nem modifica documentos. Será usada pelo novo GET endpoint.

- [ ] **Step 1: Adicionar a função no final do arquivo**

Adicionar após `joinSharedList`:

```ts
export async function lookupShareToken(token: string): Promise<{ categoryName: string } | null> {
  const snapshot = await categoriesCollection
    .where('shareToken', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return { categoryName: snapshot.docs[0].data().name as string };
}
```

- [ ] **Step 2: Verificar que o build passa**

```bash
npx next build
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore-domain.ts
git commit -m "feat: add lookupShareToken read-only Firestore query"
```

---

## Task 3: Adicionar handler GET em `/api/share/[token]/route.ts`

**Files:**
- Modify: `src/app/api/share/[token]/route.ts`

O GET retorna o nome da categoria sem autenticação — expõe apenas o nome (não dado sensível). Usado pelo edge runtime para OG images.

- [ ] **Step 1: Adicionar import e handler GET**

Arquivo completo após a modificação:

```ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { joinSharedList, lookupShareToken } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  const result = await lookupShareToken(token);
  return NextResponse.json({ categoryName: result?.categoryName ?? null }, { status: 200 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const jwtToken = await getToken({ req: request, secret: authSecret });
    const userId = jwtToken?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { token } = await context.params;

    const result = await joinSharedList(token, userId);

    if (!result) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao entrar na lista' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Testar o endpoint manualmente**

Com o dev server rodando (`npm run dev`), abrir no browser ou usar curl:

```bash
curl http://localhost:3000/api/share/token-inexistente
```

Esperado: `{"categoryName":null}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/share/[token]/route.ts
git commit -m "feat: add GET /api/share/[token] for category name lookup"
```

---

## Task 4: Criar `src/lib/share.ts`

**Files:**
- Create: `src/lib/share.ts`

Utility compartilhada entre `generateMetadata` e `opengraph-image.tsx`. Usa `fetch` com URL absoluta pois `opengraph-image.tsx` roda no edge runtime, que não suporta Firestore SDK (Node.js only) nem fetches relativos.

- [ ] **Step 1: Criar o arquivo**

```ts
export async function getCategoryNameByToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/share/${token}`)
    if (!res.ok) return null
    const { categoryName } = await res.json()
    return categoryName ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Verificar que o build passa**

```bash
npx next build
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/share.ts
git commit -m "feat: add getCategoryNameByToken edge-safe utility"
```

---

## Task 5: Criar `src/app/share/[token]/share-client.tsx`

**Files:**
- Create: `src/app/share/[token]/share-client.tsx`

Extrai toda a lógica client da share page atual para um componente dedicado que recebe `token` como prop (string já resolvida, não Promise).

- [ ] **Step 1: Criar o arquivo com a lógica extraída**

```tsx
'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/loading-spinner';

interface ShareClientProps {
  token: string;
}

export function ShareClient({ token }: ShareClientProps) {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function join() {
      try {
        const response = await fetch(`/api/share/${token}`, { method: 'POST' });

        if (!response.ok) {
          setError(true);
          return;
        }

        const { categoryName } = await response.json();
        toast.success(`Você foi adicionado à lista ${categoryName}`);
        router.push('/');
      } catch {
        setError(true);
      }
    }

    join();
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Header />
        <p className="mt-4 text-sm text-destructive">Link inválido ou expirado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Header />
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingSpinner />
        <span>Entrando na lista...</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/share/[token]/share-client.tsx
git commit -m "feat: extract ShareClient component from share page"
```

---

## Task 6: Converter `src/app/share/[token]/page.tsx` para Server Component

**Files:**
- Modify: `src/app/share/[token]/page.tsx`

Remove `'use client'`, adiciona `generateMetadata` dinâmico, e delega rendering para `<ShareClient>`.

- [ ] **Step 1: Substituir o conteúdo do arquivo**

```tsx
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
    openGraph: { title, description, type: 'website', locale: 'pt_BR' },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  return <ShareClient token={token} />;
}
```

- [ ] **Step 2: Verificar que o build passa**

```bash
npx next build
```

Esperado: sem erros. A share page deve continuar funcionando igual.

- [ ] **Step 3: Commit**

```bash
git add src/app/share/[token]/page.tsx
git commit -m "feat: convert share page to Server Component with generateMetadata"
```

---

## Task 7: Converter `src/app/page.tsx` (home) para Server Component

**Files:**
- Modify: `src/app/page.tsx`

Remove `'use client'` (não há lógica client direta) e adiciona `metadata` completo com OG tags.

- [ ] **Step 1: Substituir o conteúdo do arquivo**

```tsx
import type { Metadata } from 'next';

import { Main } from '@/components/main';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { MainContent } from '@/components/main-content';
import { CategoryCard } from '@/components/category-card';

export const metadata: Metadata = {
  title: 'Easy List — Sua lista de compras inteligente',
  description: 'Organize suas compras de forma simples e compartilhe listas com sua família ou amigos.',
  openGraph: {
    title: 'Easy List — Sua lista de compras inteligente',
    description: 'Organize suas compras de forma simples e compartilhe listas com sua família ou amigos.',
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Home() {
  return (
    <Main>
      <Header />

      <MainContent>
        <CategoryCard />
      </MainContent>

      <Footer />
    </Main>
  );
}
```

- [ ] **Step 2: Verificar que o build passa**

```bash
npx next build
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: convert home page to Server Component with full metadata"
```

---

## Task 8: Converter `src/app/category/page.tsx` para Server Component

**Files:**
- Modify: `src/app/category/page.tsx`

Remove `'use client'` e adiciona `robots: { index: false }` — a página de categorias é privada e não deve ser indexada.

- [ ] **Step 1: Substituir o conteúdo do arquivo**

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Main } from '@/components/main';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';

import { CategoryClient } from './category-client';

export const metadata: Metadata = {
  robots: { index: false },
};

function CategorySkeleton() {
  return (
    <div className="w-full space-y-2 mt-14 p-4">
      <Skeleton className="h-9 w-28" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function Category() {
  return (
    <Main>
      <Header />

      <div className="w-full mt-14 p-4">
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryClient />
        </Suspense>
      </div>
    </Main>
  );
}
```

- [ ] **Step 2: Verificar que o build passa**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/category/page.tsx
git commit -m "feat: convert category page to Server Component with noindex"
```

---

## Task 9: Criar `src/app/(auth)/layout.tsx` com noindex

**Files:**
- Create: `src/app/(auth)/layout.tsx`

As páginas de auth (`/login`, `/verify-request`) são `'use client'` com extensa lógica de formulário — não é prático convertê-las. A solução é um layout de grupo Server Component que aplica `robots: { index: false }` a todas as rotas dentro de `(auth)`.

- [ ] **Step 1: Criar o arquivo**

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Verificar que o build passa**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/layout.tsx
git commit -m "feat: add auth group layout with noindex metadata"
```

---

## Task 10: Criar `src/app/opengraph-image.tsx` (home OG image)

**Files:**
- Create: `src/app/opengraph-image.tsx`

OG image estática da home. Renderiza título e tagline em fundo escuro. O Next.js serve este arquivo automaticamente como `og:image` para a rota `/`.

- [ ] **Step 1: Criar o arquivo**

```tsx
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
```

- [ ] **Step 2: Verificar a imagem no browser**

Com o dev server rodando (`npm run dev`), abrir:

```
http://localhost:3000/opengraph-image
```

Esperado: imagem PNG 1200×630 com fundo escuro, texto "Easy List" e tagline.

- [ ] **Step 3: Commit**

```bash
git add src/app/opengraph-image.tsx
git commit -m "feat: add static OG image for home page"
```

---

## Task 11: Criar `src/app/share/[token]/opengraph-image.tsx` (share OG image dinâmica)

**Files:**
- Create: `src/app/share/[token]/opengraph-image.tsx`

OG image dinâmica para share links. Exibe o nome da categoria buscado via `getCategoryNameByToken`. Roda no edge runtime.

- [ ] **Step 1: Criar o arquivo**

```tsx
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
```

- [ ] **Step 2: Testar com um token real**

Com o dev server rodando, obter um `shareToken` válido no Firestore e abrir:

```
http://localhost:3000/share/<token>/opengraph-image
```

Esperado: imagem PNG com o nome da categoria no centro. Com token inválido, exibe "Easy List".

- [ ] **Step 3: Commit**

```bash
git add src/app/share/[token]/opengraph-image.tsx
git commit -m "feat: add dynamic OG image for share links"
```

---

## Task 12: Criar `src/app/robots.ts`

**Files:**
- Create: `src/app/robots.ts`

Instrui crawlers a indexar apenas `/`, ignorar rotas privadas e apontar para o sitemap.

- [ ] **Step 1: Criar o arquivo**

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/category', '/api/', '/(auth)/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Verificar no browser**

```
http://localhost:3000/robots.txt
```

Esperado:
```
User-agent: *
Allow: /
Disallow: /category
Disallow: /api/
Disallow: /(auth)/

Sitemap: http://localhost:3000/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.txt"
```

---

## Task 13: Criar `src/app/sitemap.ts`

**Files:**
- Create: `src/app/sitemap.ts`

Sitemap com apenas a home. Share links são temporários e não devem ser indexados.

- [ ] **Step 1: Criar o arquivo**

```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_BASE_URL!,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
```

- [ ] **Step 2: Verificar no browser**

```
http://localhost:3000/sitemap.xml
```

Esperado: XML válido com a URL da home.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add sitemap.xml"
```

---

## Task 14: Verificação Final

- [ ] **Step 1: Build de produção sem erros**

```bash
npx next build
```

Esperado: build completo sem erros de tipo ou de compilação.

- [ ] **Step 2: Verificar OG tags da home no browser**

Com dev server rodando, abrir as DevTools (F12) e verificar no `<head>` de `http://localhost:3000`:

```html
<meta property="og:title" content="Easy List — Sua lista de compras inteligente" />
<meta property="og:description" content="Organize suas compras de forma simples..." />
<meta property="og:image" content="http://localhost:3000/opengraph-image" />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 3: Verificar OG tags de uma share page**

Abrir `http://localhost:3000/share/<token-valido>` e verificar no `<head>`:

```html
<meta property="og:title" content="Lista: [nome da categoria] — Easy List" />
<meta property="og:image" content="http://localhost:3000/share/<token>/opengraph-image" />
```

- [ ] **Step 4: Verificar noindex nas rotas privadas**

Abrir `http://localhost:3000/category` e verificar no `<head>`:
```html
<meta name="robots" content="noindex" />
```

Abrir `http://localhost:3000/login` e verificar o mesmo.

- [ ] **Step 5: Commit final de verificação (se houver ajustes)**

```bash
git add -p
git commit -m "fix: seo adjustments after verification"
```
