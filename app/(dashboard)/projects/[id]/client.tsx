"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Plus,
  X,
  Check,
  ChevronDown,
  Recycle,
} from "lucide-react";
import { updateProject } from "@/app/actions/projects";
import { addLabourEntry, deleteLabourEntry } from "@/app/actions/labour";
import { addExpense, deleteExpense } from "@/app/actions/expenses";
import { addScrapEntry, deleteScrapEntry } from "@/app/actions/scrap";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR, todayISO } from "@/lib/utils";

type LabourRow = {
  id: number;
  projectId: number;
  projectName: string | null;
  date: string;
  workersCount: number;
  totalCost: number;
  notes: string | null;
};

type ExpenseRow = {
  id: number;
  projectId: number;
  projectName: string | null;
  type: string;
  description: string | null;
  amount: number;
  date: string;
};

type ScrapRow = {
  id: number;
  projectId: number;
  type: string;
  description: string;
  weight: string | null;
  amount: number;
  date: string;
  notes: string | null;
};

type ProjectData = {
  id: number;
  name: string;
  clientName: string | null;
  workType: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  location: string | null;
  quotedAmount: number;
  notes: string | null;
};

type ScrapTotals = {
  purchased: number;
  sold: number;
  profit: number;
};

const statuses = ["planning", "active", "in-progress", "on-hold", "completed"];

type TabKey = "labour" | "expenses" | "scrap" | "notes";

interface Props {
  project: ProjectData;
  labourList: LabourRow[];
  expenseList: ExpenseRow[];
  scrapList: ScrapRow[];
  labourTotal: number;
  expenseTotal: number;
  totalCost: number;
  profit: number;
  profitPct: string;
  scrapTotals: ScrapTotals;
}

