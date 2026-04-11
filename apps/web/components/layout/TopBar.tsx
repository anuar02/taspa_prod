export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 flex items-end justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Taspa</p>
        <h1 className="mt-2 text-2xl font-semibold text-text">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      </div>
    </header>
  );
}
