export default function ExpensesLoading() {
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

      {/* Form area skeleton (if open) - optional, let's just do table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="border-b border-gray-50 px-5 py-4 flex gap-8">
          {["w-20", "w-32", "w-16", "w-40", "w-20"].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-100 rounded`} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-5 py-5 flex gap-8">
            <div className="h-4 w-20 bg-slate-50 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-40 bg-slate-50 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
