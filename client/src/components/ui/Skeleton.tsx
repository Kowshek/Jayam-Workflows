interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <Skeleton className="h-4 w-4/12" />
            <Skeleton className="h-4 w-2/12" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}
