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
 * Design Engines — define the visual layout structure.
 * All business data (images, bank details, prefixes) comes from the Database.
 * These only store which React component / PDF generator to use and fallback assets.
 */
const PRESETS: Record<string, Omit<TemplateConfig, "bank">> = {
  "akm": {
    displayName: "Anas Khan Merchant (Bold)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784326/templates/anaskhanmerchant.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784325/templates/anas-sign.png",
    generator: "akm",
    prefix: "QT-AKM",
    invoicePrefix: "INV-AKM",
  },
  "atk": {
    displayName: "Atique Khan (Clean)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784329/templates/atiquekhan.jpg",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784328/templates/atique-sign.jpg",
    generator: "atk",
    prefix: "QT-ATK",
    invoicePrefix: "INV-ATK",
  },
  "vedant": {
    displayName: "Vedant (Industrial)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784344/templates/vedant.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784341/templates/vedant-sign.jpg",
    generator: "vedant",
    prefix: "QT-VED",
    invoicePrefix: "INV-VED",
  },
  "kgn": {
    displayName: "KGN (Standard)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784333/templates/kgn.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784332/templates/kgn-sign.png",
    generator: "kgn",
    prefix: "QT-KGN",
    invoicePrefix: "INV-KGN",
  },
  "madhu": {
    displayName: "Madhu Neil (Professional)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784337/templates/madhuneil.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784334/templates/madhu-sign.png",
    generator: "madhu",
    prefix: "QT-MAD",
    invoicePrefix: "INV-MAD",
  },
  "energy": {
    displayName: "Energy (Bold Borders)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784331/templates/energy.jpg",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784330/templates/energy-sign.png",
    generator: "energy",
    prefix: "Qt-Energy",
    invoicePrefix: "INV-Energy",
  },
  "vijay": {
    displayName: "Vijay (Simple)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784346/templates/vijay.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784345/templates/vijay-sign.png",
    generator: "vijay",
    prefix: "Qt-Vijay",
    invoicePrefix: "INV-Vijay",
  },
  "ak-enterprises": {
    displayName: "AK Enterprises (Elite)",
    headerImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784324/templates/ak-enterprises.png",
    signatureImage: "https://res.cloudinary.com/anaskhan/image/upload/v1776784323/templates/ak-enterprises-sign.jpg",
    generator: "ak-enterprises",
    prefix: "QT-AK/26-27/",
    invoicePrefix: "AK/26-27/",
  },
};

const EMPTY_BANK: BankDefaults = { bankName: "", accountNumber: "", ifsc: "", accountHolder: "", pan: "" };

const DEFAULT_PRESET = PRESETS["akm"];
const DEFAULT_CONFIG: TemplateConfig = { ...DEFAULT_PRESET, bank: EMPTY_BANK };

export function getTemplateConfig(
  templateName?: string | null,
  dbTemplate?: QuotationTemplate | null,
): TemplateConfig {
  let basePreset = DEFAULT_PRESET;

  // 1. Identify which PRESET (Design Engine) to use
  if (dbTemplate?.layoutPreset && PRESETS[dbTemplate.layoutPreset]) {
    basePreset = PRESETS[dbTemplate.layoutPreset];
  } else if (templateName) {
    const normalized = templateName.toLowerCase().trim();
    const match = Object.entries(PRESETS).find(([key]) => 
      normalized.includes(key) || key.includes(normalized)
    );
    if (match) basePreset = match[1];
  }

  // 2. Override preset defaults with specific DB values
  if (dbTemplate) {
    return {
      ...basePreset,
      headerImage: dbTemplate.headerImage || basePreset.headerImage,
      signatureImage: dbTemplate.signatureImage || basePreset.signatureImage,
      prefix: dbTemplate.subjectPrefix || basePreset.prefix,
      invoicePrefix: dbTemplate.invoicePrefix || basePreset.invoicePrefix,
      primaryColor: dbTemplate.primaryColor || basePreset.primaryColor,
      secondaryColor: dbTemplate.secondaryColor || basePreset.secondaryColor,
      bank: {
        bankName: dbTemplate.bankName || "",
        accountNumber: dbTemplate.accountNumber || "",
        ifsc: dbTemplate.ifsc || "",
        accountHolder: dbTemplate.accountHolder || "",
        pan: dbTemplate.pan || "",
      },
    };
  }

  return { ...basePreset, bank: EMPTY_BANK };
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
