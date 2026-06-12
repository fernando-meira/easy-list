interface SubcategoryHeaderProps {
  title: string;
  count: number;
}

export function SubcategoryHeader({ title, count }: SubcategoryHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[13px] font-semibold text-[var(--color-muted)]">
        {title}
      </span>
      <span className="text-[12px] font-medium text-[var(--color-muted)]">
        {count}
      </span>
    </div>
  );
}
