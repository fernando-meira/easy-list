'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ProductProps } from '@/types/interfaces';
import { LocalStorageEnum, StatusEnum } from '@/types/enums';

interface ProductsContextType {
  filter: StatusEnum;
  products?: ProductProps[];
  removeAllProducts: () => void;
  toggleCart: (id: number) => void;
  filteredProducts?: ProductProps[];
  removeProduct: (id: number) => void;
  setFilter: (filter: StatusEnum) => void;
  addProduct: ({ id, name, price, quantity, addToCart }: ProductProps) => void;
}

interface ProductsProviderProps {
  children: React.ReactNode;
}

export const ProductsContext = createContext({} as ProductsContextType);

function ProductsContextProvider({ children }: ProductsProviderProps) {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [filter, setFilter] = useState<StatusEnum>(StatusEnum.all);

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (filter === StatusEnum.all) return true;
    if (filter === StatusEnum.inCart) return product.addToCart;
    if (filter === StatusEnum.outOfCart) return !product.addToCart;

    return true;
  }), [products, filter]);

  const addProduct = ({ id, price, name, addToCart, quantity, unit }: ProductProps) => {
    const newProduct = {
      id, price, name, addToCart, quantity, unit,
    };

    return setProducts((state) => [...state, newProduct]);
  };

  const removeProduct = (id: number) => {
    const filteredItem = products.filter((product) => product.id !== id);

    setProducts(filteredItem);
  };

  const removeAllProducts = useMemo(() => () => {
    setProducts([]);
  }, []);

  const toggleCart = useCallback((id: number) => {
    const updatedProducts = products.map((product) => {
      if (product.id === id) {
        return { ...product, addToCart: !product.addToCart };
      }

      return product;
    });

    setProducts(updatedProducts);
  }, [products]);

  useEffect(() => {
    const storedProducts = localStorage.getItem(LocalStorageEnum.products);

    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  return (
    <ProductsContext.Provider
      value={{ products, filteredProducts, removeProduct, addProduct, removeAllProducts, filter, setFilter, toggleCart }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error('useProducts must be used within an ProductsProvider');
  }

  return context;
}

export { useProducts, ProductsContextProvider };
