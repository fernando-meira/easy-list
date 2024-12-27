import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Força uso de aspas duplas e ponto e vírgula
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      // Indentação de 2 espaços
      "indent": ["error", 2],
      // Ordena as importações automaticamente
      "sort-imports": [
        "error",
        {
          "ignoreDeclarationSort": true, // Mantém os grupos de declarações
          "ignoreCase": true             // Ignora case na ordenação
        }
      ],
      // Remove espaços extras
      "no-trailing-spaces": "error",
      // Requer nova linha no final do arquivo
      "eol-last": ["error", "always"],
      // Espaçamento consistente em torno das chaves
      "object-curly-spacing": ["error", "always"],
      // Limita o número de linhas vazias consecutivas
      "no-multiple-empty-lines": [
        "error",
        {
          max: 1,    // Permite no máximo 1 linha vazia consecutiva
          maxEOF: 0, // Não permite linha vazia no final do arquivo
          maxBOF: 0  // Não permite linha vazia no início do arquivo
        }
      ]
    }
  }
];
export default eslintConfig;
