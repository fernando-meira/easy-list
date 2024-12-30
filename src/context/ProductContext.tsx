'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ProductProps } from '@/types/interfaces';
import { StatusEnum } from '@/types/enums';

export interface EditProductProps {
  id: string;
  product: ProductProps;
}

interface ProductsContextType {
  filter: StatusEnum;
  isLoading: boolean;
  error: string | null;
  products?: ProductProps[];
  filteredProducts?: ProductProps[];
  allProductsWithoutPrice?: boolean;
  removeAllProducts: () => Promise<void>;
  allProductsInCartWithoutPrice?: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [filter, setFilter] = useState<StatusEnum>(StatusEnum.all);

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

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (filter === StatusEnum.all) return true;
    if (filter === StatusEnum.inCart) return product.addToCart;
    if (filter === StatusEnum.outOfCart) return !product.addToCart;
    return true;
  }), [products, filter]);

  const allProductsWithoutPrice = useMemo(() =>
    products.every((product) => !product.price || !product.quantity || !product.unit),
  [products]
  );

  const allProductsInCartWithoutPrice = useMemo(() =>
    products.filter((product) => product.addToCart)
      .every((product) => !product.price || !product.quantity || !product.unit),
  [products]
  );

  const managerProduct = async ({ product }: { product: ProductProps }) => {
    try {
      setIsLoading(true);

      if (product._id) {
        const response = await fetch(`/api/products/${product._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (!response.ok) throw new Error('Failed to update product');

        const updatedProduct = await response.json();

        setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (!response.ok) throw new Error('Failed to create product');

        const newProduct = await response.json();

        setProducts([...products, newProduct]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      setProducts(products.filter(product => product._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAllProducts = async () => {
    try {
      setIsLoading(true);

      await Promise.all(products.map(product =>
        fetch(`/api/products/${product._id}`, { method: 'DELETE' })
      ));

      setProducts([]);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        error,
        filter,
        products,
        isLoading,
        setFilter,
        toggleCart,
        removeProduct,
        managerProduct,
        filteredProducts,
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
