'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { toast } from 'sonner';
import { CategoryProps } from '@/types/interfaces';

interface CategoriesContextType {
  categories: CategoryProps[];
  selectedCategoryId?: string;
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  notFoundFilteredCategory: boolean;
  fetchCategories: () => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  setSelectedCategoryId: (categoryId: string) => void;
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
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [notFoundFilteredCategory, setNotFoundFilteredCategory] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [filteredCategory, setFilteredCategory] = useState<CategoryProps | undefined>(undefined);

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

    const updatedCategories = [...categories, data].sort((categoryA, categoryB) =>
      categoryA.name.localeCompare(categoryB.name, 'pt-BR', { sensitivity: 'base' })
    );

    setCategories(updatedCategories);
    toast('Categoria criada com sucesso');
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
  } ;

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);

      const response = await fetch('/api/categories');

      if (!response.ok) throw new Error('Failed to fetch products');

      const data: CategoryProps[] = await response.json();

      const orderCategories: CategoryProps[] = data.sort((categoryA, categoryB) =>
        categoryA.name.localeCompare(categoryB.name, 'pt-BR', { sensitivity: 'base' })
      );

      setCategories(orderCategories);
    } catch (err) {
      setErrorCategories(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

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
    if (categories.length === 0) {
      fetchCategories();
    }

    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find(category => category._id === selectedCategoryId);

      if (!category) {
        toast('Categoria não encontrada');

        return;
      }

      setFilteredCategory(category);
    } else {
      setNotFoundFilteredCategory(true);
    }
  }, [selectedCategoryId, categories, fetchCategories, filterCategory]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        setCategories,
        removeCategory,
        fetchCategories,
        errorCategories,
        filteredCategory,
        selectedCategoryId,
        isLoadingCategories,
        setSelectedCategoryId,
        notFoundFilteredCategory
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
