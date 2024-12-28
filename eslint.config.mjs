import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import reactHooks from 'eslint-plugin-react-hooks'; // Importa o plugin

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      'react-hooks': reactHooks, // Define o plugin como um objeto
    },
    rules: {
      // Força uso de aspas simples e ponto e vírgula
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      // Indentação de 2 espaços
      'indent': ['error', 2],
      // Ordena as importações automaticamente
      'sort-imports': [
        'error',
        {
          'ignoreDeclarationSort': true,
          'ignoreCase': true,
        }
      ],
      // Remove espaços extras
      'no-trailing-spaces': 'error',
      // Requer nova linha no final do arquivo
      'eol-last': ['error', 'always'],
      // Espaçamento consistente em torno das chaves
      'object-curly-spacing': ['error', 'always'],
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
