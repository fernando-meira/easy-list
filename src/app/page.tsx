import { CategoryList, Footer, Header } from '@/components';

export default function Home() {
  return (
    <main className="flex flex-col m-auto row-start-2 items-center sm:items-start h-screen max-w-3xl">
      <Header />

      <div id="main-content" className="p-4 flex flex-col gap-4 w-full mt-20 pb-20">
        <CategoryList />
      </div>

      <Footer />
    </main>
  );
}
