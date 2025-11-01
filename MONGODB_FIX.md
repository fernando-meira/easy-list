# ❌ Problema: Autenticação do MongoDB Falhando

## Erro Identificado

```
MongoServerError: bad auth : authentication failed
code: 8000
codeName: 'AtlasError'
```

## Causa Raiz

A string de conexão do MongoDB no arquivo `.env.local` está com um placeholder em vez da senha real:

```
MONGODB_URI=mongodb+srv://flassoh:<db_password>@fortress404.occ6n.mongodb.net/?appName=Fortress404
```

O texto `<db_password>` precisa ser substituído pela senha real do banco de dados.

## 🔧 Como Corrigir

### Opção 1: Recuperar a Senha Existente

Se você já tem um usuário configurado no MongoDB Atlas:

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com/)
2. Faça login na sua conta
3. Selecione seu projeto
4. No menu lateral, clique em **Database Access**
5. Encontre o usuário `flassoh`
6. Clique em **Edit** (ícone de lápis)
7. Clique em **Edit Password**
8. Defina uma nova senha (anote-a!)
9. Clique em **Update User**

### Opção 2: Criar Nova String de Conexão

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com/)
2. Vá para **Database** no menu lateral
3. Clique em **Connect** no seu cluster
4. Escolha **Drivers**
5. Copie a string de conexão completa
6. Substitua `<password>` pela senha real do usuário

### Atualizar o .env.local

Edite o arquivo `.env.local` e substitua a linha do `MONGODB_URI`:

```bash
# ANTES (ERRADO):
MONGODB_URI=mongodb+srv://flassoh:<db_password>@fortress404.occ6n.mongodb.net/?appName=Fortress404

# DEPOIS (CORRETO - substitua SUA_SENHA_AQUI pela senha real):
MONGODB_URI=mongodb+srv://flassoh:SUA_SENHA_AQUI@fortress404.occ6n.mongodb.net/?appName=Fortress404
```

**IMPORTANTE**: 
- Não use `<` ou `>` na senha
- Se sua senha tiver caracteres especiais, você precisa fazer URL encoding
- Exemplo: `@` vira `%40`, `#` vira `%23`, etc.

### Caracteres Especiais e URL Encoding

Se sua senha tiver caracteres especiais, use esta tabela:

| Caractere | Código URL |
|-----------|------------|
| @         | %40        |
| :         | %3A        |
| /         | %2F        |
| ?         | %3F        |
| #         | %23        |
| [         | %5B        |
| ]         | %5D        |
| !         | %21        |
| $         | %24        |
| &         | %26        |
| '         | %27        |
| (         | %28        |
| )         | %29        |
| *         | %2A        |
| +         | %2B        |
| ,         | %2C        |
| ;         | %3B        |
| =         | %3D        |
| %         | %25        |
| space     | %20        |

Ou use esta ferramenta online: https://www.urlencoder.org/

## Após Corrigir

1. Salve o arquivo `.env.local`
2. **Reinicie o servidor Next.js**:
   - Pressione `Ctrl+C` no terminal
   - Execute `npm run dev` novamente
3. Teste o login novamente

## Verificação

Para testar se a conexão está funcionando, você pode criar um script de teste:

```bash
# No terminal, execute:
node -e "const { MongoClient } = require('mongodb'); const uri = process.env.MONGODB_URI || 'sua-uri-aqui'; const client = new MongoClient(uri); client.connect().then(() => { console.log('✅ Conexão bem-sucedida!'); client.close(); }).catch(err => { console.error('❌ Erro:', err.message); });"
```

## Dicas de Segurança

- ✅ Nunca commite o arquivo `.env.local` no Git
- ✅ Use senhas fortes com letras, números e símbolos
- ✅ Considere usar variáveis de ambiente do sistema em produção
- ✅ Rotacione suas senhas periodicamente
