export default function InvoiceDetailLoading() {
  return (
    <div className="max-w-[820px] mx-auto animate-pulse">
      {/* Top bar skeleton */}
      <div className="flex items-center p-2 justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-12 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-green-100 rounded-lg" />
          <div className="h-5 w-36 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-slate-100 rounded-md" />
          <div className="h-8 w-24 bg-slate-100 rounded-md" />
          <div className="h-8 w-24 bg-slate-100 rounded-md" />
          <div className="h-8 w-8 bg-slate-100 rounded-md" />
        </div>
      </div>

      {/* Document skeleton */}
      <div className="bg-white border border-gray-200 overflow-hidden px-8 mx-auto">
        <div className="h-24 bg-slate-100 rounded mb-6" />
        <div className="flex justify-end mb-4">
          <div className="h-4 w-28 bg-slate-100 rounded" />
        </div>
        <div className="space-y-2 mb-6">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
        <div className="h-4 w-64 bg-slate-100 rounded mb-6" />
        <div className="space-y-3 mb-8">
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-5/6 bg-slate-100 rounded" />
          <div className="h-3 w-4/6 bg-slate-100 rounded" />
        </div>
        <div className="flex justify-center mb-6">
          <div className="h-6 w-40 bg-slate-200 rounded" />
        </div>
        <div className="flex justify-end mb-6">
          <div className="h-16 w-32 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}
