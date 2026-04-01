"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

export function AKMTemplate({
  mode,
  items,
  subtotal,
  clientName,
  setClientName,
  clientBranch,
  setClientBranch,
  date,
  qtNumber,
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
  const docLabel = mode === "quotation" ? "Quotation" : "Invoice";

  return (
    <>
      <div className="flex justify-end items-center pt-2 gap-4">
        <div className="inline-block bg-[#c0392b] text-white text-[10px] font-bold px-2 py-1">
          {qtNumber}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-[13px] font-semibold text-gray-700 bg-transparent border border-dashed border-gray-300 rounded px-2 py-0.5 focus:border-primary focus:outline-none cursor-pointer"
        />
      </div>

      <div className="px-8 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-block bg-[#c0392b] text-white text-[15px] font-bold px-3 py-1">
            {docLabel}
          </div>
        </div>
        <div className="mb-1">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name"
            list="client-names"
            className="w-full text-[14px] font-bold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 placeholder:font-normal"
          />
          <datalist id="client-names">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div className="mb-3">
          <input
            value={clientBranch}
            onChange={(e) => setClientBranch(e.target.value)}
            placeholder="Branch"
            className="w-full text-[13px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300"
          />
        </div>
        <div className="mb-4">
          <span className="text-[15px] text-gray-400 mr-1">Subject:</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Labour Assistance Work"
            className="text-[13px] font-semibold text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 w-[80%] placeholder:text-gray-300 placeholder:font-normal"
          />
        </div>
      </div>

      <div className="px-8">
        <table ref={tableRef} className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="bg-[#c0392b] text-white font-bold text-left px-3 py-2 w-[65%]">
                DESCRIPTION
              </th>
              <th className="bg-[#c0392b] text-white font-bold text-right px-3 py-2 w-[11%]">
                PER UNIT
              </th>
              <th className="bg-[#c0392b] text-white font-bold text-center px-3 py-2 w-[6%]">
                QTY
              </th>
              <th className="bg-[#c0392b] text-white font-bold text-center px-3 py-2 w-[6%]">
                TAX
              </th>
              <th className="bg-[#c0392b] text-white font-bold text-right px-3 py-2 w-[12%]">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors align-top"
              >
                <td className="px-1 py-0">
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
                    className="w-full px-2 py-2 bg-transparent text-[12px] text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300 resize-none overflow-hidden leading-[1.6]"
                  />
                </td>
                <td className="px-1 py-0">
                  <input
                    type="number"
                    min={0}
                    value={item.rate || ""}
                    onChange={(e) => updateItem(idx, "rate", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="px-1 py-0">
                  <input
                    type="number"
                    min={0}
                    value={item.qty || ""}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                    className={`${inputCls} text-center`}
                  />
                </td>
                <td className="px-1 py-0">
                  <input
                    value={item.taxed}
                    onChange={(e) => updateItem(idx, "taxed", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                    className={`${inputCls} text-center`}
                  />
                </td>
                <td className="px-1 py-0">
                  <input
                    type="number"
                    min={0}
                    value={item.amount || ""}
                    onChange={(e) => updateItem(idx, "amount", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 4)}
                    className={`${inputCls} text-right font-semibold`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-8">
        <div className="flex justify-between items-center border-t-2 border-gray-800 py-2">
          <span className="text-[15px] font-bold text-gray-600">Subtotal</span>
          <span className="text-[13px] font-bold text-gray-900">
            {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="px-8 pb-6 pt-2">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="inline-block bg-[#c0392b] text-white text-[10px] font-bold px-2 py-0.5 mb-2">
              {mode === "invoice" ? "Account Info" : "Terms & Condition"}
            </div>
            {mode === "invoice" ? (
              <div className="space-y-1 text-[11px] text-gray-600 border border-dashed border-gray-200 rounded-lg p-2">
                {(
                  [
                    ["Bank Name:", accountBankName, setAccountBankName],
                    ["Account no:", accountNumber, setAccountNumber],
                    ["IFSC code:", accountIfsc, setAccountIfsc],
                    ["Account holder:", accountHolder, setAccountHolder],
                    ["Pan Card no:", accountPan, setAccountPan],
                  ] as const
                ).map(([lbl, val, setter]) => (
                  <div key={lbl} className="flex gap-1">
                    <span className="text-gray-400 w-[110px] shrink-0">
                      {lbl}
                    </span>
                    <input
                      value={val}
                      onChange={(e) =>
                        (setter as (v: string) => void)(e.target.value)
                      }
                      className="flex-1 bg-transparent border-0 focus:outline-none text-[11px] text-gray-700 py-0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={4}
                className="w-full text-[11px] text-gray-600 leading-relaxed bg-transparent border border-dashed border-gray-200 rounded-lg p-2 focus:outline-none focus:border-primary/40 resize-none"
              />
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center">
              <span className="bg-[#c0392b] text-white text-[15px] font-bold px-4 py-1.5">
                TOTAL
              </span>
              <span className="bg-[#c0392b] text-white text-[13px] font-bold px-4 py-1.5 min-w-[120px] text-right">
                {formatINR(subtotal)}
              </span>
            </div>
            <img
              src={signatureImage}
              alt="Signature"
              className="h-[120px] object-cover mt-2"
            />
          </div>
        </div>
      </div>
    </>
  );
}
