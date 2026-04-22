import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { type LineItem, type DocumentMode } from "@/lib/types/document";

import type { QuotationTemplate } from "@/app/db/schema";

export interface DocumentPdfData {
  mode: DocumentMode;
  templateName?: string | null;
  dbTemplate?: QuotationTemplate | null;
  docNumber: string;
  filenamePrefix: string;
  date: string;
  clientName: string;
  clientBranch: string;
  subject: string;
  items: LineItem[];
  subtotal: number;
  terms: string;
  accountInfo?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    pan: string;
  };
}

export async function generateAndDownloadPdf({
  mode,
  templateName,
  dbTemplate,
  docNumber,
  filenamePrefix,
  date,
  clientName,
  clientBranch,
  subject,
  items,
  subtotal,
  terms,
  accountInfo,
}: DocumentPdfData) {
  const tplConfig = getTemplateConfig(templateName || undefined, dbTemplate);
  const finalAccountInfo = {
    bankName: accountInfo?.bankName || tplConfig.bank.bankName,
    accountNumber: accountInfo?.accountNumber || tplConfig.bank.accountNumber,
    ifsc: accountInfo?.ifsc || tplConfig.bank.ifsc,
    accountHolder: accountInfo?.accountHolder || tplConfig.bank.accountHolder,
    pan: accountInfo?.pan || tplConfig.bank.pan,
  };
  const origin = window.location.origin;
  const hdr = tplConfig.headerImage.startsWith("http")
    ? tplConfig.headerImage
    : `${origin}${tplConfig.headerImage}`;
  const sig = tplConfig.signatureImage.startsWith("http")
    ? tplConfig.signatureImage
    : `${origin}${tplConfig.signatureImage}`;
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short", year: "2-digit" }
  );
  const displayDateSlash = new Date(date + "T00:00:00").toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  let blob: Blob;

  if (tplConfig.generator === "vedant") {
    const { toDataUrl } = await import("@/lib/utils");
    const [hdrB64, sigB64] = await Promise.all([
      toDataUrl(hdr),
      toDataUrl(sig),
    ]);
    const { generateVEPdf } = await import("@/lib/pdf-templates/vedant-enterprises");
    blob = await generateVEPdf({
      type: mode,
      number: docNumber,
      date,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: hdrB64,
      signatureImageUrl: sigB64,
    });
  } else if (tplConfig.generator === "kgn") {
    const { toDataUrl } = await import("@/lib/utils");
    const [hdrB64, sigB64] = await Promise.all([
      toDataUrl(hdr),
      toDataUrl(sig),
    ]);
    const { generateKGNPdf } = await import("@/lib/pdf-templates/kgn-enterprises");
    blob = await generateKGNPdf({
      type: mode,
      number: docNumber,
      date,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: hdrB64,
      signatureImageUrl: sigB64,
    });
  } else if (tplConfig.generator === "atk") {
    const { generateATKPdf } = await import("@/lib/pdf-templates/atique-khan");
    blob = await generateATKPdf({
      type: mode,
      number: docNumber,
      date,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: hdr,
      signatureImageUrl: sig,
    });
  } else if (tplConfig.generator === "madhu") {
    const { generateMadhuNeilPdf } = await import("@/lib/pdf-templates/madhu-neil");
    blob = await generateMadhuNeilPdf({
      type: mode,
      number: docNumber,
      date: displayDateSlash,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: hdr,
      signatureImageUrl: sig,
    });
  } else if (tplConfig.generator === "energy") {
    const { generateEnergyPdf } = await import("@/lib/pdf-templates/energy-security");
    blob = await generateEnergyPdf({
      type: mode,
      number: docNumber,
      date,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: hdr,
      signatureImageUrl: sig,
    });
  } else if (tplConfig.generator === "ak-enterprises") {
    const { generateAKEnterprisePdf } = await import("@/lib/pdf-templates/ak-enterprises");
    blob = await generateAKEnterprisePdf({
      type: mode,
      number: docNumber,
      date,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      notes: "Looking forward for your business.",
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: mode === "quotation" ? hdr : undefined,
      signatureImageUrl: sig,
      companyGstin: "27BAPPK9432C1ZJ",
      placeOfSupply: "Maharashtra (27)",
    });
  } else if (tplConfig.generator === "vijay") {
    const { generateVijayPdf } = await import("@/lib/pdf-templates/vijay-enterprises");
    blob = await generateVijayPdf({
      type: mode,
      number: docNumber,
      date,
      clientName,
      clientBranch,
      subject,
      items,
      total: subtotal,
      terms,
      accountInfo: mode === "invoice" ? accountInfo : undefined,
      headerImageUrl: hdr,
      signatureImageUrl: sig,
    });
  } else {
    const { generateAKMPdf } = await import("@/lib/pdf-templates/anas-khan-merchant");
    blob = await generateAKMPdf({
      type: mode,
      number: docNumber,
      date: displayDate,
      clientName,
      clientBranch,
      subject,
      items,
      subtotal,
      terms,
      accountInfo: mode === "invoice" ? accountInfo : undefined,
      headerImageUrl: hdr,
      signatureImageUrl: sig,
      primaryColor: tplConfig.primaryColor,
      secondaryColor: tplConfig.secondaryColor,
      templateName: dbTemplate?.name || tplConfig.displayName,
    });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
