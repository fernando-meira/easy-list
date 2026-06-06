# Google Login - Design Spec

**Data:** 2026-06-05  
**Escopo:** Adicionar login com Google ao fluxo de autenticação existente  
**Abordagem aprovada:** Manter email/código como fallback e vincular automaticamente contas pelo mesmo email

## Contexto

O projeto usa Next.js App Router com `next-auth@4`, `MongoDBAdapter`, sessão JWT,
`EmailProvider` e um `CredentialsProvider` customizado para código de 4 dígitos. A tela
`/login` já possui fluxo em dois passos: email e validação por código. O middleware protege
rotas não-API e redireciona usuários autenticados para `/` quando acessam rotas públicas.

A implementação deve adicionar Google OAuth sem remover o login atual por email/código, pois
esse fluxo continua sendo fallback para usuários que não queiram ou não possam usar Google.

## Abordagens Avaliadas

### 1. Google + email/código com vinculação automática por email

Esta é a abordagem aprovada. Ela adiciona `GoogleProvider` ao NextAuth, mantém o fluxo atual e
permite que usuários existentes por email/código entrem via Google usando o mesmo email.

**Trade-offs:** melhor experiência e menor mudança no produto, com risco controlado porque o Google
é tratado como provedor confiável para email verificado. A decisão de vincular automaticamente deve
ficar documentada no código/configuração.

### 2. Google separado, sem vinculação automática

Mais conservador, mas pior para usuários existentes. Um usuário já criado por email poderia receber
erro ao tentar entrar pelo Google com o mesmo endereço, exigindo fluxo adicional de vinculação.

### 3. Google como login principal e email/código secundário

Simplifica visualmente a tela, mas muda mais o posicionamento do produto. Foi considerado maior que
o necessário para esta etapa.

## Arquitetura

`src/lib/auth.ts` deve importar `GoogleProvider` de `next-auth/providers/google` e adicioná-lo ao
array `providers` junto com os providers atuais.

Configuração planejada:

```ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  allowDangerousEmailAccountLinking: true,
})
```

`allowDangerousEmailAccountLinking` será usado intencionalmente para vincular automaticamente uma
conta Google a um usuário existente com o mesmo email. Esta escolha é aceitável neste app porque o
email é a identidade principal e o Google é considerado provedor confiável para email verificado.

O restante da configuração permanece igual:

- `MongoDBAdapter(clientPromise)` continua sendo o adapter.
- `session.strategy = 'jwt'` permanece.
- `EmailProvider` permanece para magic link.
- `CredentialsProvider` `verification-code` permanece para OTP.
- `pages.signIn` continua apontando para `/login`.

## Variáveis De Ambiente

Adicionar as variáveis abaixo em `.env.local` e no ambiente de produção:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

As variáveis já existentes continuam necessárias:

- `MONGODB_URI`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` ou `AUTH_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Redirect URIs esperadas no Google Cloud Console:

- Local: `http://localhost:3000/api/auth/callback/google`
- Produção: `${NEXTAUTH_URL}/api/auth/callback/google`

## UI E Fluxo

Em `src/app/(auth)/login/page.tsx`, o primeiro passo do card de login recebe um botão full-width
acima do formulário de email:

- Texto: `Continuar com Google`
- Ação: `signIn('google', { callbackUrl: '/' })`
- Estado de loading separado do envio de email, para não confundir as duas ações.

Abaixo do botão, incluir um divisor textual simples:

- Texto: `ou continue com email`

O fluxo por email/código permanece como está:

- envio de email por `/api/auth/send-login`;
- magic link;
- OTP de 4 dígitos;
- reenvio após countdown;
- banner para link expirado.

Se o Google retornar erro para `/login?error=...`, a página deve exibir um banner genérico:

`Não foi possível entrar com Google. Tente novamente ou use seu email.`

Detalhes técnicos do erro não devem ser expostos ao usuário.

## Dados

Quando um usuário novo entra pelo Google, o adapter cria o usuário e o registro OAuth conforme o
modelo padrão do NextAuth/MongoDBAdapter.

Quando um usuário existente por email/código entra pelo Google com o mesmo email, a conta OAuth é
vinculada ao usuário existente. Como categorias e produtos são escopados por `userId`, os dados
atuais permanecem associados ao mesmo usuário e não há migração de dados planejada.

## Tratamento De Erros

Erros de configuração de Google devem falhar no login e retornar para `/login` pelo fluxo padrão do
NextAuth. A UI deve mostrar mensagem genérica e oferecer o email/código como alternativa.

Não será criado um endpoint customizado para Google nesta etapa. O fluxo deve usar as rotas padrão
do NextAuth já expostas por `src/app/api/auth/[...nextauth]/route.ts`.

## Arquivos A Alterar Na Implementação

- `src/lib/auth.ts`: adicionar `GoogleProvider` e configuração de account linking.
- `src/app/(auth)/login/page.tsx`: adicionar botão Google, divisor e banner para erros OAuth.
- Documentação/env example, se existir no projeto: registrar `GOOGLE_CLIENT_ID` e
  `GOOGLE_CLIENT_SECRET`.

## Verificação

Após implementar, executar:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Também validar manualmente:

- login Google com usuário novo;
- login Google com email já existente criado via email/código;
- login por email/código continua funcionando;
- erro/cancelamento no Google mostra banner genérico em `/login`;
- usuário autenticado continua redirecionado para `/` ao acessar `/login`.
