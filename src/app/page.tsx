import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductList } from "@/components/product-list";

export default function Home() {
  return (
    <main className="flex flex-col m-auto row-start-2 items-center sm:items-start min-h-screen max-w-3xl">
      <Header />

      <div id="main-content" className="p-4 flex flex-col gap-4 w-full">
        <ProductList />
      </div>

      <Footer />
    </main>
  );
}
