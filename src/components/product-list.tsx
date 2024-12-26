"use client";

import React from "react";

import { UnitEnum } from "@/types/enums";
import { Product } from "@/types/interfaces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductList() {
  const [filter, setFilter] = React.useState("all");

  const products: Product[] = React.useMemo(() => {
    return [{
      id: 1,
      quantity: "1",
      price: "10,00",
      addToCart: true,
      name: "Produto 1",
      unit: UnitEnum.unit,
    },
    {
      id: 2,
      quantity: "1",
      price: "20,00",
      addToCart: false,
      name: "Produto 2",
      unit: UnitEnum.kg,
    }
    ];
  }, []);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between gap-4 w-full">
        <h3 className="text-lg font-semibold">Lista de produtos</h3>

        <Select value={filter} onValueChange={(value: "all" | "inCart" | "outOfCart") => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtro de produtos" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>

            <SelectItem value="inCart">No carrinho</SelectItem>

            <SelectItem value="outOfCart">Fora do carrinho</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="flex flex-col gap-4 mt-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between gap-4 p-4 border rounded-md">
            <p>{product.name}</p>

            <div className="flex items-center gap-2">
              {product.quantity && <span>{product.quantity}</span>}

              {product.unit && <span>{product.unit}</span>}

              {product.price && <span>{product.price}</span>}

              {product.addToCart && <span>🛒</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
