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

const fmtINR0 = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export interface VijayPdfProps {
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

const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 18,
    color: "#111",
    paddingBottom: 30,
  },
  headerImg: { width: "100%", height: "auto" },

  body: { paddingHorizontal: 48, paddingTop: 10 },

  // Date — right aligned
  dateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 14,
  },
  dateText: { fontSize: 11, fontFamily: "Times-Roman" },

  // Client block — no "To," label (matching image 1)
  clientName: { fontSize: 18, fontFamily: "Times-Roman", marginBottom: 2 },
  clientBranch: { fontSize: 18, fontFamily: "Times-Roman", marginBottom: 12, maxWidth: 110 },

  // Subject — left aligned, normal weight (not bold)
  subLine: { marginBottom: 12 },
  subText: { fontSize: 18, fontFamily: "Times-Roman" },

  // Item paragraphs
  itemsBlock: { marginTop: 20, marginBottom: 8 },
  itemPara: {
    fontSize: 18,
    fontFamily: "Times-Roman",
    lineHeight: 1.55,
    marginBottom: 10,
    textAlign: "justify",
  },

  // Total block — centered
  totalWrap: {
    marginTop: 10,
    marginBottom: 6,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "Times-Roman",
    textAlign: "center",
    marginBottom: 3,
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: "Times-Roman",
    textAlign: "center",
  },

  // Bank details (invoice)
  acctWrap: { marginTop: 10, marginBottom: 16 },
  acctRow: { flexDirection: "row", marginBottom: 3 },
  acctLbl: { fontFamily: "Times-Bold", fontSize: 18, width: 120 },
  acctVal: { fontSize: 18 },

  // Signature — right aligned
  signWrap: {
    alignItems: "flex-end",
    paddingRight: 0,
    marginTop: 16,
  },
  sigImg: { width: 150, height: 100, objectFit: "contain" },
});

function VijayDoc({
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
}: VijayPdfProps) {
  const filled = items.filter(
    (i) => i.description.trim() || Math.abs(i.amount) > 0 || Math.abs(i.qty) > 0 || Math.abs(i.rate) > 0,
  );
  const displayDate = fmtDate(date);
  const subjectLabel = subject || "Quotation";

  // Format total as: Rs- 60,300/– [18% GST Extra]
  const totalFormatted = `Rs- ${fmtINR0(total)}/\u2013  `;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        <View style={s.body}>
          {/* Date — right aligned */}
          <View style={s.dateRow}>
            <Text style={s.dateText}>{displayDate}</Text>
          </View>

          {/* Client — no "To," label */}
          <Text style={s.clientName}>{clientName}</Text>
          {clientBranch ? (
            <Text style={s.clientBranch}>{clientBranch}</Text>
          ) : (
            <Text style={{ marginBottom: 12 }}> </Text>
          )}

          {/* Ref number */}
          {/* {number ? (
            <Text style={{ fontSize: 9, color: "#666", marginBottom: 6 }}>
              Ref: {number}
            </Text>
          ) : null} */}

          {/* Subject — left aligned, plain */}
          <View style={s.subLine}>
            <Text style={s.subText}>Subject: {subjectLabel}</Text>
          </View>

          {/* Item paragraphs */}
          <View style={s.itemsBlock}>
            {filled.map((item, idx) => {
              const desc = item.description.trim();
              if (!desc) return null;
              return (
                <View key={idx} style={{ marginBottom: filled.length > 1 ? 15 : 10 }}>
                  <Text style={s.itemPara}>
                    {desc}
                  </Text>
                  {filled.length > 1 && (
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: "Times-Roman",
                        textAlign: "left",
                        marginTop: 1,
                      }}
                    >
                      The amount would be: {fmtINR0(item.amount)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Total — centered */}
          <View style={s.totalWrap}>
            <Text style={s.totalLabel}>All total amount of will be</Text>
            <Text style={s.totalAmount}>{totalFormatted}</Text>
            {terms && type !== "invoice" ? (
              <Text style={{ fontSize: 18, color: "#111", marginTop: 8 }}>
                {terms}
              </Text>
            ) : null}
          </View>

          {/* Bank details for invoice */}
          {type === "invoice" && accountInfo ? (
            <View style={s.acctWrap}>
              <Text style={[s.acctLbl, { marginBottom: 6 }]}>
                Bank Details:
              </Text>
              {(
                [
                  ["Bank Name:", accountInfo.bankName],
                  ["Account No:", accountInfo.accountNumber],
                  ["IFSC Code:", accountInfo.ifsc],
                  ["Account Holder:", accountInfo.accountHolder],
                  ["PAN:", accountInfo.pan],
                ] as const
              ).map(([lbl, val]) => (
                <View key={lbl} style={s.acctRow}>
                  <Text style={s.acctLbl}>{lbl}</Text>
                  <Text style={s.acctVal}>{val}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Terms (if any extra notes) */}

          {/* Signature — right aligned */}
          <View style={s.signWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={signatureImageUrl} style={s.sigImg} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateVijayPdf(props: VijayPdfProps): Promise<Blob> {
  return pdf(<VijayDoc {...props} />).toBlob();
}
