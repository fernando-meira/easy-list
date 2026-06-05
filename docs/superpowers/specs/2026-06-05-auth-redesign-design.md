# Auth Redesign — Design Spec

**Data:** 2026-06-05  
**Escopo:** Redesign visual completo do fluxo de autenticação + correção de todos os bugs 🔴  
**Referência:** `DESIGN.md` (Cal.com Design System), `AUTH_REDESIGN_ANALYSIS.md`  
**Abordagem:** Component-first — tokens e componentes base antes das páginas

---

## 1. Foundation

### Fontes

- Carregar `Inter` via `next/font/google` em `src/app/layout.tsx`
- Remover `Manrope` do `tailwind.config.ts` e `Arial, Helvetica` do `globals.css`
- Cal Sans não está disponível como web font pública — headings usam Inter 600 com `letter-spacing: -0.5px` (substituto documentado no DESIGN.md)
- Aplicar a variável CSS da fonte Inter no `body` via `className`

### Tokens CSS (`globals.css`)

Substituir valores com opacidade por valores sólidos alinhados ao DESIGN.md:

| Token | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#09090b` |
| `--card` | `#ffffff` | `#101010` |
| `--border` | `#e5e7eb` | `#27272a` |
| `--primary` | `#111111` | `#ffffff` |
| `--muted-foreground` | `#6b7280` | `#a1a1aa` |
| `--destructive` | `#ef4444` | `#ef4444` |

**Resultado:** toda referência a `bg-card/50`, `border-border/50`, `bg-background/50` no codebase deixa de ter efeito visual diferente — os componentes herdam valores sólidos sem precisar alterar cada classe individualmente.

---

## 2. Componentes Compartilhados

### Button (`src/components/ui/button.tsx`)

- Variante `default`: altura `h-10` (40px), `rounded-md` garantido como 8px via token Tailwind
- Remover das páginas de auth: `shadow-lg shadow-primary/20`, `hover:scale-[1.02]`, `active:scale-[0.98]`
- Variante `outline` permanece para uso geral; no auth o "Voltar" usa `ghost` (sem border, sem background)

### Input (`src/components/ui/input.tsx`)

- Altura: `h-10` (40px)
- Background: `bg-background` sólido — remover sobrescrita `bg-background/50` das páginas
- Border: `border-border` sólido — remover sobrescrita `border-border/50` das páginas
- Focus ring: `focus-visible:ring-ring` (token padrão, sólido)

### Header (`src/components/header.tsx`) — modo `isSimple`

- Adicionar **wordmark** à esquerda: `<span>Easy List</span>` em Inter 600, 16px
- ThemeToggle corrigido aqui (ver Seção 5 — fix A2)
- Layout: `flex justify-between items-center`, altura 64px, `bg-background` sem border
- Avatar: substituir `src='https://avatar.iran.liara.run/public'` por `<AvatarFallback>` com iniciais do usuário (fix M9)

### ThemeToggle (`src/components/theme-toggle.tsx`)

```typescript
// Antes (incorreto)
const { theme, setTheme } = useTheme();
setTheme(theme === 'light' ? 'dark' : 'light');

// Depois (fix A2)
const { resolvedTheme, setTheme } = useTheme();
setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
// Ícone: resolvedTheme === 'light' ? <MoonIcon /> : <SunIcon />
```

### OTPInput (`src/components/otp-input.tsx`)

- Adicionar `aria-label={`Dígito ${index + 1} de ${length}`}` em cada input (fix A5)
- Adicionar `dark:border-zinc-700 dark:bg-zinc-900` para contraste em dark mode (fix B6)
- `aria-required="true"` em cada input

---

## 3. Login Page (`src/app/(auth)/login/page.tsx`)

### Card container

```
// Antes
className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-black/10 p-4"

// Depois
className="rounded-lg border border-border bg-card shadow-sm p-8"
```

### Passo 1 — Email

**Estrutura de elementos (ordem top → bottom):**

1. Indicador de progresso: `<p>Passo 1 de 2</p>` — caption, muted, com barra visual simples
2. `<h1>Acesse sua conta</h1>` — Inter 600, 28px, letter-spacing -0.5px (fix A4)
3. Subtítulo: `<p>Digite seu email para continuar</p>` — body-sm, muted
4. Label + Input email — `h-10`, sem ícone Mail inline, sem `bg-background/50`
5. Erro de validação com `role="alert"` e `aria-live="polite"` (fix A6)
6. Botão "Continuar →" — `h-10`, sem `shadow-lg`, sem `hover:scale`
7. Linha de instrução: `<p>Você receberá um link e um código de 4 dígitos</p>` — body-sm, muted (substituiu a caixa grande com bullets)
8. Ícones decorativos: `aria-hidden="true"` em todos (fix accessibility)

**Fix A1 — erro JSON:**
```typescript
// Antes
const responseData = await response.json(); // pode lançar se resposta for HTML
if (!response.ok) throw new Error(responseData.error || '...');

// Depois
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.error || 'Erro ao enviar email. Tente novamente.');
}
```

**Fix A8 — magic link expirado:**  
`login/page.tsx` é `'use client'` — usar `useSearchParams()` de `next/navigation`. Se `searchParams.get('error') === 'Verification'`, exibir banner no topo do card: "Seu link expirou ou já foi usado. Solicite um novo acesso." com `role="alert"`.

### Passo 2 — Código OTP

