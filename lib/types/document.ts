export type DocumentMode = "quotation" | "invoice";

export interface LineItem {
  description: string;
  rate: number;
  qty: number;
  taxed: string;
  amount: number;
}

export interface TemplateProps {
  mode: DocumentMode;
  // state
  items: LineItem[];
  subtotal: number;
  clientName: string;
  setSubtotal?: (v: number) => void;
  setClientName: (v: string) => void;
  clientBranch: string;
  setClientBranch: (v: string) => void;
  date: string;
  qtNumber: string;
  setDate: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  terms: string;
  setTerms: (v: string) => void;
  // account info (invoice only)
  accountBankName: string;
  setAccountBankName: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  accountIfsc: string;
  setAccountIfsc: (v: string) => void;
  accountHolder: string;
  setAccountHolder: (v: string) => void;
  accountPan: string;
  setAccountPan: (v: string) => void;
  // callbacks
  updateItem: (idx: number, field: keyof LineItem, value: string) => void;
  handleKeyDown: (
    e: React.KeyboardEvent,
    rowIdx: number,
    colIdx: number,
  ) => void;
  tableRef: React.RefObject<HTMLTableElement>;
  clients: import("@/app/db/schema").Client[];
  signatureImage: string;
  formatINR: (n: number) => string;
  inputCls: string;
}
