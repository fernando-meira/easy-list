import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

export function ConfirmCleanProductListDrawer() {
  const { removeAllProducts } = useProducts();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="destructive">Limpar a lista</Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Limpar lista</DrawerTitle>

          <DrawerDescription>
            Tem certeza que deseja limpar a lista de produtos?
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter>
          <Button variant="destructive" onClick={removeAllProducts}>Limpar lista</Button>

          <Button>Cancelar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
