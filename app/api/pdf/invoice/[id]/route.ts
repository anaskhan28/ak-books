import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/app/actions/invoices";
import { getQuotation } from "@/app/actions/quotations";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function buildHTML(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>,
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[],
) {
  const paidTotal = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.totalAmount - paidTotal;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1d26; padding: 48px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand h1 { font-size: 22px; font-weight: 700; color: #3b6cf5; }
    .brand p { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 28px; font-weight: 700; color: #1a1d26; }
    .invoice-title p { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .meta-block h3 { font-size: 11px; text-transform: ; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
    .meta-block p { font-size: 13px; color: #1a1d26; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f8f9fb; text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: ; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .text-right { text-align: right; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table tr td { padding: 6px 16px; font-size: 13px; border: none; }
    .totals-table .total-row td { font-size: 16px; font-weight: 700; border-top: 2px solid #1a1d26; padding-top: 10px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>AK Enterprise Group</h1>
      <p>Bank Infrastructure & Shifting Services</p>
      <p>Mumbai, Maharashtra</p>
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <p><strong>${invoice.invoiceNumber}</strong></p>
      <p>Date: ${new Date(invoice.createdAt).toLocaleDateString("en-IN")}</p>
      ${invoice.dueDate ? `<p>Due: ${invoice.dueDate}</p>` : ""}
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h3>Bill To</h3>
      <p><strong>${invoice.clientName ?? ""}</strong></p>
      ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ""}
      ${invoice.clientPhone ? `<p>${invoice.clientPhone}</p>` : ""}
      ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ""}
    </div>
    <div class="meta-block" style="text-align:right">
      <h3>Reference</h3>
      <p>Quotation: ${invoice.quotationNumber ?? "—"}</p>
      <p>Status: ${invoice.status.toUpperCase()}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatINR(item.rate)}</td>
          <td class="text-right"><strong>${formatINR(item.amount)}</strong></td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Subtotal</td>
        <td class="text-right">${formatINR(invoice.totalAmount)}</td>
      </tr>
      <tr>
        <td>Paid</td>
        <td class="text-right">${formatINR(paidTotal)}</td>
      </tr>
      <tr class="total-row">
        <td>Balance Due</td>
        <td class="text-right">${formatINR(balance)}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>Thank you for your business. Payment is due within 30 days.</p>
    <p style="margin-top:4px">AK Enterprise Group — Bank Infrastructure & Shifting Services</p>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoice(Number(id));
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const quotation = await getQuotation(invoice.quotationId);
  const items = quotation?.items ?? [];

  const html = buildHTML(invoice, items);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
