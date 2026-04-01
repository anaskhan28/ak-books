"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  FileText,
  CalendarDays,
  User,
  Hash,
  AlignLeft,
  StickyNote,
  ScrollText,
} from "lucide-react";
import { getClients } from "@/app/actions/clients";
import { getTemplates } from "@/app/actions/templates";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import type { Client, QuotationTemplate } from "@/app/db/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocumentMode = "quotation" | "invoice";

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  hsn: string; // HSN code (used by AK Enterprise invoice)
  amount: number;
}

export interface DocumentFormValues {
  templateId: number | null;
  clientName: string;
  clientBranch: string;
  docNumber: string;
  date: string;
  expiryDate: string;
  subject: string;
  items: LineItem[];
  notes: string;
  terms: string;
  // account (invoice)
  accountBankName: string;
  accountNumber: string;
  accountIfsc: string;
  accountHolder: string;
  accountPan: string;
}

interface DocumentFormProps {
  mode: DocumentMode;
  initialValues?: Partial<DocumentFormValues>;
  onSave: (values: DocumentFormValues, subtotal: number) => Promise<void>;
  backHref: string;
  backLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyItem(): LineItem {
  return { id: uid(), description: "", qty: 1, rate: 0, hsn: "", amount: 0 };
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({
  icon: Icon,
  label,
  required,
}: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 mb-1.5 tracking-wide ">
      <Icon size={11} strokeWidth={2.5} />
      {label}
      {required && <span className="text-rose-400">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300
        placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition-all ${className}`}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DocumentForm({
  mode,
  initialValues,
  onSave,
  backHref,
  backLabel,
}: DocumentFormProps) {
  const router = useRouter();
  const isInvoice = mode === "invoice";

  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [templateId, setTemplateId] = useState<number | null>(
    initialValues?.templateId ?? null,
  );
  const [clientName, setClientName] = useState(initialValues?.clientName ?? "");
  const [clientBranch, setClientBranch] = useState(
    initialValues?.clientBranch ?? "",
  );
  const [docNumber, setDocNumber] = useState(initialValues?.docNumber ?? "");
  const [date, setDate] = useState(initialValues?.date ?? today());
  const [expiryDate, setExpiryDate] = useState(initialValues?.expiryDate ?? "");
  const [subject, setSubject] = useState(initialValues?.subject ?? "");
  const [items, setItems] = useState<LineItem[]>(
    initialValues?.items?.length ? initialValues.items : [emptyItem()],
  );
  const [notes, setNotes] = useState(
    initialValues?.notes ??
      (isInvoice
        ? "Thanks for your business."
        : "Looking forward for your business."),
  );
  const [terms, setTerms] = useState(initialValues?.terms ?? "");
  const [accountBankName, setAccountBankName] = useState(
    initialValues?.accountBankName ?? "",
  );
  const [accountNumber, setAccountNumber] = useState(
    initialValues?.accountNumber ?? "",
  );
  const [accountIfsc, setAccountIfsc] = useState(
    initialValues?.accountIfsc ?? "",
  );
  const [accountHolder, setAccountHolder] = useState(
    initialValues?.accountHolder ?? "",
  );
  const [accountPan, setAccountPan] = useState(initialValues?.accountPan ?? "");

  const [showBank, setShowBank] = useState(isInvoice);

  useEffect(() => {
    getClients().then(setClients);
    getTemplates().then(setTemplates);
  }, []);

  // Sync template defaults when template changes
  useEffect(() => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const cfg = getTemplateConfig(tpl.name);
    if (tpl.terms && !initialValues?.terms) setTerms(tpl.terms);
    if (cfg.bank) {
      if (!initialValues?.accountBankName)
        setAccountBankName(cfg.bank.bankName ?? "");
      if (!initialValues?.accountNumber)
        setAccountNumber(cfg.bank.accountNumber ?? "");
      if (!initialValues?.accountIfsc) setAccountIfsc(cfg.bank.ifsc ?? "");
      if (!initialValues?.accountHolder)
        setAccountHolder(cfg.bank.accountHolder ?? "");
      if (!initialValues?.accountPan) setAccountPan(cfg.bank.pan ?? "");
    }
  }, [templateId, templates]);

  // Computed
  const subtotal = items.reduce((s, i) => s + i.amount, 0);

  const activeTemplate = templates.find((t) => t.id === templateId);
  const tplConfig = getTemplateConfig(activeTemplate?.name);
  const isAKEnterprise = tplConfig.generator === "ak-enterprises";

  // Item helpers
  const updateItem = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "qty" || field === "rate") {
            updated.amount = Number(updated.qty) * Number(updated.rate);
          }
          if (field === "amount") {
            updated.amount = Number(value);
          }
          return updated;
        }),
      );
    },
    [],
  );

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (id: string) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((i) => i.id !== id) : prev,
    );

  async function handleSave() {
    if (!clientName.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          templateId,
          clientName,
          clientBranch,
          docNumber,
          date,
          expiryDate,
          subject,
          items,
          notes,
          terms,
          accountBankName,
          accountNumber,
          accountIfsc,
          accountHolder,
          accountPan,
        },
        subtotal,
      );
    } finally {
      setSaving(false);
    }
  }

  const filledItems = items.filter(
    (i) => i.description || i.qty > 0 || i.rate > 0 || i.amount > 0,
  );

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={13} /> {backLabel}
            </Link>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-rose-400" />
              <span className="text-[14px] font-semibold text-gray-700">
                New {isInvoice ? "Invoice" : "Quote"}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !clientName.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-rose-500 text-white rounded-lg text-[13px] font-semibold
              hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Save size={13} />
            {saving ? "Saving…" : `Save ${isInvoice ? "Invoice" : "Quote"}`}
          </button>
        </div>
      </div>

      {/* ── Form body ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Card 1 — Template + Customer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-[12px] font-bold text-gray-400  tracking-widest">
              Document Setup
            </h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 gap-5">
            {/* Template */}
            <div className="col-span-2">
              <FieldLabel icon={FileText} label="Template" required />
              <div className="relative">
                <select
                  value={templateId ?? ""}
                  onChange={(e) =>
                    setTemplateId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full px-3 py-2 pr-8 text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300 appearance-none transition-all"
                >
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Customer Name */}
            <div className="col-span-2">
              <FieldLabel icon={User} label="Customer Name" required />
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Select or add a customer"
                list="client-list"
                className="w-full px-3 py-2 text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300
                  placeholder:text-gray-300 transition-all"
              />
              <datalist id="client-list">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Branch / Address */}
            <div className="col-span-2">
              <FieldLabel icon={AlignLeft} label="Branch / Address" />
              <Input
                value={clientBranch}
                onChange={setClientBranch}
                placeholder="Branch or address (e.g. Ghatkopar Branch)"
              />
            </div>
          </div>
        </div>

        {/* Card 2 — Document Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-[12px] font-bold text-gray-400  tracking-widest">
              {isInvoice ? "Invoice Details" : "Quote Details"}
            </h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-3 gap-5">
            {/* Doc number */}
            <div>
              <FieldLabel
                icon={Hash}
                label={isInvoice ? "Invoice #" : "Quote #"}
                required
              />
              <Input
                value={docNumber}
                onChange={setDocNumber}
                placeholder={isInvoice ? "AK/25-26/00098" : "QT-000071"}
              />
            </div>

            {/* Date */}
            <div>
              <FieldLabel
                icon={CalendarDays}
                label={isInvoice ? "Invoice Date" : "Quote Date"}
                required
              />
              <Input type="date" value={date} onChange={setDate} />
            </div>

            {/* Expiry / Due date */}
            <div>
              <FieldLabel
                icon={CalendarDays}
                label={isInvoice ? "Due Date" : "Expiry Date"}
              />
              <Input type="date" value={expiryDate} onChange={setExpiryDate} />
            </div>

            {/* Subject */}
            <div className="col-span-3">
              <FieldLabel icon={AlignLeft} label="Subject" />
              <Input
                value={subject}
                onChange={setSubject}
                placeholder={
                  isInvoice ? "Shifting Invoice" : "Shifting Quotation"
                }
              />
            </div>
          </div>
        </div>

        {/* Card 3 — Item Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-[12px] font-bold text-gray-400  tracking-widest">
              Item Table
            </h2>
            <span className="text-[11px] text-gray-400">
              {filledItems.length} item{filledItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-400  text-[10px] tracking-wider w-[42%]">
                    Item Details
                  </th>
                  {isAKEnterprise && isInvoice && (
                    <th className="text-center px-3 py-3 font-semibold text-gray-400  text-[10px] tracking-wider w-[10%]">
                      HSN Code
                    </th>
                  )}
                  <th className="text-center px-3 py-3 font-semibold text-gray-400  text-[10px] tracking-wider w-[10%]">
                    Qty
                  </th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-400  text-[10px] tracking-wider w-[14%]">
                    Rate
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-400  text-[10px] tracking-wider w-[16%]">
                    Amount
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-gray-50/40 transition-colors align-top"
                  >
                    {/* Description */}
                    <td className="px-4 py-2">
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          updateItem(item.id, "description", e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                        }}
                        ref={(el) => {
                          if (el && item.description) {
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }
                        }}
                        rows={1}
                        placeholder={
                          idx === 0 ? "Type or click to select an item…" : ""
                        }
                        className="w-full text-[12px] text-gray-800 bg-transparent border-0 focus:outline-none
                          placeholder:text-gray-300 resize-none overflow-hidden leading-[1.6] py-1"
                      />
                    </td>

                    {/* HSN (AK invoice only) */}
                    {isAKEnterprise && isInvoice && (
                      <td className="px-3 py-1">
                        <select
                          value={
                            ["996793", "998533"].includes(item.hsn)
                              ? item.hsn
                              : ""
                          }
                          onChange={(e) => {
                            if (e.target.value)
                              updateItem(item.id, "hsn", e.target.value);
                          }}
                          className="w-full text-[10px] text-gray-400 bg-transparent border-0 focus:outline-none cursor-pointer mb-0.5"
                        >
                          <option value="">— pick —</option>
                          <option value="996793">996793 (Shifting)</option>
                          <option value="998533">998533 (Cleaning)</option>
                        </select>
                        <input
                          value={item.hsn}
                          onChange={(e) =>
                            updateItem(item.id, "hsn", e.target.value)
                          }
                          placeholder="Custom HSN"
                          className="w-full text-center text-[12px] text-gray-700 bg-transparent border-0 border-t border-dashed border-gray-100
                            focus:outline-none placeholder:text-gray-200 py-0.5"
                        />
                      </td>
                    )}

                    {/* Qty */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.qty || ""}
                        onChange={(e) =>
                          updateItem(item.id, "qty", Number(e.target.value))
                        }
                        className="w-full text-center text-[12px] text-gray-700 bg-transparent border-0
                          focus:outline-none placeholder:text-gray-200 py-1"
                        placeholder="1"
                      />
                    </td>

                    {/* Rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.rate || ""}
                        onChange={(e) =>
                          updateItem(item.id, "rate", Number(e.target.value))
                        }
                        className="w-full text-right text-[12px] text-gray-700 bg-transparent border-0
                          focus:outline-none placeholder:text-gray-200 py-1"
                        placeholder="0.00"
                      />
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateItem(item.id, "amount", Number(e.target.value))
                        }
                        className="w-full text-right text-[12px] font-semibold text-gray-800 bg-transparent border-0
                          focus:outline-none placeholder:text-gray-200 py-1"
                        placeholder="0.00"
                      />
                    </td>

                    {/* Remove */}
                    <td className="pr-3 py-2">
                      <button
                        onClick={() => removeRow(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300
                          hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row + subtotal */}
          <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-rose-500 font-semibold
                hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add New Row
            </button>

            <div className="text-right space-y-1 pr-9">
              <div className="flex items-center justify-end gap-8 text-[12px] text-gray-500">
                <span>Sub Total</span>
                <span className="min-w-[80px] text-right">
                  {formatINR(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-8 text-[13px] font-bold text-gray-800 border-t border-gray-100 pt-1">
                <span>Total (₹)</span>
                <span className="min-w-[80px] text-right">
                  {formatINR(subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 — Notes & Terms */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-[12px] font-bold text-gray-400  tracking-widest">
              Notes & Terms
            </h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={StickyNote} label="Customer Notes" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={
                  isInvoice
                    ? "Thanks for your business."
                    : "Looking forward for your business."
                }
                className="w-full px-3 py-2 text-[12px] text-gray-700 bg-white border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300
                  placeholder:text-gray-300 resize-none transition-all"
              />
              <p className="text-[10px] text-gray-300 mt-1">
                Displayed on the {isInvoice ? "invoice" : "quotation"}
              </p>
            </div>
            <div>
              <FieldLabel icon={ScrollText} label="Terms & Conditions" />
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder={
                  "1. Authorized work group\n2. GST 18% Extra\n3. Payment 100% Against Work Done"
                }
                className="w-full px-3 py-2 text-[12px] text-gray-700 bg-white border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300
                  placeholder:text-gray-300 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 5 — Bank Details (invoice or toggle) */}
        {(isInvoice || showBank) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-[12px] font-bold text-gray-400  tracking-widest">
                Bank Details
              </h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {(
                [
                  ["Bank Name", accountBankName, setAccountBankName],
                  ["Account Number", accountNumber, setAccountNumber],
                  ["IFSC Code", accountIfsc, setAccountIfsc],
                  ["Account Holder", accountHolder, setAccountHolder],
                  ["PAN Card No", accountPan, setAccountPan],
                ] as const
              ).map(([label, val, setter]) => (
                <div key={label}>
                  <label className="text-[11px] font-semibold text-gray-400  tracking-wide mb-1.5 block">
                    {label}
                  </label>
                  <Input
                    value={val}
                    onChange={(v) => (setter as (v: string) => void)(v)}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isInvoice && !showBank && (
          <button
            onClick={() => setShowBank(true)}
            className="text-[12px] text-gray-400 hover:text-rose-500 transition-colors"
          >
            + Add bank details
          </button>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
