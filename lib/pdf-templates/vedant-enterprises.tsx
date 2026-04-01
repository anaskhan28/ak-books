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
  n > 0
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

export interface VEPdfProps {
  type: "quotation" | "invoice";
  number?: string;
  date: string;
  clientName: string;
  clientBranch: string;
  subject: string;
  items: LineItem[];
  total: number;
  totalLabel?: string;
  currencyLabel?: string;
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

const EMPTY_ROWS = 9;
const COL_W = ["4%", "65%", "8%", "10%", "13%"] as const;
const BDR = "#333";

const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#222",
    paddingBottom: 20,
  },
  headerImg: { width: "100%" },

  // The single outer border wrapping everything from title → total row
  outerBox: {
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: BDR,
    marginTop: 12,
  },

  // Title row — has a bottom border separating it from tagline
  titleWrap: {
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    paddingVertical: 6,
  },
  titleText: {
    fontSize: 16,
    textAlign: "center",
    color: "#000",
  },

  // Tagline row
  tagline: {
    fontSize: 9,
    textAlign: "center",
    color: "#000",
    fontStyle: "normal",
    fontWeight: 7,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: BDR,
  },

  // Client info section — bottom border before column headers
  clientSection: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  toLabel: {
    fontSize: 10,
    color: "#222",
    marginBottom: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  clientName: { fontSize: 11, fontWeight: 700, color: "#222" },
  clientBranch: { fontSize: 10, color: "#222", marginTop: 1 },
  dateText: { fontSize: 10, color: "#222" },
  refText: { fontSize: 9, color: BDR, marginTop: 2 },

  // Subject row
  subjectWrap: {
    paddingVertical: 6,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  subjectLine: {
    fontSize: 10,
    color: "#222",
    textDecoration: "underline",
    fontWeight: 700,
  },

  // Table header row
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  th: {
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: "#222",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  thLast: { borderRightWidth: 0 },

  tRow: {
    flexDirection: "row",
    minHeight: 30,
  },
  td: {
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    color: "#222",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  tdLast: { borderRightWidth: 0 },

  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    borderTopColor: BDR,
  },
  totalCell: {
    fontSize: 10,
    fontWeight: 700,
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: "#222",
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  totalCellLast: { borderRightWidth: 0 },

  // Bottom section outside the box

  bottomWrapContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomWrap: { paddingTop: 8, paddingLeft: 5 },
  termsLabel: {
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

  sigWrap: {
    alignItems: "flex-end",
    marginBottom: 40,
    paddingRight: 5,
  },
  sigImg: { width: 90, height: 50, objectFit: "contain" },
  sigLabel: { fontSize: 8, color: "#444", textAlign: "center", marginTop: 2 },
  sigCompany: {
    fontSize: 9,
    fontWeight: 700,
    color: "#222",
    textAlign: "center",
  },
});

function VEDocument({
  type,
  number,
  date,
  clientName,
  clientBranch,
  subject,
  items,
  total,
  totalLabel,
  currencyLabel,
  terms,
  accountInfo,
  headerImageUrl,
  signatureImageUrl,
}: VEPdfProps) {
  const filled = items.filter(
    (i) => i.description || i.rate > 0 || i.qty > 0 || i.amount > 0,
  );
  const emptyRows = Math.max(0, EMPTY_ROWS - filled.length);
  const title = type === "quotation" ? "Quotation" : "Invoice Bill";
  const displayDate = fmtDate(date);
  const headers = [
    "Sr. No",
    "Description",
    "Qty",
    "Unit Basic",
    "Total Amount",
  ];
  const hAlign = ["center", "left", "center", "right", "right"] as const;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        {/* Single outer border box containing everything */}
        <View style={s.outerBox}>
          {/* Title — inside the box, with bottom border */}
          <View style={s.titleWrap}>
            <Text style={s.titleText}>{title}</Text>
          </View>

          {/* Tagline */}
          {type === "quotation" ? (
            <Text style={s.tagline}>
              We thank you for inviting us to Quote against your
              enquiry/requirement.
            </Text>
          ) : null}

          {/* Client info section */}
          <View style={s.clientSection}>
            <Text style={s.toLabel}>To,</Text>
            <View style={s.infoRow}>
              <View>
                <Text style={s.clientName}>{clientName}</Text>
                {clientBranch ? (
                  <Text style={s.clientBranch}>{clientBranch}</Text>
                ) : null}
              </View>
              <View>
                {number ? <Text style={s.refText}>Ref: {number}</Text> : null}
                <Text style={s.dateText}>Date: {displayDate}</Text>
              </View>
            </View>
          </View>

          {/* Subject */}
          {subject ? (
            <View style={s.subjectWrap}>
              <Text style={s.subjectLine}>Sub: {subject}</Text>
            </View>
          ) : null}

          {/* Column header row */}
          <View style={s.tHead}>
            {headers.map((h, i) => (
              <Text
                key={h}
                style={[
                  s.th,
                  i === 4 ? s.thLast : {},
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
                {item.qty > 0 ? String(item.qty) : ""}
              </Text>
              <Text style={[s.td, { width: COL_W[3], textAlign: "right" }]}>
                {fmtNum(item.rate)}
              </Text>
              <Text
                style={[
                  s.td,
                  s.tdLast,
                  { width: COL_W[4], textAlign: "right" },
                ]}
              >
                {item.amount > 0 ? fmtNum(item.amount) : ""}
              </Text>
            </View>
          ))}

          {/* Empty rows */}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`e${i}`} style={s.tRow}>
              <Text style={[s.td, { width: COL_W[0] }]}> </Text>
              <Text style={[s.td, { width: COL_W[1] }]}> </Text>
              <Text style={[s.td, { width: COL_W[2] }]}> </Text>
              <Text style={[s.td, { width: COL_W[3] }]}> </Text>
              <Text style={[s.td, s.tdLast, { width: COL_W[4] }]}> </Text>
            </View>
          ))}

          {/* Total row */}
          <View style={s.totalRow}>
            <Text style={[s.totalCell, { width: COL_W[0] }]}> </Text>
            <Text style={[s.totalCell, { width: COL_W[1], fontWeight: 700 }]}>
              {totalLabel ?? "Total amount"}
            </Text>
            <Text style={[s.totalCell, { width: COL_W[2] }]}> </Text>
            <Text
              style={[s.totalCell, { width: COL_W[3], textAlign: "right" }]}
            >
              {currencyLabel ?? "Rs."}
            </Text>
            <Text
              style={[
                s.totalCell,
                s.totalCellLast,
                { width: COL_W[4], textAlign: "right" },
              ]}
            >
              {fmtINR(total)}
            </Text>
          </View>
          <View style={s.bottomWrapContainer}>
            <View style={s.bottomWrap}>
              <Text style={s.termsLabel}>
                {type === "invoice" ? "Bank Details:" : "Terms & Conditions:-"}
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

            {/* Signature */}
            <View style={s.sigWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={signatureImageUrl} style={s.sigImg} />
              <Text style={s.sigCompany}>For Vedant Enterprises</Text>
              <Text style={s.sigLabel}>Proprietor</Text>
            </View>
          </View>
        </View>
        {/* End outer box */}

        {/* Bottom: Terms / Bank Details — outside the box */}
      </Page>
    </Document>
  );
}

export async function generateVEPdf(props: VEPdfProps): Promise<Blob> {
  return pdf(<VEDocument {...props} />).toBlob();
}
