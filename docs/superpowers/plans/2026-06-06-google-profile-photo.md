# Google Profile Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir a foto de perfil do Google no avatar do header, com fallback de iniciais para usuários sem foto.

**Architecture:** Criar o componente `UserAvatar` que encapsula `Avatar / AvatarImage / AvatarFallback` do Radix UI com lógica de iniciais. O `Header` substitui o `div` placeholder atual pelo novo componente, recebendo os dados diretamente da sessão NextAuth via `useSession()`.

**Tech Stack:** Next.js 14 App Router, NextAuth v4, `@radix-ui/react-avatar` (já instalado), TypeScript

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `src/components/user-avatar.tsx` | Renderizar avatar com imagem ou iniciais |
| Modificar | `src/components/header.tsx` | Substituir `div` placeholder por `<UserAvatar />` |

---

### Task 1: Criar o componente `UserAvatar`

**Files:**
- Create: `src/components/user-avatar.tsx`

- [ ] **Step 1: Criar o arquivo do componente**

Crie `src/components/user-avatar.tsx` com o seguinte conteúdo:

```tsx
'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getBiggestUsernamePart } from '@/utils';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) {
    const part = getBiggestUsernamePart(email);
    return part ? part[0].toUpperCase() : '';
  }
  return '';
}

export function UserAvatar({ name, email, image }: UserAvatarProps) {
  const initials = getInitials(name, email);

  return (
    <Avatar className="w-9 h-9 border border-[var(--color-hairline)]">
      <AvatarImage src={image ?? undefined} alt={name ?? email ?? 'Avatar'} />
      <AvatarFallback className="bg-[var(--color-surface-card)] text-xs font-semibold text-[var(--color-muted)]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/user-avatar.tsx
git commit -m "feat: add UserAvatar component with Google photo and initials fallback"
```

---

### Task 2: Integrar `UserAvatar` no `Header`

**Files:**
- Modify: `src/components/header.tsx:1-7` (imports) e `src/components/header.tsx:31` (placeholder)

- [ ] **Step 1: Adicionar o import**

No topo de `src/components/header.tsx`, adicione o import do `UserAvatar` junto aos demais imports locais:

```tsx
import { UserAvatar } from '@/components/user-avatar';
```

O bloco de imports ficará assim:

```tsx
'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Sun, Moon, LogIn, LogOut, ShoppingBasket } from 'lucide-react';

import { PagesEnum } from '@/types/enums';
import { UserAvatar } from '@/components/user-avatar';
```

- [ ] **Step 2: Substituir o `div` placeholder**

Localize o `div` placeholder atual (dentro do bloco `isLoggedIn`) em `src/components/header.tsx`:

```tsx
<div className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] border border-[var(--color-hairline)] flex-shrink-0" />
```

Substitua por:

```tsx
<UserAvatar
  name={session?.user?.name}
  email={session?.user?.email}
  image={session?.user?.image}
/>
```

O bloco `isLoggedIn` completo ficará assim:

```tsx
{isLoggedIn ? (
  <div className="flex items-center gap-2">
    <UserAvatar
      name={session?.user?.name}
      email={session?.user?.email}
      image={session?.user?.image}
    />
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-semibold leading-none text-[var(--color-ink)]">
        Olá, {firstName}
      </span>
      <span className="text-[11px] leading-none text-[var(--color-muted)]">
        {email}
      </span>
    </div>
  </div>
) : (
```

- [ ] **Step 3: Verificar lint e tipos**

```bash
npm run lint
npx tsc --noEmit
```

Esperado: sem erros ou warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: display Google profile photo in header avatar"
```

---

### Task 3: Verificação Manual

- [ ] **Step 1: Subir o servidor de desenvolvimento**

```bash
npm run dev
```

Acesse `http://localhost:3000`.

- [ ] **Step 2: Verificar usuário Google**

Entre com uma conta Google. Confirme que a foto de perfil aparece no avatar do header (canto superior esquerdo, ao lado de "Olá, [nome]").

- [ ] **Step 3: Verificar usuário email/código**

Entre com email + código OTP. Confirme que as iniciais aparecem no avatar (ex: `FM` para "Fernando Meira", `F` para "Fernando").

- [ ] **Step 4: Verificar fallback de imagem inválida**

No componente `UserAvatar`, temporariamente troque `image` por uma URL inválida (ex: `"https://invalid.url/img.jpg"`) para confirmar que o Radix exibe o `AvatarFallback` com as iniciais. Reverta após o teste.

- [ ] **Step 5: Build final**

```bash
npm run build
```

Esperado: build sem erros.
