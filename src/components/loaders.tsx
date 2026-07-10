/** Full-page centered spinner for route-level loading states. */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <span className="relative flex h-12 w-12">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-20" />
        <span className="relative inline-flex h-12 w-12 animate-spin rounded-full border-[3px] border-border border-t-brand" />
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

/** Inline skeleton card grid for dashboard loading. */
export function CardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5">
          <div className="skeleton h-11 w-11 rounded-xl" />
          <div className="skeleton mt-4 h-7 w-20 rounded-lg" />
          <div className="skeleton mt-2 h-4 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
