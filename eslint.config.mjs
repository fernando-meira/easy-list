import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import perfectionist from 'eslint-plugin-perfectionist';
import reactHooks from 'eslint-plugin-react-hooks'; // Importa o plugin

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const importFormattingPlugin = {
  rules: {
    'multiline-long-imports': {
      meta: {
        type: 'layout',
        fixable: 'code',
        schema: [],
        docs: {
          description: 'Quebra imports longos em múltiplas linhas',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const MAX_IMPORT_LENGTH = 100;

        function buildImportParts(node) {
          const defaultSpecifier = node.specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
          const namespaceSpecifier = node.specifiers.find((specifier) => specifier.type === 'ImportNamespaceSpecifier');
          const namedSpecifiers = node.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');
          const parts = [];

          if (defaultSpecifier) {
            parts.push(sourceCode.getText(defaultSpecifier).trim());
          }

          if (namespaceSpecifier) {
            parts.push(`* as ${namespaceSpecifier.local.name}`);
          }

          if (namedSpecifiers.length > 0) {
            const namedText = namedSpecifiers.map((specifier) => sourceCode.getText(specifier).trim());
            parts.push(namedText);
          }

          return parts;
        }

        return {
          ImportDeclaration(node) {
            if (!node.specifiers.length || sourceCode.getText(node).includes('\n')) {
              return;
            }

            const namedSpecifiers = node.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');

            if (!namedSpecifiers.length) {
              return;
            }

            const importPrefix = node.importKind === 'type' ? 'import type ' : 'import ';
            const source = sourceCode.getText(node.source);
            const parts = buildImportParts(node);
            const singleLineParts = parts.map((part) => Array.isArray(part) ? `{ ${part.join(', ')} }` : part);
            const singleLineImport = `${importPrefix}${singleLineParts.join(', ')} from ${source};`;

            if (singleLineImport.length <= MAX_IMPORT_LENGTH) {
              return;
            }

            const multilineParts = parts.map((part) =>
              Array.isArray(part) ? `{\n  ${part.join(',\n  ')}\n}` : part
            );
            const multilineImport = `${importPrefix}${multilineParts.join(', ')} from ${source};`;

            context.report({
              node,
              message: 'Imports longos devem ficar em múltiplas linhas.',
              fix(fixer) {
                return fixer.replaceText(node, multilineImport);
              },
            });
          },
        };
      },
    },
    'single-line-short-imports': {
      meta: {
        type: 'layout',
        fixable: 'code',
        schema: [],
        docs: {
          description: 'Mantém imports curtos em uma única linha',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const MAX_IMPORT_LENGTH = 100;

        return {
          ImportDeclaration(node) {
            if (!node.specifiers.length || !sourceCode.getText(node).includes('\n')) {
              return;
            }

            const hasNamedSpecifier = node.specifiers.some((specifier) => specifier.type === 'ImportSpecifier');

            if (!hasNamedSpecifier) {
              return;
            }

            const importPrefix = node.importKind === 'type' ? 'import type ' : 'import ';
            const source = sourceCode.getText(node.source);
            const defaultSpecifier = node.specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
            const namespaceSpecifier = node.specifiers.find((specifier) => specifier.type === 'ImportNamespaceSpecifier');
            const namedSpecifiers = node.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');
            const parts = [];

            if (defaultSpecifier) {
              parts.push(sourceCode.getText(defaultSpecifier).trim());
            }

            if (namespaceSpecifier) {
              parts.push(`* as ${namespaceSpecifier.local.name}`);
            }

            if (namedSpecifiers.length > 0) {
              const namedText = namedSpecifiers.map((specifier) => sourceCode.getText(specifier).trim()).join(', ');
              parts.push(`{ ${namedText} }`);
            }

            const singleLineImport = `${importPrefix}${parts.join(', ')} from ${source};`;

            if (singleLineImport.length > MAX_IMPORT_LENGTH) {
              return;
            }

            if (sourceCode.getCommentsInside(node).length > 0) {
              return;
            }

            context.report({
              node,
              message: 'Imports curtos devem ficar em uma única linha.',
              fix(fixer) {
                return fixer.replaceText(node, singleLineImport);
              },
            });
          },
        };
      },
    },
  },
};

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      'import-formatting': importFormattingPlugin,
      perfectionist,
      'react-hooks': reactHooks, // Define o plugin como um objeto
    },
    rules: {
      // Força uso de aspas simples e ponto e vírgula
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      // Indentação de 2 espaços
      'indent': ['error', 2],
      // Ordena as importações automaticamente
      'sort-imports': 'off',
      // Remove espaços extras
      'no-trailing-spaces': 'error',
      // Requer nova linha no final do arquivo
      'eol-last': ['error', 'always'],
      // Espaçamento consistente em torno das chaves
      'object-curly-spacing': ['error', 'always'],
      // Quebra imports/exports nomeados em múltiplas linhas sem reordenar os membros
      'object-curly-newline': 'off',
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'line-length',
          order: 'asc',
          fallbackSort: {
            type: 'alphabetical',
            order: 'asc',
          },
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          newlinesBetween: 1,
          internalPattern: ['^@/', '^~/', '^src/'],
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          type: 'line-length',
          order: 'asc',
          fallbackSort: {
            type: 'alphabetical',
            order: 'asc',
          },
        },
      ],
      'import-formatting/multiline-long-imports': 'error',
      'import-formatting/single-line-short-imports': 'error',
      // Limita o número de linhas vazias consecutivas
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0,
        }
      ],
      // Verifica e corrige dependências de hooks React
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
