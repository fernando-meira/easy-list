import { useMemo } from 'react';

import { useProducts } from '@/context';
import { StatusEnum } from '@/types/enums';
import { columns } from './product-table/columns';
import { DataTable } from './product-table/data-table';
import { CategoryProps, ProductProps } from '@/types/interfaces';

interface ProductsListProps {
  category: CategoryProps;
  setOpenEditSheet: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedProducts: React.Dispatch<React.SetStateAction<ProductProps>>;
}

export const ProductsList = ({ category, setSelectedProducts, setOpenEditSheet }: ProductsListProps) => {
  const { removeProduct, toggleCart, filter, isProductLoading } = useProducts();

  const productsToShow = useMemo(() => {
    // Filtrar produtos com base no filtro
    const filtered = category.products?.filter(product => {
      if (filter === StatusEnum.all) return true;
      if (filter === StatusEnum.inCart) return product.addToCart;
      return !product.addToCart;
    }) || [];

    // Ordenar produtos por nome em ordem alfabética
    return [...filtered].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }, [category.products, filter]);

  if (!category || !productsToShow || productsToShow.length === 0) {
    return (
      <div className="flex items-center justify-center w-full p-2">
        <p>Não existe produtos cadastrados para essa categoria</p>
      </div>);
  }

  const handleEditProduct = (product: ProductProps) => {
    setSelectedProducts(product);
    setOpenEditSheet(true);
  };

  const productColumns = columns({
    toggleCart,
    removeProduct,
    isProductLoading,
  });

  return <DataTable columns={productColumns} data={productsToShow} onEditProduct={handleEditProduct} />;
};
