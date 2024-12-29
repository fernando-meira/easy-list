'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ProductProps } from '@/types/interfaces';
import { LocalStorageEnum, StatusEnum } from '@/types/enums';

export interface EditProductProps {
  id: number;
  product: ProductProps;
}

interface ProductsContextType {
  filter: StatusEnum;
  products?: ProductProps[];
  removeAllProducts: () => void;
  toggleCart: (id: number) => void;
  allProductsWithoutPrice?: boolean;
  filteredProducts?: ProductProps[];
  removeProduct: (id: number) => void;
  allProductsInCartWithoutPrice?: boolean;
  setFilter: (filter: StatusEnum) => void;
  managerProduct: ({ product }: { product: ProductProps }) => void;
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

  const allProductsWithoutPrice = useMemo(() => products.every((product) => !product.price || !product.quantity || !product.unit), [products]);

  const allProductsInCartWithoutPrice = useMemo(() => products.filter((product) => product.addToCart).every((product) => !product.price || !product.quantity || !product.unit), [products]);

  const managerProduct = ({ product }: { product: ProductProps }) => {
    if (product.id) {
      const updatedProducts = products.map((productInList) => {
        if (productInList.id === product.id) {
          return { ...productInList, ...product };
        }

        return productInList;
      });

      return setProducts(updatedProducts);
    }

    const addIdInProduct = {
      ...product,
      id: Date.now(),
    };

    setProducts([...products, addIdInProduct]);
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
      value={{
        filter,
        products,
        setFilter,
        toggleCart,
        removeProduct,
        managerProduct,
        filteredProducts,
        removeAllProducts,
        allProductsWithoutPrice,
        allProductsInCartWithoutPrice
      }}
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
