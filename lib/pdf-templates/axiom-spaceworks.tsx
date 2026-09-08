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
  `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function fmtDate(d: string): string {
  if (!d) return "";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const m2 = d.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (m2) return `${m2[1]}/${m2[2]}/${m2[3]}`;
  return d;
}

interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string;
  amount: number;
}

export interface AxiomPdfProps {
  type: string;
  number?: string;
  date: string;
  clientName: string;
  clientBranch: string;
  subject?: string;
  items: LineItem[];
  total: number;
  showTotal?: boolean;
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
  primaryColor?: string;
}

const PRIMARY_COLOR = "#8a004c";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937",
    paddingBottom: 25,
    backgroundColor: "#ffffff",
  },
  headerImg: {
    width: "100%",
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  clientBox: {
    width: "60%",
  },
  toLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    marginBottom: 3,
  },
  clientNameText: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  clientBranchText: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#4b5563",
    leadingHeight: 1.3,
  },
  docTitleBox: {
    alignItems: "flex-end",
    width: "36%",
    marginTop: 20,
  },
  docTitleText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
  },
  docNumberText: {
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#6b7280",
    marginTop: 2,
  },
  dividerLine: {
    height: 0.75,
    backgroundColor: PRIMARY_COLOR,
    marginVertical: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    marginRight: 5,
  },
  dateVal: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  table: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
    marginBottom: 3,
  },
  th: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 6,
    minHeight: 18,
  },
  td: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  colNo: { width: "5%" },
  colDesc: { width: "55%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "14%", textAlign: "right" },
  colAmt: { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold" },

  middleStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    backgroundColor: "#FAF5F7",
    marginVertical: 14,
    marginTop: 30,
  },
  messageBox: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  messageText: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#6b7280",
    leadingHeight: 1.3,
  },
  totalBox: {
    width: 180,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabelText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalValText: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  bottomSection: {
    marginTop: 15,
  },
  termsBox: {
    width: "65%",
    marginBottom: 16,
  },
  termsTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    marginBottom: 5,
  },
  termsText: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#4b5563",
    leadingHeight: 1.4,
  },
  signatureBox: {
    alignItems: "flex-start",
  },
  signatureImg: {
    height: 46,
    objectFit: "contain",
    marginBottom: 3,
  },
  signatureTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
  },
});

export function AxiomPdfDocument({
  type,
  number,
  date,
  clientName,
  clientBranch,
  items,
  total,
  showTotal = true,
  terms,
  accountInfo,
  headerImageUrl,
  signatureImageUrl,
}: AxiomPdfProps) {
  const docTitle =
    type === "quotation"
      ? "QUOTE"
      : type === "invoice"
        ? "INVOICE"
        : type === "sales_order"
          ? "SALES ORDER"
          : type === "delivery_challan"
            ? "DELIVERY CHALLAN"
            : type === "eway_bill"
              ? "e-WAY BILL"
              : type === "credit_note"
                ? "CREDIT NOTE"
                : "DOCUMENT";

  const toLabel =
    type === "quotation"
      ? "Quote To"
      : type === "invoice"
        ? "Invoice To"
        : type === "sales_order"
          ? "Order To"
          : type === "delivery_challan"
            ? "Challan To"
            : type === "eway_bill"
              ? "Bill To"
              : type === "credit_note"
                ? "Credit To"
                : "To";

  const dateLabel =
    type === "quotation"
      ? "Quote Date"
      : type === "invoice"
        ? "Invoice Date"
        : "Date";

  // Filter out empty rows unless all rows are empty
  const activeItems = items.filter(
    (item) => item.description.trim() !== "" || item.rate > 0 || item.qty > 0 || item.amount > 0
  );
  const displayItems = activeItems.length > 0 ? activeItems : items.slice(0, 1);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header Banner - image already includes bottom line */}
        {headerImageUrl ? (
          <Image style={s.headerImg} src={headerImageUrl} />
        ) : null}

        <View style={s.contentContainer}>
          {/* Quote To & Document Title */}
          <View style={s.headerRow}>
            <View style={s.clientBox}>
              <Text style={s.toLabel}>{toLabel}</Text>
              <Text style={s.clientNameText}>{clientName}</Text>
              {clientBranch ? (
                <Text style={s.clientBranchText}>{clientBranch}</Text>
              ) : null}
            </View>

            <View style={s.docTitleBox}>
              <Text style={s.docTitleText}>{docTitle}</Text>
              <Text style={s.docNumberText}>{number || "QT-000001"}</Text>
            </View>
          </View>

          {/* Divider Line */}
          <View style={s.dividerLine} />

          {/* Date */}
          <View style={s.dateRow}>
            <Text style={s.dateLabel}>{dateLabel}</Text>
            <Text style={s.dateVal}>{fmtDate(date)}</Text>
          </View>

          {/* Table */}
          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colRate]}>Rate</Text>
              <Text style={[s.th, s.colAmt]}>Amount</Text>
            </View>

            {displayItems.map((item, idx) => (
              <View key={idx} style={s.tableRow}>
                <Text style={[s.td, s.colNo]}>{idx + 1}</Text>
                <Text style={[s.td, s.colDesc]}>{item.description}</Text>
                <Text style={[s.td, s.colQty]}>
                  {item.qty ? Number(item.qty).toFixed(2) : "1.00"}
                </Text>
                <Text style={[s.td, s.colRate]}>
                  {item.rate ? fmtINR(item.rate) : ""}
                </Text>
                <Text style={[s.td, s.colAmt]}>
                  {!showTotal
                    ? "—"
                    : item.amount
                      ? fmtINR(item.amount)
                      : ""}
                </Text>
              </View>
            ))}
          </View>

          {/* Middle Message & Total Strip */}
          <View style={s.middleStrip}>
            <View style={s.messageBox}>
              <Text style={s.messageText}>
                We look forward to working with you and building a long-term business relationship.
              </Text>
            </View>

            {showTotal ? (
              <View style={s.totalBox}>
                <Text style={s.totalLabelText}>Total</Text>
                <Text style={s.totalValText}>{fmtINR(total)}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Section: Terms & Signature */}
          <View style={s.bottomSection}>
            <View style={s.termsBox}>
              <Text style={s.termsTitle}>Terms & Conditions</Text>
              {accountInfo ? (
                <View>
                  <Text style={s.termsText}>Bank Name: {accountInfo.bankName}</Text>
                  <Text style={s.termsText}>Account No: {accountInfo.accountNumber}</Text>
                  <Text style={s.termsText}>IFSC Code: {accountInfo.ifsc}</Text>
                  <Text style={s.termsText}>Account Holder: {accountInfo.accountHolder}</Text>
                  <Text style={s.termsText}>PAN No: {accountInfo.pan}</Text>
                </View>
              ) : (
                <Text style={s.termsText}>
                  {(!terms || terms.includes("Authorized work group") || terms.includes("Payment 100% Against Work Done"))
                    ? "1. Quotation valid for 15 days.\n2. GST extra as applicable.\n3. 100% payment upon completion, unless agreed otherwise.\n4. Additional work beyond the quoted scope will be charged extra."
                    : terms}
                </Text>
              )}
            </View>

            <View style={s.signatureBox}>
              {signatureImageUrl ? (
                <Image style={s.signatureImg} src={signatureImageUrl} />
              ) : null}
              <Text style={s.signatureTitle}>Authorized Signature</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateAxiomPdf(props: AxiomPdfProps): Promise<Blob> {
  const doc = <AxiomPdfDocument {...props} />;
  return await pdf(doc).toBlob();
}
