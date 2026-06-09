import { Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isBefore, subWeeks } from 'date-fns';
import React, { useEffect, useCallback } from 'react';

import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';

import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';

export function CategoryCard() {
  const router = useRouter();
  const { categories, isLoadingCategories } = useCategories();

  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [olderCategories, setOlderCategories] = React.useState<CategoryProps[]>();
  const [recentCategories, setRecentCategories] = React.useState<CategoryProps[]>();
  const [sharedCategories, setSharedCategories] = React.useState<CategoryProps[]>();
  const [selectedCategoryToRemove, setSelectedCategoryToRemove] = React.useState<CategoryProps>();

  const isOlderThanAWeek = (updatedAt: Date): boolean => {
    const oneWeekAgo = subWeeks(new Date(), 1);
    return isBefore(updatedAt, oneWeekAgo);
  };

  const handleRemoveClick = useCallback((category: CategoryProps) => {
    setSelectedCategoryToRemove(category);
    setOpenRemoveDrawer(true);
  }, []);

  useEffect(() => {
    if (!categories) return;

    const categorizeItems = () => {
      const recent: CategoryProps[] = [];
      const older: CategoryProps[] = [];
      const shared: CategoryProps[] = [];

      categories.forEach(category => {
        if (category.isShared) {
          shared.push(category);
          return;
        }

        const isCategoryRecent = !isOlderThanAWeek(new Date(category.updatedAt));

        const hasRecentProducts = category.products?.some(
          product => !isOlderThanAWeek(new Date(product.updatedAt))
        );

        if (isCategoryRecent || hasRecentProducts) {
          recent.push(category);
        }

        if (!isCategoryRecent && !hasRecentProducts) {
          older.push(category);
        }
      });

      setRecentCategories(recent);
      setOlderCategories(older);
      setSharedCategories(shared);
    };

    categorizeItems();
  }, [categories]);

  const renderContent = useCallback((renderCategories: CategoryProps[], isShared?: boolean) => {
    if (isLoadingCategories) {
      return Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-[86px] w-full rounded-[var(--radius-lg)]" />
      ));
    }

    if (renderCategories) {
      return renderCategories.map(category => (
        <div
          key={category._id}
          className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-canvas)]"
        >
          <div
            className="flex cursor-pointer items-center justify-between gap-2 px-4 py-[14px]"
            onClick={() => router.push(`/category?id=${category._id}`)}
          >
            <span className="flex-1 text-base font-semibold leading-snug text-[var(--color-ink)]">
              {category.name}
            </span>
            {(category.products?.length ?? 0) > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-surface-card)] px-3 py-[9px]">
                {isShared && <Users className="h-3 w-3 text-[var(--color-ink)]" />}
                <span className="text-[13px] font-medium text-[var(--color-ink)]">
                  {(category.products ?? []).length}
                </span>
                <span className="text-[13px] font-medium text-[var(--color-ink)]">
                  produtos
                </span>
              </span>
            )}
          </div>

          {!category.isShared && (
            <>
              <div className="h-px w-full bg-[var(--color-hairline)]" />

              <button
                onClick={() => handleRemoveClick(category)}
                aria-label="Remover categoria"
                className="flex h-10 w-full items-center justify-center bg-[var(--color-surface-soft)] transition-colors hover:bg-[var(--color-surface-card)]"
              >
                <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
              </button>
            </>
          )}
        </div>
      ));
    }

    return null;
  }, [isLoadingCategories, router, handleRemoveClick]);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-sans text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-[var(--color-ink)]">
        Categorias
      </h1>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Minhas listas</p>

        {recentCategories && recentCategories.length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-muted)]">Atualizadas</p>
            {renderContent(recentCategories)}
          </section>
        )}

        {olderCategories && olderCategories.length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-muted)]">Antigas</p>
            {renderContent(olderCategories)}
          </section>
        )}
      </section>

      {sharedCategories && sharedCategories.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Compartilhadas</p>
          {renderContent(sharedCategories, true)}
        </section>
      )}

      {selectedCategoryToRemove && (
        <ConfirmRemoveCategoryDrawer
          open={openRemoveDrawer}
          onOpenChange={setOpenRemoveDrawer}
          category={selectedCategoryToRemove}
        />
      )}
    </main>
  );
}
