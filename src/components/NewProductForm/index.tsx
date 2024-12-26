"use client";

import React from "react";

import { UnitEnum } from "@/types/enums";
import { AddProductDrawer, AddProductModal } from "@/components";
import { useWindowSize } from "@/hooks/useWindowSize";

export function NewProductForm() {
  const { isDesktop } = useWindowSize();

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

  const commonProps = {
    unit,
    name,
    price,
    setUnit,
    setName,
    quantity,
    setPrice,
    addToCart,
    editingId,
    setQuantity,
    setAddToCart,
    cancelEditing,
    addOrEditProduct,
  };

  return isDesktop ? (
    <AddProductModal {...commonProps} />
  ) : (
    <AddProductDrawer {...commonProps} />
  );
}
