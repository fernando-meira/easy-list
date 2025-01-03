'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { CategoryProps } from '@/types/interfaces';

interface CategoriesContextType {
  categories: CategoryProps[];
  isLoadingCategories: boolean;
  errorCategories: string | null;
  setCategories: (categories: CategoryProps[]) => void;
  addCategory: (category: CategoryProps) => Promise<void>;
}

interface CategoryProviderProps {
  children: React.ReactNode;
}

export const CategoriesContext = createContext({} as CategoriesContextType);

function CategoriesContextProvider({ children }: CategoryProviderProps) {
  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);

  const addCategory = async (category: CategoryProps) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to create category');

    const newCategory = await response.json();

    setCategories([...categories, newCategory]);
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);

      const response = await fetch('/api/categories');

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();

      setCategories(data);
    } catch (err) {
      setErrorCategories(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        setCategories,
        errorCategories,
        isLoadingCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

function useCategories(): CategoriesContextType {
  const context = useContext(CategoriesContext);

  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}

export { useCategories, CategoriesContextProvider };
