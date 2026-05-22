"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createBranch } from "@/app/actions/clients";
import { validateGSTIN } from "@/lib/validation";
import { alerts } from "@/lib/alerts";

interface AddBranchModalProps {
  clientId: number;
  clientName: string;
  onClose: () => void;
  onSuccess: (newBranch: { id: number; branchName: string; address: string | null; gstin: string | null }) => void;
}

const fieldCls = "w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/10 focus:border-primary placeholder:text-muted-foreground/30";

export default function AddBranchModal({
  clientId,
  clientName,
  onClose,
  onSuccess,
}: AddBranchModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [branchName, setBranchName] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSave() {
    setError("");
    const cleanedBranchName = branchName.trim();
    if (!cleanedBranchName) {
      setError("Branch name is required");
      return;
    }

    const cleanedGstin = gstin.trim().toUpperCase();
    if (cleanedGstin) {
      const check = validateGSTIN(cleanedGstin);
      if (!check.valid) {
        setError(check.error || "Invalid GSTIN format");
        return;
      }
    }

    setSaving(true);
    try {
      const result = await createBranch({
        clientId,
        branchName: cleanedBranchName,
        address: address.trim() || null,
        gstin: cleanedGstin || null,
        contactPerson: null,
        phone: null,
        email: null,
      });

      alerts.success("Branch added successfully");
      onSuccess({
        id: result.id,
        branchName: result.branchName,
        address: result.address,
        gstin: result.gstin,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create branch. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-foreground/45 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">
              Add New Branch
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Creating a branch for <span className="font-semibold text-foreground">{clientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-muted-foreground block">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Mumbai Branch, Technology Dept"
              className={fieldCls}
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-muted-foreground block">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 27AAACS8577K2ZO"
              className={`${fieldCls} uppercase`}
              maxLength={15}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-muted-foreground block">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter branch street address, city, state..."
              className={`${fieldCls} resize-none min-h-[100px]`}
              disabled={saving}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-slate-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-foreground bg-white border border-border rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-white bg-primary rounded-xl hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Branch"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
