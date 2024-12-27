"use client";

import React, { createContext, useContext, useState } from "react";

import { ProductProps } from "@/types/interfaces";

interface ProductsContextType {
  products?: ProductProps[];
  removeProduct: (id: number) => void;
  addProduct: ({ id, name, price, quantity, addToCart }: ProductProps) => void;
}

interface ProductsProviderProps {
  children: React.ReactNode;
}

export const ProductsContext = createContext({} as ProductsContextType);

function ProductsContextProvider({ children }: ProductsProviderProps) {
  const [products, setProducts] = useState<ProductProps[]>([]);

  function addProduct({ id, price, name, addToCart, quantity, unit }: ProductProps) {
    const newProduct = {
      id, price, name, addToCart, quantity, unit,
    };

    return setProducts((state) => [...state, newProduct]);
  }

  function removeProduct(id: number) {
    const filteredItem = products.filter((product) => product.id !== id);

    setProducts(filteredItem);
  }

  return (
    <ProductsContext.Provider
      value={{ products, removeProduct, addProduct: addProduct }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProducts must be used within an ProductsProvider");
  }

  return context;
}

export { useProducts, ProductsContextProvider };
