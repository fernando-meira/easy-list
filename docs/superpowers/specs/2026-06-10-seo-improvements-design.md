# SEO Improvements — Design Spec

**Date:** 2026-06-10
**Branch:** feat/share-button-design (compatible)
**Status:** Approved

## Goals

- Improve discoverability: home page (`/`) indexável e crawlável pelo Google
- Improve social previews: links compartilhados (`/share/[token]`) exibem imagem, título e descrição com o nome da categoria no WhatsApp e redes sociais
- Bloquear rotas privadas de indexação: `/category`, `/api/`, rotas de auth

## Approach

Abordagem B — SEO completo com OG image dinâmica via `ImageResponse`.

---

## Section 1: Architecture — Server Component Conversion

O Next.js exige Server Components para exportar `metadata` e `generateMetadata`. Hoje as páginas usam `'use client'` desnecessariamente ou com lógica que pode ser extraída para filhos.

### Changes

| File | Before | After |
|---|---|---|
| `src/app/page.tsx` | `'use client'` (sem lógica client) | Server Component + `export const metadata` |
| `src/app/category/page.tsx` | `'use client'` (delega para `<CategoryClient>`) | Server Component + `export const metadata` |
| `src/app/share/[token]/page.tsx` | `'use client'` com `useEffect`/`useState` | Server Component + `generateMetadata` |
| `src/app/share/[token]/share-client.tsx` | não existe | Novo componente com lógica de join (useEffect, useState, useRouter) |

**Home e category:** remover `'use client'` — toda interatividade já está nos componentes filhos.

**Share page:** criar `<ShareClient token={token}>` que recebe o token como prop e contém toda a lógica de join. O `page.tsx` passa a ser Server Component responsável apenas por renderizar `<ShareClient>` e exportar `generateMetadata`.

### New API endpoint

`GET /api/share/[token]` — retorna `{ categoryName: string | null }` sem consumir o token (o POST existente faz o join; o GET apenas consulta). Usado por `generateMetadata` e pela OG image da share page.

---

## Section 2: Metadata per Route

### Home (`src/app/page.tsx`)

```ts
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
}
```

### Share page (`src/app/share/[token]/page.tsx`)

```ts
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const name = await getCategoryNameByToken(token)

  const title = name ? `Lista: ${name} — Easy List` : 'Easy List'
  const description = name
    ? `Você foi convidado para a lista "${name}". Abra para entrar.`
    : 'Você recebeu um convite para uma lista no Easy List.'

  return {
    title,
    openGraph: { title, description, type: 'website', locale: 'pt_BR' },
    twitter: { card: 'summary_large_image' },
  }
}
```

### Noindex routes

Login (`/(auth)/login/page.tsx`) e verify-request (`/(auth)/verify-request/page.tsx`) recebem:
```ts
export const metadata: Metadata = {
  robots: { index: false },
}
```

A rota `/category` também recebe `robots: { index: false }`.

### Environment variable

`NEXT_PUBLIC_BASE_URL` — URL base de produção (ex: `https://easy-list.app`). Deve ser adicionada ao `.env.local` e às variáveis de ambiente de deploy.

---

## Section 3: Dynamic OG Images

Arquivos `opengraph-image.tsx` colocados na pasta de cada rota são servidos automaticamente como `og:image` pelo Next.js.

### Home — `src/app/opengraph-image.tsx` (static)

- Tamanho: `1200×630`
- Runtime: `edge`
- Conteúdo: logo do app + "Easy List" + tagline em fundo escuro (`#18181b`)

```tsx
export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', width: '100%', height: '100%',
      background: '#18181b', color: '#ffffff', fontFamily: 'sans-serif',
    }}>
      <span style={{ fontSize: 64, fontWeight: 700 }}>Easy List</span>
      <span style={{ fontSize: 28, marginTop: 16, opacity: 0.7 }}>
        Sua lista de compras inteligente
      </span>
    </div>
  )
}
```

### Share — `src/app/share/[token]/opengraph-image.tsx` (dynamic)

- Busca nome da categoria via `getCategoryNameByToken(token)`
- Renderiza: "Lista compartilhada" + nome da categoria + "Toque para entrar"
- Fallback para nome genérico se token inválido

```tsx
export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { token: string } }) {
  const name = await getCategoryNameByToken(params.token)

  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', width: '100%', height: '100%',
      background: '#18181b', color: '#ffffff', fontFamily: 'sans-serif',
    }}>
      <span style={{ fontSize: 24, opacity: 0.6 }}>Lista compartilhada</span>
      <strong style={{ fontSize: 56, fontWeight: 700, marginTop: 12 }}>
        {name ?? 'Easy List'}
      </strong>
      <span style={{ fontSize: 24, marginTop: 16, opacity: 0.5 }}>Toque para entrar</span>
    </div>
  )
}
```

### Shared utility — `src/lib/share.ts`

Função `getCategoryNameByToken(token: string): Promise<string | null>` compartilhada entre `generateMetadata` e `opengraph-image.tsx`.

Deve usar `fetch` com URL absoluta construída via `NEXT_PUBLIC_BASE_URL` — `opengraph-image.tsx` roda no **edge runtime**, que não suporta o Firestore SDK (Node.js only) nem fetches relativos.

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

---

## Section 4: `robots.txt` and `sitemap.xml`

### `src/app/robots.ts`

```ts
import type { MetadataRoute } from 'next'

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
  }
}
```

### `src/app/sitemap.ts`

Apenas a home por enquanto. Share links são temporários e não devem ser indexados.

```ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_BASE_URL!,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
```

---

## Files to Create / Modify

| Action | File |
|---|---|
| Modify | `src/app/page.tsx` |
| Modify | `src/app/category/page.tsx` |
| Modify | `src/app/share/[token]/page.tsx` |
| Modify | `src/app/(auth)/login/page.tsx` |
| Modify | `src/app/(auth)/verify-request/page.tsx` |
| Create | `src/app/share/[token]/share-client.tsx` |
| Create | `src/app/opengraph-image.tsx` |
| Create | `src/app/share/[token]/opengraph-image.tsx` |
| Create | `src/app/robots.ts` |
| Create | `src/app/sitemap.ts` |
| Create | `src/lib/share.ts` |
| Modify | `src/app/api/share/[token]/route.ts` (add GET handler) |
| Modify | `.env.local` (add NEXT_PUBLIC_BASE_URL) |

## Out of Scope

- Structured data / JSON-LD
- Web App Manifest (PWA)
- Performance / Core Web Vitals
- Landing page de marketing separada
