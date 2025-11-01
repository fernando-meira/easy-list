# Problema com Envio de Email via Resend

## ✅ Status: PARCIALMENTE RESOLVIDO

### ✅ Código Corrigido
O código está funcionando corretamente e capturando erros do Resend adequadamente.

### ⚠️ Limitação do Domínio de Teste
O domínio `onboarding@resend.dev` só permite enviar emails para `f.lasso.h@gmail.com`.

**Erro ao tentar enviar para outros emails:**
```
statusCode: 403
message: 'You can only send testing emails to your own email address (f.lasso.h@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains'
```

### Teste Confirmado
A API do Resend está funcionando corretamente para o email autorizado:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_GhSpLivM_7UjqM9GCta16U9EHKq1acSaF' \
  -H 'Content-Type: application/json' \
  -d '{"from": "Easy List <onboarding@resend.dev>", "to": ["f.lasso.h@gmail.com"], "subject": "Teste", "html": "<p>Teste</p>"}'
```
**Resultado**: Email enviado com sucesso (ID: c6deeb25-8fb9-40d2-bc5c-4de1f6882c59)

## Diagnóstico

A rota `/api/auth/request-code` estava retornando status 200 mesmo quando o email falhava, porque o erro do Resend não estava sendo capturado adequadamente.

## Problemas Identificados

1. **Falta de tratamento de erro específico do Resend**: O código não verificava se `emailResult.error` existia
2. **Email de teste**: Usando `onboarding@resend.dev` que tem limitações
3. **Falta de validação da API key**: Não verificava se `RESEND_API_KEY` estava configurada

## Correções Implementadas

### 1. Validação da API Key
```typescript
if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY não está configurada');
  return NextResponse.json(
    { error: 'Serviço de email não configurado' },
    { status: 500 }
  );
}
```

### 2. Tratamento de Erro do Resend
```typescript
const emailResult = await resend.emails.send({...});

if (emailResult.error) {
  console.error('Erro do Resend ao enviar email:', emailResult.error);
  throw new Error(`Falha ao enviar email: ${emailResult.error.message}`);
}
```

### 3. Limpeza do Banco em Caso de Falha
```typescript
catch (emailError) {
  // Remover o código do banco já que o email falhou
  await db.collection('verificationCodes').deleteOne({
    email,
    code: verificationCode,
  });
  
  return NextResponse.json(
    { error: 'Erro ao enviar email. Por favor, tente novamente.' },
    { status: 500 }
  );
}
```

## Próximos Passos para Resolver o Problema

### Opção 1: Configurar Domínio Próprio no Resend (Recomendado)

1. Acesse o [Resend Dashboard](https://resend.com/domains)
2. Adicione seu domínio próprio
3. Configure os registros DNS (MX, SPF, DKIM)
4. Atualize a variável `EMAIL_FROM` no `.env.local`:
   ```
   EMAIL_FROM=Easy List <noreply@seudominio.com>
   ```

### Opção 2: Verificar o Email de Teste

O domínio `onboarding@resend.dev` só envia emails para o email associado à sua conta Resend. Verifique:

1. Se o email que você está testando é o mesmo da sua conta Resend
2. Se sua API key está ativa e válida
3. Se você não excedeu o limite de emails do plano gratuito

### Opção 3: Verificar Logs do Resend

1. Acesse [Resend Logs](https://resend.com/emails)
2. Verifique o motivo específico da falha do email
3. Possíveis causas:
   - Email de destino inválido
   - Limite de envio excedido
   - API key inválida
   - Domínio não verificado

## 🚀 AÇÃO NECESSÁRIA: Reiniciar o Servidor

**IMPORTANTE**: As correções foram implementadas no código, mas o servidor Next.js precisa ser reiniciado para aplicá-las.

### Passos para Resolver:

1. **Parar o servidor atual**:
   - Pressione `Ctrl+C` no terminal onde o `npm run dev` está rodando

2. **Reiniciar o servidor**:
   ```bash
   npm run dev
   ```

3. **Testar novamente**:
   - Acesse http://localhost:3000/login
   - Clique na aba "Código"
   - Digite seu email (f.lasso.h@gmail.com)
   - Clique em "Receber código"

4. **Verificar os logs**:
   - Agora você verá logs detalhados no console do servidor
   - Se houver erro, a mensagem será específica
   - Se funcionar, verá: "Email enviado com sucesso: {data}"

### O que foi corrigido:

✅ Validação da API key antes de enviar email  
✅ Captura de erros específicos do Resend  
✅ Logs detalhados para debugging  
✅ Limpeza do banco de dados se o email falhar  
✅ Retorno de erro 500 (em vez de 200) quando falhar  

## Como Testar

1. ~~Reinicie o servidor de desenvolvimento~~ **FEITO - Agora você precisa reiniciar**
2. Tente enviar um código novamente
3. Verifique os logs do console para mensagens de erro detalhadas
4. Se o erro persistir, verifique os logs no dashboard do Resend

## Verificação Rápida

Execute no terminal para verificar se as variáveis estão configuradas:
```bash
echo $RESEND_API_KEY
echo $EMAIL_FROM
```

Ou verifique o arquivo `.env.local` diretamente.
