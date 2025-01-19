import { migrateCategories } from './migrate-categories';

console.log('Iniciando script de migração...');

migrateCategories()
  .then(() => {
    console.log('Script de migração finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  });
