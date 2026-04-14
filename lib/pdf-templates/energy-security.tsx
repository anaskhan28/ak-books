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
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return d;
}

interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string;
  amount: number;
}

export interface EnergyPdfProps {
  type: "quotation" | "invoice";
  number?: string;
  date: string;
  clientName: string;
  clientBranch: string;
  subject: string;
  items: LineItem[];
  total: number;
  terms?: string;
  accountInfo?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    pan: string;
  };
  headerImageUrl: string;
  signatureImageUrl: string;
}

const EMPTY_ROWS = 6;
const BDR = "#333";
const COL_W = ["8%", "64%", "10%", "18%"] as const;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
    paddingBottom: 20,
  },
  headerImg: { width: "100%", height: "auto" },

  body: { paddingHorizontal: 40, paddingTop: 8 },

  // Date right-aligned
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  toBlock: { fontSize: 10, color: "#111", maxWidth: 110 },
  clientName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  dateText: { fontSize: 10, color: "#111" },

  // Dear Sir
  dear: { marginTop: 14, marginBottom: 10 },

  // Sub — centered, bold, underlined feel
  subWrap: { marginBottom: 12, alignItems: "center" },
  subText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textDecoration: "underline",
  },

  // Table
  tableWrap: {
    borderWidth: 1,
    borderColor: BDR,
  },
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    backgroundColor: "#f5f5f5",
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: "#111",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  thLast: { borderRightWidth: 0 },

  tRow: {
    flexDirection: "row",
    minHeight: 36,
  },
  td: {
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    color: "#111",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  tdLast: { borderRightWidth: 0 },

  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BDR,
  },
  totalCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: "#111",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  totalCellLast: { borderRightWidth: 0 },

  // Terms
  termsWrap: { marginTop: 10 },
  termsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 3,
  },
  termText: { fontSize: 9, color: "#333", lineHeight: 1.7 },

  // Bank details (invoice)
  acctRow: { flexDirection: "row", marginBottom: 2 },
  acctLbl: { fontFamily: "Helvetica-Bold", fontSize: 9, width: 110 },
  acctVal: { fontSize: 9, color: "#333" },

  // Footer sign image (full-width footer strip)
  signImg: { width: "100%", height: "auto", marginTop: 16 },
});

function EnergyDoc({
  type,
  number,
  date,
  clientName,
  clientBranch,
  subject,
  items,
  total,
  terms,
  accountInfo,
  headerImageUrl,
  signatureImageUrl,
}: EnergyPdfProps) {
  const filled = items.filter(
    (i) => i.description.trim() || Math.abs(i.qty) > 0 || Math.abs(i.rate) > 0 || Math.abs(i.amount) > 0,
  );
  const emptyRows = Math.max(0, EMPTY_ROWS - filled.length);
  const displayDate = fmtDate(date);
  const title = type === "quotation" ? "Shifting Quotation" : "Invoice Bill";
  const hAlign = ["center", "left", "center", "right"] as const;
  const headers = ["Sr No", "Description", "Qty", "Total Price"];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        <View style={s.body}>
          {/* To + Date row */}
          <View style={s.dateRow}>
            <View>
              <Text style={s.toBlock}>To,</Text>
              <Text style={s.clientName}>{clientName}</Text>
              {clientBranch ? (
                <Text style={s.toBlock}>{clientBranch}</Text>
              ) : null}
              {number ? (
                <Text style={{ fontSize: 9, color: "#111", marginTop: 4 }}>
                  Ref: {number}
                </Text>
              ) : null}
            </View>
            <Text style={s.dateText}>{displayDate}</Text>
          </View>

          {/* Dear Sir */}
          <View style={s.dear}>
            <Text style={{ fontSize: 10 }}>Dear Sir,</Text>
          </View>

          {/* Sub — centered */}
          <View style={s.subWrap}>
            <Text style={s.subText}>Sub: {subject || title}</Text>
          </View>

          {/* Table */}
          <View style={s.tableWrap}>
            {/* Header */}
            <View style={s.tHead}>
              {headers.map((h, i) => (
                <Text
                  key={h}
                  style={[
                    s.th,
                    i === 3 ? s.thLast : {},
                    { width: COL_W[i], textAlign: hAlign[i] },
                  ]}
                >
                  {h}
                </Text>
              ))}
            </View>

            {/* Filled rows */}
            {filled.map((item, idx) => (
              <View key={idx} style={s.tRow} wrap={false}>
                <Text style={[s.td, { width: COL_W[0], textAlign: "center" }]}>
                  {idx + 1}
                </Text>
                <Text style={[s.td, { width: COL_W[1] }]}>
                  {item.description}
                </Text>
                <Text style={[s.td, { width: COL_W[2], textAlign: "center" }]}>
                  {Math.abs(item.qty) > 0 ? String(item.qty) : ""}
                </Text>
                <Text
                  style={[
                    s.td,
                    s.tdLast,
                    { width: COL_W[3], textAlign: "right" },
                  ]}
                >
                  {Math.abs(item.amount) > 0 ? fmtINR(item.amount) : ""}
                </Text>
              </View>
            ))}

            {/* Empty rows */}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <View key={`e${i}`} style={s.tRow}>
                <Text style={[s.td, { width: COL_W[0] }]}> </Text>
                <Text style={[s.td, { width: COL_W[1] }]}> </Text>
                <Text style={[s.td, { width: COL_W[2] }]}> </Text>
                <Text style={[s.td, s.tdLast, { width: COL_W[3] }]}> </Text>
              </View>
            ))}
          </View>

          {/* Terms / Bank Details */}
          {type === "invoice" && accountInfo ? (
            <View style={s.termsWrap}>
              <Text style={s.termsLabel}>Bank Details:</Text>
              {(
                [
                  ["Bank Name:", accountInfo.bankName],
                  ["Account no:", accountInfo.accountNumber],
                  ["IFSC code:", accountInfo.ifsc],
                  ["Account holder:", accountInfo.accountHolder],
                  ["Pan Card no:", accountInfo.pan],
                ] as const
              ).map(([lbl, val]) => (
                <View key={lbl} style={s.acctRow}>
                  <Text style={s.acctLbl}>{lbl}</Text>
                  <Text style={s.acctVal}>{val}</Text>
                </View>
              ))}
            </View>
          ) : terms ? (
            <View style={s.termsWrap}>
              <Text style={s.termsLabel}>Terms & Condition-</Text>
              <Text style={s.termText}>{terms}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer signature strip — full width */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={signatureImageUrl} style={s.signImg} />
      </Page>
    </Document>
  );
}

export async function generateEnergyPdf(props: EnergyPdfProps): Promise<Blob> {
  return pdf(<EnergyDoc {...props} />).toBlob();
}
