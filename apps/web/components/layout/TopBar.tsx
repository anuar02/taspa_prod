export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </header>
  );
}
