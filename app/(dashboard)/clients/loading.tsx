export default function ClientsLoading() {
  return (
    <div className="p-2 md:p-0 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-primary/20 rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-5 h-24"
          >
            <div className="h-4 w-48 bg-slate-200 rounded mb-3" />
            <div className="flex gap-4">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
