"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { capitalizeFirstLetter } from "@/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts } from "@/context/ProductContext";
import { PrettyUnitEnum, UnitEnum } from "@/types/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export const AddProductDrawer = () => {
  const { addProduct } = useProducts();

  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [addToCart, setAddToCart] = React.useState(false);
  const [unit, setUnit] = React.useState<UnitEnum>(UnitEnum.unit);
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    addProduct({ id: Date.now(), name, price, quantity, addToCart, unit });

    setName("");
    setPrice("");
    setQuantity("");
    setEditingId(null);
    setAddToCart(false);
    setUnit(UnitEnum.unit);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Adicionar produto</Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-full p-4">
          <DrawerHeader>
            <DrawerTitle>Adicionar produto</DrawerTitle>

            <DrawerDescription>Adicione um novo produto à sua lista. Clique em salvar para confirmar.</DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Produto</Label>

              <Input
                required
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do produto"
              />
            </div>

            <div className="flex gap-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>

                <Input
                  step="1"
                  id="price"
                  type="number"
                  value={price}
                  placeholder="Preço"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade/Peso</Label>

                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={unit === UnitEnum.unit ? "Quantidade" : "Peso"}
                    className="flex-grow"
                  />
                  <Select value={unit} onValueChange={(value: UnitEnum) => setUnit(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Unidade de medida"/>
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={UnitEnum.unit}>{capitalizeFirstLetter(PrettyUnitEnum.unit)}</SelectItem>

                      <SelectItem value={UnitEnum.kg}>{capitalizeFirstLetter(PrettyUnitEnum.kg)}</SelectItem>

                      <SelectItem value={UnitEnum.grams}>{capitalizeFirstLetter(PrettyUnitEnum.grams)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="add-to-cart"
                checked={addToCart}
                onCheckedChange={(checked) => setAddToCart(checked as boolean)}
              />

              <Label htmlFor="add-to-cart">Adicionar ao carrinho</Label>
            </div>

            <DrawerFooter>
              <Button type="submit">
                {editingId !== null ? "Atualizar produto" : "Adicionar produto"}
              </Button>

              {editingId !== null && (
                <Button variant="outline" onClick={() => setEditingId(null)}>
            Cancelar edição
                </Button>
              )}
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