export default function ProjectDetailClient({
  project,
  labourList,
  expenseList,
  scrapList,
  labourTotal,
  expenseTotal,
  totalCost,
  profit,
  profitPct,
  scrapTotals,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("labour");
  const [showLabourForm, setShowLabourForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showScrapForm, setShowScrapForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(project.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  async function handleAddLabour(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await addLabourEntry({
      projectId: project.id,
      date: fd.get("date") as string,
      workersCount: Number(fd.get("workersCount")),
      totalCost: Number(fd.get("totalCost")),
      notes: (fd.get("notes") as string) || null,
    });
    setShowLabourForm(false);
    setSaving(false);
    router.refresh();
  }

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await addExpense({
      projectId: project.id,
      type: fd.get("type") as string,
      description: (fd.get("description") as string) || null,
      amount: Number(fd.get("amount")),
      date: fd.get("date") as string,
    });
    setShowExpenseForm(false);
    setSaving(false);
    router.refresh();
  }

  async function handleAddScrap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await addScrapEntry({
      projectId: project.id,
      type: fd.get("scrapType") as string,
      description: fd.get("description") as string,
      amount: Number(fd.get("amount")),
      date: fd.get("date") as string,
    });
    setShowScrapForm(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDeleteLabour(id: number) {
    await deleteLabourEntry(id);
    router.refresh();
  }

  async function handleDeleteExpense(id: number) {
    await deleteExpense(id);
    router.refresh();
  }

  async function handleDeleteScrap(id: number) {
    await deleteScrapEntry(id);
    router.refresh();
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await updateProject(project.id, { notes });
    setSavingNotes(false);
  }

  async function handleStatusChange(status: string) {
    await updateProject(project.id, { status });
    setShowStatusDropdown(false);
    router.refresh();
  }

  const fieldCls =
    "w-full px-3.5 py-3 bg-background border border-border rounded-xl text-[14px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";

  const scrapPurchases = scrapList.filter((s) => s.type === "purchase");
  const scrapSales = scrapList.filter((s) => s.type === "sale");

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/projects"
            className="text-[13px] text-muted hover:text-primary transition-colors shrink-0"
          >
            ← All Projects
          </Link>
          <span className="text-muted">|</span>
          <h1 className="text-[20px] font-medium text-muted truncate">
            {project.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={project.status} />
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-[12px] text-muted hover:text-muted transition-all"
            >
              {project.status} <ChevronDown size={12} />
            </button>
            {showStatusDropdown && (
              <>
                <div
                  className="fixed inset-1 z-40"
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-xl z-50 py-1 w-40">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="w-full text-left px-3.5 py-2.5 text-[13px] text-muted hover:bg-background capitalize transition-colors"
                    >
                      {s.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 animate-fade-in-up">
        <InfoCard label="Client" value={project.clientName || "—"} />
        <InfoCard label="Type" value={project.workType} />
        <InfoCard
          label="Location"
          value={project.location || "—"}
          icon={<MapPin size={12} className="text-muted" />}
        />
        <InfoCard
          label="Dates"
          value={
            project.startDate
              ? `${project.startDate}${project.endDate ? ` → ${project.endDate}` : ""}`
              : "—"
          }
          icon={<Calendar size={12} className="text-muted" />}
        />
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 animate-fade-in-up stagger-2">
        <FinanceCard
          label="Quoted Amount"
          value={formatINR(project.quotedAmount)}
          color="text-neutral-700"
        />
        <FinanceCard
          label="Labour Cost"
          value={formatINR(labourTotal)}
          color="text-neutral-700"
        />
        <FinanceCard
          label="Other Expenses"
          value={formatINR(expenseTotal)}
          color="text-neutral-700"
        />
        <FinanceCard
          label={`Profit (${profitPct}%)`}
          value={formatINR(Math.abs(profit))}
          color={profit >= 0 ? "text-success" : "text-danger"}
          prefix={profit < 0 ? "- " : ""}
        />
      </div>

      {/* Total Cost Bar */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between mb-6 animate-fade-in-up stagger-3">
        <span className="text-[14px] text-muted font-medium">
          Total Cost (Labour + Expenses)
        </span>
        <span className="text-[18px] font-medium text-neutral-700">
          {formatINR(totalCost)}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-5 animate-fade-in-up stagger-4">
        <div className="flex gap-0 overflow-x-auto">
          <TabButton
            active={tab === "labour"}
            onClick={() => setTab("labour")}
            label={`Labour (${labourList.length})`}
          />
          <TabButton
            active={tab === "expenses"}
            onClick={() => setTab("expenses")}
            label={`Expenses (${expenseList.length})`}
          />
          <TabButton
            active={tab === "scrap"}
            onClick={() => setTab("scrap")}
            label={`Scrap (${scrapList.length})`}
          />
          <TabButton
            active={tab === "notes"}
            onClick={() => setTab("notes")}
            label="Notes"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up stagger-5">
        {/* ── Labour Tab ── */}
        {tab === "labour" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted">
                {labourList.length} entries · Total{" "}
                <span className="font-normal text-muted">
                  {formatINR(labourTotal)}
                </span>
              </p>
              <button
                onClick={() => setShowLabourForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors"
              >
                <Plus size={14} /> Add Entry
              </button>
            </div>

            {showLabourForm && (
              <form
                onSubmit={handleAddLabour}
                className="bg-surface border border-border rounded-2xl p-4 mb-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Date
                    </label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={todayISO()}
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Workers
                    </label>
                    <input
                      name="workersCount"
                      type="number"
                      min={1}
                      required
                      placeholder="5"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Total Cost (₹)
                    </label>
                    <input
                      name="totalCost"
                      type="number"
                      min={0}
                      required
                      placeholder="3500"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Description
                    </label>
                    <input
                      name="notes"
                      placeholder="e.g. Raju, Manoj, 3 helpers"
                      className={fieldCls}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLabourForm(false)}
                    className="px-4 py-2 border border-border rounded-lg text-[13px] text-muted hover:text-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {labourList.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-muted text-left">
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Workers</th>
                        <th className="px-5 py-3 font-medium text-right">
                          Cost
                        </th>
                        <th className="px-5 py-3 font-medium">Description</th>
                        <th className="px-5 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {labourList.map((l) => (
                        <tr
                          key={l.id}
                          className="border-b border-border/50 hover:bg-primary-light/20 transition-colors"
                        >
                          <td className="px-5 py-3 text-muted">
                            {l.date}
                          </td>
                          <td className="px-5 py-3">
                            <span className="bg-primary-light text-primary text-[12px] font-normal px-2 py-0.5 rounded-md">
                              {l.workersCount} workers
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-normal text-muted">
                            {formatINR(l.totalCost)}
                          </td>
                          <td className="px-5 py-3 text-muted max-w-[300px] truncate">
                            {l.notes || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleDeleteLabour(l.id)}
                              className="text-muted hover:text-danger transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-background/30">
                        <td className="px-5 py-3 font-medium text-muted">
                          Total Labour Cost
                        </td>
                        <td />
                        <td className="px-5 py-3 text-right font-medium text-neutral-700">
                          {formatINR(labourTotal)}
                        </td>
                        <td />
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Expenses Tab ── */}
        {tab === "expenses" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted">
                {expenseList.length} items · Total{" "}
                <span className="font-normal text-muted">
                  {formatINR(expenseTotal)}
                </span>
              </p>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors"
              >
                <Plus size={14} /> Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <form
                onSubmit={handleAddExpense}
                className="bg-surface border border-border rounded-2xl p-4 mb-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      required
                      placeholder="Transport / Vehicle"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Type
                    </label>
                    <select name="type" required className={fieldCls}>
                      <option value="Transport">Transport</option>
                      <option value="Tools & Equipment">
                        Tools & Equipment
                      </option>
                      <option value="Material">Material</option>
                      <option value="Packing">Packing</option>
                      <option value="Fuel & Toll">Fuel & Toll</option>
                      <option value="Food">Food</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      name="amount"
                      type="number"
                      min={0}
                      required
                      placeholder="8000"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Date
                    </label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={todayISO()}
                      className={fieldCls}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="px-4 py-2 border border-border rounded-lg text-[13px] text-muted hover:text-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {expenseList.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-muted text-left">
                        <th className="px-5 py-3 font-medium">Description</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium text-right">
                          Amount
                        </th>
                        <th className="px-5 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {expenseList.map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-border/50 hover:bg-primary-light/20 transition-colors"
                        >
                          <td className="px-5 py-3 font-medium text-muted">
                            {e.description || e.type}
                          </td>
                          <td className="px-5 py-3 text-muted capitalize">
                            {e.type}
                          </td>
                          <td className="px-5 py-3 text-muted">{e.date}</td>
                          <td className="px-5 py-3 text-right font-normal text-warning">
                            {formatINR(e.amount)}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="text-muted hover:text-danger transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-background/30">
                        <td className="px-5 py-3 font-medium text-muted">
                          Total Expenses
                        </td>
                        <td />
                        <td />
                        <td className="px-5 py-3 text-right font-medium text-warning">
                          {formatINR(expenseTotal)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scrap Tab ── */}
        {tab === "scrap" && (
          <div>
            {/* Scrap Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-[11px] font-normal text-muted  tracking-wider mb-1">
                  Purchased
                </p>
                <p className="text-[18px] font-medium text-neutral-700">
                  {formatINR(scrapTotals.purchased)}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-[11px] font-normal text-muted  tracking-wider mb-1">
                  Sold
                </p>
                <p className="text-[18px] font-medium text-neutral-700">
                  {formatINR(scrapTotals.sold)}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-[11px] font-normal text-muted  tracking-wider mb-1">
                  Scrap {scrapTotals.profit >= 0 ? "Profit" : "Loss"}
                </p>
                <p
                  className={`text-[18px] font-medium ${scrapTotals.profit >= 0 ? "text-success" : "text-danger"}`}
                >
                  {scrapTotals.profit < 0 ? "- " : ""}
                  {formatINR(Math.abs(scrapTotals.profit))}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted">
                {scrapList.length} entries · Separate from project profit/loss
              </p>
              <button
                onClick={() => setShowScrapForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors"
              >
                <Plus size={14} /> Add Scrap Entry
              </button>
            </div>

            {showScrapForm && (
              <form
                onSubmit={handleAddScrap}
                className="bg-surface border border-border rounded-2xl p-4 mb-4 space-y-3"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Type
                    </label>
                    <select name="scrapType" required className={fieldCls}>
                      <option value="purchase">Purchase (Kharida)</option>
                      <option value="sale">Sale (Becha)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      required
                      placeholder="e.g. Iron scrap, AC units"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      name="amount"
                      type="number"
                      min={0}
                      required
                      placeholder="25000"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">
                      Date
                    </label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={todayISO()}
                      className={fieldCls}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScrapForm(false)}
                    className="px-4 py-2 border border-border rounded-lg text-[13px] text-muted hover:text-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="flex gap-4 w-full">
              {/* Purchases Section */}
              {scrapPurchases.length > 0 && (
                <div className="mb-5 w-full">
                  <h4 className="text-[13px] font-normal text-muted mb-2 flex items-center gap-2">
                    <Recycle size={14} className="text-danger" />
                    Scrap Purchased
                  </h4>
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-border bg-background/50 text-muted text-left">
                            <th className="px-5 py-3 font-medium">Item</th>
                            <th className="px-5 py-3 font-medium">Date</th>
                            <th className="px-5 py-3 font-medium text-right">
                              Amount
                            </th>
                            <th className="px-5 py-3 w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {scrapPurchases.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-border/50 hover:bg-primary-light/20 transition-colors"
                            >
                              <td className="px-5 py-3 font-medium text-muted">
                                {s.description}
                              </td>
                              <td className="px-5 py-3 text-muted">{s.date}</td>
                              <td className="px-5 py-3 text-right font-normal text-neutral-700">
                                {formatINR(s.amount)}
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => handleDeleteScrap(s.id)}
                                  className="text-muted hover:text-danger transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-background/30">
                            <td
                              className="px-5 py-3 font-medium text-muted"
                              colSpan={2}
                            >
                              Total Purchased
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-neutral-700">
                              {formatINR(scrapTotals.purchased)}
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Section */}
              {scrapSales.length > 0 && (
                <div className="w-full">
                  <h4 className="text-[13px] font-normal text-muted mb-2 flex items-center gap-2">
                    <Recycle size={14} className="text-success" />
                    Scrap Sold
                  </h4>
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-border bg-background/50 text-muted text-left">
                            <th className="px-5 py-3 font-medium">Item</th>
                            <th className="px-5 py-3 font-medium">Date</th>
                            <th className="px-5 py-3 font-medium text-right">
                              Amount
                            </th>
                            <th className="px-5 py-3 w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {scrapSales.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-border/50 hover:bg-primary-light/20 transition-colors"
                            >
                              <td className="px-5 py-3 font-medium text-muted">
                                {s.description}
                              </td>
                              <td className="px-5 py-3 text-muted">{s.date}</td>
                              <td className="px-5 py-3 text-right font-normal text-neutral-700">
                                {formatINR(s.amount)}
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => handleDeleteScrap(s.id)}
                                  className="text-muted hover:text-danger transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-background/30">
                            <td
                              className="px-5 py-3 font-medium text-muted"
                              colSpan={2}
                            >
                              Total Sold
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-neutral-700">
                              {formatINR(scrapTotals.sold)}
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Notes Tab ── */}
        {tab === "notes" && (
          <div className="max-w-2xl">
            <p className="text-[13px] text-muted mb-3">
              Branch manager details, access timings, special instructions, etc.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={10}
              placeholder={`Branch Manager: Mr. Sharma\nContact: 98765 43210\nAccess Timing: 9 AM – 6 PM (Mon-Sat)\nSecurity Contact: ...\n\nSpecial Instructions:\n- Locker room key with manager\n- Night work not allowed\n- Parking available in basement`}
              className={`${fieldCls} min-h-[200px]`}
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Check size={14} />
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-[11px] font-normal text-muted  tracking-wider mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[14px] font-normal text-muted truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function FinanceCard({
  label,
  value,
  color,
  prefix = "",
}: {
  label: string;
  value: string;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-[11px] font-normal text-muted  tracking-wider mb-1.5">
        {label}
      </p>
      <p className={`text-[18px] font-medium ${color}`}>
        {prefix}
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-[13px] font-normal transition-all border-b-2 whitespace-nowrap ${active
        ? "text-primary border-primary"
        : "text-muted border-transparent hover:text-muted"
        }`}
    >
      {label}
    </button>
  );
}
