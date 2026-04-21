"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";
import { formatINR } from "@/lib/utils";

export function KGNTemplate({
  mode,
  isReadOnly,
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
  inputCls,
  headerImage,
}: TemplateProps) {
  const title = mode === "quotation" ? "Quotation" : "Invoice Bill";

  return (
    <>
      {headerImage && (
        <div className="w-full mb-4">
          <img src={headerImage} alt="Header" className="w-full object-cover rounded" />
        </div>
      )}
      <div className="w-full  text-[15px] border-2 border-gray-800">
        <h2 className="text-center text-[18px] font-normal text-black py-1 font-serif underline">
          {title}
        </h2>
        <div className="border border-gray-800 w-full" />

        <div className="px-4 md:px-8 text-[12px] md:text-[15px] text-gray-500 mb-1">To,</div>
        <div className="flex justify-between items-start px-4 md:px-8 pb-1">
          <div className="flex-1 pl-2">
            <div className="mb-1">
              {isReadOnly ? (
                <div className="w-full text-[11px] md:text-[13px] font-semibold text-gray-900 py-1">
                  {clientName || "—"}
                </div>
              ) : (
                <>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName?.(e.target.value)}
                    placeholder="Client Name"
                    list="client-names-kgn"
                    className="w-full text-[11px] md:text-[13px] font-semibold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 placeholder:font-normal"
                  />
                  <datalist id="client-names-kgn">
                    {clients.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </>
              )}
            </div>
            {isReadOnly ? (
              <div className="w-full max-w-[110px] text-[12px] md:text-[15px] text-gray-700 py-1 whitespace-pre-wrap break-words">
                {clientBranch || "—"}
              </div>
            ) : (
              <textarea
                value={clientBranch}
                onChange={(e) => {
                  setClientBranch?.(e.target.value);
                  autoResize(e.target);
                }}
                ref={(el) => {
                  if (el && clientBranch) autoResize(el);
                }}
                rows={1}
                placeholder="Branch"
                className="w-full max-w-[110px] text-[12px] md:text-[15px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 resize-none overflow-y-hidden leading-[1.4]"
              />
            )}
          </div>
          {isReadOnly ? (
            <div className="text-[10px] md:text-[13px] font-semibold text-gray-700 px-2 py-0.5 ml-4 shrink-0">
              {date}
            </div>
          ) : (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate?.(e.target.value)}
              className="text-[10px] md:text-[13px] font-semibold text-gray-700 bg-transparent border border-dashed border-gray-300 rounded px-2 py-0.5 focus:border-primary focus:outline-none cursor-pointer ml-4 shrink-0"
            />
          )}
        </div>

        <div className="px-4 md:px-8 pt-2 pb-3 text-center">
          <span className="text-[12px] md:text-[15px] text-gray-400 mr-1">Sub:</span>
          {isReadOnly ? (
            <span className="text-[11px] md:text-[13px] font-semibold text-gray-800 py-0.5">
              {subject || "—"}
            </span>
          ) : (
            <input
              value={subject}
              onChange={(e) => setSubject?.(e.target.value)}
              placeholder="Quotation for Shifting Services"
              className="text-[11px] md:text-[13px] font-semibold text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 w-[70%] placeholder:text-gray-300 placeholder:font-normal"
            />
          )}
        </div>

        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="w-full border-collapse text-[9px] md:text-[12px] border border-gray-800"
          >
            <thead>
              <tr>
                <th className="border border-gray-800 font-bold text-left px-3 py-2 w-[60%]">
                  DESCRIPTION
                </th>
                <th className="border border-gray-800 font-bold text-center px-3 py-2 w-[13%]">
                  Approx QTY
                </th>
                <th className="border border-gray-800 font-bold text-right px-3 py-2 w-[12%]">
                  Per Rate
                </th>
                <th className="border border-gray-800 font-bold text-right px-3 py-2 w-[15%]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {(isReadOnly ? items.filter(item => item.description || item.amount > 0) : items).map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors align-top"
                >
                  <td className="border-x border-gray-800 px-1 py-0">
                    {isReadOnly ? (
                      <div className="w-full px-2 py-2 text-[9px] md:text-[12px] text-gray-800 whitespace-pre-wrap leading-[1.6]">
                        {item.description}
                      </div>
                    ) : (
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          updateItem?.(idx, "description", e.target.value);
                          autoResize(e.target);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Tab") handleKeyDown?.(e, idx, 0);
                        }}
                        ref={(el) => {
                          if (el && item.description) autoResize(el);
                        }}
                        rows={1}
                        placeholder={idx === 0 ? "Type description..." : ""}
                        className="w-full px-2 py-2 bg-transparent text-[9px] md:text-[12px] text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300 resize-none overflow-hidden leading-[1.6]"
                      />
                    )}
                  </td>
                  <td className="border-x border-gray-200 px-1 py-0">
                    {isReadOnly ? (
                      <div className="w-full py-2 text-center text-[9px] md:text-[12px] text-gray-700">
                        {item.qty || ""}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.qty || ""}
                        onChange={(e) => updateItem?.(idx, "qty", e.target.value)}
                        onKeyDown={(e) => handleKeyDown?.(e, idx, 1)}
                        className={`${inputCls} text-center`}
                      />
                    )}
                  </td>
                  <td className="border-x border-gray-200 px-1 py-0">
                    {isReadOnly ? (
                      <div className="w-full py-2 text-right text-[9px] md:text-[12px] text-gray-700 pr-2">
                        {item.rate ? formatINR(item.rate) : ""}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.rate || ""}
                        onChange={(e) => updateItem?.(idx, "rate", e.target.value)}
                        onKeyDown={(e) => handleKeyDown?.(e, idx, 2)}
                        className={`${inputCls} text-right`}
                      />
                    )}
                  </td>
                  <td className="border-x border-gray-800 px-1 py-0">
                    {isReadOnly ? (
                      <div className="w-full py-2 text-right text-[9px] md:text-[12px] font-semibold text-gray-800 pr-2">
                        {item.amount ? formatINR(item.amount) : ""}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateItem?.(idx, "amount", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown?.(e, idx, 3)}
                        className={`${inputCls} text-center font-semibold`}
                      />
                    )}
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
                <td className="border border-gray-800 px-3 py-2 text-right font-bold text-[12px]">
                  {formatINR(subtotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-6 pt-3">
        <div className="flex gap-4 md:gap-6">
          <div className="flex-1">
            <p className="text-[9px] md:text-[11px] font-bold underline text-gray-700 mb-1">
              {mode === "invoice" ? "Bank Details:" : "Terms & Conditions:-"}
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
                    {isReadOnly ? (
                      <span className="flex-1 text-[9px] md:text-[11px] text-gray-700 py-0">
                        {val || "—"}
                      </span>
                    ) : (
                      <input
                        value={val}
                        onChange={(e) =>
                          (setter as (v: string) => void)?.(e.target.value)
                        }
                        className="flex-1 bg-transparent border-0 focus:outline-none text-[9px] md:text-[11px] text-gray-700 py-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              isReadOnly ? (
                <div className="w-full text-[9px] md:text-[11px] text-gray-600 leading-relaxed bg-transparent border border-gray-800 border-dashed rounded-lg p-2 whitespace-pre-wrap">
                  {terms || "—"}
                </div>
              ) : (
                <textarea
                  value={terms}
                  onChange={(e) => setTerms?.(e.target.value)}
                  rows={4}
                  className="w-full text-[9px] md:text-[11px] text-gray-600 leading-relaxed bg-transparent border border-dashed border-gray-200 rounded-lg p-2 focus:outline-none focus:border-primary/40 resize-none"
                />
              )
            )}
          </div>
          <div className="flex flex-col items-end justify-end">
            <img
              src={signatureImage}
              alt="Signature"
              className="h-[50px] md:h-[80px] object-contain"
            />
            <p className="text-[8px] md:text-[10px] font-bold text-gray-700 text-center mt-1">
              For K.G.N. Enterprises
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
