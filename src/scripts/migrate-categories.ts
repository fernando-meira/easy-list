import mongoose from 'mongoose';

import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function migrateCategories() {
  try {
    console.log('Iniciando migração de categorias...');
    await connectDB();

    // Busca todas as categorias sem userId
    const categories = await Category.find({ userId: { $exists: false } });

    console.log(`Encontradas ${categories.length} categorias para migrar`);

    if (categories.length === 0) {
      console.log('Nenhuma categoria precisa ser migrada.');
      return;
    }

    const defaultUserId = '678c6af71f4b89bdcfa8db32';

    for (const category of categories) {
      await Category.findByIdAndUpdate(category._id, {
        $set: { userId: defaultUserId }
      });
      console.log(`Categoria ${category.name} migrada com sucesso.`);
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Executa a migração
migrateCategories();
