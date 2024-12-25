import { Header } from "@/components/header";
import { NewProductForm } from "@/components/new-product-form";

export default function Home() {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <Header />

      <NewProductForm />
    </main>
  );
}
