import { useState, useRef } from "react";
import type { LineItem, DocumentMode } from "@/lib/types/document";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";

export function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

interface UseDocumentEditorOptions {
  mode: DocumentMode;
  templateName: string | undefined;
  initialNumber: string;
  initialDate: string;
  initialClientName: string;
  initialClientBranch: string;
  initialSubject: string;
  initialNotes: string;
  initialItems: LineItem[];
  initialAccount: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    pan: string;
  };
  template?: import("@/app/db/schema").QuotationTemplate | null;
}

const EMPTY_ROWS = 10;
const MADHU_EMPTY_ROWS = 1;

export function useDocumentEditor({
  mode,
  templateName,
  initialNumber,
  initialDate,
  initialClientName,
  initialClientBranch,
  initialSubject,
  initialNotes,
  initialItems,
  initialAccount,
  template,
}: UseDocumentEditorOptions) {
  const tplConfig = getTemplateConfig(templateName, template);
  const isATK = tplConfig.generator === "atk";
  const isVE = tplConfig.generator === "vedant";
  const isKGN = tplConfig.generator === "kgn";
  const isMADHU = tplConfig.generator === "madhu";
  const isENERGY = tplConfig.generator === "energy";
  const isVIJAY = tplConfig.generator === "vijay";
  const isAKE = tplConfig.generator === "ak-enterprises";

  const tableRef = useRef<HTMLTableElement>(null);

  const [docNumber, setDocNumber] = useState(initialNumber);
  const [date, setDate] = useState(initialDate);
  const [clientName, setClientName] = useState(initialClientName);
  const [clientBranch, setClientBranch] = useState(initialClientBranch);
  const [subject, setSubject] = useState(initialSubject);
  const [terms, setTerms] = useState(initialNotes);

  const [accountBankName, setAccountBankName] = useState(
    initialAccount.bankName,
  );
  const [accountNumber, setAccountNumber] = useState(
    initialAccount.accountNumber,
  );
  const [accountIfsc, setAccountIfsc] = useState(initialAccount.ifsc);
  const [accountHolder, setAccountHolder] = useState(
    initialAccount.accountHolder,
  );
  const [accountPan, setAccountPan] = useState(initialAccount.pan);

  const emptyRowCount = isMADHU ? MADHU_EMPTY_ROWS : EMPTY_ROWS;
  const padded: LineItem[] = [
    ...initialItems,
    ...Array.from(
      { length: Math.max(0, emptyRowCount - initialItems.length) },
      () => ({
        description: "",
        rate: 0,
        qty: 0,
        taxed: "",
        amount: 0,
      }),
    ),
  ];

  const [items, setItems] = useState<LineItem[]>(padded);

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      if (field === "description" || field === "taxed") {
        (item as Record<string, string | number>)[field] = value;
      } else if (field === "amount") {
        item.amount = Number(value) || 0;
      } else {
        const num = Number(value) || 0;
        if (field === "rate") item.rate = num;
        if (field === "qty") item.qty = num;
        item.amount = item.qty * item.rate;
      }
      updated[idx] = item;
      return updated;
    });
  }

  function handleKeyDown(
    e: React.KeyboardEvent,
    rowIdx: number,
    colIdx: number,
  ) {
    const lastCol =
      isATK || isVE || isKGN || isENERGY || isAKE
        ? 3
        : isMADHU || isVIJAY
          ? 0
          : 4;
    if (e.key === "Tab" && !e.shiftKey && colIdx === lastCol) {
      e.preventDefault();
      if (rowIdx === items.length - 1) {
        setItems((prev) => [
          ...prev,
          { description: "", rate: 0, qty: 0, taxed: "", amount: 0 },
        ]);
      }
      setTimeout(() => focusCell(rowIdx + 1, 0), 30);
    }
    if (e.key === "Enter" && colIdx !== 0) {
      e.preventDefault();
      if (rowIdx < items.length - 1) focusCell(rowIdx + 1, colIdx);
      else {
        setItems((prev) => [
          ...prev,
          { description: "", rate: 0, qty: 0, taxed: "", amount: 0 },
        ]);
        setTimeout(() => focusCell(rowIdx + 1, colIdx), 30);
      }
    }
  }

  function focusCell(row: number, col: number) {
    if (!tableRef.current) return;
    const tbody = tableRef.current.querySelector("tbody");
    if (!tbody) return;
    const tr = tbody.children[row] as HTMLTableRowElement | undefined;
    if (!tr) return;
    const inputs = tr.querySelectorAll("input, textarea");
    const el = inputs[col] as HTMLElement | undefined;
    el?.focus();
  }

  const filledItems = items.filter(
    (i) => i.description || i.rate > 0 || i.qty > 0 || i.amount > 0,
  );
  const subtotal = items.reduce((s, i) => s + i.amount, 0);

  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  const displayDateSlash = new Date(date + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );

  // ── PDF download ──────────────────────────────────────────────────────────
  async function handleDownloadPDF(
    docNumberOverride: string,
    filenamePrefix: string,
  ) {
    const origin = window.location.origin;
    const hdr = `${origin}${tplConfig.headerImage}`;
    const sig = `${origin}${tplConfig.signatureImage}`;
    const acct = {
      bankName: accountBankName,
      accountNumber,
      ifsc: accountIfsc,
      accountHolder,
      pan: accountPan,
    };
    const printItems = filledItems;

    let blob: Blob;

    if (tplConfig.generator === "vedant") {
      const { toDataUrl } = await import("@/lib/utils");
      const [hdrB64, sigB64] = await Promise.all([
        toDataUrl(hdr),
        toDataUrl(sig),
      ]);
      const { generateVEPdf } =
        await import("@/lib/pdf-templates/vedant-enterprises");
      blob = await generateVEPdf({
        type: mode,
        number: docNumberOverride,
        date,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdrB64,
        signatureImageUrl: sigB64,
      });
    } else if (tplConfig.generator === "kgn") {
      const { toDataUrl } = await import("@/lib/utils");
      const [hdrB64, sigB64] = await Promise.all([
        toDataUrl(hdr),
        toDataUrl(sig),
      ]);
      const { generateKGNPdf } =
        await import("@/lib/pdf-templates/kgn-enterprises");
      blob = await generateKGNPdf({
        type: mode,
        number: docNumberOverride,
        date,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdrB64,
        signatureImageUrl: sigB64,
      });
    } else if (tplConfig.generator === "atk") {
      const { generateATKPdf } =
        await import("@/lib/pdf-templates/atique-khan");
      blob = await generateATKPdf({
        type: mode,
        number: docNumberOverride,
        date,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdr,
        signatureImageUrl: sig,
      });
    } else if (tplConfig.generator === "madhu") {
      const { generateMadhuNeilPdf } =
        await import("@/lib/pdf-templates/madhu-neil");
      blob = await generateMadhuNeilPdf({
        type: mode,
        number: docNumberOverride,
        date: displayDateSlash,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdr,
        signatureImageUrl: sig,
      });
    } else if (tplConfig.generator === "energy") {
      const { generateEnergyPdf } =
        await import("@/lib/pdf-templates/energy-security");
      blob = await generateEnergyPdf({
        type: mode,
        number: docNumberOverride,
        date,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdr,
        signatureImageUrl: sig,
      });
    } else if (tplConfig.generator === "ak-enterprises") {
      const { generateAKEnterprisePdf } =
        await import("@/lib/pdf-templates/ak-enterprises");
      blob = await generateAKEnterprisePdf({
        type: mode,
        number: docNumberOverride,
        date,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        notes: "Looking forward for your business.",
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: mode === "quotation" ? hdr : undefined,
        signatureImageUrl: sig,
        companyGstin: "27BAPPK9432C1ZJ",
        placeOfSupply: "Maharashtra (27)",
      });
    } else if (tplConfig.generator === "vijay") {
      const { generateVijayPdf } =
        await import("@/lib/pdf-templates/vijay-enterprises");
      blob = await generateVijayPdf({
        type: mode,
        number: docNumberOverride,
        date,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        total: subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdr,
        signatureImageUrl: sig,
      });
    } else {
      const { generateAKMPdf } =
        await import("@/lib/pdf-templates/anas-khan-merchant");
      blob = await generateAKMPdf({
        type: mode,
        number: docNumberOverride,
        date: displayDate,
        clientName,
        clientBranch,
        subject,
        items: printItems,
        subtotal,
        terms,
        accountInfo: mode === "invoice" ? acct : undefined,
        headerImageUrl: hdr,
        signatureImageUrl: sig,
        primaryColor: tplConfig.primaryColor,
        secondaryColor: tplConfig.secondaryColor,
        templateName: template?.name || tplConfig.displayName,
      });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "w-full px-2 py-2 bg-transparent text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300";

  return {
    // template flags
    tplConfig,
    isATK,
    isVE,
    isKGN,
    isMADHU,
    // doc number
    docNumber,
    setDocNumber,
    // fields
    date,
    setDate,
    clientName,
    setClientName,
    clientBranch,
    setClientBranch,
    subject,
    setSubject,
    terms,
    setTerms,
    // account
    accountBankName,
    setAccountBankName,
    accountNumber,
    setAccountNumber,
    accountIfsc,
    setAccountIfsc,
    accountHolder,
    setAccountHolder,
    accountPan,
    setAccountPan,
    // items
    items,
    setItems,
    filledItems,
    subtotal,
    updateItem,
    handleKeyDown,
    tableRef,
    // pdf
    handleDownloadPDF,
    // helpers
    inputCls,
    formatINR,
  };
}
