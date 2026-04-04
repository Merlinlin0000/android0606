const CanvasPlaceholder = () => {
  return (
    <section className="h-full rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-mica backdrop-blur-sm">
      <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50">
        <header className="border-b border-slate-200 px-4 py-2 text-xs font-medium tracking-wide text-slate-500">
          Infinite Canvas (Placeholder)
        </header>
        <div className="relative flex-1 overflow-hidden rounded-b-xl bg-dot-grid bg-dot-grid">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/40" />
        </div>
      </div>
    </section>
  );
};

export default CanvasPlaceholder;
