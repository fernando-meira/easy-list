# Easy List 

Uma aplicação web moderna construída com Next.js 15 para gerenciamento de listas de compras e tarefas de forma simples e eficiente.

## Tecnologias

Este projeto utiliza as seguintes tecnologias:

- [Next.js 15](https://nextjs.org/) - Framework React com SSR
- [React 19](https://react.dev/) - Biblioteca para construção de interfaces
- [Firebase Firestore](https://firebase.google.com/products/firestore) - Banco de dados
- [NextAuth.js](https://next-auth.js.org/) - Autenticação
- [TailwindCSS](https://tailwindcss.com/) - Estilização
- [Radix UI](https://www.radix-ui.com/) - Componentes acessíveis
- [React Hook Form](https://react-hook-form.com/) - Gerenciamento de formulários
- [Zod](https://zod.dev/) - Validação de dados
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática

## Pré-requisitos

- Node.js 18+ 
- Projeto Firebase com Firestore
- Firebase Emulator Suite para desenvolvimento local
- Variáveis de ambiente configuradas em `.env.local`

## Começando

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/easy-list.git
cd easy-list
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` e preencha com suas credenciais do Firebase, Resend e NextAuth.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.


## Estrutura do Projeto

```
src/
  ├── app/          # Rotas e páginas
  ├── components/   # Componentes React reutilizáveis
  ├── lib/         # Firebase, autenticação e utilitários de servidor
  └── types/       # Definições de tipos TypeScript
```

## Contribuindo

Contribuições são sempre bem-vindas! Por favor, leia o guia de contribuição antes de submeter um PR.

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
