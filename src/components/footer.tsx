import { products } from "@/data/products";
import { convertToCurrency } from "@/utils/convertToCurrency/convertToCurrency";
import { calculateTotalValue } from "@/utils/calculateTotalValue/calculateTotalValue";

export function Footer() {
  return (
    <footer className="position: absolute bottom-0 w-full m-auto border-t max-w-3xl">
      <div className="p-4 flex justify-between gap-4 mx-auto">
        <p className="font-semibold">Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}</p>

        <p className="font-semibold text-teal-400">No carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}</p>
      </div>
    </footer>
  );
}
