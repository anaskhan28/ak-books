"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  X,
  Settings,
  Search,
  GripVertical,
  Info,
  CalendarIcon,
  ChevronDown,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getClients } from "@/app/actions/clients";
import { getTemplates } from "@/app/actions/templates";
import { getNextDocumentNumber } from "@/app/actions/quotations";
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

function FieldRow({
  label,
  required,
  children,
  className = "",
  info,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  info?: string;
}) {
  return (
    <div className={`flex flex-col md:grid md:grid-cols-[200px_1fr] items-start gap-1 md:gap-4 py-3 border-b border-gray-100 last:border-0 ${className}`}>
      <label className="flex items-center gap-1 mt-2 text-[13px] text-gray-500 font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
        {info && (
          <div className="group relative">
            <Info size={12} className="text-gray-300 cursor-help" />
            <div className="absolute left-0 md:left-full ml-0 md:ml-2 top-full md:top-0 scale-0 group-hover:scale-100 bg-gray-800 text-white text-[10px] px-2 py-1 rounded w-32 z-50 transition-all origin-top md:origin-left">
              {info}
            </div>
          </div>
        )}
      </label>
      <div className="flex items-center gap-2 w-full max-w-xl">
        {children}
      </div>
    </div>
  );
}

function ZohoInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  disabled,
  icon: Icon,
  onIconClick,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  icon?: any;
  onIconClick?: () => void;
}) {
  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
          focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
          placeholder:text-muted-foreground/40 disabled:bg-slate-50 disabled:text-muted-foreground/60 transition-all ${className} ${Icon ? "pr-10" : ""}`}
      />
      {Icon && (
        <button
          type="button"
          onClick={onIconClick}
          className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors border-l border-border"
        >
          <Icon size={14} />
        </button>
      )}
    </div>
  );
}

function ZohoDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal px-3 py-2 text-[14px] border-border rounded-xl h-auto hover:bg-transparent",
            !value && "text-muted-foreground/40"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {value ? format(parseISO(value), "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
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
    
    // Fetch next number only if it's a new document or the template has changed
    const isInitialTemplate = templateId === initialValues?.templateId;
    const hasInitialNumber = !!initialValues?.docNumber;

    if (!hasInitialNumber || !isInitialTemplate) {
      getNextDocumentNumber(tpl.id, isInvoice).then(setDocNumber);
    }

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
  }, [templateId, templates, isInvoice]);

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
    const clientId = clients.find((c) => c.name === clientName)?.id;
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
    <div className="min-h-screen bg-background pb-12">
      {/* ── Responsive Header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="p-1.5 bg-slate-50 rounded hidden sm:inline-flex">
              <FileText size={18} className="text-muted-foreground" />
            </span>
            <h1 className="text-[14px] md:text-[16px] font-semibold text-foreground">
              {isInvoice ? "New Invoice" : "New Quote"}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !clientName.trim()}
              className="px-4 md:px-6 py-2 bg-primary text-white rounded-xl text-[13px] font-medium
                hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <Link
              href={backHref}
              className="p-1.5 hover:bg-slate-50 rounded-full text-muted-foreground hover:text-destructive transition-all"
            >
              <X size={20} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12">
        {/* Customer Section */}
        <section className="space-y-1">
          <FieldRow label="Customer Name" required>
            <div className="flex-1 relative">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Select or add a customer"
                list="client-list"
                className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                  placeholder:text-muted-foreground/40 transition-all font-medium"
              />
              <datalist id="client-list">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <button className="p-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
              <Search size={14} />
            </button>
          </FieldRow>

          <FieldRow label="Client Branch">
            <textarea
              value={clientBranch}
              onChange={(e) => setClientBranch(e.target.value)}
              placeholder="Enter branch name or address"
              rows={1}
              className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                placeholder:text-muted-foreground/30 transition-all shadow-sm resize-none"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </FieldRow>

          <FieldRow label="Template" required>
            <Select 
               value={templateId?.toString() ?? ""} 
               onValueChange={(val) => setTemplateId(val ? Number(val) : null)}
            >
              <SelectTrigger className="w-full px-3 py-2 h-auto text-[14px] border-border rounded-xl bg-white">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </section>

        {/* Details Section */}
        <section className="space-y-1">
          <FieldRow 
            label={isInvoice ? "Invoice#" : "Quote#"} 
            required
            info="Automatic numbering is enabled"
          >
            <ZohoInput
              value={docNumber}
              onChange={setDocNumber}
              placeholder={isInvoice ? "INV-000001" : "QT-000001"}
              icon={Settings}
            />
          </FieldRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4">
             <FieldRow label={isInvoice ? "Invoice Date" : "Quote Date"} required className="border-0">
                <ZohoDatePicker value={date} onChange={setDate} />
             </FieldRow>
             <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 py-3">
                <label className="text-[13px] text-gray-500 font-medium md:min-w-[100px] md:text-right">
                  {isInvoice ? "Due Date" : "Expiry Date"}
                </label>
                <ZohoDatePicker value={expiryDate} onChange={setExpiryDate} />
             </div>
          </div>

          <FieldRow label="Subject">
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={isInvoice ? "Let your customer know what this Invoice is for" : "Let your customer know what this Quote is for"}
              rows={1}
              className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                placeholder:text-muted-foreground/40 resize-none transition-all"
            />
          </FieldRow>
        </section>

        {/* Item Table Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-gray-700">Item Table</h2>
            <button className="text-primary text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary/5 px-3 py-1 rounded-full transition-all">
               <span className="w-4 h-4 flex items-center justify-center border border-primary rounded-full text-[10px] pb-0.5">✓</span>
               <span className="hidden sm:inline">Bulk Actions</span>
            </button>
          </div>

          <div className="border border-border rounded overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-[12px] min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="w-10" />
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-widest text-[10px] w-[45%] border-r border-border">
                      Item Details
                    </th>
                    {isAKEnterprise && isInvoice && (
                      <th className="text-center px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-widest text-[10px] w-[12%] border-r border-border">
                        HSN Code
                      </th>
                    )}
                    <th className="text-center px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-widest text-[10px] w-[12%] border-r border-border">
                      Quantity
                    </th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-widest text-[10px] w-[12%] border-r border-border">
                      Rate
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-widest text-[10px] w-[15%]">
                      Amount
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-slate-50/50 transition-all duration-150"
                    >
                      <td className="text-center text-slate-300">
                        <GripVertical size={14} className="mx-auto" />
                      </td>
                      
                      <td className="p-0 border-r border-border">
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
                          className="w-full px-4 py-3 text-[14px] text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/30 resize-none overflow-hidden leading-relaxed"
                        />
                      </td>

                      {isAKEnterprise && isInvoice && (
                        <td className="p-0 border-r border-border">
                          <input
                            value={item.hsn}
                            onChange={(e) => updateItem(item.id, "hsn", e.target.value)}
                            className="w-full px-2 py-3 text-center text-[14px] text-foreground bg-transparent border-0 focus:outline-none"
                          />
                        </td>
                      )}

                      <td className="p-0 border-r border-border">
                        <input
                          type="number"
                          value={item.qty || ""}
                          onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                          className="w-full px-2 py-3 text-center text-[14px] text-foreground bg-transparent border-0 focus:outline-none"
                        />
                      </td>

                      <td className="p-0 border-r border-border">
                        <input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                          className="w-full px-2 py-3 text-right text-[14px] text-foreground bg-transparent border-0 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3 text-right text-[14px] text-foreground font-medium bg-slate-50/20">
                        {formatINR(item.amount)}
                      </td>

                      <td className="text-center px-1">
                        <button
                          onClick={() => removeRow(item.id)}
                          className="p-2 text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between py-6 gap-8">
              <div className="flex flex-col gap-2">
                <button
                  onClick={addRow}
                  className="flex items-center gap-2 px-4 py-2 text-[14px] text-primary font-semibold hover:bg-primary/5 rounded-xl border border-dashed border-primary/30 transition-all active:scale-95"
                >
                  <Plus size={16} /> Add New Row
                </button>
              </div>

             <div className="w-full md:w-[400px] bg-slate-50/50 p-6 rounded-lg border border-border space-y-4">
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                   <span>Sub Total</span>
                   <span className="text-foreground">{formatINR(subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between text-[16px] font-bold text-foreground pt-4 border-t border-border">
                   <span>Total (₹)</span>
                   <span className="text-primary">{formatINR(subtotal)}</span>
                </div>
             </div>
          </div>
        </section>

        {/* Footer Notes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-8 border-t border-border">
          <div className="space-y-4">
            {isAKEnterprise && (
              <div className="space-y-1.5">
                <label className="text-[13px] text-gray-600 font-medium">Customer Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                    placeholder:text-muted-foreground/30 transition-all shadow-sm"
                />
                <p className="text-[11px] text-muted-foreground/60">Displayed on the {isInvoice ? "invoice" : "quotation"}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
               <label className="text-[13px] text-gray-600 font-medium">Terms & Conditions</label>
               <textarea
                 value={terms}
                 onChange={(e) => setTerms(e.target.value)}
                 rows={3}
                 className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                   placeholder:text-muted-foreground/30 transition-all shadow-sm"
               />
            </div>
          </div>
        </section>

        {/* Bank Details section */}
        {(isInvoice || showBank) ? (
          <section className="pt-8 border-t border-border space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-muted uppercase tracking-widest">Bank Details</h2>
                {isInvoice && (
                  <button onClick={() => setShowBank(!showBank)} className="text-primary text-[12px] hover:underline">
                    {showBank ? "Hide" : "Show"}
                  </button>
                )}
             </div>
             
             {showBank && (
               <div className="grid grid-cols-1 gap-1 max-w-2xl">
                 {(
                   [
                     ["Bank Name", accountBankName, setAccountBankName],
                     ["Account Number", accountNumber, setAccountNumber],
                     ["IFSC Code", accountIfsc, setAccountIfsc],
                     ["Account Holder", accountHolder, setAccountHolder],
                     ["PAN Card No", accountPan, setAccountPan],
                   ] as const
                 ).map(([label, val, setter]) => (
                   <FieldRow key={label} label={label}>
                     <ZohoInput
                       value={val}
                       onChange={(v) => (setter as (v: string) => void)(v)}
                       placeholder={label}
                     />
                   </FieldRow>
                 ))}
               </div>
             )}
          </section>
        ) : (
          <div className="pt-8 flex justify-center">
             <button
               onClick={() => setShowBank(true)}
               className="px-6 py-2 border border-border text-muted-foreground text-[14px] font-medium rounded-xl hover:bg-slate-50 transition-all"
             >
               + Add Bank Details
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
