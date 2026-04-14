export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-2 mb-0 animate-pulse">
      {/* Quick Create skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 bg-slate-100 rounded-xl" />
        ))}
      </div>

      {/* Row 1: Finance + Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
          <div className="h-8 w-40 bg-slate-200 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-3/4 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="h-4 w-20 bg-slate-200 rounded mb-4" />
          <div className="h-8 w-20 bg-slate-200 rounded mb-4" />
          <div className="h-3 w-full bg-slate-100 rounded" />
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="h-4 w-24 bg-slate-200 rounded mb-6" />
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-4 w-8 bg-slate-200 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-8 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Sales + Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 h-[260px]">
          <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-full bg-slate-50 rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 h-[260px]">
          <div className="h-4 w-28 bg-slate-200 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-full bg-slate-50 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Invoices + Clients */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-lg border border-slate-200 p-6 h-[280px]">
          <div className="h-4 w-28 bg-slate-200 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-full bg-slate-50 rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 h-[280px]">
          <div className="h-4 w-20 bg-slate-200 rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-28 bg-slate-100 rounded" />
                <div className="h-4 w-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
