import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Trash2 } from 'lucide-react';

export function ConfirmCleanProductListDrawer() {
  const { removeAllProducts } = useProducts();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="flex gap-2 bg-rose-200 p-2 rounded cursor-pointer">
          <Trash2 className="h-4 w-4 text-rose-600" />
        </div>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Limpar lista</DrawerTitle>

          <DrawerDescription>
            Tem certeza que deseja limpar a lista de produtos?
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="mb-8">
          <Button variant="destructive" onClick={removeAllProducts}>Limpar lista</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
