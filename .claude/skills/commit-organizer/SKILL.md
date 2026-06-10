---
name: commit-organizer
description: Use esta skill quando precisar analisar alterações não commitadas em um repositório Git, garantir que commits não sejam feitos diretamente na branch main, separar mudanças em blocos lógicos, criar commits revisados, publicar a branch remota e preparar o fluxo para abertura de PR.
---

# Commit Organizer

## Objetivo

Analisar alterações não commitadas no projeto, garantir que o trabalho não seja feito diretamente na branch `main`, organizar as mudanças em blocos lógicos de commits, publicar a branch remota e preparar o fluxo para abertura de PR.

Todas as mensagens, explicações e resumos para o usuário devem ser em português.

## Fluxo

1. Verificar a branch atual:

```bash
git branch --show-current
```

2. Analisar todas as alterações não commitadas:

```bash
git status
git diff
```

3. Se a branch atual for `main`, criar uma nova branch baseada na funcionalidade implementada.

Usar um nome curto e descritivo, por exemplo:

```txt
feature/agendamentos-manuais
fix/firebase-admin-config
chore/update-project-rules
```

Depois, mudar para a nova branch:

```bash
git checkout -b nome-da-branch
```

4. Separar as alterações em blocos lógicos de commits.

Exemplos de blocos:

- criação de types/schemas;
- criação ou alteração de services;
- criação ou ajuste de APIs;
- alterações de UI;
- ajustes de validação;
- correções de regras de negócio;
- testes;
- documentação.

5. Para cada bloco, adicionar apenas os arquivos relacionados:

```bash
git add caminho/do/arquivo
```

6. Antes de cada commit, validar o diff dos arquivos adicionados:

```bash
git diff --cached
```

7. Criar commits seguindo exatamente este padrão:

```txt
feat(task-title): Description....

Alterações:
- ...
- ...
- ...
```

Exemplo:

```txt
feat(agendamentos-manuais): adiciona criação manual de reservas

Alterações:
- cria schemas e tipos de booking
- adiciona service server-side para reservas
- implementa validação de conflito por horário
```

Usar o tipo mais adequado no início do commit:

- `feat`: nova funcionalidade;
- `fix`: correção;
- `refactor`: refatoração sem mudança de comportamento;
- `chore`: ajustes técnicos/configuração;
- `docs`: documentação;
- `test`: testes.

8. Após criar todos os commits, mostrar um resumo:

```bash
git log --oneline -n 10
git status
```

9. Se o `git status` estiver limpo, publicar a branch atual no remoto com upstream.

Confirmar a branch atual antes do push:

```bash
git branch --show-current
```

Publicar a branch, substituindo `nome-da-branch` pela branch atual:

```bash
git push -u origin nome-da-branch
```

Se o push falhar, reportar o erro e não abrir PR automaticamente.

10. Após a branch ser publicada, mostrar o resumo final:

```bash
git log --oneline -n 10
git status
```

11. Ao final, perguntar:

```txt
Deseja que eu abra uma PR para a branch main?
```

## Regras Importantes

- Nunca commitar diretamente na branch `main`.
- Não adicionar arquivos sem revisar o diff.
- Não misturar alterações sem relação no mesmo commit.
- Não abrir PR sem confirmação.
- Publicar a branch antes de perguntar sobre abertura de PR.
- Não fazer push se ainda houver alterações não commitadas, a menos que o usuário peça explicitamente outro fluxo.
- Se houver mudanças não relacionadas, preservá-las e não incluí-las nos commits.
- Se um arquivo contiver mudanças de assuntos diferentes, usar staging parcial quando necessário e revisar o diff staged antes do commit.
