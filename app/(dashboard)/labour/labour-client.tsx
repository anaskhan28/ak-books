"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { alerts } from "@/lib/alerts";
import { Plus, Check, Trash2, Users, Receipt, Info } from "lucide-react";
import { addLabourEntry, deleteLabourEntry } from "@/app/actions/labour";
import PageHeader from "@/components/ui/page-header";
import { formatINR, todayISO } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";

interface LabourRow {
  id: number;
  projectId: number;
  projectName: string | null;
  date: string;
  workersCount: number;
  totalCost: number;
  notes: string | null;
}

interface ProjectOption {
  id: number;
  name: string;
}

interface LabourClientProps {
  entries: LabourRow[];
  projects: ProjectOption[];
}

export default function LabourClient({ entries, projects }: LabourClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project") || "";

  const [showForm, setShowForm] = useState(!!preselectedProject);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [projectId, setProjectId] = useState(preselectedProject);
  const [date, setDate] = useState(todayISO());
  const [workersCount, setWorkersCount] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addLabourEntry({
        projectId: Number(projectId),
        date,
        workersCount: Number(workersCount),
        totalCost: Number(totalCost),
        notes: notes || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setWorkersCount("");
      setTotalCost("");
      setNotes("");
      router.refresh();
      if (window.innerWidth < 768) setShowForm(false);
    } catch (err) {
      console.error(err);
      alerts.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!(await alerts.confirm("Delete this entry?"))) return;
    await deleteLabourEntry(id);
    alerts.success("Entry deleted");
    router.refresh();
  }

  const fieldCls =
    "w-full px-3.5 py-3 bg-background border border-border rounded-xl text-[14px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer";
  const inputCls = fieldCls.replace("cursor-pointer", "");
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <div className="p-2 md:p-0">
      <PageHeader
        title="Labour Tracking"
        subtitle="Daily worker count and cost — quick entry for site use"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Add Entry
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-6 animate-fade-in-up space-y-4 shadow-sm"
        >
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-[13px] font-medium">
              <Check size={16} /> Entry saved successfully!
            </div>
          )}

          <div>
            <label className={labelCls}>Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className={fieldCls}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Workers *</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={workersCount}
                  onChange={(e) => setWorkersCount(e.target.value)}
                  required
                  placeholder="5"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Total Cost (₹) *</label>
              <input
                type="number"
                min={0}
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                required
                placeholder="3500"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3 helpers + 2 loaders, overtime 2hrs"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-[14px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Labour Entry"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-border rounded-xl text-[13px] font-medium text-muted hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 && !showForm ? (
        <EmptyState
          title="No entries yet"
          message="Track daily worker counts and labor costs."
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {entries.map((e) => (
              <div
                key={e.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[12px] font-medium text-primary mb-0.5">
                      {e.projectName}
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                      <Users size={14} className="text-gray-400" />
                      {e.workersCount} Workers
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-bold text-gray-900">
                      {formatINR(e.totalCost)}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(e.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
                {e.notes && (
                  <div className="mt-2 text-[12px] text-gray-500 italic truncate">
                    &quot;{e.notes}&quot;
                  </div>
                )}
                <button
                  onClick={() => handleDelete(e.id)}
                  className="mt-3 w-full py-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-red-500 bg-red-50 rounded-lg"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-muted text-left">
                    <th className="px-5 py-4 font-medium uppercase text-[11px] tracking-wider">Date</th>
                    <th className="px-5 py-4 font-medium uppercase text-[11px] tracking-wider">Project</th>
                    <th className="px-5 py-4 font-medium uppercase text-[11px] tracking-wider">Workers</th>
                    <th className="px-5 py-4 font-medium uppercase text-[11px] tracking-wider text-right">Cost</th>
                    <th className="px-5 py-4 font-medium uppercase text-[11px] tracking-wider">Notes</th>
                    <th className="px-5 py-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-gray-800 font-medium">{e.projectName}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full text-[11px] font-bold text-primary uppercase">
                          <Users size={12} />
                          {e.workersCount}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        {formatINR(e.totalCost)}
                      </td>
                      <td className="px-5 py-4 text-gray-500 italic max-w-[200px] truncate">
                        {e.notes || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
