"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  X,
  Check,
  GitBranch,
} from "lucide-react";
import {
  createClient,
  updateClient,
  deleteClient,
  createBranch,
  deleteBranch,
} from "@/app/actions/clients";
import { validateGSTIN } from "@/lib/validation";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { alerts } from "@/lib/alerts";
import type { Client, ClientBranch } from "@/app/db/schema";

interface ClientsClientProps {
  initialClients: (Client & { branches: ClientBranch[] })[];
}

export default function ClientsClient({ initialClients }: ClientsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingBranchFor, setAddingBranchFor] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editGstin, setEditGstin] = useState("");
  const [gstError, setGstError] = useState("");

  // ── GST validation helper ──
  function handleGstChange(value: string, setError: (e: string) => void) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned && cleaned.length === 15) {
      const result = validateGSTIN(cleaned);
      setError(result.valid ? "" : result.error || "");
    } else if (cleaned.length > 0 && cleaned.length < 15) {
      setError(`${15 - cleaned.length} more characters needed`);
    } else {
      setError("");
    }
    return cleaned;
  }

  // ── Create Client ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const gstin = (fd.get("gstin") as string)?.trim().toUpperCase() || null;

    if (gstin) {
      const result = validateGSTIN(gstin);
      if (!result.valid) {
        alerts.error("Invalid GST", result.error);
        setSaving(false);
        return;
      }
    }

    try {
      await createClient({
        name: fd.get("name") as string,
        gstin,
        contactPerson: null,
        phone: null,
        email: null,
        address: null,
      });
      setShowForm(false);
      router.refresh();
    } catch (error: any) {
      alerts.error("Failed to save", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Save GST edit ──
  async function handleSaveGstin(clientId: number) {
    const gstin = editGstin.trim().toUpperCase() || null;
    if (gstin) {
      const result = validateGSTIN(gstin);
      if (!result.valid) {
        alerts.error("Invalid GST", result.error);
        return;
      }
    }
    try {
      await updateClient(clientId, { gstin });
      setEditingId(null);
      alerts.success("GST updated");
      router.refresh();
    } catch (error: any) {
      alerts.error("Failed", error.message);
    }
  }

  // ── Add Branch ──
  async function handleAddBranch(e: React.FormEvent<HTMLFormElement>, clientId: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const gstin = (fd.get("gstin") as string)?.trim().toUpperCase() || null;
    
    if (gstin) {
      const result = validateGSTIN(gstin);
      if (!result.valid) {
        alerts.error("Invalid GST", result.error);
        return;
      }
    }
    
    try {
      await createBranch({
        clientId,
        branchName: fd.get("branchName") as string,
        address: (fd.get("address") as string) || null,
        contactPerson: (fd.get("contactPerson") as string) || null,
        phone: (fd.get("phone") as string) || null,
        gstin,
        email: null,
      });
      setAddingBranchFor(null);
      router.refresh();
    } catch (error: any) {
      alerts.error("Failed", error.message);
    }
  }

  // ── Delete Branch ──
  async function handleDeleteBranch(branchId: number) {
    if (!(await alerts.confirm("Delete this branch?", "This cannot be undone."))) return;
    await deleteBranch(branchId);
    router.refresh();
  }

  // ── Delete Client ──
  async function handleDeleteClient(clientId: number) {
    if (!(await alerts.confirm("Delete this client?", "All branches will be deleted too."))) return;
    try {
      await deleteClient(clientId);
      alerts.success("Client deleted");
      router.refresh();
    } catch {
      alerts.error("Failed", "Client may have linked quotations.");
    }
  }

  const fieldCls =
    "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <div className="p-2 md:p-0">
      <PageHeader
        title="Client Database"
        subtitle="Companies, GST numbers, and branch locations"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Add Client
          </button>
        }
      />

      {/* Create Client Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-5 mb-6 animate-fade-in-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Company / Bank Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. State Bank of India"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>GSTIN (optional)</label>
              <input
                name="gstin"
                placeholder="e.g. 27AAACS8577K2ZO"
                maxLength={15}
                className={`${fieldCls} uppercase tracking-wider font-mono ${gstError ? "border-red-400 focus:ring-red-100" : ""}`}
                onChange={(e) => {
                  e.target.value = handleGstChange(e.target.value, setGstError);
                }}
              />
              {gstError && (
                <p className="text-[11px] text-red-500 mt-1">{gstError}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !!gstError}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Client"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setGstError(""); }}
              className="px-5 py-2.5 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Client List */}
      {initialClients.length === 0 && !showForm ? (
        <EmptyState
          title="No clients yet"
          message="Add your first bank or company client."
        />
      ) : (
        <div className="grid gap-4">
          {initialClients.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all"
              >
                {/* Client Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={16} className="text-primary/70 shrink-0" />
                        <h3 className="text-[15px] font-semibold text-foreground truncate">
                          {c.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted ml-6">
                        {c.gstin ? (
                          <span className="font-mono text-[11px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                            GST: {c.gstin}
                          </span>
                        ) : (
                          editingId !== c.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(c.id);
                                setEditGstin("");
                              }}
                              className="text-primary/70 hover:text-primary text-[11px] underline underline-offset-2"
                            >
                              + Add GST
                            </button>
                          )
                        )}
                        <span className="flex items-center gap-1">
                          <GitBranch size={11} className="text-primary/50" />
                          {c.branches.length} {c.branches.length === 1 ? "branch" : "branches"}
                        </span>
                      </div>

                      {/* Inline GST edit */}
                      {editingId === c.id && (
                        <div
                          className="flex items-center gap-2 mt-2 ml-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            value={editGstin}
                            onChange={(e) => setEditGstin(handleGstChange(e.target.value, setGstError))}
                            placeholder="27AAACS8577K2ZO"
                            maxLength={15}
                            className="px-2.5 py-1.5 text-[12px] font-mono uppercase tracking-wider border border-border rounded-lg w-[180px] focus:outline-none focus:border-primary"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveGstin(c.id)}
                            disabled={!!gstError}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-40"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setGstError(""); }}
                            className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100"
                          >
                            <X size={14} />
                          </button>
                          {gstError && <span className="text-[10px] text-red-500">{gstError}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(c.id); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-muted" />
                      ) : (
                        <ChevronDown size={16} className="text-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: Branches */}
                {isExpanded && (
                  <div className="border-t border-border bg-slate-50/50 px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[12px] font-bold text-muted uppercase tracking-widest">
                        Branches
                      </h4>
                      <button
                        onClick={() => setAddingBranchFor(addingBranchFor === c.id ? null : c.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Add Branch
                      </button>
                    </div>

                    {/* Add Branch Form */}
                    {addingBranchFor === c.id && (
                      <form
                        onSubmit={(e) => handleAddBranch(e, c.id)}
                        className="bg-white border border-border rounded-xl p-4 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Branch Name *</label>
                            <input name="branchName" required placeholder="e.g. Andheri West" className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Contact Person</label>
                            <input name="contactPerson" placeholder="Branch manager name" className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Phone</label>
                            <input name="phone" type="tel" placeholder="+91 98765 43210" className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>GSTIN (optional)</label>
                            <input name="gstin" placeholder="15-digit GSTIN" className={fieldCls} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Address</label>
                            <input name="address" placeholder="Full branch address" className={fieldCls} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-[12px] font-medium hover:bg-primary-dark transition-colors">
                            Save Branch
                          </button>
                          <button type="button" onClick={() => setAddingBranchFor(null)} className="px-4 py-2 border border-border rounded-xl text-[12px] text-muted">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Branch List */}
                    {c.branches.length === 0 ? (
                      <p className="text-[12px] text-muted/60 py-2">No branches added yet.</p>
                    ) : (
                      c.branches.map((b) => (
                        <div
                           key={b.id}
                           className="flex items-start justify-between bg-white border border-border/60 rounded-xl p-3 group"
                        >
                           <div className="min-w-0">
                             <p className="text-[13px] font-medium text-foreground">{b.branchName}</p>
                             <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1 text-[11px] text-muted items-center">
                               {b.contactPerson && (
                                 <span className="font-medium text-foreground/70">{b.contactPerson}</span>
                               )}
                               {b.phone && (
                                 <span className="flex items-center gap-1">
                                   <Phone size={10} className="text-primary/60" /> {b.phone}
                                 </span>
                               )}
                               {b.address && (
                                 <span className="flex items-center gap-1">
                                   <MapPin size={10} className="text-primary/60" /> {b.address}
                                 </span>
                               )}
                               {b.gstin && (
                                 <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono text-[10px]">
                                   GST: {b.gstin}
                                 </span>
                               )}
                             </div>
                           </div>
                          <button
                            onClick={() => handleDeleteBranch(b.id)}
                            className="p-1 text-gray-200 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
