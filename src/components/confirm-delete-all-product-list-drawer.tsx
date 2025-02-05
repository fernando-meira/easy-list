import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

export function ConfirmDeleteAllProductListDrawer() {
  const { removeAllProducts, hasAnyProduct } = useProducts();

  return hasAnyProduct && (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="destructive" className="mt-4">
            Limpar listas
        </Button>
      </DrawerTrigger>

      <DrawerContent className='max-w-3xl my-0 mx-auto'>
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
