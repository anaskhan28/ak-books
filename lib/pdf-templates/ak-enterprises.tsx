import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const fmtINR = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function fmtDate(d: string): string {
  // returns DD/MM/YYYY
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return d;
}

// Convert number to words (Indian system)
function numberToWords(n: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function below1000(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 ? " " + ones[num % 10] : "") +
        " "
      );
    return ones[Math.floor(num / 100)] + " Hundred " + below1000(num % 100);
  }

  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  let result = "";
  if (crore) result += below1000(crore) + "Crore ";
  if (lakh) result += below1000(lakh) + "Lakh ";
  if (thousand) result += below1000(thousand) + "Thousand ";
  result += below1000(rest);
  return result.trim();
}

function amountInWords(total: number): string {
  const rupees = Math.floor(total);
  const paise = Math.round((total - rupees) * 100);
  let words = "Indian Rupee " + numberToWords(rupees);
  if (paise > 0) words += " and " + numberToWords(paise) + " Paise";
  words += " Only";
  return words;
}

interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string; // HSN code for AK invoice
  amount: number;
}

export interface AKEnterprisePdfProps {
  type: "quotation" | "invoice";
  number?: string;
  date: string;
  clientName: string;
  clientBranch: string;
  clientCity?: string;
  clientState?: string;
  clientGstin?: string;
  subject: string;
  items: LineItem[];
  total: number;
  gstRate?: number; // default 18
  notes?: string;
  terms?: string;
  accountInfo?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    pan: string;
  };
  headerImageUrl?: string; // only for quotation
  signatureImageUrl: string;
  // AK company info
  companyGstin?: string;
  placeOfSupply?: string;
}

const BDR = "#aaa";
const DARK = "#222";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingBottom: 20,
  },
  headerImg: { width: "100%", height: "auto" },

  // ── QUOTATION STYLES ──────────────────────────────────────────────────────

  // Company info box (quotation) — top section inside outer border
  qtCompanyBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BDR,
    padding: 8,
    marginHorizontal: 20,
    marginTop: 20,
  },
  qtCompanyLeft: { flex: 1 },
  qtCompanyName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  qtCompanyDetail: { fontSize: 8, color: "#444", lineHeight: 1.4 },
  qtDocTitle: { fontSize: 18, color: "#444", textAlign: "right" },

  // Meta row: Quote#, Date, Place of Supply
  metaRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BDR,
    borderTopWidth: 0,
    marginHorizontal: 20,
  },
  metaCell: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  metaCellLast: { borderRightWidth: 0 },
  metaLabel: { fontSize: 8, color: "#555" },
  metaValue: { fontFamily: "Helvetica-Bold", fontSize: 9 },

  // Address row: Quotation To / Consignee To
  addrRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BDR,
    borderTopWidth: 0,
    marginHorizontal: 20,
  },
  addrCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  addrCellLast: { borderRightWidth: 0 },
  addrHeader: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 4 },
  addrLine: { fontSize: 8, color: "#333", lineHeight: 1.4, maxWidth: 110 },

  // Subject row
  subjectRow: {
    borderWidth: 1,
    borderColor: BDR,
    borderTopWidth: 0,
    marginHorizontal: 20,
    padding: 6,
  },
  subjectLabel: { fontSize: 8, color: "#555", marginBottom: 2 },
  subjectValue: { fontSize: 9 },

  // Table
  tableWrap: {
    borderWidth: 1,
    borderColor: BDR,
    borderTopWidth: 0,
    marginHorizontal: 20,
  },
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    backgroundColor: "#f0f0f0",
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  thLast: { borderRightWidth: 0 },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BDR,
    minHeight: 30,
  },
  td: {
    fontSize: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: BDR,
    lineHeight: 1.4,
  },
  tdLast: { borderRightWidth: 0 },

  // Bottom section: notes/terms left, total/signature right
  bottomRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BDR,
    borderTopWidth: 0,
    marginHorizontal: 20,
    minHeight: 80,
  },
  bottomLeft: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  bottomRight: {
    width: "35%",
    padding: 6,
  },
  notesLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 3 },
  notesText: { fontSize: 8, color: "#333", lineHeight: 1.5 },
  termsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginTop: 6,
    marginBottom: 2,
  },

  // Total box (quotation)
  totalBoxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: BDR,
    paddingBottom: 3,
    marginBottom: 3,
  },
  totalBoxLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalBoxValue: { fontFamily: "Helvetica-Bold", fontSize: 9 },

  // Signature block (quotation)
  sigBlock: { marginTop: 8, alignItems: "center" },
  sigImg: { height: 100, objectFit: "contain" },
  sigName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
  sigTitle: { fontSize: 8, color: "#555", textAlign: "center" },

  // ── INVOICE STYLES ────────────────────────────────────────────────────────

  // Invoice: no header image — company info as text block
  invPage: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },

  invCompanyBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BDR,

    padding: 8,
    marginBottom: 0,
  },
  invDocTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // Invoice table has more columns: Sr No / Item / HSN / Qty / Rate / CGST% / CGSTAmt / SGST% / SGSTAmt / Amount
  invTh: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: BDR,
    textAlign: "center",
  },
  invTd: {
    fontSize: 7,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: BDR,
    lineHeight: 1.4,
  },

  // Invoice bottom
  invBottomRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BDR,
    borderTopWidth: 0,
    minHeight: 60,
  },
  invBottomLeft: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  invBottomRight: {
    width: "32%",
    padding: 6,
  },
  invTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  invTotalLabel: { fontSize: 8, color: "#333" },
  invTotalValue: { fontSize: 8, textAlign: "right" },
  invGrandLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  invGrandValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "right",
  },
  inWordsText: {
    fontFamily: "Helvetica-BoldOblique",
    fontSize: 8,
    marginTop: 4,
    color: "#222",
  },
  bankLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, marginTop: 4 },
  bankRow: { flexDirection: "row", marginTop: 1 },
  bankKey: { fontFamily: "Helvetica-Bold", fontSize: 8, width: 90 },
  bankVal: { fontSize: 8 },
});

