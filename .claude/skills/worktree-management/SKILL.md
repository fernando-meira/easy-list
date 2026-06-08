# Skill: Gerenciamento de Worktree para Tarefas Paralelas

## Objetivo

Sempre que houver mais de uma tarefa em andamento no mesmo repositório, utilize esta skill para criar um ambiente isolado por tarefa usando `git worktree`.

Isso evita conflitos entre branches, arquivos modificados e contextos diferentes de implementação/análise.

## Quando usar

Use esta skill sempre que:

* Uma nova tarefa for iniciada antes da anterior ser finalizada.
* For necessário trabalhar em duas ou mais branches ao mesmo tempo.
* A tarefa pedir explicitamente criação de worktree.
* A tarefa envolver análise técnica isolada.
* A tarefa exigir criação de nova branch sem interferir no diretório principal do projeto.
* Existirem alterações locais que não devem ser misturadas com a nova tarefa.

## Regras obrigatórias

Antes de criar qualquer worktree:

1. Verifique a branch atual.
2. Verifique se existem alterações locais com `git status`.
3. Confirme qual será a branch base da nova tarefa:

   * use `main`, quando o projeto utilizar `main`;
   * use `master`, quando o projeto utilizar `master`;
   * se o usuário informar explicitamente a base, siga a instrução do usuário.
4. Atualize a branch base com `git fetch` e `git pull`.
5. Crie uma branch nova, com nome claro e relacionado à tarefa.
6. Crie o worktree fora da pasta principal do projeto, preferencialmente em `.worktrees/<nome-da-branch>`.

## Fluxo recomendado

```bash
git status
git branch --show-current
git fetch origin
git checkout main
git pull origin main
git worktree add .worktrees/<nome-da-branch> -b <nome-da-branch> main
cd .worktrees/<nome-da-branch>
```

Se a branch base for `master`, use:

```bash
git status
git branch --show-current
git fetch origin
git checkout master
git pull origin master
git worktree add .worktrees/<nome-da-branch> -b <nome-da-branch> master
cd .worktrees/<nome-da-branch>
```

## Convenção de nomes

Use nomes objetivos e em inglês ou no padrão do projeto.

Exemplos:

```bash
fix/mobile-drawer-keyboard
analysis/mobile-drawer-keyboard
feature/realtime-list-sync
investigation/vaul-keyboard-viewport
```

## Cuidados importantes

* Nunca reutilize um worktree de outra tarefa.
* Nunca misture alterações de tarefas diferentes.
* Nunca crie branch nova a partir de uma branch de tarefa, a menos que o usuário peça explicitamente.
* Nunca implemente fora do worktree quando a tarefa pedir isolamento.
* Antes de abrir PR, garanta que apenas arquivos relacionados à tarefa foram alterados.
* Se o worktree for apenas para análise, a PR deve conter somente documentação, plano ou arquivos de análise.

## Entregável esperado

Ao finalizar a preparação do ambiente, informe:

* Caminho do worktree criado.
* Branch criada.
* Branch base utilizada.
* Status inicial do Git.
* Próximo passo da tarefa.

## Exemplo de resposta esperada

```md
Worktree criado com sucesso.

- Base: main
- Branch: analysis/mobile-drawer-keyboard
- Caminho: .worktrees/analysis-mobile-drawer-keyboard
- Status: working tree clean

Vou seguir com a análise técnica isolada neste ambiente.
```
