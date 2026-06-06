# 🔄 Sistema de Login Unificado

## Mudanças Implementadas

### ✅ O que foi feito

1. **Nova Rota Unificada**: `/api/auth/send-login`
   - Envia um único email com **magic link** E **código de verificação**
   - Substitui as rotas separadas de magic link e código

2. **Página de Login Simplificada**
    - Removidas as tabs (Magic Link / Código)
    - Interface única e mais limpa
    - Usuário digita o email e recebe ambas as opções
    - A validação manual usa `signIn('verification-code')` diretamente, sem chamada prévia para `/api/auth/verify-code`

3. **Email Unificado**
   - Contém duas opções de acesso:
     - 🔗 Link mágico (clique para acessar)
     - 🔑 Código de 4 caracteres (digite manualmente)

4. **Rota de Callback do Magic Link**: `/api/auth/callback/email`
   - Processa o token do magic link
   - Cria sessão automaticamente
   - Redireciona para a página inicial

## Fluxo de Autenticação

### 1. Usuário Digita o Email

```
Página de Login
    ↓
Digite seu email
    ↓
Clica em "Continuar"
```

### 2. Sistema Envia Email Unificado

```
POST /api/auth/send-login
    ↓
Gera código (4 chars)
Gera token (magic link)
    ↓
Salva no MongoDB
    ↓
Envia email com ambos
```

### 3. Usuário Escolhe Como Acessar

**Opção A: Magic Link (Mais Rápido)**
```
Clica no link do email
    ↓
GET /api/auth/callback/email?token=xxx&email=xxx
    ↓
Valida token
    ↓
Cria sessão
    ↓
Redireciona para /
```

**Opção B: Código Manual**
```
Digita código na tela
    ↓
signIn('verification-code')
    ↓
CredentialsProvider valida código não usado
    ↓
Cria usuário se necessário e confirma email
    ↓
Marca código como usado
    ↓
Redireciona para /
```

## Estrutura de Arquivos

### Novos Arquivos

```
src/app/api/auth/
├── send-login/
│   └── route.ts          # Nova rota unificada
└── callback/
    └── email/
        └── route.ts      # Callback do magic link
```

### Arquivos Modificados

```
src/app/(auth)/login/
└── page.tsx              # Interface simplificada
```

### Arquivos Mantidos (Ainda Necessários)

```
src/app/api/auth/
├── verify-code/
│   └── route.ts          # Compatibilidade: valida código sem consumir uso
└── request-code/
    └── route.ts          # Pode ser removido (deprecated)
```

## Banco de Dados

### Coleção: verificationCodes

```javascript
{
  email: "user@example.com",
  code: "A1B2",              // Código de 4 caracteres
  token: "abc123...",        // Token do magic link
  expiresAt: ISODate("..."), // 10 minutos
  createdAt: ISODate("..."),
  used: false,
  attempts: 0
}
```

## Template do Email

O email enviado contém:

1. **Seção do Magic Link**
   - Botão destacado "Acessar Easy List"
   - Link direto para login

2. **Seção do Código**
   - Código em destaque (grande e legível)
   - Instruções para uso manual

3. **Informações**
   - Tempo de expiração (10 minutos)
   - Aviso de segurança

## Vantagens da Unificação

### ✅ Para o Usuário

- **Mais simples**: Um único fluxo, sem escolhas confusas
- **Mais flexível**: Pode usar o método que preferir
- **Mais rápido**: Magic link para acesso instantâneo
- **Mais confiável**: Código como fallback se o link não funcionar

### ✅ Para o Sistema

- **Menos código**: Uma rota em vez de duas
- **Menos emails**: Um email em vez de dois possíveis
- **Melhor UX**: Interface mais limpa e intuitiva
- **Mais eficiente**: Menos requisições ao banco

## Segurança

### Medidas Implementadas

1. **Rate Limiting**: Máximo 5 tentativas por hora
2. **Expiração**: Código e token expiram em 10 minutos
3. **Uso Único**: Código/token só pode ser usado uma vez
4. **Validação**: Email e código validados no backend
5. **Tentativas**: Contador de tentativas inválidas
6. **Segredo compartilhado**: NextAuth, middleware e rotas protegidas usam `authSecret`, resolvido de `NEXTAUTH_SECRET` ou `AUTH_SECRET`

### Tokens

- **Código**: 4 caracteres alfanuméricos (16^4 = 65.536 combinações)
- **Magic Link Token**: 32 bytes hex (2^256 combinações)

## Migração

### Rotas Antigas (Podem ser Removidas)

- `/api/auth/request-code` - Substituída por `/api/auth/send-login`
- NextAuth EmailProvider - Substituído pelo sistema unificado

### Compatibilidade

O sistema atual mantém:
- `/api/auth/verify-code` - Compatível para validação externa, mas não consome o código
- Autenticação por código via NextAuth CredentialsProvider, que consome o código e cria/confirma o usuário

## Testes

### Testar o Fluxo Completo

1. **Enviar Email**
   ```bash
   curl -X POST http://localhost:3000/api/auth/send-login \
     -H 'Content-Type: application/json' \
     -d '{"email":"seu@email.com"}'
   ```

2. **Verificar Email**
   - Abra o email recebido
   - Teste o magic link
   - Teste o código manual

3. **Validar Código via API de Compatibilidade**
    ```bash
    curl -X POST http://localhost:3000/api/auth/verify-code \
      -H 'Content-Type: application/json' \
      -d '{"email":"seu@email.com","code":"A1B2"}'
    ```

4. **Validar Código no Fluxo Real**
   - Digite o código na tela de login.
   - O frontend chama `signIn('verification-code')`.
   - O CredentialsProvider valida, cria/confirma o usuário e marca o código como usado.

## Próximos Passos

### Opcional (Melhorias Futuras)

1. **Remover rotas antigas**
   - Deletar `/api/auth/request-code`
   - Simplificar NextAuth config

2. **Analytics**
   - Rastrear qual método é mais usado
   - Magic link vs Código manual

3. **Melhorias de UX**
   - Auto-submit do código ao digitar 4 caracteres
   - Copiar código com um clique
   - Reenviar email

4. **Internacionalização**
   - Traduzir emails
   - Suporte a múltiplos idiomas

## Troubleshooting

### Email não chega

1. Verifique se o email está correto
2. Verifique spam/lixo eletrônico
3. Verifique logs do Resend
4. Confirme que está usando email autorizado (se domínio de teste)

### Magic link não funciona

1. Verifique se o link não expirou (10 min)
2. Verifique se já foi usado
3. Verifique logs do servidor
4. Use o código manual como alternativa

### Código inválido

1. Verifique se digitou corretamente (case-insensitive)
2. Verifique se não expirou
3. Verifique se não excedeu tentativas (5 max)
4. Solicite novo código
