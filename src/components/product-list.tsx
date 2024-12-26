"use client";

import React from "react";

import { PrettyStatusEnum, StatusEnum } from "@/types/enums";
import { Checkbox } from "@/components/ui/checkbox";
import { LucideShoppingCart, Pencil, Trash2 } from "lucide-react";
import { convertToCurrency } from "@/utils/convertToCurrency/convertToCurrency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { products } from "@/data/products";
import { CalculateProductValue } from "@/utils/calculateProductValue/calculateProductValue";

export function ProductList() {
  const [filter, setFilter] = React.useState<StatusEnum>(StatusEnum.all);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between gap-4 w-full">
        <h3 className="text-lg font-semibold">Lista de produtos</h3>

        <Select value={filter} onValueChange={(value: StatusEnum) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtro de produtos" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={StatusEnum.all}>{PrettyStatusEnum.all}</SelectItem>

            <SelectItem value={StatusEnum.inCart}>{PrettyStatusEnum.inCart}</SelectItem>

            <SelectItem value={StatusEnum.outOfCart}>{PrettyStatusEnum.outOfCart}</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="flex flex-col  mt-4">
        {products.map((product) => (
          <Accordion type="single" collapsible key={product.id}>
            <AccordionItem value="item">
              <AccordionTrigger className="flex justify-normal py-4 hover:no-underline">
                <div className="flex flex-1 gap-2 items-center">
                  <Checkbox
                    id={`cart-${product.id}`}
                    checked={product.addToCart}
                    // onCheckedChange={() => toggleCart(product.id)}
                  />
                  <strong>{product.name}</strong>

                  {product.addToCart && (
                    <LucideShoppingCart className="h-4 w-4 text-teal-400" />
                  )}
                </div>

                <div className="flex gap-2 mr-2">
                  {product.quantity && product.unit && (
                    <span>{`${product.quantity} ${product.unit}`}</span>
                  )}

                  {product.price && product.quantity && product.unit && (
                    <span className="font-semibold text-teal-400">
                      {CalculateProductValue({
                        quantity: product.quantity,
                        price: product.price,
                        unit: product.unit,
                      })}
                    </span>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent >
                <div className="flex flex-row gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    {product.quantity && (
                      <p>
                        <strong>Quantidade:</strong> {product.quantity} {product.unit}
                      </p>
                    )}

                    {product.price && (
                      <p>
                        <strong>Preço por {product.unit}:</strong> R$ {convertToCurrency(product.price)}
                      </p>
                    )}

                    <p><strong>Status:</strong> {product.addToCart ? "No carrinho" : "Fora do carrinho"}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 bg-teal-100 p-2 rounded cursor-pointer">
                      <Pencil className="h-4 w-4 text-teal-400" />
                    </div>

                    <div className="flex gap-2 bg-rose-100 p-2 rounded cursor-pointer">
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
