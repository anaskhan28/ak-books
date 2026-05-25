"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Settings,
  Search,
  GripVertical,
  Info,
  CalendarIcon,
  FileText,
} from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { cn, formatINR, generateId, getDocumentLabel } from "@/lib/utils";
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
import { getClients, getBranches } from "@/app/actions/clients";
import { getTemplates } from "@/app/actions/templates";
import { getNextDocumentNumber } from "@/app/actions/quotations";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { HSN_PRESETS, INDIAN_STATES } from "@/lib/constants";
import { alerts } from "@/lib/alerts";
import type { Client, ClientBranch, QuotationTemplate } from "@/app/db/schema";
import AddBranchModal from "./AddBranchModal";

// ── Types ─────────────────────────────────────────────────────────────────────

import type { DocumentMode } from "@/lib/types/document";

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
  status: string;
  notes: string;
  terms: string;
  placeOfSupply?: string | null;
  // account (invoice)
  accountBankName: string;
  accountNumber: string;
  accountIfsc: string;
  accountHolder: string;
  accountPan: string;
  showTotal: boolean;
  isComparative: boolean;
  // logistics
  vehicleNumber?: string;
  transporterName?: string;
  transporterId?: string;
  transportMode?: string;
  dispatchDate?: string;
  fromPlace?: string;
  toPlace?: string;
  transportDocNumber?: string;
  transportDocDate?: string;
  // credit notes
  reason?: string;
  invoiceId?: number | null;
}

