export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col m-auto row-start-2 items-center sm:items-start h-screen max-w-3xl">
      {children}
    </main>
  );
}
