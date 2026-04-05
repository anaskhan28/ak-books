"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

const BDR = "border border-gray-400";

// Default HSN codes used frequently
const HSN_PRESETS = [
  { code: "996793", label: "Shifting" },
  { code: "998533", label: "Cleaning" },
];

// Shared address block used in both To/Consignee and Bill To/Consignee
function AddressBlock({
  clientName,
  clientBranch,
  clientCity,
  clientState,
  clientGstin,
}: {
  clientName: string;
  clientBranch: string;
  clientCity?: string;
  clientState?: string;
  clientGstin?: string;
}) {
  return (
    <div className="text-[11px] text-gray-800 leading-5">
      <div className="font-semibold">
        {clientName || <span className="text-gray-300">Client Name</span>}
      </div>
      {clientBranch && <div>{clientBranch}</div>}
      {clientCity && <div>{clientCity}</div>}
      {clientState && <div>{clientState}</div>}
      <div>India</div>
      {clientGstin && <div>GSTIN {clientGstin}</div>}
    </div>
  );
}

export function AKEnterpriseTemplate({
  mode,
  items,
  subtotal,
  clientName,
  setClientName,
  clientBranch,
  setClientBranch,
  date,
  setDate,
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
  formatINR,
  inputCls,
}: TemplateProps) {
  // GST calc for invoice
  const gstRate = 18;
  const gstTotal = subtotal * (gstRate / 100);
  const grandTotal = subtotal + gstTotal;

  const isInvoice = mode === "invoice";
  const docTitle = isInvoice ? "TAX INVOICE" : "Quotation";

  return (
    <div className="text-[11px] text-gray-800">
      {/* ── Company info box + doc title ── */}
      <div className={`flex justify-between items-start p-3 mx-0 md:mx-5 mt-3 ${BDR}`}>
        <div className="flex flex-col gap-1">
          <div className="font-bold text-[10px] md:text-[13px]">AK Enterprises</div>
          {isInvoice && (
            <div className="text-[8px] md:text-[10px] text-gray-500">
              GSTIN 27BAPPK9432C1ZJ
            </div>
          )}
          <div className="text-[8px] md:text-[10px] text-gray-500">9892493707</div>
          <div className="text-[8px] md:text-[10px] text-gray-500">
            akenterprises.dealers@gmail.com
          </div>
          <div className="text-[8px] md:text-[10px] text-gray-500">
            https://akenterprisegroup.in
          </div>
          {isInvoice && (
            <div className="text-[8px] md:text-[10px] text-gray-500 truncate max-w-[150px] md:max-w-none">
              Shop no 13, Mumbra - Panvel Hwy, near Daighar Police Station,
              <br className="hidden md:block" />
              Shilphata, Thane, Maharashtra 421204
            </div>
          )}
        </div>
        <div
          className={`text-[${isInvoice ? "12" : "15"}px] md:text-[${isInvoice ? "16" : "20"}px] font-${isInvoice ? "bold" : "normal"} text-gray-500`}
        >
          {docTitle}
        </div>
      </div>

      {/* ── Meta row: Quote#/Invoice# | Date | Place of Supply ── */}
      <div className="flex mx-0 md:mx-5 border border-t-0 border-gray-400">
        <div className="flex-1 p-1 md:p-2 border-r border-gray-400">
          <div className="text-[7px] md:text-[9px] text-gray-400">
            {isInvoice ? "Invoice#" : "Quote"}
          </div>
          <div className="font-semibold text-[8px] md:text-[10px] text-gray-600">—</div>
        </div>
        <div className="flex-1 p-1 md:p-2 border-r border-gray-400">
          <div className="text-[7px] md:text-[9px] text-gray-400">
            {isInvoice ? "Invoice Date" : "Date"}
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="font-semibold text-[8px] md:text-[10px] text-gray-700 bg-transparent border-0 focus:outline-none cursor-pointer w-full"
          />
        </div>
        <div className="flex-1 p-1 md:p-2">
          <div className="text-[7px] md:text-[9px] text-gray-400">Place Of Supply</div>
          <div className="font-semibold text-[8px] md:text-[10px] text-gray-600">
            Maharashtra (27)
          </div>
        </div>
      </div>

      {/* ── Address row: To / Consignee ── */}
      <div className="flex mx-0 md:mx-5 border border-t-0 border-gray-400">
        <div className="flex-1 p-2 md:p-3 border-r border-gray-400">
          <div className="font-bold text-[9px] md:text-[11px] mb-1 md:mb-2">
            {isInvoice ? "Bill To" : "Quotation To"}
          </div>
          {/* Client inputs */}
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name"
            list="client-names-ak-enterprises"
            className="w-full text-[9px] md:text-[11px] font-semibold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 placeholder:text-gray-300 placeholder:font-normal mb-1"
          />
          <datalist id="client-names-ak-enterprises">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <input
            value={clientBranch}
            onChange={(e) => setClientBranch(e.target.value)}
            placeholder="Branch / Address"
            className="w-full text-[9px] md:text-[11px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 placeholder:text-gray-300 mb-0.5"
          />
          <div className="text-[8px] md:text-[10px] text-gray-400 mt-1">India</div>
          {isInvoice && (
            <input
              placeholder="Client GSTIN"
              className="w-full text-[8px] md:text-[10px] text-gray-600 bg-transparent border-0 border-b border-dashed border-gray-300 focus:outline-none py-0.5 placeholder:text-gray-200 mt-1"
            />
          )}
        </div>
        <div className="flex-1 p-2 md:p-3">
          <div className="font-bold text-[9px] md:text-[11px] mb-1 md:mb-2">Consignee To</div>
          <div className="md:hidden">
            <div className="text-[9px] font-semibold">{clientName || "Client Name"}</div>
            <div className="text-[8px]">{clientBranch}</div>
          </div>
          <div className="hidden md:block">
            <AddressBlock clientName={clientName} clientBranch={clientBranch} />
          </div>
        </div>
      </div>

      {/* ── Subject ── */}
      <div className="mx-0 md:mx-5 border border-t-0 border-gray-400 px-2 md:px-3 py-1 md:py-2">
        <div className="text-[7px] md:text-[9px] text-gray-400 mb-0.5 md:mb-1">Subject :</div>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={isInvoice ? "Shifting Invoice" : "Shifting Quotation"}
          className="w-full text-[9px] md:text-[11px] text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 placeholder:text-gray-300"
        />
      </div>

      {/* ── Table ── */}
      {isInvoice ? (
        /* Invoice table — 8 columns */
        <div className="mx-0 md:mx-5 border border-t-0 border-gray-400 overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse text-[10px]">
            <thead className="bg-gray-100">
              {/* GST group header */}
              <tr>
                <th
                  className="border border-gray-400 px-1 py-1 w-[4%] text-center"
                  rowSpan={2}
                >
                  Sr
                  <br />
                  No
                </th>
                <th
                  className="border border-gray-400 px-2 py-1 text-left"
                  rowSpan={2}
                  style={{ width: "46%" }}
                >
                  Item & Description
                </th>
                <th
                  className="border border-gray-400 px-1 py-1 w-[8%] text-center"
                  rowSpan={2}
                >
                  HSN
                  <br />
                  Code
                </th>
                <th
                  className="border border-gray-400 px-1 py-1 w-[6%] text-center"
                  rowSpan={2}
                >
                  Qty
                </th>
                <th
                  className="border border-gray-400 px-1 py-1 w-[10%] text-right"
                  rowSpan={2}
                >
                  Rate
                </th>
                <th
                  className="border border-gray-400 px-1 py-1 text-center"
                  colSpan={2}
                >
                  GST
                </th>
                <th
                  className="border border-gray-400 px-1 py-1 w-[13%] text-right"
                  rowSpan={2}
                >
                  Amount
                </th>
              </tr>
              <tr>
                <th className="border border-gray-400 px-1 py-1 w-[4%] text-center">
                  %
                </th>
                <th className="border border-gray-400 px-1 py-1 w-[9%] text-right">
                  Amt
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const taxable = item.amount;
                const gstItemTotal = taxable * (gstRate / 100);
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 align-top hover:bg-gray-50/50"
                  >
                    <td className="border-x border-gray-400 text-center text-gray-500 py-2 text-[9px]">
                      {item.description || item.amount > 0 ? idx + 1 : ""}
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
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
                        placeholder={idx === 0 ? "Type description..." : ""}
                        className="w-full px-1 py-1.5 bg-transparent text-[10px] text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300 resize-none overflow-hidden leading-[1.5]"
                      />
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
                      <select
                        value={
                          HSN_PRESETS.some((p) => p.code === item.taxed)
                            ? item.taxed
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) updateItem(idx, "taxed", e.target.value);
                        }}
                        className="w-full bg-transparent text-[10px] text-gray-400 border-0 focus:outline-none cursor-pointer py-0.5 appearance-none text-center"
                      >
                        <option value="">— pick —</option>
                        {HSN_PRESETS.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.code} ({p.label})
                          </option>
                        ))}
                      </select>
                      <input
                        value={item.taxed}
                        onChange={(e) =>
                          updateItem(idx, "taxed", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                        className={`${inputCls} text-center text-[10px] border-t border-dashed border-gray-200`}
                        placeholder="HSN"
                      />
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
                      <input
                        type="number"
                        min={0}
                        value={item.qty || ""}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                        className={`${inputCls} text-center text-[10px]`}
                      />
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
                      <input
                        type="number"
                        min={0}
                        value={item.rate || ""}
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                        className={`${inputCls} text-right text-[10px]`}
                      />
                    </td>
                    <td className="border-x border-gray-200 text-center text-[9px] py-2 text-gray-500">
                      {gstRate}%
                    </td>
                    <td className="border-x border-gray-200 text-right text-[9px] px-1 py-2 text-gray-600">
                      {taxable > 0 ? formatINR(gstItemTotal) : ""}
                    </td>
                    <td className="border-x border-gray-400 px-1 py-0">
                      <input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateItem(idx, "amount", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 4)}
                        className={`${inputCls} text-right font-semibold text-[10px]`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Quotation table — 5 columns */
        <div className="mx-0 md:mx-5 border border-t-0 border-gray-400 overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse text-[11px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 px-2 py-2 w-[6%] text-center font-bold">
                  Sr No
                </th>
                <th
                  className="border border-gray-400 px-2 py-2 text-left font-bold"
                  style={{ width: "58%" }}
                >
                  Item & Description
                </th>
                <th className="border border-gray-400 px-2 py-2 w-[8%] text-center font-bold">
                  Qty
                </th>
                <th className="border border-gray-400 px-2 py-2 w-[14%] text-right font-bold">
                  Unit Basic
                </th>
                <th className="border border-gray-400 px-2 py-2 w-[14%] text-right font-bold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const hasContent =
                  item.description ||
                  item.qty > 0 ||
                  item.rate > 0 ||
                  item.amount > 0;
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 align-top hover:bg-gray-50/50"
                  >
                    <td className="border-x border-gray-400 text-center text-[10px] text-gray-500 py-2">
                      {hasContent ? idx + 1 : ""}
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
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
                        placeholder={idx === 0 ? "Type description..." : ""}
                        className="w-full px-2 py-2 bg-transparent text-[11px] text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300 resize-none overflow-hidden leading-[1.5]"
                      />
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
                      <input
                        type="number"
                        min={0}
                        value={item.qty || ""}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                        className={`${inputCls} text-center`}
                      />
                    </td>
                    <td className="border-x border-gray-200 px-1 py-0">
                      <input
                        type="number"
                        min={0}
                        value={item.rate || ""}
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                        className={`${inputCls} text-right`}
                      />
                    </td>
                    <td className="border-x border-gray-400 px-1 py-0">
                      <input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateItem(idx, "amount", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                        className={`${inputCls} text-right font-semibold`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bottom: Notes/Terms/Bank left | Total+Signature right ── */}
      <div className="flex mx-0 md:mx-5 border border-t-0 border-gray-400 min-h-[100px] md:min-h-[120px]">
        {/* Left */}
        <div className="flex-1 p-3 border-r border-gray-400">
          {isInvoice ? (
            <>
              <div className="text-[10px] font-bold text-gray-700 mb-1">
                Total In Words
              </div>
              <div className="text-[10px] italic font-semibold text-gray-800 mb-3">
                {/* simplified display */}
                {grandTotal > 0 ? `₹${formatINR(grandTotal)}` : "—"}
              </div>
              {/* <div className="text-[10px] font-bold text-gray-700 mb-1">
                Notes
              </div>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                placeholder="Thanks for your business."
                className="w-full text-[10px] text-gray-600 bg-transparent border border-dashed border-gray-200 rounded p-1 focus:outline-none resize-none mb-3"
              /> */}
              <div className="text-[10px] font-bold text-gray-700 mb-1">
                Bank Details:
              </div>
              <div className="space-y-0.5 border border-dashed border-gray-200 rounded p-2">
                {(
                  [
                    ["Bank Name:", accountBankName, setAccountBankName],
                    ["Account No:", accountNumber, setAccountNumber],
                    ["IFSC Code:", accountIfsc, setAccountIfsc],
                    ["Account Holder:", accountHolder, setAccountHolder],
                    ["Pan Card No:", accountPan, setAccountPan],
                  ] as const
                ).map(([lbl, val, setter]) => (
                  <div key={lbl} className="flex gap-1">
                    <span className="text-[10px] font-bold text-gray-600 w-[110px] shrink-0">
                      {lbl}
                    </span>
                    <input
                      value={val}
                      onChange={(e) =>
                        (setter as (v: string) => void)(e.target.value)
                      }
                      className="flex-1 bg-transparent border-0 focus:outline-none text-[10px] text-gray-700"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* <div className="text-[10px] font-bold text-gray-700 mb-1">
                Notes
              </div>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="Looking forward for your business."
                className="w-full text-[10px] text-gray-600 bg-transparent border border-dashed border-gray-200 rounded p-1 focus:outline-none resize-none mb-3"
              /> */}
              <div className="text-[10px] font-bold text-gray-700 mb-1">
                Terms & Conditions
              </div>
              <div className="text-[10px] text-gray-500 whitespace-pre-line leading-5">
                {`1. Authorized work group\n2. GST 18% Extra\n3. Payment 100% Against Work Done .\n4. Warai /Mathadi & Any other Local Charges Extra`}
              </div>
            </>
          )}
        </div>

        {/* Right — totals + signature */}
        <div className="w-[35%] p-3 flex flex-col">
          {isInvoice ? (
            <>
              <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                <span>Total Taxable Amount</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-[12px] border-t border-gray-300 pt-1 mb-3">
                <span>Total</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-bold text-[12px] border-b border-gray-300 pb-2 mb-3">
              <span>Total</span>
              <span>{formatINR(subtotal)}</span>
            </div>
          )}

          {/* Signature */}
          <div className="flex flex-col items-center mt-auto">
            {isInvoice && (
              <div className="text-[10px] text-gray-500 mb-1">Atique Khan</div>
            )}
            <img
              src={signatureImage}
              alt="Signature"
              className="h-[100px] object-contain"
            />
            <div className="text-[10px] font-bold text-gray-700 mt-1 text-center">
              For A.K. ENTERPRISES
            </div>
            <div className="text-[9px] text-gray-500 text-center">
              Proprietor
            </div>
            <div className="text-[9px] text-gray-400 mt-1 text-center">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
