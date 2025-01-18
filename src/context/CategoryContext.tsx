'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { toast } from 'sonner';
import { CategoryProps } from '@/types/interfaces';

interface CategoriesContextType {
  categories: CategoryProps[];
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  filterCategory: (categoryId: string) => void;
  removeCategory: (id: string) => Promise<void>;
  setCategories: (categories: CategoryProps[]) => void;
  addCategory: (category: CategoryProps) => Promise<void>;
}

interface CategoryProviderProps {
  children: React.ReactNode;
}

export const CategoriesContext = createContext({} as CategoriesContextType);

function CategoriesContextProvider({ children }: CategoryProviderProps) {

  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<CategoryProps>();
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);

  const addCategory = async (category: CategoryProps) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      toast('Erro ao criar categoria');

      throw new Error('Failed to create category');
    }

    const { data } = await response.json();

    toast('Categoria criada com sucesso');

    setCategories([...categories, data]);
  };

  const removeCategory = async (id: string) => {
    const response = await fetch(`/api/categories?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      toast('Erro ao remover categoria');

      return;
    }

    const status = response.status;

    if (status === 204) {
      setCategories(categories.filter(category => category._id !== id));

      toast('Categoria removida com sucesso');
    }
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

  const filterCategory = useCallback((categoryId: string) => {
    if (!categoryId || categoryId === 'all') {
      setFilteredCategory(undefined);

      return;
    }

    const filteredCategory = categories.find(category => category?._id === categoryId);

    setFilteredCategory(filteredCategory);
  }, [categories]);

  useEffect(() => {
    if (filteredCategory) {
      filterCategory(filteredCategory._id);
    }
  }, [categories, filterCategory, filteredCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        setCategories,
        filterCategory,
        removeCategory,
        errorCategories,
        filteredCategory,
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