interface DocumentFormProps {
  mode: DocumentMode;
  initialValues?: Partial<DocumentFormValues>;
  isEdit?: boolean;
  onSave: (values: DocumentFormValues, subtotal: number) => Promise<void>;
  backHref: string;
  backLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────


function emptyItem(): LineItem {
  return { id: generateId(), description: "", qty: 1, rate: 0, hsn: "", amount: 0 };
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
import { DatePicker } from "@/components/ui/date-picker";

const ZohoDatePicker = DatePicker;

// ── Main Component ────────────────────────────────────────────────────────────

export function DocumentForm({
  mode,
  initialValues,
  isEdit,
  onSave,
  backHref,
  backLabel,
}: DocumentFormProps) {
  const isInvoice = mode === "invoice" || mode === "credit_note";

  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [clientBranchOptions, setClientBranchOptions] = useState<ClientBranch[]>([]);
  const [saving, setSaving] = useState(false);
  const [addBranchModalOpen, setAddBranchModalOpen] = useState(false);

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
  const [status, setStatus] = useState(initialValues?.status ?? (isInvoice ? "unpaid" : "draft"));
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
  const [placeOfSupply, setPlaceOfSupply] = useState(initialValues?.placeOfSupply ?? "Maharashtra (27)");
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
  const [showTotal, setShowTotal] = useState(initialValues?.showTotal ?? true);
  const [isComparative, setIsComparative] = useState(initialValues?.isComparative ?? false);

  // Logistics states
  const [vehicleNumber, setVehicleNumber] = useState(initialValues?.vehicleNumber ?? "");
  const [transporterName, setTransporterName] = useState(initialValues?.transporterName ?? "");
  const [transporterId, setTransporterId] = useState(initialValues?.transporterId ?? "");
  const [transportMode, setTransportMode] = useState(initialValues?.transportMode ?? "road");
  const [dispatchDate, setDispatchDate] = useState(initialValues?.dispatchDate ?? "");
  const [fromPlace, setFromPlace] = useState(initialValues?.fromPlace ?? "Mumbai");
  const [toPlace, setToPlace] = useState(initialValues?.toPlace ?? "");
  const [transportDocNumber, setTransportDocNumber] = useState(initialValues?.transportDocNumber ?? "");
  const [transportDocDate, setTransportDocDate] = useState(initialValues?.transportDocDate ?? "");

  // Credit Notes states
  const [reason, setReason] = useState(initialValues?.reason ?? "");
  const [invoiceId, setInvoiceId] = useState<number | null>(initialValues?.invoiceId ?? null);

  const matchedClient = useMemo(() => {
    return clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase());
  }, [clientName, clients]);

  const selectedBranchId = useMemo(() => {
    if (!clientBranch) return "";
    const firstLine = clientBranch.split("\n")[0].trim().toLowerCase();
    const found = clientBranchOptions.find(
      (b) => b.branchName.toLowerCase() === firstLine
    );
    return found ? found.id.toString() : "";
  }, [clientBranch, clientBranchOptions]);

  const [showBank, setShowBank] = useState(isInvoice);

  useEffect(() => {
    getClients().then(setClients);
    getTemplates().then(setTemplates);
  }, []);

  const isFirstRender = useRef(true);

  // Automatically calculate 30 days after the invoice/quote date as due/expiry date
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialValues?.expiryDate) {
        return;
      }
    }

    if (date) {
      try {
        const parsed = parseISO(date);
        const thirtyDaysAfter = addDays(parsed, 30);
        setExpiryDate(format(thirtyDaysAfter, "yyyy-MM-dd"));
      } catch (err) {
        console.error("Error calculating due date:", err);
      }
    }
  }, [date, initialValues?.expiryDate]);

  // Load branches when client changes
  useEffect(() => {
    if (matchedClient) {
      getBranches(matchedClient.id).then(setClientBranchOptions);
    } else {
      setClientBranchOptions([]);
    }
  }, [matchedClient]);

  // Sync template defaults when template changes
  useEffect(() => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    // Fetch next number only if it's a new document or the template has changed
    const isInitialTemplate = templateId === initialValues?.templateId;
    const hasInitialNumber = !!initialValues?.docNumber;

    if (!hasInitialNumber || !isInitialTemplate) {
      getNextDocumentNumber(tpl.id, mode).then(setDocNumber);
    }

    const cfg = getTemplateConfig(tpl.name, tpl);
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
  const tplConfig = getTemplateConfig(activeTemplate?.name, activeTemplate);
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

  async function handleSave(forcedStatus?: string) {

    if (!clientName.trim()) {
      alerts.error("Validation Error", "Customer Name is required.");
      return;
    }
    if (!templateId) {
      alerts.error("Validation Error", "Please select a template.");
      return;
    }
    if (!subject.trim()) {
      alerts.error("Validation Error", "Subject is required.");
      return;
    }
    if (filledItems.length === 0) {
      alerts.error("Validation Error", "Please add at least one item with a description.");
      return;
    }

    setSaving(true);
    const clientId = clients.find((c) => c.name === clientName)?.id;
    const finalStatus = forcedStatus || status;
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
          status: finalStatus,
          notes,
          terms,
          placeOfSupply,
          accountBankName,
          accountNumber,
          accountIfsc,
          accountHolder,
          accountPan,
          showTotal,
          isComparative,
          vehicleNumber,
          transporterName,
          transporterId,
          transportMode,
          dispatchDate,
          fromPlace,
          toPlace,
          transportDocNumber,
          transportDocDate,
          reason,
          invoiceId,
        },
        subtotal,
      );
    } catch (error: any) {
      alerts.error("Save failed", error.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  const filledItems = useMemo(
    () => items.filter((i) => i.description || i.qty > 0 || i.rate > 0 || i.amount > 0),
    [items],
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
              {isEdit
                ? `Edit ${getDocumentLabel(mode)}`
                : `New ${getDocumentLabel(mode)}`}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {!isEdit ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(
                    mode === "invoice" ? "unpaid" : 
                    mode === "credit_note" ? "issued" : 
                    mode === "eway_bill" ? "active" : "draft"
                  )}
                  disabled={saving || !clientName.trim()}
                  className="px-3 md:px-4 py-2 bg-white border border-border text-foreground rounded-xl text-[13px] font-medium
                    hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  Draft
                </button>
                <button
                  onClick={() => handleSave(
                    mode === "invoice" ? "unpaid" : 
                    mode === "credit_note" ? "issued" : 
                    mode === "eway_bill" ? "active" : 
                    mode === "sales_order" ? "confirmed" : 
                    mode === "delivery_challan" ? "dispatched" : "sent"
                  )}
                  disabled={saving || !clientName.trim()}
                  className="px-4 md:px-6 py-2 bg-primary text-white rounded-xl text-[13px] font-medium
                    hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
                >
                  {["invoice", "sales_order", "delivery_challan", "eway_bill", "credit_note"].includes(mode) ? "Save" : "Send"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSave()}
                disabled={saving || !clientName.trim()}
                className="px-4 md:px-6 py-2 bg-primary text-white rounded-xl text-[13px] font-medium
                  hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            )}
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
            {matchedClient ? (
              <div className="space-y-2 w-full">
                <Select
                  value={selectedBranchId}
                  onValueChange={(val) => {
                    if (val === "__new__") {
                      setAddBranchModalOpen(true);
                    } else if (val) {
                      const branch = clientBranchOptions.find((b) => b.id.toString() === val);
                      if (branch) {
                        let branchText = branch.branchName;
                        if (branch.address) {
                          branchText += `\n${branch.address}`;
                        }
                        setClientBranch(branchText);
                      }
                    } else {
                      setClientBranch("");
                    }
                  }}
                >
                  <SelectTrigger className="w-full px-3 py-2 h-auto text-[14px] border-border rounded-xl bg-white font-medium">
                    <SelectValue placeholder="Select a saved branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientBranchOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.branchName}{b.address ? ` — ${b.address.replace(/\n/g, ", ")}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-primary font-semibold hover:text-primary">
                      + Add New Branch...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {clientBranch && (
                  <textarea
                    value={clientBranch}
                    onChange={(e) => setClientBranch(e.target.value)}
                    placeholder="Branch name & address for this document..."
                    rows={3}
                    className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                      placeholder:text-muted-foreground/30 transition-all min-h-[80px]"
                  />
                )}
              </div>
            ) : (
              <textarea
                value={clientBranch}
                onChange={(e) => setClientBranch(e.target.value)}
                placeholder="Enter branch name and address"
                rows={2}
                className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                  placeholder:text-muted-foreground/30 transition-all resize-none"
              />
            )}
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

          {isAKEnterprise && (
            <FieldRow label="Place of Supply">
              <Select
                value={placeOfSupply || "Maharashtra (27)"}
                onValueChange={(val) => setPlaceOfSupply(val)}
              >
                <SelectTrigger className="w-full px-3 py-2 h-auto text-[14px] border-border rounded-xl bg-white font-medium">
                  <SelectValue placeholder="Select Place of Supply" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          )}
        </section>

        {/* Details Section */}
        <section className="space-y-1">
          <FieldRow
            label={
              mode === "invoice" ? "Invoice#" :
              mode === "sales_order" ? "Order#" :
              mode === "delivery_challan" ? "Challan#" :
              mode === "eway_bill" ? "e-Way Bill#" :
              mode === "credit_note" ? "Credit Note#" : "Quote#"
            }
            required
            info="Automatic numbering is enabled"
          >
            <ZohoInput
              value={docNumber}
              onChange={setDocNumber}
              placeholder={
                mode === "invoice" ? "INV-000001" :
                mode === "sales_order" ? "SO-000001" :
                mode === "delivery_challan" ? "DC-000001" :
                mode === "eway_bill" ? "EWB-000001" :
                mode === "credit_note" ? "CN-000001" : "QT-000001"
              }
              icon={Settings}
            />
          </FieldRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4">
            <FieldRow
              label={
                mode === "invoice" ? "Invoice Date" :
                mode === "sales_order" ? "Order Date" :
                mode === "delivery_challan" ? "Challan Date" :
                mode === "eway_bill" ? "e-Way Bill Date" :
                mode === "credit_note" ? "Credit Note Date" : "Quote Date"
              }
              required
              className="border-0"
            >
              <ZohoDatePicker value={date} onChange={setDate} />
            </FieldRow>
            {["invoice", "quotation", "sales_order"].includes(mode) && (
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 py-3">
                <label className="text-[13px] text-gray-500 font-medium md:min-w-[100px] md:text-right">
                  {mode === "invoice" ? "Due Date" : mode === "sales_order" ? "Expected Delivery" : "Expiry Date"}
                </label>
                <ZohoDatePicker value={expiryDate} onChange={setExpiryDate} />
              </div>
            )}
          </div>

          <FieldRow label="Subject" required>
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={"Let your customer know what this " + getDocumentLabel(mode) + " is for"}
              rows={1}
              className="w-full px-3 py-2 text-[14px] text-foreground bg-white border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary
                placeholder:text-muted-foreground/40 resize-none transition-all"
            />
          </FieldRow>

          {/* Logistics Transport Fields */}
          {(mode === "delivery_challan" || mode === "eway_bill") && (
            <div className="border border-border rounded-xl p-4 bg-slate-50/50 space-y-2 mt-4">
              <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-2">Transport & Dispatch Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldRow label="Vehicle Number" className="border-0 py-1">
                  <ZohoInput value={vehicleNumber} onChange={setVehicleNumber} placeholder="MH-04-GP-1234" />
                </FieldRow>
                <FieldRow label="Dispatch Date" className="border-0 py-1">
                  <ZohoDatePicker value={dispatchDate} onChange={setDispatchDate} />
                </FieldRow>
                <FieldRow label="Transporter Name" className="border-0 py-1">
                  <ZohoInput value={transporterName} onChange={setTransporterName} placeholder="e.g. VRL Logistics" />
                </FieldRow>
                <FieldRow label="Transporter ID" className="border-0 py-1">
                  <ZohoInput value={transporterId} onChange={setTransporterId} placeholder="GSTIN or Transporter ID" />
                </FieldRow>
                <FieldRow label="Transport Doc No (LR)" className="border-0 py-1">
                  <ZohoInput value={transportDocNumber} onChange={setTransportDocNumber} placeholder="LR Number" />
                </FieldRow>
                <FieldRow label="Transport Mode" className="border-0 py-1">
                  <Select value={transportMode} onValueChange={setTransportMode}>
                    <SelectTrigger className="w-full px-3 py-2 h-auto text-[14px] border-border rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road">Road</SelectItem>
                      <SelectItem value="rail">Rail</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>
            </div>
          )}

          {/* Credit Notes Fields */}
          {mode === "credit_note" && (
            <div className="border border-border rounded-xl p-4 bg-slate-50/50 space-y-2 mt-4">
              <FieldRow label="Reason for Credit Note" className="border-0 py-1">
                <ZohoInput value={reason} onChange={setReason} placeholder="e.g. Sales Return, Rate Difference, Post-Sale Discount" />
              </FieldRow>
            </div>
          )}
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
                        <td className="p-0 border-r border-border min-w-[100px]">
                          <div className="flex flex-col">
                            <select
                              value={HSN_PRESETS.some(p => p.code === item.hsn) ? item.hsn : ""}
                              onChange={(e) => {
                                if (e.target.value) updateItem(item.id, "hsn", e.target.value);
                              }}
                              className="w-full px-2 py-1.5 text-[12px] text-primary font-medium bg-primary/5 border-b border-dashed border-primary/20 focus:outline-none cursor-pointer"
                            >
                              <option value="">— HSN —</option>
                              {HSN_PRESETS.map((p) => (
                                <option key={p.code} value={p.code}>
                                  {p.code} ({p.label})
                                </option>
                              ))}
                            </select>
                            <input
                              value={item.hsn}
                              onChange={(e) => updateItem(item.id, "hsn", e.target.value)}
                              placeholder="Manual"
                              className="w-full px-2 py-1.5 text-center text-[12px] text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/30"
                            />
                          </div>
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

              {showTotal && (
                <div className="flex items-center justify-between text-[16px] font-bold text-foreground pt-4 border-t border-border">
                  <span>Total (₹)</span>
                  <span className="text-foreground">{formatINR(subtotal)}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="show-total"
                  checked={showTotal}
                  onChange={(e) => setShowTotal(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="show-total" className="text-[13px] text-muted-foreground cursor-pointer select-none">
                  Show total amount on {isInvoice ? "invoice" : "quotation"}
                </label>
              </div>

              {!isInvoice && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is-comparative"
                    checked={isComparative}
                    onChange={(e) => setIsComparative(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                  />
                  <label htmlFor="is-comparative" className="text-[13px] text-amber-600 cursor-pointer select-none font-medium">
                    Comparative quote (exclude from totals)
                  </label>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer Notes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-8 border-t border-border">
          <div className="space-y-4">
            {isAKEnterprise && isInvoice && (
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
                <p className="text-[11px] text-muted-foreground/60">Displayed on the invoice</p>
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

      {addBranchModalOpen && matchedClient && (
        <AddBranchModal
          clientId={matchedClient.id}
          clientName={matchedClient.name}
          onClose={() => setAddBranchModalOpen(false)}
          onSuccess={(newBranch) => {
            setClientBranchOptions((prev) => [...prev, newBranch as any]);
            let branchText = newBranch.branchName;
            if (newBranch.address) {
              branchText += `\n${newBranch.address}`;
            }
            setClientBranch(branchText);
          }}
        />
      )}
    </div>
  );
}
