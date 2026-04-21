export default function ProjectsLoading() {
  return (
    <div className="p-2 md:p-0 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-primary/20 rounded-xl" />
      </div>

      {/* Grid of cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-5 h-48 flex flex-col justify-between"
          >
            <div>
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-3" />
              <div className="h-3 w-1/2 bg-slate-100 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="h-3 w-20 bg-slate-50 rounded" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
