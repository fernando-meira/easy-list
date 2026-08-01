import { FOOTER_CLEARANCE_PX } from '@/lib/constants';

const skel = 'bg-[var(--color-hairline)] animate-pulse';

export function CategoryPageSkeleton() {
  return (
    <div className="flex flex-col gap-4" style={{ paddingBottom: FOOTER_CLEARANCE_PX }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <div className={`${skel} h-3 w-9 rounded-sm`} />
        <div className={`${skel} h-3 w-1.5 rounded-sm`} />
        <div className={`${skel} h-3 w-[90px] rounded-sm`} />
      </div>

      {/* Hero card — faithful structure */}
      <div className="flex flex-col gap-[14px] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-[18px]">
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-col gap-1">
            <div className={`${skel} h-7 w-[190px] rounded-md`} />
            <div className={`${skel} h-[13px] w-[130px] rounded`} />
          </div>
          <div className={`${skel} h-8 w-[120px] rounded-full`} />
        </div>

        <div className="flex gap-[10px]">
          <div className={`${skel} h-[34px] flex-1 rounded-full`} />
          <div className={`${skel} h-[34px] flex-1 rounded-full`} />
        </div>

        <div className={`${skel} h-10 w-full rounded-md`} />
        <div className={`${skel} h-16 w-full rounded-md`} />
      </div>

      {/* Fora do carrinho */}
      <div className={`${skel} h-[14px] w-[120px] rounded`} />
      {[0, 1, 2].map(i => (
        <div key={i} className={`${skel} h-[68px] w-full rounded-xl`} />
      ))}

      {/* Carrinho */}
      <div className={`${skel} h-[14px] w-[80px] rounded`} />
      {[0, 1].map(i => (
        <div key={i} className={`${skel} h-[68px] w-full rounded-xl`} />
      ))}
    </div>
  );
}
