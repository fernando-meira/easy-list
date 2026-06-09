const skel = 'bg-[var(--color-hairline)] animate-pulse';

export function CategoryListSkeleton() {
  return (
    <main className="flex flex-col gap-4">
      <div className={`${skel} h-[34px] w-40 rounded-lg`} />

      <section className="flex flex-col gap-3">
        <div className={`${skel} h-[14px] w-[120px] rounded`} />

        <div className="flex flex-col gap-2">
          <div className={`${skel} h-3 w-[90px] rounded`} />
          <div className={`${skel} h-[86px] w-full rounded-xl`} />
          <div className={`${skel} h-[86px] w-full rounded-xl`} />
        </div>

        <div className="flex flex-col gap-2">
          <div className={`${skel} h-3 w-[60px] rounded`} />
          <div className={`${skel} h-[86px] w-full rounded-xl`} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className={`${skel} h-[14px] w-[140px] rounded`} />
        <div className={`${skel} h-[56px] w-full rounded-xl`} />
      </section>

      <div className={`${skel} h-10 w-40 rounded-full`} />
    </main>
  );
}
