import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen">
      <Header />

      <div id="main-content" className="p-4 flex flex-col gap-4">

      </div>

      <Footer />
    </main>
  );
}
