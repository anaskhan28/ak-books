"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { alerts } from "@/lib/alerts";
import { Plus, Check, Trash2, Calendar, Tag, FileText } from "lucide-react";
import { addExpense, deleteExpense } from "@/app/actions/expenses";
import PageHeader from "@/components/ui/page-header";
import { formatINR, todayISO } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";

const expenseTypes = [
  "Transport",
  "Tools & Equipment",
  "Material",
  "Food & Refreshment",
  "Fuel",
  "Miscellaneous",
];

interface ExpenseRow {
  id: number;
  projectId: number;
  projectName: string | null;
  type: string;
  description: string | null;
  amount: number;
  date: string;
}

interface ProjectOption {
  id: number;
  name: string;
}

interface ExpensesClientProps {
  expenses: ExpenseRow[];
  projects: ProjectOption[];
}

export default function ExpensesClient({ expenses, projects }: ExpensesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project") || "";

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [projectId, setProjectId] = useState(preselectedProject);
  const [type, setType] = useState(expenseTypes[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
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
      router.refresh();
      // Keep form open for quick entries if user wants, but maybe close if on mobile
      if (window.innerWidth < 768) setShowForm(false);
    } catch (err) {
      console.error(err);
      alerts.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!(await alerts.confirm("Delete this expense?"))) return;
    await deleteExpense(id);
    alerts.success("Expense deleted");
    router.refresh();
  }

  const fieldCls =
    "w-full px-3.5 py-3 bg-background border border-border rounded-xl text-[14px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer";
  const inputCls = fieldCls.replace("cursor-pointer", "");
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

      {/* Quick Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-6 animate-fade-in-up space-y-4 shadow-sm"
        >
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-[13px] font-medium">
              <Check size={16} /> Expense saved successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Truck hire for shifting"
                className={inputCls}
              />
            </div>
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
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-[14px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Expense"}
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

      {/* Entries List */}
      {expenses.length === 0 && !showForm ? (
        <EmptyState
          title="No expenses yet"
          message="Track your project spendings here."
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted text-left">
                  <th className="px-4 md:px-5 py-4 font-medium uppercase text-[11px] tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 md:px-5 py-4 font-medium uppercase text-[11px] tracking-wider whitespace-nowrap">Project</th>
                  <th className="px-4 md:px-5 py-4 font-medium uppercase text-[11px] tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-4 md:px-5 py-4 font-medium uppercase text-[11px] tracking-wider whitespace-nowrap">Description</th>
                  <th className="px-4 md:px-5 py-4 font-medium uppercase text-[11px] tracking-wider text-right whitespace-nowrap">Amount</th>
                  <th className="px-4 md:px-5 py-4 w-10 sticky right-0 bg-white" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-4 md:px-5 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 md:px-5 py-4 text-gray-800 font-medium whitespace-nowrap">{e.projectName}</td>
                    <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-medium text-gray-600 uppercase">
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 md:px-5 py-4 text-gray-500 italic min-w-[150px]">
                      {e.description || "—"}
                    </td>
                    <td className="px-4 md:px-5 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatINR(e.amount)}
                    </td>
                    <td className="px-4 md:px-5 py-4 text-right sticky right-0 bg-white/80 md:bg-transparent backdrop-blur-sm md:backdrop-none">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 md:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
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
