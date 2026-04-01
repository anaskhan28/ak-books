"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Check, Trash2 } from "lucide-react";
import {
  getLabourEntries,
  addLabourEntry,
  deleteLabourEntry,
} from "@/app/actions/labour";
import { getProjects } from "@/app/actions/projects";
import PageHeader from "@/components/ui/page-header";
import { formatINR, todayISO } from "@/lib/utils";

type LabourRow = Awaited<ReturnType<typeof getLabourEntries>>[number];
type ProjectOption = { id: number; name: string };

export default function LabourPage() {
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project") || "";

  const [entries, setEntries] = useState<LabourRow[]>([]);
  const [projectList, setProjectList] = useState<ProjectOption[]>([]);
  const [showForm, setShowForm] = useState(!!preselectedProject);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [projectId, setProjectId] = useState(preselectedProject);
  const [date, setDate] = useState(todayISO());
  const [workersCount, setWorkersCount] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const [e, p] = await Promise.all([getLabourEntries(), getProjects()]);
    setEntries(e);
    setProjectList(p.map(({ id, name }) => ({ id, name })));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
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
    await load();
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await deleteLabourEntry(id);
    await load();
  }

  const fieldCls =
    "w-full px-3.5 py-3 bg-background border border-border rounded-xl text-[15px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <>
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
          className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-6 animate-fade-in-up space-y-4"
        >
          {success && (
            <div className="flex items-center gap-2 p-3 bg-success-bg border border-success/20 rounded-xl text-success text-[13px] font-medium">
              <Check size={16} /> Entry saved!
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
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Workers *</label>
              <input
                type="number"
                min={1}
                value={workersCount}
                onChange={(e) => setWorkersCount(e.target.value)}
                required
                placeholder="5"
                className={fieldCls}
              />
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
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3 helpers + 2 loaders, overtime 2hrs"
              className={fieldCls}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary text-white rounded-xl text-[14px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Labour Entry"}
          </button>
        </form>
      )}

      {entries.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Workers</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 hover:bg-primary-light/20 transition-colors"
                  >
                    <td className="px-4 py-3">{e.date}</td>
                    <td className="px-4 py-3 text-muted">{e.projectName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-primary-light text-primary text-[12px] font-normal px-2 py-0.5 rounded-md">
                        {e.workersCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatINR(e.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-muted">{e.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-muted hover:text-danger transition-colors"
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
      )}
    </>
  );
}
