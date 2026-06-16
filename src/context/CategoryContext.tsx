'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { query, where, Timestamp, collection, onSnapshot } from 'firebase/firestore';
import React, { useRef, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { AuthStatusEnum } from '@/types/enums';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { ProductProps, CategoryProps } from '@/types/interfaces';
import { getClientDb, getClientAuth } from '@/lib/firebase-client';

interface RawCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  subcategoryOrder?: string[];
}

interface RawProduct {
  id: string;
  name: string;
  unit?: string;
  price?: string;
  createdAt: string;
  quantity?: string;
  updatedAt: string;
  categoryId: string;
  addToCart?: boolean;
  subcategory?: string;
}

interface CategoriesContextType {
  categories: CategoryProps[];
  selectedCategoryId?: string;
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  fetchCategories: () => Promise<void>;
  markLocalMutation: (count?: number) => void;
  removeCategory: (id: string) => Promise<void>;
  leaveSharedCategory: (id: string) => Promise<void>;
  setSelectedCategoryId: (categoryId: string) => void;
  addCategory: (category: CategoryProps) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryProps[]>>;
}

interface CategoryProviderProps {
  children: React.ReactNode;
}

export const CategoriesContext = createContext({} as CategoriesContextType);

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function CategoriesContextProvider({ children }: CategoryProviderProps) {
  const { status: sessionStatus } = useSession();
  const { isReady, isError } = useFirebaseAuth();

  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [filteredCategory, setFilteredCategory] = useState<CategoryProps | undefined>(undefined);

  const localMutationCount = useRef(0);
  const latestCategoriesRef = useRef<RawCategory[]>([]);
  const latestProductsRef = useRef<RawProduct[]>([]);
  const pendingInitialSnapshots = useRef(2);
  const latestSharedCategoriesRef = useRef<RawCategory[]>([]);
  const latestSharedProductsRef = useRef<RawProduct[]>([]);

  const markLocalMutation = useCallback((count = 1) => {
    localMutationCount.current += count;
  }, []);

  const buildCategoriesFromRefs = useCallback((): CategoryProps[] => {
    const ownedCatIds = new Set(latestCategoriesRef.current.map((c) => c.id));

    const allRawCats = [
      ...latestCategoriesRef.current.map((c) => ({ ...c, isShared: false as const })),
      ...latestSharedCategoriesRef.current
        .filter((sc) => !ownedCatIds.has(sc.id))
        .map((c) => ({ ...c, isShared: true as const })),
    ];

    const ownedProdIds = new Set(latestProductsRef.current.map((p) => p.id));

    const allRawProds = [
      ...latestProductsRef.current,
      ...latestSharedProductsRef.current.filter((sp) => !ownedProdIds.has(sp.id)),
    ];

    return allRawCats
      .map((cat): CategoryProps => {
        const catRef: CategoryProps = {
          _id: cat.id,
          name: cat.name,
          isShared: cat.isShared,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          subcategoryOrder: cat.subcategoryOrder,
        };

        const products: ProductProps[] = allRawProds
          .filter((p) => p.categoryId === cat.id)
          .map((p) => ({
            _id: p.id,
            name: p.name,
            unit: p.unit,
            price: p.price,
            category: catRef,
            quantity: p.quantity,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            categoryId: p.categoryId,
            subcategory: p.subcategory,
            addToCart: Boolean(p.addToCart),
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

        return { ...catRef, products };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }, []);

  const handleSnapshotUpdate = useCallback(
    (isInitial: boolean) => {
      const rebuilt = buildCategoriesFromRefs();
      setCategories(rebuilt);

      if (pendingInitialSnapshots.current === 0) {
        setIsLoadingCategories(false);
      }

      if (isInitial) return;

      if (localMutationCount.current > 0) {
        localMutationCount.current -= 1;
        return;
      }

      toast('Lista atualizada');
    },
    [buildCategoriesFromRefs]
  );

  useEffect(() => {
    if (!isReady || sessionStatus !== AuthStatusEnum.authenticated) return;

    const userId = getClientAuth().currentUser?.uid;
    if (!userId) return;

    pendingInitialSnapshots.current = 2;

    const unsubscribers: (() => void)[] = [];
    let sharedProductsUnsub: (() => void) | null = null;

    const unsubCategories = onSnapshot(
      query(collection(getClientDb(), 'categories'), where('userId', '==', userId)),
      (snapshot) => {
        const isInitial = pendingInitialSnapshots.current > 0;
        if (isInitial) pendingInitialSnapshots.current -= 1;

        latestCategoriesRef.current = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
            subcategoryOrder: data.subcategoryOrder as string[] | undefined,
          };
        });

        handleSnapshotUpdate(isInitial);
      },
      (error) => {
        console.error('Categories listener error:', error);
        setErrorCategories(error.message);
      }
    );
    unsubscribers.push(unsubCategories);

    const unsubProducts = onSnapshot(
      query(collection(getClientDb(), 'products'), where('userId', '==', userId)),
      (snapshot) => {
        const isInitial = pendingInitialSnapshots.current > 0;
        if (isInitial) pendingInitialSnapshots.current -= 1;

        latestProductsRef.current = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            unit: data.unit as string | undefined,
            price: data.price as string | undefined,
            createdAt: timestampToIso(data.createdAt),
            quantity: data.quantity as string | undefined,
            updatedAt: timestampToIso(data.updatedAt),
            categoryId: data.categoryId as string,
            addToCart: data.addToCart as boolean | undefined,
            subcategory: data.subcategory as string | undefined,
          };
        });

        handleSnapshotUpdate(isInitial);
      },
      (error) => {
        console.error('Products listener error:', error);
        setErrorCategories(error.message);
      }
    );
    unsubscribers.push(unsubProducts);

    const unsubSharedCategories = onSnapshot(
      query(
        collection(getClientDb(), 'categories'),
        where('sharedWith', 'array-contains', userId)
      ),
      (snapshot) => {
        latestSharedCategoriesRef.current = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
            subcategoryOrder: data.subcategoryOrder as string[] | undefined,
          };
        });

        if (sharedProductsUnsub) {
          sharedProductsUnsub();
          sharedProductsUnsub = null;
        }
        latestSharedProductsRef.current = [];

        handleSnapshotUpdate(true);

        const sharedCategoryIds = snapshot.docs.map((d) => d.id);

        if (sharedCategoryIds.length === 0) {
          return;
        }

        const FIRESTORE_IN_LIMIT = 30;
        const idsForQuery = sharedCategoryIds.slice(0, FIRESTORE_IN_LIMIT);
        if (sharedCategoryIds.length > FIRESTORE_IN_LIMIT) {
          console.warn(`User has ${sharedCategoryIds.length} shared categories; only first ${FIRESTORE_IN_LIMIT} synced.`);
        }

        let isFirstFire = true;

        sharedProductsUnsub = onSnapshot(
          query(
            collection(getClientDb(), 'products'),
            where('categoryId', 'in', idsForQuery)
          ),
          (prodSnapshot) => {
            latestSharedProductsRef.current = prodSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name as string,
                unit: data.unit as string | undefined,
                price: data.price as string | undefined,
                createdAt: timestampToIso(data.createdAt),
                quantity: data.quantity as string | undefined,
                updatedAt: timestampToIso(data.updatedAt),
                categoryId: data.categoryId as string,
                addToCart: data.addToCart as boolean | undefined,
                subcategory: data.subcategory as string | undefined,
              };
            });

            handleSnapshotUpdate(isFirstFire);
            isFirstFire = false;
          },
          (error) => {
            console.error('Shared products listener error:', error);
          }
        );
      },
      (error) => {
        console.error('Shared categories listener error:', error);
      }
    );
    unsubscribers.push(unsubSharedCategories);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (sharedProductsUnsub) sharedProductsUnsub();
    };
  }, [isReady, sessionStatus, handleSnapshotUpdate]);

  const addCategory = async (category: CategoryProps) => {
    markLocalMutation();

    const response = await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      localMutationCount.current -= 1;
      toast('Erro ao criar categoria');
      throw new Error('Failed to create category');
    }

    toast('Categoria criada com sucesso');
  };

  const removeCategory = async (id: string) => {
    const productCount = categories.find((c) => c._id === id)?.products?.length ?? 0;
    markLocalMutation(1 + productCount);

    const response = await fetch(`/api/categories?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      localMutationCount.current -= (1 + productCount);
      toast('Erro ao remover categoria');
      return;
    }

    if (response.status === 204) {
      toast('Categoria removida com sucesso');
    }
  };

  const leaveSharedCategory = async (id: string) => {
    markLocalMutation();

    const response = await fetch(`/api/categories/${id}/leave`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      localMutationCount.current -= 1;
      toast('Erro ao sair da lista');
      return;
    }

    setCategories((prev) => prev.filter((c) => c._id !== id));
    toast('Você saiu da lista');
  };

  const updateCategory = async (id: string, name: string) => {
    markLocalMutation();

    const response = await fetch(`/api/categories?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      localMutationCount.current -= 1;
      toast('Erro ao atualizar categoria');
      return;
    }

    toast('Categoria atualizada com sucesso');
  };

  const fetchCategories = useCallback(async () => {
    // No-op: initial load is handled by onSnapshot
  }, []);

  const filterCategory = useCallback(
    (categoryId: string) => {
      if (!categoryId || categoryId === 'all') {
        setFilteredCategory(undefined);
        return;
      }
      const found = categories.find((category) => category?._id === categoryId);
      setFilteredCategory(found);
    },
    [categories]
  );

  useEffect(() => {
    if (filteredCategory) {
      filterCategory(filteredCategory._id);
    }
  }, [categories, filterCategory, filteredCategory]);

  useEffect(() => {
    if (isError) {
      setIsLoadingCategories(false);
      setErrorCategories('Falha ao conectar em tempo real');
    }
  }, [isError]);

  useEffect(() => {
    if (
      sessionStatus === AuthStatusEnum.loading ||
      sessionStatus === AuthStatusEnum.unauthenticated
    ) {
      return;
    }

    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find((c) => c._id === selectedCategoryId);

      if (!category) {
        toast('Categoria não encontrada');
        return;
      }

      setFilteredCategory(category);
    }
  }, [selectedCategoryId, categories, sessionStatus]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        setCategories,
        removeCategory,
        updateCategory,
        errorCategories,
        fetchCategories,
        filteredCategory,
        markLocalMutation,
        selectedCategoryId,
        isLoadingCategories,
        leaveSharedCategory,
        setSelectedCategoryId,
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
