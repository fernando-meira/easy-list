'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnyProduct, setHasAnyProduct] = useState(false);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [filter, setFilter] = useState<StatusEnum>(StatusEnum.all);
  const [isProductLoading, setIsProductLoading] = useState<IsProductLoadingProps>({
    productId: null,
    isLoading: false,
  });

  const { setCategories } = useCategories();

  const fetchCategories = async () => {
    const response = await fetch('/api/categories');

    if (!response.ok) throw new Error('Failed to fetch categories');

    const data = await response.json();

    setCategories(data);
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/products');

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();

      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (filter === StatusEnum.all) return products;
    if (filter === StatusEnum.inCart) return products.filter(product => product.addToCart);
    if (filter === StatusEnum.outOfCart) return products.filter(product => !product.addToCart);
    return products;
  }, [products, filter]);

  const allProductsWithoutPrice = useMemo(() =>
    products.every((product) => !product.price || !product.quantity || !product.unit),
  [products]
  );

  const allProductsInCartWithoutPrice = useMemo(() =>
    products.filter((product) => product.addToCart)
      .every((product) => !product.price || !product.quantity || !product.unit),
  [products]
  );

  const verifyHasAnyProduct = useCallback(() => {
    setHasAnyProduct(products.length > 0);
  }, [products]);

  const managerProduct = async ({ product }: { product: ProductProps }) => {
    try {
      setIsProductLoading({ productId: product._id || null, isLoading: true });

      if (product._id) {
        const response = await fetch(`/api/products/${product._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (!response.ok) throw new Error('Failed to update product');

        const updatedProduct = await response.json();

        setProducts(products.map(product => product._id === updatedProduct._id ? updatedProduct : product));

        await fetchCategories();
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (!response.ok) throw new Error('Failed to create product');

        const newProduct = await response.json();

        setProducts([...products, newProduct]);

        await fetchCategories();

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

      if (!response.ok) throw new Error('Failed to delete product');

      setProducts(products.filter(product => product._id !== id));

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProductLoading({ productId: null, isLoading: false });
    }
  };

  const removeAllProducts = async () => {
    try {
      setIsLoading(true);

      await Promise.all(products.map(product =>
        fetch(`/api/products/${product._id}`, { method: 'DELETE' })
      ));

      setProducts([]);

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCart = async (id: string) => {
    try {
      const product = products.find(p => p._id === id);

      if (!product) return;

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, addToCart: !product.addToCart }),
      });

      if (!response.ok) throw new Error('Failed to update product');

      const updatedProduct = await response.json();

      setProducts(products.map(p => p._id === id ? updatedProduct : p));

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    verifyHasAnyProduct();
  }, [products, verifyHasAnyProduct]);

  return (
    <ProductsContext.Provider
      value={{
        error,
        filter,
        products,
        isLoading,
        setFilter,
        toggleCart,
        hasAnyProduct,
        removeProduct,
        managerProduct,
        filteredProducts,
        isProductLoading,
        removeAllProducts,
        allProductsWithoutPrice,
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
