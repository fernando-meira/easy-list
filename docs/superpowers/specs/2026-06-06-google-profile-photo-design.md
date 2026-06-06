# Google Profile Photo — Design Spec

**Data:** 2026-06-06  
**Escopo:** Exibir a foto de perfil do Google no avatar do header, com fallback de iniciais para usuários sem foto  
**Abordagem aprovada:** Componente `UserAvatar` dedicado, consumido pelo `Header`

## Contexto

O header já possui um `div` placeholder circular (w-9 h-9) onde a foto de perfil deve aparecer. O projeto usa NextAuth v4 com `GoogleProvider` e sessão JWT — `session.user.image` é populado automaticamente pelo NextAuth a partir do perfil Google, sem callbacks extras. Para usuários que entraram por email/código, `session.user.image` é `null`. O projeto já possui `Avatar / AvatarImage / AvatarFallback` de `@radix-ui/react-avatar` em `src/components/ui/avatar.tsx`.

## Fluxo da Imagem

1. Usuário faz login via Google OAuth
2. Google retorna o perfil com a URL da foto (`picture`, domínio `lh3.googleusercontent.com`)
3. NextAuth salva a URL no JWT como `token.picture`
4. `useSession()` expõe `session.user.image` com essa URL
5. `UserAvatar` recebe `image` como prop e renderiza via `AvatarImage`
6. Se `image` for `null` ou a carga falhar → Radix exibe `AvatarFallback` com as iniciais

Para usuários email/código, `session.user.image` é `null` e o fallback de iniciais é exibido diretamente.

## Componente `UserAvatar`

**Arquivo:** `src/components/user-avatar.tsx`

Props:
- `name?: string | null`
- `email?: string | null`
- `image?: string | null`

**Lógica de iniciais:**
- Se `name` existir: primeira letra da primeira palavra + primeira letra da última palavra.  
  Ex: `"Fernando Meira"` → `FM`, `"Fernando"` → `F`
- Se não houver `name`: primeira letra do maior trecho do email via `getBiggestUsernamePart` (utilitário já existente em `src/utils`)

**Estilo:**
- Tamanho: `w-9 h-9` (igual ao placeholder atual)
- Borda: `border border-[var(--color-hairline)]`
- Fallback: texto de iniciais com `text-xs font-semibold text-[var(--color-muted)]` sobre fundo `bg-[var(--color-surface-card)]`

## Integração no `Header`

O `div` placeholder atual (linha 31 de `src/components/header.tsx`) é substituído por:

```tsx
<UserAvatar
  name={session?.user?.name}
  email={session?.user?.email}
  image={session?.user?.image}
/>
```

Nenhuma outra alteração no header é necessária.

## Arquivos Alterados

- **Novo:** `src/components/user-avatar.tsx`
- **Modificado:** `src/components/header.tsx` — substituir `div` placeholder por `<UserAvatar />`

## Sem Mudanças Necessárias

- `src/lib/auth.ts` — `session.user.image` já é provido pelo NextAuth automaticamente
- `next.config.js` — Radix UI usa `<img>` nativo, não `next/image`; nenhuma configuração de domínio externo necessária

## Verificação

Após implementar:

- `npm run lint`
- `npx tsc --noEmit`

Validar manualmente:
- Usuário Google: foto de perfil aparece no avatar do header
- Usuário email/código: iniciais aparecem no avatar do header
- Imagem indisponível (URL inválida): fallback de iniciais exibido pelo Radix
