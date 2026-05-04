export default function InvoicesLoading() {
  return (
    <div className="p-2 md:p-0 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-28 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-primary/20 rounded-xl" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div>
        {/* Mobile Card View Skeleton (shown only on mobile) */}
        <div className="md:hidden space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-4 border-b border-border/60">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-20 bg-slate-200 rounded ml-4" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* Desktop Table View Skeleton (hidden on mobile) */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4 flex gap-12">
            {["w-20", "w-28", "w-16", "w-20", "w-16", "w-16", "w-16"].map((w, i) => (
              <div key={i} className={`h-3 ${w} bg-slate-100 rounded`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-gray-50 px-5 py-4 flex gap-12">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-16 bg-slate-50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
