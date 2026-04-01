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

function fmtDateSlash(d: string): string {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string;
  amount: number;
}

export interface MadhuNeilPdfProps {
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
    fontFamily: "Helvetica",
    fontSize: 13,
    color: "#111",
  },
  headerImg: {
    width: "100%",
    height: "auto",
  },

  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
  },

  // Date right-aligned
  dateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 14,
  },
  dateText: { fontSize: 13, color: "#111" },

  // "To," then client name/branch
  toLabel: { fontSize: 13, color: "#111", marginBottom: 2 },
  clientName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111",
    marginBottom: 2,
  },
  clientBranch: { fontSize: 13, color: "#111", marginBottom: 2, marginTop: 2 },

  // Dear Sir
  dear: { marginTop: 16, marginBottom: 10 },
  dearText: { fontSize: 13, color: "#111" },

  // Sub line — bold
  subLine: { marginBottom: 20, marginTop: 10 },
  subText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },

  // Item paragraphs
  itemsBlock: { marginBottom: 4 },
  itemPara: {
    fontSize: 13,
    color: "#111",
    lineHeight: 1.4,
    marginBottom: 8,
  },

  // Total line — centered, specific format from image 3
  totalWrap: {
    marginTop: 50,
    marginBottom: 8,
    alignItems: "center",
  },
  totalText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111",
    textAlign: "center",
  },

  gstText: {
    fontSize: 13,
    color: "#111",
    marginBottom: 20,
    marginTop: 30,
  },

  // Bank details (invoice only)
  acctRow: { flexDirection: "row", marginBottom: 3 },
  acctLbl: { fontFamily: "Helvetica-Bold", fontSize: 13, width: 110 },
  acctVal: { fontSize: 13 },

  // Closing
  closing: { marginTop: 8 },
  closingText: { fontSize: 13, color: "#111", marginBottom: 4 },

  // Signature — left aligned (matching images 1 & 3)
  signWrap: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  sigImg: { width: 110, height: 50, objectFit: "contain" },
  sigFooter: { fontSize: 10, color: "#111", marginTop: 2 },
});

function MadhuNeilDoc({
  type,
  date,
  clientName,
  clientBranch,
  subject,
  number,
  items,
  total,
  terms,
  accountInfo,
  headerImageUrl,
  signatureImageUrl,
}: MadhuNeilPdfProps) {
  const filled = items.filter(
    (i) => i.description.trim() || i.amount > 0 || i.qty > 0 || i.rate > 0,
  );

  const dateText = fmtDateSlash(date);
  const subjectLabel = subject || "Quotation for Shifting";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerImageUrl} style={s.headerImg} />

        <View style={s.body}>
          {/* Date — right aligned */}
          <View style={s.dateRow}>
            <Text style={s.dateText}>Date: {dateText}</Text>
          </View>

          {/* To, Client */}
          {/* <Text style={s.toLabel}>To,</Text> */}
          {number ? (
            <Text
              style={{
                fontSize: 9,
                color: "#111",
                marginBottom: 5,
              }}
            >
              {number}
            </Text>
          ) : null}
          <Text style={s.clientName}>{clientName}</Text>
          {clientBranch ? (
            <Text style={s.clientBranch}>{clientBranch}</Text>
          ) : null}

          {/* Dear Sir */}
          <View style={s.dear}>
            <Text style={s.dearText}>Dear Sir,</Text>
          </View>

          {/* Sub line */}
          <View style={s.subLine}>
            <Text style={s.subText}>Sub: {subjectLabel}</Text>
          </View>

          {/* Item paragraphs */}
          <View style={s.itemsBlock}>
            {filled.map((item, idx) => {
              const desc = item.description.trim();
              if (!desc) return null;
              return (
                <Text key={idx} style={s.itemPara}>
                  {desc}
                </Text>
              );
            })}
          </View>

          {/* Total — centered, bold, matching image 3 format */}
          <View style={s.totalWrap}>
            <Text style={s.totalText}>
              All Total Amount is RS-/-{fmtINR(total)}/-
            </Text>
          </View>

          {/* Bank details for invoice */}
          {/* {type === "invoice" && accountInfo ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={[s.acctLbl, { marginBottom: 4 }]}>
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
          ) : null} */}

          {/* Terms */}
          {terms ? <Text style={s.gstText}>{terms}</Text> : null}

          {/* Closing */}
          <View style={s.closing}>
            <Text style={s.closingText}>Thanking you,</Text>
          </View>

          {/* Signature — left aligned */}
          <View style={s.signWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={signatureImageUrl} style={s.sigImg} />
          </View>

          <Text style={s.closingText}>Yours Faithfully,</Text>
          <Text style={s.closingText}>
            For Madhu-Neil Safes &amp; Securities.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateMadhuNeilPdf(
  props: MadhuNeilPdfProps,
): Promise<Blob> {
  return pdf(<MadhuNeilDoc {...props} />).toBlob();
}
