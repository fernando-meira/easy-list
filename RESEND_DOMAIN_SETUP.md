# 🚀 Configurar Domínio Próprio no Resend

## Problema Atual

Você está usando `onboarding@resend.dev` que tem limitações:
- ❌ Só envia para `f.lasso.h@gmail.com` (seu email cadastrado)
- ❌ Não funciona para outros destinatários
- ❌ Aparece como "resend.dev" para os usuários

## Solução: Verificar um Domínio Próprio

### Opção 1: Usar um Domínio que Você Possui

Se você tem um domínio (ex: `seudominio.com`):

#### Passo 1: Adicionar Domínio no Resend

1. Acesse https://resend.com/domains
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `seudominio.com`)
4. Clique em **Add**

#### Passo 2: Configurar DNS

O Resend vai mostrar registros DNS que você precisa adicionar:

**Registros necessários:**

```
Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT (SPF)
Name: @
Value: v=spf1 include:amazonses.com ~all

Type: TXT (DKIM)
Name: [fornecido pelo Resend]
Value: [fornecido pelo Resend]

Type: TXT (DMARC)
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@resend.com
```

#### Passo 3: Adicionar Registros no seu Provedor de DNS

Dependendo de onde seu domínio está hospedado:

**Cloudflare:**
1. Acesse https://dash.cloudflare.com/
2. Selecione seu domínio
3. Vá em **DNS** > **Records**
4. Adicione cada registro fornecido pelo Resend

**Namecheap:**
1. Acesse https://www.namecheap.com/
2. Vá em **Domain List** > seu domínio > **Advanced DNS**
3. Adicione cada registro

**GoDaddy:**
1. Acesse https://www.godaddy.com/
2. Vá em **My Products** > **DNS**
3. Adicione cada registro

**Registro.br:**
1. Acesse https://registro.br/
2. Vá em **Meus Domínios**
3. Clique em **Editar Zona**
4. Adicione cada registro

#### Passo 4: Aguardar Verificação

- A verificação pode levar de alguns minutos até 48 horas
- O Resend verifica automaticamente
- Você receberá um email quando estiver pronto

#### Passo 5: Atualizar o .env.local

```bash
# Substitua onboarding@resend.dev pelo seu domínio
EMAIL_FROM=Easy List <noreply@seudominio.com>
```

### Opção 2: Usar Subdomínio (Recomendado)

É melhor usar um subdomínio para emails transacionais:

```bash
# Exemplo:
EMAIL_FROM=Easy List <noreply@app.seudominio.com>
# ou
EMAIL_FROM=Easy List <noreply@mail.seudominio.com>
```

**Vantagens:**
- Não afeta o domínio principal se houver problemas
- Melhor organização
- Reputação de email separada

### Opção 3: Não Tem Domínio? Use Serviços Gratuitos

Se você não tem um domínio, pode:

1. **Comprar um domínio barato:**
   - Namecheap: ~$10/ano
   - Porkbun: ~$8/ano
   - Google Domains: ~$12/ano

2. **Usar domínio gratuito (não recomendado para produção):**
   - Freenom: domínios .tk, .ml, .ga, .cf, .gq
   - ⚠️ Pode ter problemas de reputação de email

3. **Continuar testando com seu email:**
   - Use apenas `f.lasso.h@gmail.com` para testes
   - Configure domínio próprio antes de lançar

## Após Configurar

### 1. Testar o Envio

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_GhSpLivM_7UjqM9GCta16U9EHKq1acSaF' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Easy List <noreply@seudominio.com>",
    "to": ["qualquer-email@exemplo.com"],
    "subject": "Teste",
    "html": "<p>Teste com domínio próprio</p>"
  }'
```

### 2. Atualizar o Código

O código já está preparado! Só precisa atualizar o `.env.local`:

```bash
EMAIL_FROM=Easy List <noreply@seudominio.com>
```

### 3. Reiniciar o Servidor

```bash
# Ctrl+C para parar
npm run dev
```

## Dicas Importantes

### ✅ Boas Práticas

- Use `noreply@` ou `no-reply@` para emails transacionais
- Configure DMARC para melhorar a entregabilidade
- Monitore a reputação do domínio
- Implemente feedback loops

### ⚠️ Evite

- Não use emails pessoais como remetente
- Não use domínios gratuitos em produção
- Não envie spam (óbvio, mas importante!)
- Não ignore bounces e reclamações

### 📊 Monitoramento

Após configurar, monitore:
- Taxa de entrega
- Taxa de abertura
- Bounces (emails devolvidos)
- Reclamações de spam

Acesse: https://resend.com/emails

## Solução Temporária (Apenas para Desenvolvimento)

Se você quer testar agora sem configurar domínio:

1. Use apenas o email `f.lasso.h@gmail.com` para testes
2. Crie usuários de teste com esse email
3. Configure o domínio próprio antes de lançar em produção

## Precisa de Ajuda?

- Documentação Resend: https://resend.com/docs/dashboard/domains/introduction
- Suporte Resend: https://resend.com/support
- Verificador de DNS: https://mxtoolbox.com/
