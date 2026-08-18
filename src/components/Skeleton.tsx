/**
 * Lightweight skeleton placeholder with a shimmer sweep. Used while client-fetched
 * data (wishlist, dashboard) is loading, to reduce layout shift and perceived wait.
 * The shimmer is animation-based, so it's automatically stilled under prefers-reduced-motion.
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-200/70 ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent [animation:shimmer_1.4s_infinite]" />
    </div>
  );
}

/** A card-shaped skeleton matching the product grid's cells. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[1.15rem] border border-slate-200/90 bg-white">
      <Skeleton className="aspect-[4/4.35] rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-1 h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}
