'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { StatusEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';
import { useCategories } from '@/context/CategoryContext';

export interface EditProductProps {
  id: string;
  product: ProductProps;
}

export interface IsProductLoadingProps {
  isLoading: boolean;
  productId: string | null;
}

interface ProductsContextType {
  filter: StatusEnum;
  error: string | null;
  hasAnyProduct: boolean;
  products?: ProductProps[];
  filteredProducts?: ProductProps[];
  allProductsWithoutPrice?: boolean;
  removeAllProducts: () => Promise<void>;
  allProductsInCartWithoutPrice?: boolean;
  isProductLoading: IsProductLoadingProps;
  setFilter: (filter: StatusEnum) => void;
  toggleCart: (id: string) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  managerProduct: ({ product }: { product: ProductProps }) => Promise<void>;
}

interface ProductsProviderProps {
  children: React.ReactNode;
}

export const ProductsContext = createContext({} as ProductsContextType);

function ProductsContextProvider({ children }: ProductsProviderProps) {
  const { categories, setCategories, selectedCategoryId } = useCategories();

  const [error, setError] = useState<string | null>(null);
  const [hasAnyProduct, setHasAnyProduct] = useState(false);
  const [filter, setFilter] = useState<StatusEnum>(StatusEnum.all);
  const [isProductLoading, setIsProductLoading] = useState<IsProductLoadingProps>({
    productId: null,
    isLoading: false,
  });

  const allProductsCategory = useMemo(() => categories.flatMap((category) => category._id === selectedCategoryId ? category.products || [] : []), [categories, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    if (filter === StatusEnum.all) return allProductsCategory;
    if (filter === StatusEnum.inCart) return allProductsCategory.filter(product => product.addToCart);
    if (filter === StatusEnum.outOfCart) return allProductsCategory.filter(product => !product.addToCart);

    return allProductsCategory;
  }, [allProductsCategory, filter]);

  const allProductsWithoutPrice = useMemo(() => {
    return allProductsCategory.every((product) => !product.price || !product.quantity || !product.unit);
  }, [allProductsCategory]);

  const allProductsInCartWithoutPrice = useMemo(() =>
    allProductsCategory.filter((product) => product.addToCart)
      .every((product) => !product.price || !product.quantity || !product.unit),
  [allProductsCategory]
  );

  const verifyHasAnyProduct = useCallback(() => {
    setHasAnyProduct(allProductsCategory.length > 0);
  }, [allProductsCategory]);

  const managerProduct = async ({ product }: { product: ProductProps }) => {
    try {
      setIsProductLoading({ productId: product._id || null, isLoading: true });

      if (product._id) {
        const response = await fetch(`/api/products/${product._id}`, {
          method: 'PUT',
          body: JSON.stringify(product),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          toast('Erro ao atualizar o produto');

          throw new Error('Failed to update product');
        };

        const updatedProduct = await response.json();

        setCategories(categories.map(category => ({
          ...category,
          products: category?.products?.map(product => product?._id === updatedProduct?._id ? updatedProduct : product)
        })));

        toast.success('Produto atualizado');
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (!response.ok) {
          toast('Erro ao criar o produto');

          throw new Error('Failed to create product');
        };

        const newProduct = await response.json();
        const productCategory = categories.find(category => category._id === newProduct.category._id);

        setCategories(categories.map(category => ({
          ...category,
          products: category?._id === newProduct.category?._id ? [...category.products || [], newProduct] : category.products
        })));

        toast.success(`Produto adicionado a lista ${productCategory?.name}`);

        setFilter(StatusEnum.all);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProductLoading({ productId: null, isLoading: false });
    }
  };

  const removeProduct = async (id: string) => {
    try {
      setIsProductLoading({ productId: id, isLoading: true });

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const productName = categories.flatMap(category => category.products || []).find(product => product._id === id)?.name;

        toast(`Erro ao remover o produto ${productName}`);

        throw new Error('Failed to delete product');
      }

      const category = categories.find(category => category.products?.some(product => product._id === id));

      setCategories(categories.map(category => ({
        ...category,
        products: category.products?.filter(product => product._id !== id)
      })));

      toast.success(`Produto removido da lista ${category?.name}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProductLoading({ productId: null, isLoading: false });
    }
  };

  const removeAllProducts = async () => {
    try {
      await Promise.all(categories.flatMap(category => category.products || []).map(product =>
        fetch(`/api/products/${product._id}`, { method: 'DELETE' })
      ));

      setCategories(categories.map(category => ({
        ...category,
        products: []
      })));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleCart = async (id: string) => {
    if (!id) return;

    setIsProductLoading({ productId: id, isLoading: true });

    try {
      const product = categories.flatMap(category => category.products || []).find(product => product._id === id);

      if (!product) return;

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, addToCart: !product.addToCart }),
      });

      if (!response.ok) {
        toast.error('Erro ao atualizar produto no carrinho');

        throw new Error('Failed to update product');
      }

      const updatedProduct = await response.json();

      setCategories(categories.map(category => ({
        ...category,
        products: category.products?.map(product => product._id === id ? updatedProduct : product)
      })));

      if (product.addToCart) {
        toast.success('Produto removido do carrinho');
      } else {
        toast.success('Produto adicionado ao carrinho');
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    finally {
      setIsProductLoading({ productId: null, isLoading: false });
    }
  };

  useEffect(() => {
    verifyHasAnyProduct();
  }, [allProductsCategory, verifyHasAnyProduct]);

  return (
    <ProductsContext.Provider
      value={{
        error,
        filter,
        setFilter,
        toggleCart,
        hasAnyProduct,
        removeProduct,
        managerProduct,
        filteredProducts,
        isProductLoading,
        removeAllProducts,
        allProductsWithoutPrice,
        products: allProductsCategory,
        allProductsInCartWithoutPrice,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}

export { useProducts, ProductsContextProvider };