// ── QUOTATION DOCUMENT ────────────────────────────────────────────────────────

function AKQuotationDoc({
  number,
  date,
  clientName,
  clientBranch,
  clientCity,
  clientState,
  subject,
  items,
  total,
  notes,
  terms,
  placeOfSupply,
  headerImageUrl,
  signatureImageUrl,
}: AKEnterprisePdfProps) {
  const filled = items.filter(
    (i) => i.description.trim() || i.qty > 0 || i.rate > 0 || i.amount > 0,
  );
  const displayDate = fmtDate(date);

  // Quotation col widths: Sr No / Description / Qty / Unit Basic / Amount
  const cols = ["6%", "58%", "8%", "14%", "14%"] as const;
  const headers = [
    "Sr\nNo",
    "Item & Description",
    "Qty",
    "Unit Basic",
    "Amount",
  ];
  const hAlign = ["center", "left", "center", "right", "right"] as const;

  const clientLines = [
    clientName,
    clientBranch,
    clientCity,
    clientState ? `${clientState}` : "",
    "India",
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header image */}
        {headerImageUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={headerImageUrl} style={s.headerImg} />
        ) : null}

        {/* Company info + doc title */}
        <View style={s.qtCompanyBox}>
          <View style={s.qtCompanyLeft}>
            <Text style={s.qtCompanyName}>AK Enterprises</Text>
            <Text style={s.qtCompanyDetail}>9892493707</Text>
            <Text style={s.qtCompanyDetail}>
              akenterprises.dealers@gmail.com
            </Text>
            <Text style={s.qtCompanyDetail}>https://akenterprisegroup.in</Text>
          </View>
          <Text style={s.qtDocTitle}>Quotation</Text>
        </View>

        {/* Quote# / Date / Place of Supply */}
        <View style={s.metaRow}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Quote</Text>
            <Text style={s.metaValue}>: {number || "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaValue}>: {displayDate}</Text>
          </View>
          <View style={[s.metaCell, s.metaCellLast]}>
            <Text style={s.metaLabel}>Place Of Supply</Text>
            <Text style={s.metaValue}>
              : {placeOfSupply || "Maharashtra (27)"}
            </Text>
          </View>
        </View>

        {/* Quotation To / Consignee To */}
        <View style={s.addrRow}>
          <View style={s.addrCell}>
            <Text style={s.addrHeader}>Quotation To</Text>
            {clientLines.map((l, i) => (
              <Text
                key={i}
                style={[
                  s.addrLine,
                  i === 0 ? { fontFamily: "Helvetica-Bold" } : {},
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
          <View style={[s.addrCell, s.addrCellLast]}>
            <Text style={s.addrHeader}>Consignee To</Text>
            {clientLines.map((l, i) => (
              <Text
                key={i}
                style={[
                  s.addrLine,
                  i === 0 ? { fontFamily: "Helvetica-Bold" } : {},
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View style={s.subjectRow}>
          <Text style={s.subjectLabel}>Subject :</Text>
          <Text style={s.subjectValue}>{subject || "Shifting Quotation"}</Text>
        </View>

        {/* Table */}
        <View style={s.tableWrap}>
          <View style={s.tHead}>
            {headers.map((h, i) => (
              <Text
                key={h}
                style={[
                  s.th,
                  i === 4 ? s.thLast : {},
                  { width: cols[i], textAlign: hAlign[i] },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>
          {filled.map((item, idx) => (
            <View key={idx} style={s.tRow} wrap={false}>
              <Text style={[s.td, { width: cols[0], textAlign: "center" }]}>
                {idx + 1}
              </Text>
              <Text style={[s.td, { width: cols[1] }]}>{item.description}</Text>
              <Text style={[s.td, { width: cols[2], textAlign: "center" }]}>
                {Math.abs(item.qty) > 0 ? item.qty.toFixed(2) : ""}
              </Text>
              <Text style={[s.td, { width: cols[3], textAlign: "right" }]}>
                {Math.abs(item.rate) > 0 ? fmtINR(item.rate) : ""}
              </Text>
              <Text
                style={[s.td, s.tdLast, { width: cols[4], textAlign: "right" }]}
              >
                {Math.abs(item.amount) > 0 ? fmtINR(item.amount) : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Bottom: Notes + Terms left | Total + Signature right */}
        <View style={s.bottomRow}>
          <View style={s.bottomLeft}>
            {notes ? (
              <>
                <Text style={s.notesLabel}>Notes</Text>
                <Text style={s.notesText}>{notes}</Text>
              </>
            ) : null}
            {terms ? (
              <>
                <Text style={s.termsLabel}>Terms & Conditions</Text>
                <Text style={s.notesText}>{terms}</Text>
              </>
            ) : null}
          </View>
          <View style={s.bottomRight}>
            <View style={s.totalBoxRow}>
              <Text style={s.totalBoxLabel}>Total</Text>
              <Text style={s.totalBoxValue}>{`\u20B9${fmtINR(total)}`}</Text>
            </View>
            <View style={s.sigBlock}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={signatureImageUrl} style={s.sigImg} />
              <Text style={s.sigName}>For A.K. ENTERPRISES</Text>
              <Text style={s.sigTitle}>Proprietor</Text>
              <Text style={[s.sigTitle, { marginTop: 4 }]}>
                Authorized Signature
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ── INVOICE DOCUMENT ──────────────────────────────────────────────────────────

function AKInvoiceDoc({
  number,
  date,
  clientName,
  clientBranch,
  clientCity,
  clientState,
  clientGstin,
  subject,
  items,
  total,
  gstRate = 18,
  notes,
  accountInfo,
  placeOfSupply,
  companyGstin,
  signatureImageUrl,
}: AKEnterprisePdfProps) {
  const filled = items.filter(
    (i) => i.description.trim() || i.qty > 0 || i.rate > 0 || i.amount > 0,
  );
  const displayDate = fmtDate(date);
  const halfGst = gstRate / 2; // 9% each for CGST + SGST
  const taxableAmount = filled.reduce((s, i) => s + i.amount, 0);
  const cgstTotal = taxableAmount * (halfGst / 100);
  const grandTotal = taxableAmount + cgstTotal * 2;

  const clientLines = [
    clientName,
    clientBranch,
    clientCity,
    clientState,
    "India",
    clientGstin ? `GSTIN ${clientGstin}` : "",
  ].filter(Boolean);

  // Invoice cols: Sr / Description / HSN / Qty / Rate / CGST% / CGSTAmt / SGST% / SGSTAmt / Amount
  const cols = [
    "4%",
    "36%",
    "8%",
    "6%",
    "9%",
    "4%",
    "8%",
    "4%",
    "8%",
    "13%",
  ] as const;

  return (
    <Document>
      <Page size="A4" style={s.invPage}>
        {/* No header image for invoice — company info as text */}
        <View style={s.invCompanyBox}>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 5,
            }}
          >
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              AK Enterprises
            </Text>
            {companyGstin ? (
              <Text style={{ fontSize: 8, color: "#444" }}>
                GSTIN {companyGstin}
              </Text>
            ) : null}
            <Text style={{ fontSize: 8, color: "#444" }}>9892493707</Text>
            <Text style={{ fontSize: 8, color: "#444" }}>
              akenterprises.dealers@gmail.com
            </Text>
            <Text style={{ fontSize: 8, color: "#444" }}>
              https://akenterprisegroup.in
            </Text>
            <Text style={{ fontSize: 8, color: "#444" }}>
              Shop no 13, Mumbra - Panvel Hwy, near Daighar Police Station,
            </Text>
            <Text style={{ fontSize: 8, color: "#444" }}>
              Shilphata, Thane, Maharashtra 421204
            </Text>
          </View>
          <Text style={s.invDocTitle}>TAX INVOICE</Text>
        </View>

        {/* Invoice# / Date / Place of Supply */}
        <View style={[s.metaRow, { marginHorizontal: 0, borderTopWidth: 0 }]}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Invoice#</Text>
            <Text style={s.metaValue}>: {number || "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Invoice Date</Text>
            <Text style={s.metaValue}>: {displayDate}</Text>
          </View>
          <View style={[s.metaCell, s.metaCellLast]}>
            <Text style={s.metaLabel}>Place Of Supply</Text>
            <Text style={s.metaValue}>
              : {placeOfSupply || "Maharashtra (27)"}
            </Text>
          </View>
        </View>

        {/* Bill To / Consignee To */}
        <View style={[s.addrRow, { marginHorizontal: 0, borderTopWidth: 0 }]}>
          <View style={s.addrCell}>
            <Text style={s.addrHeader}>Bill To</Text>
            {clientLines.map((l, i) => (
              <Text
                key={i}
                style={[
                  s.addrLine,
                  i === 0 ? { fontFamily: "Helvetica-Bold" } : {},
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
          <View style={[s.addrCell, s.addrCellLast]}>
            <Text style={s.addrHeader}>Consignee To</Text>
            {clientLines.map((l, i) => (
              <Text
                key={i}
                style={[
                  s.addrLine,
                  i === 0 ? { fontFamily: "Helvetica-Bold" } : {},
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View
          style={[s.subjectRow, { marginHorizontal: 0, borderTopWidth: 0 }]}
        >
          <Text style={s.subjectLabel}>Subject :</Text>
          <Text style={s.subjectValue}>{subject || "Shifting Invoice"}</Text>
        </View>

        {/* Invoice Table */}
        <View style={[s.tableWrap, { marginHorizontal: 0, borderTopWidth: 0 }]}>
          {/* Two-row header */}
          <View style={[s.tHead, { flexDirection: "row" }]}>
            <Text style={[s.invTh, { width: cols[0] }]}>Sr{"\n"}No</Text>
            <Text style={[s.invTh, { width: cols[1], textAlign: "left" }]}>
              Item & Description
            </Text>
            <Text style={[s.invTh, { width: cols[2] }]}>HSN{"\n"}Code</Text>
            <Text style={[s.invTh, { width: cols[3] }]}>Qty</Text>
            <Text style={[s.invTh, { width: cols[4] }]}>Rate</Text>
            <Text style={[s.invTh, { width: cols[5] }]}>%</Text>
            <Text style={[s.invTh, { width: cols[6] }]}>Amt</Text>
            <Text style={[s.invTh, { width: cols[7] }]}>%</Text>
            <Text style={[s.invTh, { width: cols[8] }]}>Amt</Text>
            <Text style={[s.invTh, s.thLast, { width: cols[9] }]}>Amount</Text>
          </View>
          {/* CGST / SGST sub-header */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: BDR,
              backgroundColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                width: `${parseFloat(cols[0]) + parseFloat(cols[1]) + parseFloat(cols[2]) + parseFloat(cols[3]) + parseFloat(cols[4])}%`,
              }}
            />
            <View
              style={{
                width: `${parseFloat(cols[5]) + parseFloat(cols[6])}%`,
                borderLeftWidth: 1,
                borderLeftColor: BDR,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  paddingVertical: 2,
                }}
              >
                CGST
              </Text>
            </View>
            <View
              style={{
                width: `${parseFloat(cols[7]) + parseFloat(cols[8])}%`,
                borderLeftWidth: 1,
                borderLeftColor: BDR,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  paddingVertical: 2,
                }}
              >
                SGST
              </Text>
            </View>
            <View
              style={{
                width: cols[9],
                borderLeftWidth: 1,
                borderLeftColor: BDR,
              }}
            />
          </View>

          {filled.map((item, idx) => {
            const taxable = item.amount;
            const cgst = taxable * (halfGst / 100);
            const sgst = cgst;
            return (
              <View key={idx} style={s.tRow} wrap={false}>
                <Text
                  style={[s.invTd, { width: cols[0], textAlign: "center" }]}
                >
                  {idx + 1}
                </Text>
                <Text style={[s.invTd, { width: cols[1] }]}>
                  {item.description}
                </Text>
                <Text
                  style={[s.invTd, { width: cols[2], textAlign: "center" }]}
                >
                  {item.taxed || ""}
                </Text>
                <Text
                  style={[s.invTd, { width: cols[3], textAlign: "center" }]}
                >
                  {Math.abs(item.qty) > 0 ? item.qty.toFixed(2) : ""}
                </Text>
                <Text style={[s.invTd, { width: cols[4], textAlign: "right" }]}>
                  {Math.abs(item.rate) > 0 ? fmtINR(item.rate) : ""}
                </Text>
                <Text
                  style={[s.invTd, { width: cols[5], textAlign: "center" }]}
                >
                  {halfGst}%
                </Text>
                <Text style={[s.invTd, { width: cols[6], textAlign: "right" }]}>
                  {fmtINR(cgst)}
                </Text>
                <Text
                  style={[s.invTd, { width: cols[7], textAlign: "center" }]}
                >
                  {halfGst}%
                </Text>
                <Text style={[s.invTd, { width: cols[8], textAlign: "right" }]}>
                  {fmtINR(sgst)}
                </Text>
                <Text
                  style={[
                    s.invTd,
                    s.tdLast,
                    { width: cols[9], textAlign: "right" },
                  ]}
                >
                  {Math.abs(taxable) > 0 ? fmtINR(taxable) : ""}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bottom: left (words + notes + bank) | right (totals + signature) */}
        <View style={[s.invBottomRow, { marginHorizontal: 0 }]}>
          <View style={s.invBottomLeft}>
            <Text style={s.notesLabel}>Total In Words</Text>
            <Text style={s.inWordsText}>{amountInWords(grandTotal)}</Text>

            {notes ? (
              <>
                <Text style={[s.notesLabel, { marginTop: 6 }]}>Notes</Text>
                <Text style={s.notesText}>{notes}</Text>
              </>
            ) : null}

            {accountInfo ? (
              <View
                style={{ display: "flex", flexDirection: "column", gap: 5 }}
              >
                <Text style={s.bankLabel}>
                  Bank Name: {accountInfo.bankName}
                </Text>
                <Text style={[s.notesText, { fontFamily: "Helvetica-Bold" }]}>
                  Account No : {accountInfo.accountNumber}
                </Text>
                <Text style={[s.notesText, { fontFamily: "Helvetica-Bold" }]}>
                  IFSC Code: {accountInfo.ifsc}
                </Text>
                <Text style={[s.notesText, { fontFamily: "Helvetica-Bold" }]}>
                  Account Holder : {accountInfo.accountHolder}
                </Text>
                <Text style={[s.notesText, { fontFamily: "Helvetica-Bold" }]}>
                  Pan Card No : {accountInfo.pan}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={s.invBottomRight}>
            <View style={s.invTotalRow}>
              <Text style={s.invTotalLabel}>Total Taxable Amount</Text>
              <Text style={s.invTotalValue}>{fmtINR(taxableAmount)}</Text>
            </View>
            <View
              style={[
                s.invTotalRow,
                { borderTopWidth: 0.5, borderTopColor: BDR, paddingTop: 2 },
              ]}
            >
              <Text style={s.invGrandLabel}>Total</Text>
              <Text
                style={s.invGrandValue}
              >{`\u20B9${fmtINR(grandTotal)}`}</Text>
            </View>

            {/* Signature */}
            <View style={[s.sigBlock, { marginTop: 12 }]}>
              <Text style={{ fontSize: 8, color: "#444" }}>Atique Khan</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={signatureImageUrl} style={s.sigImg} />
              <Text style={s.sigName}>For A.K. ENTERPRISES</Text>
              <Text style={s.sigTitle}>Proprietor</Text>
              <Text style={[s.sigTitle, { marginTop: 4 }]}>
                Authorized Signature
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

export async function generateAKEnterprisePdf(
  props: AKEnterprisePdfProps,
): Promise<Blob> {
  const doc =
    props.type === "invoice" ? (
      <AKInvoiceDoc {...props} />
    ) : (
      <AKQuotationDoc {...props} />
    );
  return pdf(doc).toBlob();
}
