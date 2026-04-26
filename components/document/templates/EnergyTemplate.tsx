"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

export function EnergyTemplate({
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
  headerImage,
}: TemplateProps) {
  const title = mode === "quotation" ? "Shifting Quotation" : "Invoice Bill";

  return (
    <div className="px-4 md:px-8 pt-4 pb-0">
      {headerImage && (
        <div className="w-full mb-6 -mt-3">
          <img src={headerImage} alt="Header" className="w-full object-cover rounded" />
        </div>
      )}
      {/* To + Date row */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 pr-4">
          <div className="text-[12px] text-gray-700 mb-1">To,</div>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name"
            list="client-names-energy"
            className="w-full max-w-48 text-[11px] md:text-[13px] font-semibold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 placeholder:font-normal"
          />
          <datalist id="client-names-energy">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
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
            placeholder="Branch / Address"
            className="w-full max-w-[110px] text-[10px] md:text-[12px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 resize-none overflow-y-hidden leading-[1.4]"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-[10px] md:text-[13px] font-semibold text-gray-700 bg-transparent border border-dashed border-gray-300 rounded px-2 py-0.5 focus:border-primary focus:outline-none cursor-pointer shrink-0"
        />
      </div>

      {/* Dear Sir */}
      <div className="text-[12px] text-gray-900 mb-6">Dear Sir,</div>

      {/* Sub — centered, bold */}
      <div className="text-center mb-4 flex items-center justify-center gap-1">
        <span className="text-[12px] font-semibold text-gray-900 flex items-center gap-1">
          Sub: <span className="text-red-500 font-bold">*</span>
        </span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={title}
          className={`text-[11px] md:text-[13px] font-semibold text-gray-800 bg-transparent border-0 border-b border-dashed ${!subject ? 'border-red-300' : 'border-gray-300'} focus:border-primary focus:outline-none py-0.5 w-[70%] placeholder:text-gray-300 placeholder:font-normal transition-colors`}
        />
      </div>

      {/* Table — 4 cols: Sr No, Description, Qty, Total Price */}
      <div className="overflow-x-auto">
        <table
          ref={tableRef}
          className="w-full border-collapse text-[9px] md:text-[12px] border border-gray-700"
        >
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-700 font-bold text-center px-2 py-2 w-[10%]">
                Sr No
              </th>
              <th className="border border-gray-700 font-bold text-left px-3 py-2 w-[62%]">
                Description
              </th>
              <th className="border border-gray-700 font-bold text-center px-2 py-2 w-[10%]">
                Qty
              </th>
              <th className="border border-gray-700 font-bold text-right px-3 py-2 w-[18%]">
                Total Price
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
                  className=" hover:bg-gray-50/50 transition-colors align-top"
                >
                  <td className="border-x border-gray-700 text-center text-[11px] text-gray-500 py-2">
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
                  <td className="border-x border-gray-700 px-1 py-0">
                    <input
                      type="number"
                      min={0}
                      value={item.amount || ""}
                      onChange={(e) => updateItem(idx, "amount", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                      className={`${inputCls} text-right font-semibold`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Terms / Bank Details */}
      <div className="mt-4 pb-4">
        <p className="text-[11px] font-bold text-gray-700 mb-1">
          {mode === "invoice" ? "Bank Details:" : "Terms & Condition-"}
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
                <span className="text-gray-400 w-[90px] md:w-[110px] shrink-0">{lbl}</span>
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
            placeholder="1. GST@18%Extra&#10;2. PAYMENT: 100% Advance&#10;3. Work Done in 2-3 Weeks&#10;4. Warai/ Mathadi & Any Other Local Charges Extra"
          />
        )}
      </div>

      {/* Footer strip — full-width signature/logo image */}
      <div className="-mx-4 md:-mx-8">
        <img
          src={signatureImage}
          alt="Footer"
          className="w-full object-contain"
        />
      </div>
    </div>
  );
}
