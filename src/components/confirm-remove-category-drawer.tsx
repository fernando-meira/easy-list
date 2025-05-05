import { toast } from 'sonner';

import { Trash } from 'lucide-react';
import { useCategories } from '@/context';
import { ActionButton } from './action-button';
import { CategoryProps } from '@/types/interfaces';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface ConfirmRemoveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmRemoveCategoryDrawer({ category, open, onOpenChange }: ConfirmRemoveCategoryDrawerProps) {
  const { removeCategory } = useCategories();

  const handleRemoveCategory = async () => {
    if (!category) {
      toast('Categoria não encontrada');

      return;
    }

    removeCategory(category._id);

    onOpenChange(false);
  };

  return category && (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className='max-w-3xl my-0 mx-auto'>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>{category.name}</DrawerTitle>

            <DrawerDescription>
              Tem certeza que deseja remover a categoria {category.name}?
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter>
            <ActionButton text={`Remover ${category.name}`} icon={Trash} onClick={handleRemoveCategory} />
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
