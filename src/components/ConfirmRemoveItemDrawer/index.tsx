import { toast } from 'sonner';

import { useCategories } from '@/context';
import { Button } from '@/components/ui/button';
import { CategoryProps } from '@/types/interfaces';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface ConfirmRemoveItemDrawerProps {
  open: boolean;
  item?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmRemoveItemDrawer({ item, open, onOpenChange }: ConfirmRemoveItemDrawerProps) {
  const { removeCategory } = useCategories();

  const handleRemoveCategory = async () => {
    if (!item) {
      toast('Categoria não encontrada');

      return;
    }

    removeCategory(item._id);

    onOpenChange(false);
  };

  return item && (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item.name}</DrawerTitle>

          <DrawerDescription>
            Tem certeza que deseja remover a categoria {item.name}?
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="mb-8">
          <Button variant="destructive" onClick={handleRemoveCategory}>Remover {item.name}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
