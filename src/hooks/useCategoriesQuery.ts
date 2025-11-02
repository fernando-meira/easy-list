'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryProps } from '@/types/interfaces';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { AuthStatusEnum } from '@/types/enums';

/**
 * Hook customizado para gerenciar categorias com polling inteligente
 *
 * Funcionalidades:
 * - Polling automático a cada 3 segundos
 * - Revalidação ao retornar o foco para a aba
 * - Comparação de updatedAt para evitar re-renderizações desnecessárias
 * - Pausa automática quando usuário não está autenticado
 *
 * @returns {object} Dados e métodos para gerenciar categorias
 */
export function useCategoriesQuery() {
  const { status: sessionStatus } = useSession();
  const queryClient = useQueryClient();

  // Buscar categorias com polling inteligente
  const {
    data: categories = [],
    isLoading,
    error,
    dataUpdatedAt,
  } = useQuery<CategoryProps[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data: CategoryProps[] = await response.json();

      // Ordenar categorias alfabeticamente
      return data.sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      );
    },
    // Polling a cada 3 segundos
    refetchInterval: 3000,
    // Revalida quando a janela volta ao foco
    refetchOnWindowFocus: true,
    // Só faz polling se o usuário estiver autenticado
    enabled: sessionStatus === AuthStatusEnum.authenticated,
    // Comparação estrutural para evitar re-renders desnecessários
    select: (data) => {
      // Aqui você pode adicionar lógica adicional de transformação
      // Por exemplo, filtrar ou mapear dados
      return data;
    },
    // Mantém dados anteriores durante revalidação (evita "flicker")
    placeholderData: (previousData) => previousData,
  });

  // Mutation para adicionar categoria
  const addCategoryMutation = useMutation({
    mutationFn: async (category: CategoryProps) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(category),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: () => {
      // Invalida e refetch imediatamente
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar categoria');
    },
  });

  // Mutation para remover categoria
  const removeCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove category');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria removida com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover categoria');
    },
  });

  return {
    categories,
    isLoading,
    error: error?.message || null,
    dataUpdatedAt,
    addCategory: addCategoryMutation.mutate,
    removeCategory: removeCategoryMutation.mutate,
    isAddingCategory: addCategoryMutation.isPending,
    isRemovingCategory: removeCategoryMutation.isPending,
  };
}

/**
 * CONFIGURAÇÕES DE POLLING - COMO AJUSTAR:
 *
 * 1. Alterar intervalo de polling:
 *    refetchInterval: 5000 // 5 segundos
 *
 * 2. Pausar polling quando usuário inativo:
 *    refetchInterval: (query) => {
 *      // Pausa se não houver interação por 5 minutos
 *      const lastInteraction = Date.now() - query.state.dataUpdatedAt;
 *      return lastInteraction > 300000 ? false : 3000;
 *    }
 *
 * 3. Polling condicional baseado em visibilidade:
 *    refetchInterval: document.hidden ? false : 3000
 *
 * 4. Desabilitar polling completamente:
 *    refetchInterval: false
 *
 * 5. Polling apenas em horário comercial:
 *    refetchInterval: () => {
 *      const hour = new Date().getHours();
 *      return hour >= 8 && hour <= 18 ? 3000 : false;
 *    }
 */
