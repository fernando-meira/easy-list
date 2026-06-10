# Array / Object / Import Organization Rule

## Objetivo

Manter consistência visual e previsibilidade no código através da organização em formato de "escada".

A ordenação deve sempre seguir:

1. Menor quantidade de caracteres primeiro.
2. Em caso de empate, ordenar alfabeticamente.
3. A regra vale para:
   - imports
   - arrays de dependência
   - propriedades de objetos
   - parâmetros multiline
   - arrays
   - enums
   - qualquer estrutura vertical/aninhada

---

# Exemplos

## ✅ Correto

```ts
export type Member = {
  name: string;
  email: string;
  userId: string;
  createdAt: Timestamp;
  role: "owner" | "admin";
  status: "active" | "inactive";
};
```

Motivo:
- `name` possui menos caracteres.
- Depois `email`.
- Depois `userId`.
- Depois `createdAt`.
- Em caso de proximidade/tamanho equivalente, manter ordem alfabética.

---

## ❌ Incorreto

```ts
export type Member = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  status: "active" | "inactive";
  createdAt: Timestamp;
};
```

Motivo:
- Ordem visual inconsistente.
- Quebra o padrão de escada do projeto.

---

# Imports

## ✅ Correto

```ts
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
```

---

# Arrays de dependência

## ✅ Correto

```ts
useEffect(() => {
  fetchData();
}, [
  id,
  page,
  search,
  filters,
  organizationId,
]);
```

---

# Objetos

## ✅ Correto

```ts
const payload = {
  id,
  name,
  email,
  createdAt,
  organizationId,
};
```

---

# Objetos com valores explicitos

## Correto

```ts
const buttonVariants = {
  variant: {
    ghost: "hover:bg-zinc-100 hover:text-zinc-950",
    default: "bg-zinc-950 text-white hover:bg-zinc-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
  },
  size: {
    sm: "h-9 px-3",
    lg: "h-11 px-5",
    default: "h-10 px-4",
    icon: "h-10 w-10 px-0",
  },
};
```

Motivo:
- A ordenacao considera a linha completa, incluindo chave, valor, default assignment e demais caracteres visiveis.
- `default: "bg-zinc-950 text-white hover:bg-zinc-800"` e menor que `destructive: "bg-red-600 text-white hover:bg-red-700"`.
- `default: "h-10 px-4"` e menor que `icon: "h-10 w-10 px-0"`.

---

# Parâmetros multiline com valor padrão

## ✅ Correto

```ts
export function FormField({
  id,
  error,
  label,
  autoComplete,
  type = "text",
  ...props
}: FormFieldProps) {}
```

Motivo:
- A ordenação considera o item completo escrito na linha.
- `type = "text"` é maior que `autoComplete`, então fica depois.
- Rest parameters como `...props` devem permanecer por último por semântica da linguagem.

---

# Regras adicionais

- Sempre manter alinhamento visual limpo.
- Nunca ordenar semanticamente ou manualmente.
- O padrão do projeto é exclusivamente:
  - menor → maior
  - empate → ordem alfabética
- A regra deve ser aplicada automaticamente em qualquer refatoração.
- Ao criar novos campos, reordenar toda a estrutura.

---

# Imports com declaracao completa

## Correto

```ts
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signIn } from "../services/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/form-field";
import { type LoginInput, loginSchema } from "../schemas/auth.schema";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
```

Motivo:
- Imports seguem a linha completa da declaracao.
- Nao separar por origem, tipo ou alias quando isso quebrar a escada.
- Named imports multiline seguem a mesma regra, um item por linha.
- Quando a ordem de um import de efeito colateral for semanticamente importante, manter a ordem necessaria e adicionar comentario explicando.
