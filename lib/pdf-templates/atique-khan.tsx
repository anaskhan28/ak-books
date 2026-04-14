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
  `Rs.${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string;
  amount: number;
}

export interface ATKPdfProps {
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

const EMPTY_ROWS = 15;
const COL_W = ["55%", "10%", "15%", "20%"] as const;
const COL_ALIGN = ["left", "center", "right", "right"] as const;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#222",
    paddingBottom: 20,
  },
  headerImg: { width: "100%" },

  titleWrap: { paddingHorizontal: 40, paddingTop: 8, marginBottom: 6 },
  titleRule: { borderBottomWidth: 1, borderBottomColor: "#333" },
  titleText: {
    fontSize: 20,
    textAlign: "center",
    fontFamily: "Times-Roman",
    fontStyle: "italic",
    paddingVertical: 4,
  },
  titleRuleBot: { borderTopWidth: 1, borderTopColor: "#333" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginTop: 15,
    marginBottom: 1,
  },
  clientName: { fontSize: 11, color: "#222" },
  clientBranch: { fontSize: 11, color: "#222", maxWidth: 110 },
  dateText: { fontSize: 11, color: "#222" },

  subjectLine: {
    paddingHorizontal: 40,
    paddingTop: 8,
    paddingBottom: 10,
    fontSize: 11,
    color: "#222",
  },

  tableWrap: { paddingHorizontal: 40 },

  tHead: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  th: {
    fontSize: 10,
    fontWeight: 700,
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: "#222",
    borderRightWidth: 0.5,
    borderRightColor: "#333",
  },
  thFirst: { borderLeftWidth: 1, borderLeftColor: "#333" },
  thLast: { borderRightWidth: 1, borderRightColor: "#333" },

  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.2,
    borderBottomColor: "#999",
    minHeight: 20,
  },
  td: {
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    color: "#222",
    borderRightWidth: 0.2,
    borderRightColor: "#999",
  },
  tdFirst: { borderLeftWidth: 1, borderLeftColor: "#333" },
  tdLast: { borderRightWidth: 1, borderRightColor: "#333" },

  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  totalCell: {
    fontSize: 10,
    fontWeight: 700,
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: "#222",
    borderRightWidth: 0.2,
    borderRightColor: "#999",
  },
  totalFirst: { borderLeftWidth: 1, borderLeftColor: "#333" },
  totalLast: { borderRightWidth: 1, borderRightColor: "#333" },

  bottomWrap: {
    paddingHorizontal: 40,
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftCol: { flex: 1, maxWidth: "65%", paddingRight: 10 },
  rightCol: { alignItems: "flex-end" },

  bankLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#222",
    marginBottom: 3,
    textDecoration: "underline",
  },
  termText: { fontSize: 9, color: "#444", lineHeight: 1.7 },

  acctRow: { flexDirection: "row", marginBottom: 2 },
  acctLbl: { fontWeight: 700, fontSize: 9, color: "#444", width: 100 },
  acctVal: { fontSize: 9, color: "#444" },

  sigImg: { width: 80, height: 45, marginTop: 8, objectFit: "contain" },
});

function fmtDate(d: string): string {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return d;
}

function ATKDocument({
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
}: ATKPdfProps) {
  const filled = items.filter(
    (i) => i.description || Math.abs(i.rate) > 0 || Math.abs(i.qty) > 0 || Math.abs(i.amount) > 0,
  );
  const emptyRows = Math.max(0, EMPTY_ROWS - filled.length);
  const title = type === "quotation" ? "Quotation" : "Invoice Bill";
  const displayDate = fmtDate(date);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        {/* Centered title with rules */}
        <View style={s.titleWrap}>
          <View style={s.titleRule} />
          <Text style={s.titleText}>{title}</Text>
          <View style={s.titleRuleBot} />
        </View>

        {/* Client info + Date */}
        <View style={s.infoRow}>
          <View>
            <Text style={s.clientName}>{clientName}</Text>
            {clientBranch ? (
              <Text style={s.clientBranch}>{clientBranch}</Text>
            ) : null}
          </View>
          <Text style={s.dateText}>{displayDate}</Text>
        </View>

        {/* Quotation/Invoice number */}
        {number ? (
          <Text
            style={{
              fontSize: 9,
              color: "#666",
              paddingHorizontal: 40,
              marginTop: 2,
            }}
          >
            Ref: {number}
          </Text>
        ) : null}

        {/* Subject */}
        {subject ? <Text style={s.subjectLine}>Subject: {subject}</Text> : null}

        {/* Table */}
        <View style={s.tableWrap}>
          <View style={s.tHead}>
            {["DESCRIPTION", "QTY", "Per Rate", "Amount"].map((h, i) => (
              <Text
                key={h}
                style={[
                  s.th,
                  i === 0 ? s.thFirst : {},
                  i === 3 ? s.thLast : {},
                  { width: COL_W[i], textAlign: COL_ALIGN[i] },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>

          {filled.map((item, idx) => (
            <View key={idx} style={s.tRow} wrap={false}>
              <Text style={[s.td, s.tdFirst, { width: COL_W[0] }]}>
                {item.description}
              </Text>
              <Text style={[s.td, { width: COL_W[1], textAlign: "center" }]}>
                {Math.abs(item.qty) > 0 ? String(item.qty) : ""}
              </Text>
              <Text style={[s.td, { width: COL_W[2], textAlign: "right" }]}>
                {fmtNum(item.rate)}
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

          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`e${i}`} style={[s.tRow, { minHeight: 18 }]}>
              <Text style={[s.td, s.tdFirst, { width: COL_W[0] }]}> </Text>
              <Text style={[s.td, { width: COL_W[1] }]}> </Text>
              <Text style={[s.td, { width: COL_W[2] }]}> </Text>
              <Text style={[s.td, s.tdLast, { width: COL_W[3] }]}> </Text>
            </View>
          ))}

          {/* Total row */}
          <View style={s.totalRow}>
            <Text style={[s.totalCell, s.totalFirst, { width: COL_W[0] }]}>
              Total
            </Text>
            <Text style={[s.totalCell, { width: COL_W[1] }]}> </Text>
            <Text style={[s.totalCell, { width: COL_W[2] }]}> </Text>
            <Text
              style={[
                s.totalCell,
                s.totalLast,
                { width: COL_W[3], textAlign: "right" },
              ]}
            >
              {fmtINR(total)}
            </Text>
          </View>
        </View>

        {/* Bottom: Bank Details / Terms + Signature */}
        <View style={s.bottomWrap}>
          <View style={s.leftCol}>
            <Text style={s.bankLabel}>
              {type === "invoice" ? " Bank Details:" : " Terms & Condition:"}
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
          <View style={s.rightCol}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={signatureImageUrl} style={s.sigImg} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateATKPdf(props: ATKPdfProps): Promise<Blob> {
  return pdf(<ATKDocument {...props} />).toBlob();
}
