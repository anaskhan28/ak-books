"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Check, Trash2 } from "lucide-react";
import { getExpenses, addExpense, deleteExpense } from "@/app/actions/expenses";
import { getProjects } from "@/app/actions/projects";
import PageHeader from "@/components/ui/page-header";
import { formatINR, todayISO } from "@/lib/utils";

type ExpenseRow = Awaited<ReturnType<typeof getExpenses>>[number];
type ProjectOption = { id: number; name: string };

const expenseTypes = [
  "Transport",
  "Tools & Equipment",
  "Material",
  "Food & Refreshment",
  "Fuel",
  "Miscellaneous",
];

import { Suspense } from "react";

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}

function ExpensesPageContent() {
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project") || "";

  const [entries, setEntries] = useState<ExpenseRow[]>([]);
  const [projectList, setProjectList] = useState<ProjectOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [projectId, setProjectId] = useState(preselectedProject);
  const [type, setType] = useState(expenseTypes[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  async function load() {
    const [e, p] = await Promise.all([getExpenses(), getProjects()]);
    setEntries(e);
    setProjectList(p.map(({ id, name }) => ({ id, name })));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addExpense({
      projectId: Number(projectId),
      type,
      description: description || null,
      amount: Number(amount),
      date,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setDescription("");
    setAmount("");
    await load();
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await deleteExpense(id);
    await load();
  }

  const fieldCls =
    "w-full px-3.5 py-3 bg-background border border-border rounded-xl text-[15px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <div className="p-2 md:p-0">
      <PageHeader
        title="Expenses"
        subtitle="Track project-wise expenses on the go"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Add Expense
          </button>
        }
      />

      {/* Quick Entry Form — mobile optimized */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-6 animate-fade-in-up space-y-4"
        >
          {success && (
            <div className="flex items-center gap-2 p-3 bg-success-bg border border-success/20 rounded-xl text-success text-[13px] font-medium">
              <Check size={16} /> Expense saved successfully!
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={fieldCls}
              >
                {expenseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="1500"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Truck hire for shifting"
              className={fieldCls}
            />
          </div>

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

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary text-white rounded-xl text-[14px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </form>
      )}

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
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
                    <td className="px-4 py-3 font-medium text-muted capitalize">
                      {e.type}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {e.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatINR(e.amount)}
                    </td>
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
    </div>
  );
}
