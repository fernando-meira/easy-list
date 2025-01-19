import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Índice composto para otimizar consultas por usuário e nome
categorySchema.index({ userId: 1, name: 1 });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