**Estrutura de elementos (ordem top → bottom):**

1. Indicador de progresso: `<p>Passo 2 de 2</p>`
2. `<h1>Verifique seu email</h1>` — Inter 600, 28px (fix A4)
3. Subtítulo: `Enviamos o código para <strong>{currentEmail}</strong>` — body-sm, email em Inter 600 #111111
4. OTPInput — corrigido (aria-labels, dark mode contrast)
5. Erro com `role="alert"` (fix A6)
6. Botão "Verificar →" — `h-10`, sem shadow/scale
7. Botão "← Voltar ao email" — `variant="ghost"`, body-sm (fix M8 — não mais outline)
8. Countdown de reenvio: `Não recebeu? Reenviar em MM:SS` — body-sm, muted; botão ativo após timer zerar (fix A7)

**Countdown:** estado `resendCountdown` inicializado em 600 (10 min). `useEffect` com `setInterval` de 1s. Quando chega a 0, exibe botão "Reenviar email" que chama `sendLoginEmail` com o email atual.

---

## 4. Verify-Request Page

**Mover arquivo:** `src/app/verify-request/page.tsx` → `src/app/(auth)/verify-request/page.tsx`

**Fix A3 — email persistido via sessionStorage:**
```typescript
// No sendLoginEmail (login/page.tsx), ao enviar com sucesso:
sessionStorage.setItem('auth_email', data.email);

// No verify-request/page.tsx:
const [email, setEmail] = useState('');
useEffect(() => {
  const stored = sessionStorage.getItem('auth_email');
  if (stored) setEmail(stored);
}, []);
```

**Estrutura de elementos:**

1. Ícone `<Mail>` 40px, `aria-hidden="true"`
2. `<h1>Verifique seu email</h1>` (já existe ✅)
3. `Enviamos um link para <strong>{email}</strong>` — body-sm, muted
4. `Verifique a caixa de entrada ou spam.` — body-sm, muted
5. Botão "Reenviar email" — `variant="outline"`, desabilitado com countdown `em MM:SS`; ao zerar, habilitado e chama `/api/auth/send-login`
6. Botão "← Voltar para o login" — `variant="ghost"`, `href="/login"`
7. Remover `<LoadingSpinner>` de "Aguardando confirmação" — o `useEffect + useSession` já redireciona automaticamente

---

## 5. Resumo de Fixes por ID

| ID | Problema | Onde | Status |
|---|---|---|---|
| A1 | Erro JSON técnico exposto no toast | `login/page.tsx` | ✅ Especificado |
| A2 | ThemeToggle usa `theme` em vez de `resolvedTheme` | `theme-toggle.tsx` | ✅ Especificado |
| A3 | Email ausente no verify-request | `verify-request/page.tsx` + `login/page.tsx` | ✅ Especificado |
| A4 | Sem `<h1>` nos passos de login | `login/page.tsx` | ✅ Especificado |
| A5 | OTP inputs sem `aria-label` | `otp-input.tsx` | ✅ Especificado |
| A6 | Erros inline sem `role="alert"` | `login/page.tsx` | ✅ Especificado |
| A7 | Sem botão "Reenviar código" | `login/page.tsx` + `verify-request/page.tsx` | ✅ Especificado |
| A8 | Sem tratamento para magic link expirado | `login/page.tsx` | ✅ Especificado |
| M1 | Glassmorphism (viola DESIGN.md) | `globals.css` + `login/page.tsx` | ✅ Especificado |
| M2 | Tipografia incorreta (Arial/Manrope) | `layout.tsx` + `globals.css` | ✅ Especificado |
| M3 | Altura inputs/botões diverge (44px → 40px) | `button.tsx` + `input.tsx` | ✅ Especificado |
| M4 | `hover:scale` no botão | `login/page.tsx` | ✅ Especificado |
| M5 | Sem wordmark no header de auth | `header.tsx` | ✅ Especificado |
| M6 | Sem indicador de progresso passo 1/2 | `login/page.tsx` | ✅ Especificado |
| M7 | Caixa informativa redundante no passo 2 | `login/page.tsx` | ✅ Especificado |
| M8 | "Voltar" como outline em vez de ghost | `login/page.tsx` | ✅ Especificado |
| M9 | Avatar hardcoded URL externa | `header.tsx` | ✅ Especificado |
| B6 | OTP contraste baixo em dark mode | `otp-input.tsx` | ✅ Especificado |

---

## 6. Arquivos Alterados

| Arquivo | Tipo de mudança |
|---|---|
| `src/app/layout.tsx` | Carrega Inter via next/font |
| `src/app/globals.css` | Tokens CSS sólidos, remove Arial/Manrope |
| `tailwind.config.ts` | Remove Manrope, garante rounded-md = 8px |
| `src/components/ui/button.tsx` | h-10, rounded-md |
| `src/components/ui/input.tsx` | h-10, bg/border sólidos |
| `src/components/header.tsx` | Wordmark, AvatarFallback, ThemeToggle fix |
| `src/components/theme-toggle.tsx` | resolvedTheme |
| `src/components/otp-input.tsx` | aria-labels, dark mode contrast |
| `src/app/(auth)/login/page.tsx` | Redesign completo passo 1 e 2 |
| `src/app/(auth)/verify-request/page.tsx` | Movido + redesign + sessionStorage |

**Arquivo removido:** `src/app/verify-request/page.tsx` (movido para dentro do grupo `(auth)`)
