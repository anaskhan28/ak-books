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
  displayName: string;
  primaryColor?: string;
  secondaryColor?: string;
}

import type { QuotationTemplate } from "@/app/db/schema";

/**
 * These are "Design Engines". 
 * They define the visual structure and default assets.
 * All specific business data comes from the Database.
 */
const PRESETS: Record<string, TemplateConfig> = {
  "akm": {
    displayName: "Anas Khan Merchant (Bold)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784326/templates/anaskhanmerchant.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784325/templates/anas-sign.png",
    generator: "akm",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "atk": {
    displayName: "Atique Khan (Clean)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784329/templates/atiquekhan.jpg",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784328/templates/atique-sign.jpg",
    generator: "atk",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "vedant": {
    displayName: "Vedant (Industrial)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784344/templates/vedant.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784341/templates/vedant-sign.jpg",
    generator: "vedant",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "kgn": {
    displayName: "KGN (Standard)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784333/templates/kgn.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784332/templates/kgn-sign.png",
    generator: "kgn",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "madhu": {
    displayName: "Madhu Neil (Professional)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784337/templates/madhuneil.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784334/templates/madhu-sign.png",
    generator: "madhu",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "energy": {
    displayName: "Energy (Bold Borders)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784331/templates/energy.jpg",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784330/templates/energy-sign.png",
    generator: "energy",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "vijay": {
    displayName: "Vijay (Simple)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784346/templates/vijay.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784345/templates/vijay-sign.png",
    generator: "vijay",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
  "ak-enterprises": {
    displayName: "AK Enterprises (Elite)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784324/templates/ak-enterprises.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784323/templates/ak-enterprises-sign.jpg",
    generator: "ak-enterprises",
    prefix: "QT-",
    invoicePrefix: "INV-",
    bank: { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" },
  },
};

const DEFAULT_CONFIG: TemplateConfig = PRESETS["akm"];

export function getTemplateConfig(
  templateName?: string | null,
  dbTemplate?: QuotationTemplate | null,
): TemplateConfig {
  let baseConfig = DEFAULT_CONFIG;

  // 1. Identify which PRESET (Design Engine) to use
  if (dbTemplate?.layoutPreset && PRESETS[dbTemplate.layoutPreset]) {
    baseConfig = PRESETS[dbTemplate.layoutPreset];
  } else if (templateName) {
    const normalized = templateName.toLowerCase().trim();
    const match = Object.entries(PRESETS).find(([key]) => 
      normalized.includes(key) || key.includes(normalized)
    );
    if (match) baseConfig = match[1];
  }

  // 2. Override preset defaults with specific DB values
  if (dbTemplate) {
    return {
      ...baseConfig,
      headerImage: dbTemplate.headerImage || baseConfig.headerImage,
      signatureImage: dbTemplate.signatureImage || baseConfig.signatureImage,
      prefix: dbTemplate.subjectPrefix || baseConfig.prefix,
      invoicePrefix: dbTemplate.invoicePrefix || baseConfig.invoicePrefix,
      primaryColor: dbTemplate.primaryColor || baseConfig.primaryColor,
      secondaryColor: dbTemplate.secondaryColor || baseConfig.secondaryColor,
      bank: {
        bankName: dbTemplate.bankName || "",
        accountNumber: dbTemplate.accountNumber || "",
        ifsc: dbTemplate.ifsc || "",
        accountHolder: dbTemplate.accountHolder || "",
        pan: dbTemplate.pan || "",
      },
    };
  }

  return baseConfig;
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
