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

const RED = "#c0392b";

const fmtNum = (n: number) =>
  n > 0
    ? n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

const fmtINR = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;

interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string;
  amount: number;
}

export interface AKMPdfProps {
  type: "quotation" | "invoice";
  number: string;
  date: string;
  clientName: string;
  clientBranch: string;
  subject: string;
  items: LineItem[];
  subtotal: number;
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

const EMPTY_TABLE_ROWS = 15;
const COL_W = ["65%", "11%", "6%", "6%", "12%"] as const;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
    paddingBottom: 20,
  },
  headerImg: { width: "100%" },

  dateRowContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 4,
    gap: 6,
  },
  dateRow: {
    textAlign: "right",
    paddingRight: 40,
    fontSize: 11,
    color: "#444",
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 40,
    paddingTop: 10,
    gap: 10,
  },
  badge: {
    backgroundColor: RED,
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeNum: {
    backgroundColor: RED,
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  clientSection: { paddingHorizontal: 40, paddingTop: 6 },
  clientName: { fontSize: 10, fontWeight: 700, color: "#111", marginBottom: 3 },
  clientBranch: { fontSize: 10, color: "#555", marginBottom: 6 },
  subjectLine: { fontSize: 10, color: "#333", marginBottom: 12, marginTop: 8 },
  subjectVal: { fontWeight: 700, color: "#222" },

  tableWrap: { paddingHorizontal: 40 },
  tHead: {
    flexDirection: "row",
    backgroundColor: RED,
  },
  th: {
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#a93226",
  },
  thFirst: { borderLeftWidth: 1, borderLeftColor: "#333" },
  thLast: { borderRightWidth: 1, borderRightColor: "#333" },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.2,
    borderBottomColor: "#333",
    minHeight: 22,
  },
  td: {
    fontSize: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  tdFirst: { borderLeftWidth: 1, borderLeftColor: "#333" },
  tdLast: { borderRightWidth: 1, borderRightColor: "#333" },

  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 0.2,
    borderTopColor: "#222",
    paddingVertical: 6,
    marginHorizontal: 40,
  },
  subtotalLbl: { fontSize: 11, fontWeight: 700, color: "#555" },
  subtotalVal: { fontSize: 11, fontWeight: 700, color: "#111" },

  bottom: {
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingTop: 6,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftCol: { flex: 1, maxWidth: "58%", paddingRight: 10 },
  rightCol: { alignItems: "flex-end" },

  sectionBadge: {
    backgroundColor: RED,
    color: "#fff",
    fontSize: 8,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  termsText: { fontSize: 9, color: "#555", lineHeight: 1.7 },

  acctRow: { flexDirection: "row", marginBottom: 2 },
  acctLbl: { fontWeight: 700, fontSize: 9, color: "#555", width: 95 },
  acctVal: { fontSize: 9, color: "#444" },

  totalBar: { flexDirection: "row", backgroundColor: RED },
  totalLbl: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  totalVal: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    paddingHorizontal: 14,
    paddingVertical: 6,
    textAlign: "right",
  },
  sigImg: { width: 80, height: 80, marginTop: 4, objectFit: "cover" },
});

function AKMDocument({
  type,
  number,
  date,
  clientName,
  clientBranch,
  subject,
  items,
  subtotal,
  terms,
  accountInfo,
  headerImageUrl,
  signatureImageUrl,
}: AKMPdfProps) {
  const filled = items.filter(
    (i) => i.description || i.rate > 0 || i.qty > 0 || i.amount > 0,
  );
  const emptyRows = Math.max(0, EMPTY_TABLE_ROWS - filled.length);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        {/* Date */}
        <View style={s.dateRowContainer}>
          <Text style={s.badgeNum}>{number}</Text>
          <Text style={s.dateRow}>{date}</Text>
        </View>
        {/* Badge row */}
        <View style={s.badgeRow}>
          <Text style={s.badge}>
            {type === "quotation" ? "Invoice" : "Invoice"}
          </Text>
        </View>

        {/* Client info */}
        <View style={s.clientSection}>
          <Text style={s.clientName}>{clientName}</Text>
          {clientBranch ? (
            <Text style={s.clientBranch}>{clientBranch}</Text>
          ) : null}
          {subject ? (
            <Text style={s.subjectLine}>
              Subject: <Text style={s.subjectVal}>{subject}</Text>
            </Text>
          ) : null}
        </View>

        {/* Items table */}
        <View style={s.tableWrap}>
          <View style={s.tHead}>
            {["DESCRIPTION", "PER UNIT", "QTY", "TAX", "AMOUNT"].map((h, i) => (
              <Text
                key={h}
                style={[
                  s.th,
                  i === 0 ? s.thFirst : {},
                  i === 4 ? s.thLast : {},
                  {
                    width: COL_W[i],
                    textAlign: (
                      ["left", "right", "center", "center", "right"] as const
                    )[i],
                  },
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
              <Text style={[s.td, { width: COL_W[1], textAlign: "right" }]}>
                {fmtNum(item.rate)}
              </Text>
              <Text style={[s.td, { width: COL_W[2], textAlign: "center" }]}>
                {item.qty > 0 ? String(item.qty) : ""}
              </Text>
              <Text style={[s.td, { width: COL_W[3], textAlign: "center" }]}>
                {item.taxed}
              </Text>
              <Text
                style={[
                  s.td,
                  s.tdLast,
                  { width: COL_W[4], textAlign: "right", fontWeight: 700 },
                ]}
              >
                {item.amount > 0 ? fmtNum(item.amount) : ""}
              </Text>
            </View>
          ))}

          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`e${i}`} style={[s.tRow, { minHeight: 20 }]}>
              <Text style={[s.td, s.tdFirst, { width: COL_W[0] }]}> </Text>
              <Text style={[s.td, { width: COL_W[1] }]}> </Text>
              <Text style={[s.td, { width: COL_W[2] }]}> </Text>
              <Text style={[s.td, { width: COL_W[3] }]}> </Text>
              <Text style={[s.td, s.tdLast, { width: COL_W[4] }]}> </Text>
            </View>
          ))}
        </View>

        {/* Subtotal */}
        <View style={s.subtotalRow}>
          <Text style={s.subtotalLbl}>Subtotal</Text>
          <Text style={s.subtotalVal}>{fmtNum(subtotal)}</Text>
        </View>

        {/* Bottom section */}
        <View style={s.bottom}>
          <View style={s.leftCol}>
            {type === "quotation" && terms ? (
              <>
                <Text style={s.sectionBadge}>Terms &amp; Condition</Text>
                <Text style={s.termsText}>{terms}</Text>
              </>
            ) : type === "invoice" && accountInfo ? (
              <>
                <Text style={s.sectionBadge}>Account Info</Text>
                {[
                  ["Bank Name:", accountInfo.bankName],
                  ["Account no:", accountInfo.accountNumber],
                  ["IFSC code:", accountInfo.ifsc],
                  ["Account holder:", accountInfo.accountHolder],
                  ["Pan Card no:", accountInfo.pan],
                ].map(([lbl, val]) => (
                  <View key={lbl} style={s.acctRow}>
                    <Text style={s.acctLbl}>{lbl}</Text>
                    <Text style={s.acctVal}>{val}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>

          <View style={s.rightCol}>
            <View style={s.totalBar}>
              <Text style={s.totalLbl}>TOTAL</Text>
              <Text style={s.totalVal}>{fmtINR(subtotal)}</Text>
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={signatureImageUrl} style={s.sigImg} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateAKMPdf(props: AKMPdfProps): Promise<Blob> {
  return pdf(<AKMDocument {...props} />).toBlob();
}
