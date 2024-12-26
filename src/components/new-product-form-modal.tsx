import React from "react";

import { UnitEnum } from "@/types/enums";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewProductFormModal() {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [addToCart, setAddToCart] = React.useState(false);
  const [unit, setUnit] = React.useState<UnitEnum>(UnitEnum.unit);
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const addOrEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log({
      name,
      unit,
      price,
      quantity,
      addToCart,
    });
  };

  const cancelEditing = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setEditingId(null);
    setAddToCart(false);
    setUnit(UnitEnum.unit);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Adicionar produto</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar produto</DialogTitle>

          <DialogDescription>
            Adicione um novo produto à sua lista. Clique em salvar para confirmar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={addOrEditProduct} className="space-y-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="name">Produto</Label>

            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do produto"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (opcional)</Label>

              <Input
                id="price"
                step="0.01"
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
                  placeholder={unit === "unit" ? "Quantidade" : "Peso"}
                  className="flex-grow"
                />

                <Select value={unit} onValueChange={(value: UnitEnum) => setUnit(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione a quantidade" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="unit">{UnitEnum.unit}</SelectItem>

                    <SelectItem value="kg">{UnitEnum.kg}</SelectItem>

                    <SelectItem value="grams">{UnitEnum.grams}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            {unit === "grams" && (
              <p className="text-sm text-muted-foreground mt-1">
                O calculo do preço ser&aacute; feito com base no peso em gramas
              </p>
            )}

            {unit === "kg" && (
              <p className="text-sm text-muted-foreground mt-1">
                O cálculo do preço ser&aacute; feito com base no peso em quilos
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="add-to-cart"
              checked={addToCart}
              onCheckedChange={(checked) => setAddToCart(checked as boolean)}
            />

            <Label htmlFor="add-to-cart">Adicionar ao carrinho</Label>
          </div>

          <DialogFooter>
            <Button type="submit">
              {editingId !== null ? "Atualizar produto" : "Adicionar produto"}
            </Button>

            {editingId !== null && (
              <Button variant="outline" onClick={cancelEditing}>
                Cancelar edição
              </Button>
            )}
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}
