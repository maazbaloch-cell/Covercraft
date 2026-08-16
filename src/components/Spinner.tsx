/**
 * Inline loading spinner used by buttons across the storefront and admin.
 * Sized in `em` by default so it scales with the button's font-size, and uses
 * `currentColor` so it inherits the button's text colour. Pair it with the
 * "overlay" pattern (absolutely-centred spinner + opacity-0 label) so a button
 * never changes width when it enters its loading state.
 */
export default function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" role="status" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
