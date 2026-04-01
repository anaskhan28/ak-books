export interface BankDefaults {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  pan: string;
}

export interface TemplateConfig {
  headerImage: string;
  signatureImage: string;
  generator:
    | "akm"
    | "atk"
    | "vedant"
    | "madhu"
    | "kgn"
    | "energy"
    | "vijay"
    | "ak-enterprises";
  prefix: string;
  invoicePrefix: string;
  bank: BankDefaults;
}

const TEMPLATES: Record<string, TemplateConfig> = {
  "anas khan merchant": {
    headerImage: "/templates/anaskhanmerchant.png",
    signatureImage: "/templates/anas-sign.png",
    generator: "akm",
    prefix: "QT-AKM",
    invoicePrefix: "INV-AKM",
    bank: {
      bankName: "State Bank of India",
      accountNumber: "41447171789",
      ifsc: "SBIN0014748",
      accountHolder: "Mohammed Anas Atique Khan",
      pan: "LLTPK1955R",
    },
  },
  "atique khan": {
    headerImage: "/templates/atiquekhan.jpg",
    signatureImage: "/templates/atique-sign.jpg",
    generator: "atk",
    prefix: "QT-ATK",
    invoicePrefix: "INV-ATK",
    bank: {
      bankName: "Canara Bank",
      accountNumber: "5079101002721",
      ifsc: "CNRB0005079",
      accountHolder: "Atique Mobin Khan",
      pan: "BAPPK9432C",
    },
  },
  "vedant enterprises": {
    headerImage: "/templates/vedant.png",
    signatureImage: "/templates/vedant-sign.jpg",
    generator: "vedant",
    prefix: "QT-VED",
    invoicePrefix: "INV-VED",
    bank: {
      bankName: "Bank of India",
      accountNumber: "201120110001590",
      ifsc: "BKID0002011",
      accountHolder: "Vedant Enterprises",
      pan: "AERPK7415K",
    },
  },
  "k.g.n. enterprises": {
    headerImage: "/templates/kgn.png",
    signatureImage: "/templates/kgn-sign.png",
    generator: "kgn",
    prefix: "QT-KGN",
    invoicePrefix: "INV-KGN",
    bank: {
      bankName: "State Bank of India",
      accountNumber: "41447171789",
      ifsc: "SBIN0014748",
      accountHolder: "Mohammed Anas Atique Khan",
      pan: "LLTPK1955R",
    },
  },

  "madhu neil safes & securities": {
    // NOTE: filename uses "madhuneil" in `public/templates`
    headerImage: "/templates/madhuneil.png",
    signatureImage: "/templates/madhu-sign.png",
    generator: "madhu",
    prefix: "QT-MADHUNEIL",
    invoicePrefix: "INV-MADHUNEIL",
    bank: {
      bankName: "State Bank of India",
      accountNumber: "41447171789",
      ifsc: "SBIN0014748",
      accountHolder: "Mohammed Anas Atique Khan",
      pan: "LLTPK1955R",
    },
  },
  "energy security": {
    headerImage: "/templates/energy.jpg",
    signatureImage: "/templates/energy-sign.png",
    generator: "energy",
    prefix: "QT-ENERGY",
    invoicePrefix: "INV-ENERGY",
    bank: {
      bankName: "State Bank of India",
      accountNumber: "41447171789",
      ifsc: "SBIN0014748",
      accountHolder: "Mohammed Anas Atique Khan",
      pan: "LLTPK1955R",
    },
  },

  " ak enterprises": {
    generator: "ak-enterprises",
    headerImage: "/templates/ak-enterprises.png", // header used for quotation only
    signatureImage: "/templates/ak-enterprises-sign.jpg",
    prefix: "QT-AK/26-27/",
    invoicePrefix: "AK/26-27/",
    bank: {
      bankName: "Canara Bank",
      accountNumber: "120002367872",
      ifsc: "CNRB0005079",
      accountHolder: "AK Enterprises",
      pan: "BAPPK9432C",
    },
  },
  vijay: {
    generator: "vijay",
    prefix: "QT-VIJAY",
    invoicePrefix: "INV-VIJAY",
    headerImage: "/templates/vijay.png",
    signatureImage: "/templates/vijay-sign.png",
    bank: {
      bankName: "State Bank of India",
      accountNumber: "41447171789",
      ifsc: "SBIN0014748",
      accountHolder: "Mohammed Anas Atique Khan",
      pan: "LLTPK1955R",
    },
  },
};

const DEFAULT_CONFIG: TemplateConfig = TEMPLATES["anas khan merchant"];

export function getTemplateConfig(
  templateName?: string | null,
): TemplateConfig {
  if (!templateName) return DEFAULT_CONFIG;
  const normalized = templateName.toLowerCase().trim();

  // Exact match first (expected in most cases)
  const direct = TEMPLATES[normalized];
  if (direct) return direct;

  // Fallback: tolerate extra words / slightly different DB names.
  const partialMatch =
    Object.entries(TEMPLATES).find(
      ([knownKey]) =>
        normalized.includes(knownKey) || knownKey.includes(normalized),
    ) ?? null;

  return (partialMatch?.[1] as TemplateConfig | null) ?? DEFAULT_CONFIG;
}

export function getTemplatePrefixById(
  templateId: number | null,
  templateName?: string | null,
): string {
  if (templateName) {
    const cfg = getTemplateConfig(templateName);
    return cfg.prefix;
  }
  return DEFAULT_CONFIG.prefix;
}
