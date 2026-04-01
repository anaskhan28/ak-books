import { NextRequest, NextResponse } from "next/server";
import { getQuotation } from "@/app/actions/quotations";
import { readFile } from "fs/promises";
import { join } from "path";

function fmtINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtNum(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Q = NonNullable<Awaited<ReturnType<typeof getQuotation>>>;

async function getHeaderBase64(): Promise<string> {
  try {
    const filePath = join(
      process.cwd(),
      "public",
      "templates",
      "anaskhanmerchant.png",
    );
    const buffer = await readFile(filePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

async function buildHTML(q: Q) {
  const headerImg = await getHeaderBase64();
  const dateStr = new Date(q.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  const emptyRows = Math.max(0, 8 - q.items.length);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${q.quotationNumber}</title>
<style>
  @page { margin: 20mm 15mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1d26;
    max-width: 760px;
    margin: 0 auto;
    font-size: 12px;
    line-height: 1.4;
  }
  .header-img { width: 100%; display: block; }
  .date-row { text-align: right; padding: 16px 0 0; font-size: 13px; font-weight: 600; color: #444; }
  .qt-row { display: flex; align-items: center; gap: 12px; margin: 12px 0 10px; }
  .qt-badge {
    display: inline-block;
    background: #c0392b;
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 12px;
  }
  .qt-number { font-size: 12px; color: #888; font-family: monospace; }
  .client-name { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 2px; }
  .client-branch { font-size: 13px; color: #555; margin-bottom: 8px; }
  .subject { font-size: 13px; margin-bottom: 16px; }
  .subject strong { color: #222; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  table.items th {
    background: #c0392b;
    color: white;
    font-size: 11px;
    font-weight: 700;
    text-transform: ;
    padding: 8px 10px;
    text-align: left;
  }
  table.items th.r { text-align: right; }
  table.items th.c { text-align: center; }
  table.items td {
    padding: 7px 10px;
    font-size: 12px;
    border-bottom: 1px solid #e8e8e8;
    color: #333;
  }
  table.items td.r { text-align: right; }
  table.items td.c { text-align: center; }
  table.items td.bold { font-weight: 700; }
  .empty-row td { height: 28px; }

  .subtotal-row {
    display: flex;
    justify-content: space-between;
    border-top: 2px solid #222;
    padding: 8px 0;
    font-weight: 700;
    font-size: 13px;
  }

  .footer { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 12px; }
  .terms-box { flex: 1; }
  .terms-label {
    display: inline-block;
    background: #c0392b;
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    margin-bottom: 6px;
  }
  .terms-text { font-size: 11px; color: #555; line-height: 1.7; white-space: pre-wrap; }
  .total-box { display: flex; align-items: center; }
  .total-label {
    background: #c0392b;
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
  }
  .total-value {
    background: #c0392b;
    color: white;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    min-width: 100px;
    text-align: right;
  }

  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>

${headerImg ? `<img src="${headerImg}" class="header-img" alt=""/>` : ""}

<div class="date-row">${dateStr}</div>

<div class="qt-row">
  <div class="qt-badge">Quotation</div>
  <span class="qt-number">${q.quotationNumber}</span>
</div>

<div class="client-name">${q.clientName || ""}</div>
<div class="client-branch">${q.clientBranch || ""}</div>

${q.subject ? `<div class="subject">Subject: <strong>${q.subject}</strong></div>` : ""}

<table class="items">
  <thead>
    <tr>
      <th style="width:62%">DESCRIPTION</th>
      <th class="r" style="width:11%">UNIT PRICE</th>
      <th class="c" style="width:6%">QTY</th>
      <th class="c" style="width:6%">TAX</th>
      <th class="r" style="width:12%">AMOUNT</th>
    </tr>
  </thead>
  <tbody>
    ${q.items
      .map(
        (item) => `<tr>
      <td>${item.description}</td>
      <td class="r">${item.rate > 0 ? fmtNum(item.rate) : ""}</td>
      <td class="c">${item.quantity > 0 ? item.quantity : ""}</td>
      <td class="c">${item.taxed || ""}</td>
      <td class="r bold">${item.amount > 0 ? "₹" + fmtNum(item.amount) : ""}</td>
    </tr>`,
      )
      .join("")}
    ${Array.from({ length: emptyRows })
      .map(
        () =>
          `<tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>`,
      )
      .join("")}
  </tbody>
</table>

<div class="subtotal-row">
  <span>Subtotal</span>
  <span>${fmtNum(q.totalAmount)}</span>
</div>

<div class="footer">
  <div class="terms-box">
    ${q.notes ? `<span class="terms-label">Terms & Condition</span><div class="terms-text">${q.notes}</div>` : ""}
  </div>
  <div class="total-box">
    <span class="total-label">TOTAL</span>
    <span class="total-value">${fmtINR(q.totalAmount)}</span>
  </div>
</div>

<script>window.onload=()=>window.print()</script>
</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const quotation = await getQuotation(Number(id));
  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const html = await buildHTML(quotation);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
