"use client";

import { useState, useEffect } from "react";
import { Plus, Phone, IndianRupee } from "lucide-react";
import { getWorkers, createWorker } from "@/app/actions/workers";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { formatINR } from "@/lib/utils";
import type { Worker } from "@/app/db/schema";

export default function WorkersPage() {
  const [workerList, setWorkerList] = useState<Worker[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWorkers().then(setWorkerList);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await createWorker({
      name: fd.get("name") as string,
      role: fd.get("role") as string,
      phone: (fd.get("phone") as string) || null,
      dailyRate: Number(fd.get("dailyRate")),
    });
    const updated = await getWorkers();
    setWorkerList(updated);
    setShowForm(false);
    setSaving(false);
  }

  const fieldCls =
    "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <>
      <PageHeader
        title="Workers"
        subtitle="Manage your workforce"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Add Worker
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-5 mb-6 animate-fade-in-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input
                name="name"
                required
                placeholder="Worker name"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Role *</label>
              <select name="role" required className={fieldCls}>
                <option value="labourer">Labourer</option>
                <option value="supervisor">Supervisor</option>
                <option value="driver">Driver</option>
                <option value="technician">Technician</option>
                <option value="helper">Helper</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Daily Rate (₹) *</label>
              <input
                name="dailyRate"
                type="number"
                required
                placeholder="500"
                className={fieldCls}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Worker"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {workerList.length === 0 && !showForm ? (
        <EmptyState
          title="No workers yet"
          message="Add workers to start tracking labour."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workerList.map((w) => (
            <div
              key={w.id}
              className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary font-medium text-[14px]">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[14px] font-normal text-muted">
                    {w.name}
                  </h3>
                  <p className="text-[12px] text-muted capitalize">{w.role}</p>
                </div>
                {!w.active && (
                  <span className="ml-auto text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-normal">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[12px] text-muted">
                {w.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> {w.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium text-muted">
                  <IndianRupee size={11} /> {formatINR(w.dailyRate)}/day
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
