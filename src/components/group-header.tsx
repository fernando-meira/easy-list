interface GroupHeaderProps {
  title: string;
  count: number;
}

export function GroupHeader({ title, count }: GroupHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-base font-semibold text-[var(--color-ink)]">
        {title}
      </span>
      <div className="flex items-center justify-center w-7 h-6 rounded-full bg-[var(--color-primary)]">
        <span className="text-[12px] font-semibold text-[var(--color-on-primary)]">
          {count}
        </span>
      </div>
    </div>
  );
}
