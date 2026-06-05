export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" className="p-4 flex flex-col gap-4 w-full mt-14 pb-28">
      {children}
    </div>
  );
}
