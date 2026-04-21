export default function PaymentsLoading() {
  return (
    <div className="p-2 md:p-0 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-primary/20 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 flex gap-8">
          {["w-24", "w-20", "w-32", "w-24", "w-16", "w-24", "w-32"].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-100 rounded`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-5 py-4 flex gap-8">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-200/50 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded ml-auto" />
            <div className="h-4 w-16 bg-slate-100 rounded ml-auto text-red-100" />
            <div className="h-4 w-24 bg-slate-50 rounded" />
            <div className="h-4 w-32 bg-slate-50 rounded italic" />
          </div>
        ))}
      </div>
    </div>
  );
}
