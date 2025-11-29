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
    const filtered = category.products?.filter(product => {
      if (filter === StatusEnum.all) return true;
      if (filter === StatusEnum.inCart) return product.addToCart;
      return !product.addToCart;
    }) || [];

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

  const productsInCart = productsToShow.filter(product => product.addToCart);
  console.log('🥲 ~ productsInCart:', productsInCart);
  const productsNotInCart = productsToShow.filter(product => !product.addToCart);
  console.log('🥲 ~ productsNotInCart:', productsNotInCart);

  const handleEditProduct = (product: ProductProps) => {
    setSelectedProducts(product);
    setOpenEditSheet(true);
  };

  const productColumns = columns({
    toggleCart,
    removeProduct,
    isProductLoading,
  });

  return (
    <div>
      <p className='font-bold mb-2 text-sm'>Fora do carrinho</p>

      <DataTable
        columns={productColumns}
        data={productsNotInCart}
        onEditProduct={handleEditProduct}
      />

      <div className="my-4" />

      <p className='mb-2 text-sm font-bold'>Carrinho</p>

      <DataTable
        data={productsInCart}
        columns={productColumns}
        onEditProduct={handleEditProduct}
      />
    </div>
  );

};
