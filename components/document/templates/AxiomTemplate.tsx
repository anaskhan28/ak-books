"use client";

import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

function formatAxiomDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const m2 = d.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (m2) return `${m2[1]}/${m2[2]}/${m2[3]}`;
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const fmtINR = (n: number) =>
  `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function AxiomTemplate({
  mode,
  items,
  subtotal,
  clientName,
  setClientName,
  clientBranch,
  setClientBranch,
  date,
  setDate,
  qtNumber,
  subject,
  setSubject,
  terms,
  setTerms,
  accountBankName,
  setAccountBankName,
  accountNumber,
  setAccountNumber,
  accountIfsc,
  setAccountIfsc,
  accountHolder,
  setAccountHolder,
  accountPan,
  setAccountPan,
  updateItem,
  handleKeyDown,
  tableRef,
  clients,
  signatureImage,
  inputCls,
  headerImage,
  primaryColor = "#8a004c",
  showTotal,
  isReadOnly,
}: TemplateProps) {
  const docTitle =
    mode === "quotation"
      ? "QUOTE"
      : mode === "invoice"
        ? "INVOICE"
        : mode === "sales_order"
          ? "SALES ORDER"
          : mode === "delivery_challan"
            ? "DELIVERY CHALLAN"
            : mode === "eway_bill"
              ? "e-WAY BILL"
              : mode === "credit_note"
                ? "CREDIT NOTE"
                : "DOCUMENT";

  const toLabel =
    mode === "quotation"
      ? "Quote To"
      : mode === "invoice"
        ? "Invoice To"
        : mode === "sales_order"
          ? "Order To"
          : mode === "delivery_challan"
            ? "Challan To"
            : mode === "eway_bill"
              ? "Bill To"
              : mode === "credit_note"
                ? "Credit To"
                : "To";

  const dateLabel =
    mode === "quotation"
      ? "Quote Date"
      : mode === "invoice"
        ? "Invoice Date"
        : "Date";

  const formattedHeaderImg =
    headerImage ||
    "https://res.cloudinary.com/anaskhan/image/upload/v1788841702/templates/axiom_spaceworks_fwxj2z.png";

  const formattedSigImg =
    signatureImage ||
    "https://res.cloudinary.com/anaskhan/image/upload/v1788841778/templates/axiom_businesses_ig0vp0.png";

  // Filter out empty rows so only active items are shown
  const activeItems = items.filter(
    (item) => item.description.trim() !== "" || item.rate > 0 || item.qty > 0 || item.amount > 0
  );
  const displayItems = activeItems.length > 0 ? activeItems : items.slice(0, 1);

  const displayDate = formatAxiomDate(date);

  return (
    <div className="w-full text-[#1f2937] font-sans bg-white">
      {/* Header Banner - banner image already contains the bottom accent line */}
      {formattedHeaderImg && (
        <div className="w-full">
          <img
            src={formattedHeaderImg}
            alt="Axiom Spaceworks Header"
            className="w-full object-contain"
          />
        </div>
      )}

      {/* Main Content Container with standard margins */}
      <div className="px-6 md:px-10 pt-5 pb-8">
        {/* Quote To & Document Title Row */}
        <div className="flex justify-between items-start pb-2">
          <div className="flex-1 max-w-[62%]">
            <p
              className="text-[13px] font-bold mb-1"
              style={{ color: primaryColor }}
            >
              {toLabel}
            </p>
            <div className="mb-0.5">
              {isReadOnly ? (
                <p className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">
                  {clientName || "CENTRAL BANK OF INDIA"}
                </p>
              ) : (
                <>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="CENTRAL BANK OF INDIA"
                    list="client-names-axiom"
                    className="w-full text-[13px] font-bold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-200 focus:border-primary focus:outline-none py-0.5 placeholder:text-gray-300 uppercase tracking-wide"
                  />
                  <datalist id="client-names-axiom">
                    {clients.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </>
              )}
            </div>
            {isReadOnly ? (
              <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">
                {clientBranch || "Central Bank of India\nBandra Kurla Complex (BKC)\nMumbai\nMaharashtra"}
              </p>
            ) : (
              <textarea
                value={clientBranch}
                onChange={(e) => {
                  setClientBranch(e.target.value);
                  autoResize(e.target);
                }}
                ref={(el) => {
                  if (el && clientBranch) autoResize(el);
                }}
                rows={2}
                placeholder="Central Bank of India&#10;Bandra Kurla Complex (BKC)&#10;Mumbai&#10;Maharashtra"
                className="w-full text-[11px] text-gray-600 bg-transparent border-0 border-b border-dashed border-gray-200 focus:border-primary focus:outline-none py-0.5 placeholder:text-gray-300 resize-none overflow-y-hidden leading-relaxed"
              />
            )}
          </div>

          <div className="text-right flex flex-col items-end">
            <h1
              className="text-[28px] md:text-[32px] font-bold tracking-tight leading-none"
              style={{ color: primaryColor }}
            >
              {docTitle}
            </h1>
            <p className="text-[12px] text-gray-500 font-medium mt-1">
              {qtNumber || "QT-000001"}
            </p>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div
          className="w-full h-[1px] my-3"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Date Row */}
        <div className="flex items-center gap-3 py-1 mb-5 text-[12px]">
          <span
            className="font-bold shrink-0"
            style={{ color: primaryColor }}
          >
            {dateLabel}
          </span>
          {isReadOnly ? (
            <span className="text-gray-800 font-normal">
              {displayDate}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-[12px] text-gray-700 bg-transparent border-0 focus:outline-none cursor-pointer"
              />
              <span className="text-[11px] text-gray-500 font-medium">
                ({displayDate})
              </span>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="w-full my-4">
          <table
            ref={tableRef}
            className="w-full border-collapse text-[11px] md:text-[12px]"
          >
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="font-bold text-left py-2 px-2 w-[5%]"
                  style={{ color: primaryColor }}
                >
                  #
                </th>
                <th
                  className="font-bold text-left py-2 px-2 w-[55%]"
                  style={{ color: primaryColor }}
                >
                  Description
                </th>
                <th
                  className="font-bold text-right py-2 px-2 w-[12%]"
                  style={{ color: primaryColor }}
                >
                  Qty
                </th>
                <th
                  className="font-bold text-right py-2 px-2 w-[14%]"
                  style={{ color: primaryColor }}
                >
                  Rate
                </th>
                <th
                  className="font-bold text-right py-2 px-2 w-[14%]"
                  style={{ color: primaryColor }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayItems.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50/50 transition-colors align-top"
                >
                  <td className="py-3 px-2 text-gray-500 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    {isReadOnly ? (
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                        {item.description}
                      </p>
                    ) : (
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          updateItem(idx, "description", e.target.value);
                          autoResize(e.target);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Tab") handleKeyDown(e, idx, 0);
                        }}
                        ref={(el) => {
                          if (el && item.description) autoResize(el);
                        }}
                        rows={1}
                        placeholder={idx === 0 ? "Description of work / goods..." : ""}
                        className="w-full py-0.5 bg-transparent text-gray-800 border-0 focus:outline-none placeholder:text-gray-300 resize-none overflow-hidden leading-relaxed"
                      />
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {isReadOnly ? (
                      <span className="font-medium text-gray-800">
                        {item.qty ? Number(item.qty).toFixed(2) : "1.00"}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.qty || ""}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                        className={`${inputCls} text-right font-medium`}
                      />
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {isReadOnly ? (
                      <span className="font-medium text-gray-800">
                        {item.rate ? fmtINR(item.rate) : ""}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.rate || ""}
                        onChange={(e) => updateItem(idx, "rate", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                        className={`${inputCls} text-right font-medium`}
                      />
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-bold text-gray-900">
                      {!showTotal ? "—" : item.amount ? fmtINR(item.amount) : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="w-full border-b border-gray-200" />
        </div>

        {/* Message Banner & Total Strip (Single unified container matching Image 2) */}
        <div className="w-full bg-[#FAF5F7] flex flex-col md:flex-row items-stretch justify-between my-20 rounded-none overflow-hidden">
          <div className="flex-1 p-4 flex items-center justify-center md:justify-start">
            <p className="text-[11px] text-gray-500 leading-relaxed font-normal text-center md:text-left">
              We look forward to working with you and building a long-term business relationship.
            </p>
          </div>

          {showTotal && (
            <div
              className="w-full md:w-[320px] px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="font-bold text-[13px] tracking-wide">
                Total
              </span>
              <span className="font-bold text-[14px] md:text-[16px]">
                {fmtINR(subtotal)}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Section: Terms & Signature */}
        <div className="pt-2 pb-6">
          <div className="flex flex-col items-start gap-8">
            {/* Terms & Conditions */}
            <div className="w-full max-w-[65%]">
              <p
                className="text-[12px] font-bold mb-2"
                style={{ color: primaryColor }}
              >
                Terms & Conditions
              </p>
              {mode === "invoice" || mode === "credit_note" ? (
                <div className="space-y-1.5 text-[10.5px] text-gray-600 border border-dashed border-gray-200 rounded p-3 bg-gray-50/50">
                  {[
                    ["Bank Name:", accountBankName, setAccountBankName],
                    ["Account No:", accountNumber, setAccountNumber],
                    ["IFSC Code:", accountIfsc, setAccountIfsc],
                    ["Account Holder:", accountHolder, setAccountHolder],
                    ["PAN No:", accountPan, setAccountPan],
                  ].map(([lbl, val, setter]) => (
                    <div key={lbl as string} className="flex gap-2 items-center">
                      <span className="text-gray-400 font-medium w-[100px] shrink-0">
                        {lbl as string}
                      </span>
                      {isReadOnly ? (
                        <span className="text-gray-700">{val as string}</span>
                      ) : (
                        <input
                          value={val as string}
                          onChange={(e) =>
                            (setter as (v: string) => void)(e.target.value)
                          }
                          className="flex-1 bg-transparent border-0 focus:outline-none text-[10.5px] text-gray-700 py-0"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : isReadOnly ? (
                <div className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">
                  {(!terms || terms.includes("Authorized work group") || terms.includes("Payment 100% Against Work Done"))
                    ? "1. Quotation valid for 15 days.\n2. GST extra as applicable.\n3. 100% payment upon completion, unless agreed otherwise.\n4. Additional work beyond the quoted scope will be charged extra."
                    : terms}
                </div>
              ) : (
                <textarea
                  value={(!terms || terms.includes("Authorized work group") || terms.includes("Payment 100% Against Work Done"))
                    ? "1. Quotation valid for 15 days.\n2. GST extra as applicable.\n3. 100% payment upon completion, unless agreed otherwise.\n4. Additional work beyond the quoted scope will be charged extra."
                    : terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  placeholder="1. Quotation valid for 15 days.&#10;2. GST extra as applicable.&#10;3. 100% payment upon completion, unless agreed otherwise.&#10;4. Additional work beyond the quoted scope will be charged extra."
                  className="w-full text-[11px] text-gray-600 leading-relaxed bg-transparent border border-dashed border-gray-200 rounded p-2 focus:outline-none focus:border-primary/40 resize-none"
                />
              )}
            </div>

            {/* Authorized Signature */}
            <div className="flex flex-col items-start pt-2">
              {formattedSigImg && (
                <img
                  src={formattedSigImg}
                  alt="Signature"
                  className="h-[60px] md:h-[75px] object-contain mb-1"
                />
              )}
              <p
                className="text-[12px] font-bold tracking-wide"
                style={{ color: primaryColor }}
              >
                Authorized Signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
