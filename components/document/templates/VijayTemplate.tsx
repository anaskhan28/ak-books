"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

export function VijayTemplate({
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
  clients,
  signatureImage,
  inputCls,
  formatINR,
}: TemplateProps) {
  // Format matching image 1: Rs- 60,300/– [18% GST Extra]
  const totalFormatted = `Rs- ${formatINR(subtotal)}`;

  return (
    <div
      className="px-4 md:px-10 pt-4 pb-6"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Date — right aligned */}
      <div className="flex justify-end mb-5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-[11px] md:text-[13px] text-gray-700 bg-transparent border border-dashed border-gray-300 rounded px-2 py-0.5 focus:border-primary focus:outline-none cursor-pointer"
          style={{ fontFamily: "inherit" }}
        />
      </div>

      {/* Client — no "To," label */}
      <div className="mb-6">
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client Name"
          list="client-names-vijay"
          className="w-full text-[11px] md:text-[13px] font-semibold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 placeholder:font-normal"
          style={{ fontFamily: "inherit" }}
        />
        <datalist id="client-names-vijay">
          {clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        <input
          value={clientBranch}
          onChange={(e) => setClientBranch(e.target.value)}
          placeholder="Branch / Address"
          className="w-full text-[10px] md:text-[12px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300"
          style={{ fontFamily: "inherit" }}
        />
      </div>

      {/* Subject — left aligned, plain (not bold) */}
      <div className="mb-5">
        <span className="text-[11px] md:text-[13px] text-gray-900 mr-1">Subject:</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Quotation for work"
          className="text-[11px] md:text-[13px] text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 w-[80%] placeholder:text-gray-300"
          style={{ fontFamily: "inherit" }}
        />
      </div>

      {/* Item paragraphs — description only */}
      <div
        className="text-[13px] text-gray-900 mb-4"
        style={{ lineHeight: 1.6 }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="mb-3">
            {idx === 0 && (
              <>
                <textarea
                  value={item.description}
                  onChange={(e) => {
                    updateItem(idx, "description", e.target.value);
                    autoResize(e.target);
                  }}
                  rows={15}
                  placeholder={idx === 0 ? "Write item paragraphs..." : ""}
                  className="w-full max-w-full md:max-w-xl text-[12px] md:text-[15px] text-gray-800 bg-transparent border-0 focus:outline-none resize-none leading-[1.5] overflow-hidden"
                />
              </>
            )}
            {idx === 0 && (
              <div className="flex justify-end items-center gap-2 mt-1">
                <label className="text-[15px] text-gray-900">Amount:</label>
                <button className="bg-green-400 rounded-md px-2">
                  <input
                    type="number"
                    min={0}
                    value={item.amount || ""}
                    onChange={(e) => updateItem(idx, "amount", e.target.value)}
                    className={`${inputCls} text-[15px] text-right font-semibold max-w-[90px]  `}
                    placeholder="Amount"
                  />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total — centered */}
      <div className="text-center my-4">
        <div className="text-[11px] md:text-[13px] text-gray-900">
          All total amount of will be
        </div>
        <div className="text-[11px] md:text-[13px] text-gray-900 mt-1">{totalFormatted}</div>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={2}
          className="w-full md:w-50 text-[11px] md:text-[13px] text-black font-bold leading-relaxed bg-transparent border border-dashed border-gray-200 rounded-lg p-2 focus:outline-none focus:border-primary/40 resize-none"
        />
      </div>

      {/* Bank details (invoice only) */}
      {mode === "invoice" && (
        <div className="mt-4 mb-4">
          <div className="text-[11px] font-bold underline text-gray-700 mb-2">
            Bank Details:
          </div>
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
                <span className="text-gray-400 w-[110px] shrink-0">{lbl}</span>
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
        </div>
      )}

      {/* Signature — right aligned */}
      <div className="flex justify-end mt-6">
        <img
          src={signatureImage}
          alt="Signature"
          className="h-[50px] md:h-[70px] object-contain"
        />
      </div>
    </div>
  );
}
