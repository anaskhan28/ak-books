"use client";
import { autoResize } from "@/lib/hooks/useDocumentEditor";
import type { TemplateProps } from "@/lib/types/document";

export function MadhuTemplate({
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
  updateItem,
  clients,
  signatureImage,
  inputCls,
  formatINR,
  headerImage,
}: TemplateProps) {
  return (
    <div className="px-4 md:px-8 pt-3">
      {headerImage && (
        <div className="w-full mb-6 -mt-3">
          <img src={headerImage} alt="Header" className="w-full object-cover rounded" />
        </div>
      )}
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <div className="text-[10px] md:text-[12px] text-gray-700 mb-1">To,</div>
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
            placeholder="Branch / Address"
            className="w-full max-w-[110px] text-[11px] md:text-[13px] text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-1 placeholder:text-gray-300 resize-none overflow-y-hidden leading-[1.4]"
          />
        </div>
        <div className="flex flex-row justiy-end items-center">
          <div className="text-[10px] md:text-[12px] text-gray-500 mb-1 whitespace-nowrap">Date:</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-[11px] md:text-[13px] font-semibold text-gray-700 bg-transparent border border-dashed border-gray-300 rounded px-2 py-0.5 focus:border-primary focus:outline-none cursor-pointer ml-2 md:ml-4"
          />
        </div>
      </div>

      <div className="mt-10 text-[15px] text-gray-900">Dear Sir,</div>

      <div className="mt-8 text-center">
        <span className="text-[12px] md:text-[15px] text-gray-500 mr-1">Sub:</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Invoice Subject"
          className="text-[12px] md:text-[15px] font-semibold text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-primary focus:outline-none py-0.5 w-[80%] placeholder:text-gray-300 placeholder:font-normal"
        />
      </div>

      <div
        className="mt-6 text-[15px] text-gray-900"
        style={{ lineHeight: 1.35 }}
      >
        {items
          .filter((item) => item.description.trim() || item.amount > 0)
          .map((item, idx, filtered) => (
            <div key={idx} className="mb-6 last:mb-0">
              <textarea
                value={item.description}
                onChange={(e) => {
                  updateItem(idx, "description", e.target.value);
                  autoResize(e.target);
                }}
                rows={5}
                placeholder="Write item paragraphs..."
                className="w-full max-w-full md:max-w-xl text-[12px] md:text-[15px] text-gray-800 bg-transparent border-0 focus:outline-none resize-none leading-[1.5] overflow-hidden"
                ref={(el) => {
                  if (el) autoResize(el);
                }}
              />
              <div className="flex justify-end items-center gap-2 mt-1">
                <label className="text-[13px] md:text-[15px] text-gray-600">
                  {filtered.length > 1
                    ? "The amount would be:"
                    : "Amount:"}
                </label>
                <div className="bg-green-400 rounded-md px-2 flex items-center h-8">
                  <span className="text-white text-[13px] md:text-[15px] mr-1">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.amount || ""}
                    onChange={(e) => updateItem(idx, "amount", e.target.value)}
                    className="bg-transparent text-[13px] md:text-[15px] text-white font-semibold w-[80px] focus:outline-none text-right"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-4 text-[12px] md:text-[15px] text-gray-900">
        All Total Amount is Rs. /- {formatINR(subtotal)} /-
      </div>
      <div className="mt-2 text-[12px] md:text-[15px] text-gray-900">
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={2}
          className="w-full md:w-50 text-[12px] md:text-[15px] text-black font-bold leading-relaxed bg-transparent border border-dashed border-gray-200 rounded-lg p-2 focus:outline-none focus:border-primary/40 resize-none"
        />
      </div>
      {/* 
              <div className="mt-6">
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
              </div> */}

      <div className=" pb-4 text-[15px] text-gray-900">
        <span className="text-gray-900 font-normal">Thanking you,</span>
        <div
          className="
                flex justify-start items-start"
        >
          <div className="">
            <img
              src={signatureImage}
              alt="Signature"
              className="h-[40px] md:h-[60px] object-contain mx-auto"
            />
            <div className="text-[9px] md:text-[10px] font-semibold text-gray-700 mt-1">
              Proprietor
            </div>
          </div>
        </div>
        <div className="mt-1">Yours Faithfully,</div>
        <div className="mt-1">For Madhu-Neil Safes &amp; Securities.</div>
      </div>
    </div>
  );
}
