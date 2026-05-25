import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { type LineItem, type DocumentMode } from "@/lib/types/document";
import { formatDateDMY } from "@/lib/utils";
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
  clientGstin?: string | null;
  placeOfSupply?: string | null;
  subject: string;
  items: LineItem[];
  subtotal: number;
  terms: string;
  showTotal?: boolean;
  accountInfo?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    pan: string;
  };
}

export async function generatePdfBlob({
  mode,
  templateName,
  dbTemplate,
  docNumber,
  filenamePrefix,
  date,
  clientName,
  clientBranch,
  clientGstin,
  placeOfSupply,
  subject,
  items,
  subtotal,
  terms,
  showTotal,
  accountInfo,
}: DocumentPdfData): Promise<Blob> {
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
  const displayDate = formatDateDMY(date);
  const displayDateSlash = formatDateDMY(date);

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
      showTotal: showTotal ?? true,
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
      showTotal: showTotal ?? true,
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
      showTotal: showTotal ?? true,
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
      showTotal: showTotal ?? true,
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
      showTotal: showTotal ?? true,
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
      clientGstin: mode === "invoice" ? (clientGstin || undefined) : undefined,
      subject,
      items,
      total: subtotal,
      showTotal: showTotal ?? true,
      notes: mode === "invoice" ? terms : undefined,
      terms: mode === "quotation" ? terms : undefined,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: mode === "quotation" ? hdr : undefined,
      signatureImageUrl: sig,
      companyGstin: "27BAPPK9432C1ZJ",
      placeOfSupply: placeOfSupply || undefined,
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
      showTotal: showTotal ?? true,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
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
      showTotal: showTotal ?? true,
      terms,
      accountInfo: mode === "invoice" ? finalAccountInfo : undefined,
      headerImageUrl: hdr,
      signatureImageUrl: sig,
      primaryColor: tplConfig.primaryColor,
      secondaryColor: tplConfig.secondaryColor,
      templateName: dbTemplate?.name || tplConfig.displayName,
    });
  }

  return blob;
}

export async function generateAndDownloadPdf(data: DocumentPdfData) {
  const blob = await generatePdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.filenamePrefix}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function generateAndDownloadMergedPdf(documents: DocumentPdfData[], filenamePrefix: string) {
  const { PDFDocument } = await import("pdf-lib");
  const mergedPdf = await PDFDocument.create();

  for (const docData of documents) {
    const blob = await generatePdfBlob(docData);
    const pdfBytes = await blob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfFile = await mergedPdf.save();
  const blob = new Blob([mergedPdfFile as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
