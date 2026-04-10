"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

export function ATKTemplate({
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
  const title = mode === "quotation" ? "Quotation" : "Invoice Bill";

  return (
    <>
      <div className="px-4 md:px-8 pt-3">
        <div className="border-t border-gray-800" />
        <h2 className="text-center text-[14px] md:text-[20px] italic font-normal text-gray-800 py-1 font-serif leading-tight">
          {title}
        </h2>
        <div className="border-b border-gray-800" />
      </div>

      <div className="flex justify-between items-start px-4 md:px-8 pt-3 pb-1">
        <div className="flex-1">
          <div className="mb-1">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name"
              list="client-names"
              className="w-full text-[11px] md:text-[13px] font-semibold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 placeholder:font-normal"
            />
            <datalist id="client-names">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <textarea
            value={clientBranch}
            onChange={(e) => {
              setClientBranch(e.target.value);
              autoResize(e.target);
            }}
            ref={(el) => {
              if (el && clientBranch) autoResize(el);
            }}
            rows={1}
            placeholder="Branch"
            className="w-full max-w-[18rem] text-[12px] md:text-[15px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 resize-none overflow-hidden leading-[1.4]"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-[10px] md:text-[13px] font-semibold text-gray-700 bg-transparent border border-dashed border-gray-300 rounded px-2 py-0.5 focus:border-primary focus:outline-none cursor-pointer ml-4 shrink-0"
        />
      </div>

      <div className="px-4 md:px-8 pt-2 pb-3">
        <span className="text-[12px] md:text-[15px] text-gray-400 mr-1">Subject:</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Quotation for Scrap"
          className="text-[11px] md:text-[13px] font-semibold text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 w-[80%] placeholder:text-gray-300 placeholder:font-normal"
        />
      </div>

      <div className="px-4 md:px-8 overflow-x-auto">
        <table
          ref={tableRef}
          className="w-full border-collapse text-[9px] md:text-[12px] border border-gray-800"
        >
          <thead>
            <tr>
              <th className="border border-gray-800 font-bold text-left px-3 py-2 w-[55%]">
                DESCRIPTION
              </th>
              <th className="border border-gray-800 font-bold text-center px-3 py-2 w-[10%]">
                QTY
              </th>
              <th className="border border-gray-800 font-bold text-right px-3 py-2 w-[15%]">
                Per Rate
              </th>
              <th className="border border-gray-800 font-bold text-right px-3 py-2 w-[20%]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors align-top"
              >
                <td className="border-x border-gray-800 px-1 py-0">
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
                    className="w-full px-2 py-2 bg-transparent text-[9px] md:text-[12px] text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300 resize-none overflow-hidden leading-[1.6]"
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
                    onChange={(e) => updateItem(idx, "rate", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="border-x border-gray-800 px-1 py-0">
                  <input
                    type="number"
                    min={0}
                    value={item.amount || ""}
                    onChange={(e) => updateItem(idx, "amount", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                    className={`${inputCls} text-center font-semibold`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-800">
              <td
                colSpan={3}
                className="border border-gray-800 px-3 py-2 font-bold text-[12px]"
              >
                Total
              </td>
              <td className="border border-gray-800 px-3 py-2 text-right font-bold text-[9px] md:text-[12px]">
                {formatINR(subtotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-4 md:px-8 pb-6 pt-3">
        <div className="flex gap-4 md:gap-6">
          <div className="flex-1">
            <p className="text-[9px] md:text-[11px] font-bold underline text-gray-700 mb-1">
              {mode === "invoice" ? "Terms & Condition:" : "Terms & Condition:"}
            </p>
            {mode === "invoice" ? (
              <div className="space-y-1 text-[9px] md:text-[11px] text-gray-600 border border-dashed border-gray-200 rounded-lg p-2">
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
                    <span className="text-gray-400 w-[90px] md:w-[110px] shrink-0">
                      {lbl}
                    </span>
                    <input
                      value={val}
                      onChange={(e) =>
                        (setter as (v: string) => void)(e.target.value)
                      }
                      className="flex-1 bg-transparent border-0 focus:outline-none text-[9px] md:text-[11px] text-gray-700 py-0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={4}
                className="w-full text-[9px] md:text-[11px] text-gray-600 leading-relaxed bg-transparent border border-dashed border-gray-200 rounded-lg p-2 focus:outline-none focus:border-primary/40 resize-none"
              />
            )}
          </div>
          <div className="flex flex-col items-end justify-end">
            <img
              src={signatureImage}
              alt="Signature"
              className="h-[50px] md:h-[80px] object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
}
