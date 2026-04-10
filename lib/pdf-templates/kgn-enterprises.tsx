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

const fmtNum = (n: number) =>
  n !== 0
    ? n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

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

export interface KGNPdfProps {
  type: "quotation" | "invoice";
  number?: string;
  date: string;
  clientName: string;
  clientBranch: string;
  subject: string;
  items: LineItem[];
  total: number;
  totalLabel?: string;
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

const EMPTY_ROWS = 15;
const COL_W = ["62%", "13%", "12%", "13%"] as const;
const BDR = "#222";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
    paddingBottom: 20,
  },
  headerImg: { width: "100%" },
  outerBox: {
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: BDR,
    marginTop: 20,
  },
  titleWrap: {
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    paddingVertical: 4,
  },
  titleText: {
    fontSize: 13,
    textAlign: "center",
    color: "#000",
    fontFamily: "Helvetica-Bold",
  },
  clientSection: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  clientName: { fontSize: 10, color: "#111" },
  clientBranch: { fontSize: 10, color: "#111", marginTop: 1 },
  dateText: { fontSize: 10, color: "#111" },
  subjectWrap: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  subjectLine: {
    fontSize: 10,
    color: "#111",
  },
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  th: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 3,
    color: "#111",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  thLast: { borderRightWidth: 0 },
  tRow: {
    flexDirection: "row",
    minHeight: 22,
    borderBottomWidth: 0.2,
    borderBottomColor: BDR,
  },
  td: {
    fontSize: 10,
    paddingVertical: 3,
    paddingHorizontal: 3,
    color: "#111",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  tdLast: { borderRightWidth: 0 },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BDR,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  totalCell: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 3,
    color: "#111",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  totalCellLast: { borderRightWidth: 0 },
  footerWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  termsLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  termText: { fontSize: 9, color: "#111", lineHeight: 1.5 },
  acctRow: { flexDirection: "row", marginBottom: 2 },
  acctLbl: { fontFamily: "Helvetica-Bold", fontSize: 9, width: 90 },
  acctVal: { fontSize: 9 },
  sigWrap: { alignItems: "flex-end", paddingRight: 4 },
  sigImg: { width: 90, height: 55, objectFit: "contain" },
});

function KGNDocument({
  type,
  date,
  clientName,
  number,
  clientBranch,
  subject,
  items,
  total,
  totalLabel,
  terms,
  accountInfo,
  headerImageUrl,
  signatureImageUrl,
}: KGNPdfProps) {
  const filled = items.filter(
    (i) => i.description || Math.abs(i.rate) > 0 || Math.abs(i.qty) > 0 || Math.abs(i.amount) > 0,
  );
  const emptyRows = Math.max(0, EMPTY_ROWS - filled.length);
  const displayDate = fmtDate(date);
  const title = type === "quotation" ? "Quotation" : "Invoice Bill";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        <View style={s.outerBox}>
          <View style={s.titleWrap}>
            <Text style={s.titleText}>{title}</Text>
          </View>

          <View style={s.clientSection}>
            <View style={s.infoRow}>
              <View>
                <Text style={s.clientName}>{clientName}</Text>
                {clientBranch ? (
                  <Text style={s.clientBranch}>{clientBranch}</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "column", gap: 2 }}>
                {number ? <Text style={s.clientName}>{number}</Text> : null}
                <Text style={s.dateText}>{displayDate}</Text>
              </View>
            </View>
          </View>

          <View style={s.subjectWrap}>
            <Text style={s.subjectLine}>Subject: {subject}</Text>
          </View>

          <View style={s.tHead}>
            <Text style={[s.th, { width: COL_W[0], textAlign: "left" }]}>
              DESCRIPTION
            </Text>
            <Text style={[s.th, { width: COL_W[1], textAlign: "center" }]}>
              Approx QTY
            </Text>
            <Text style={[s.th, { width: COL_W[2], textAlign: "center" }]}>
              Rate
            </Text>
            <Text
              style={[s.th, s.thLast, { width: COL_W[3], textAlign: "right" }]}
            >
              Amount
            </Text>
          </View>

          {filled.map((item, idx) => (
            <View key={idx} style={s.tRow} wrap={false}>
              <Text style={[s.td, { width: COL_W[0] }]}>
                {item.description}
              </Text>
              <Text style={[s.td, { width: COL_W[1], textAlign: "center" }]}>
                {Math.abs(item.qty) > 0 ? String(item.qty) : ""}
              </Text>
              <Text style={[s.td, { width: COL_W[2], textAlign: "center" }]}>
                {fmtNum(item.rate)}
              </Text>
              <Text
                style={[
                  s.td,
                  s.tdLast,
                  { width: COL_W[3], textAlign: "right" },
                ]}
              >
                {Math.abs(item.amount) > 0 ? fmtNum(item.amount) : ""}
              </Text>
            </View>
          ))}

          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`e${i}`} style={s.tRow}>
              <Text style={[s.td, { width: COL_W[0] }]}> </Text>
              <Text style={[s.td, { width: COL_W[1] }]}> </Text>
              <Text style={[s.td, { width: COL_W[2] }]}> </Text>
              <Text style={[s.td, s.tdLast, { width: COL_W[3] }]}> </Text>
            </View>
          ))}

          <View style={s.totalRow}>
            <Text style={[s.totalCell, { width: COL_W[0] }]}>
              {totalLabel ?? "Total"}
            </Text>
            <Text style={[s.totalCell, { width: COL_W[1] }]}> </Text>
            <Text
              style={[s.totalCell, { width: COL_W[2], textAlign: "center" }]}
            >
              Rs
            </Text>
            <Text
              style={[
                s.totalCell,
                s.totalCellLast,
                { width: COL_W[3], textAlign: "right" },
              ]}
            >
              {fmtINR(total)}
            </Text>
          </View>

          <View style={s.footerWrap}>
            <View>
              <Text style={s.termsLabel}>
                {type === "invoice" ? "Bank Details" : "Terms and Condition"}
              </Text>
              {type === "invoice" && accountInfo ? (
                <>
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
                </>
              ) : terms ? (
                <Text style={s.termText}>{terms}</Text>
              ) : null}
            </View>

            <View style={s.sigWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={signatureImageUrl} style={s.sigImg} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateKGNPdf(props: KGNPdfProps): Promise<Blob> {
  return pdf(<KGNDocument {...props} />).toBlob();
}
