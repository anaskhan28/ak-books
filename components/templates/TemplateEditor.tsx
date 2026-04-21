"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  CreditCard,
  Palette,
  Layout,
  Type,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { QuotationTemplate } from "@/app/db/schema";
import { createTemplate, updateTemplate } from "@/app/actions/templates";
import { cn, formatINR } from "@/lib/utils";
import type { TemplateProps } from "@/lib/types/document";
import { ImageUpload } from "@/components/ui/image-upload";

// Import actual templates for preview
import { AKMTemplate } from "@/components/document/templates/AkmTemplate";
import { ATKTemplate } from "@/components/document/templates/AtkTemplate";
import { VETemplate } from "@/components/document/templates/VeTemplate";
import { MadhuTemplate } from "@/components/document/templates/MadhuTemplate";
import { KGNTemplate } from "@/components/document/templates/KgnTemplate";
import { EnergyTemplate } from "@/components/document/templates/EnergyTemplate";
import { VijayTemplate } from "@/components/document/templates/VijayTemplate";
import { AKEnterpriseTemplate } from "@/components/document/templates/AkEnterprisesTemplate";

interface TemplateEditorProps {
  initialData?: QuotationTemplate;
}

const PRESETS = [
  {
    id: "akm",
    name: "Anas Khan Merchant",
    description: "Bold header bars, distinct partitions",
    defaultPrimary: "#c0392b",
    defaultSecondary: "#333333"
  },
  {
    id: "atk",
    name: "Atique Khan",
    description: "Italic headers, cleaner lines",
    defaultPrimary: "#1a1a1a",
    defaultSecondary: "#666666"
  },
  {
    id: "vedant",
    name: "Vedant Enterprises",
    description: "Industrial style, high contrast",
    defaultPrimary: "#2c3e50",
    defaultSecondary: "#95a5a6"
  },
  {
    id: "madhu",
    name: "Madhu Neil Safes",
    description: "Professional, focused on trust",
    defaultPrimary: "#000000",
    defaultSecondary: "#333333"
  },
  {
    id: "kgn",
    name: "K.G.N. Enterprises",
    description: "Bordered layout, traditional business",
    defaultPrimary: "#000000",
    defaultSecondary: "#444444"
  },
  {
    id: "energy",
    name: "Energy Security",
    description: "Strong bold headers, industrial",
    defaultPrimary: "#000000",
    defaultSecondary: "#333333"
  },
  {
    id: "vijay",
    name: "Vijay Enterprises",
    description: "Simple, highly readable",
    defaultPrimary: "#1a1a1a",
    defaultSecondary: "#666666"
  },
  {
    id: "ak-enterprises",
    name: "AK Enterprises",
    description: "Premium large-scale business layout",
    defaultPrimary: "#0066FF",
    defaultSecondary: "#333333"
  },
];

export default function TemplateEditor({ initialData }: TemplateEditorProps) {
  const router = useRouter();
  const tableRef = useRef<HTMLTableElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<Partial<QuotationTemplate>>(
    initialData || {
      name: "",
      companyName: "Anas Khan Merchant",
      address: "Mumbra, Thane - 400612",
      phone: "+91 9892493707",
      email: "anas@example.com",
      subjectPrefix: "QT-",
      invoicePrefix: "INV-",
      terms: "1. Payment within 7 days\n2. Goods once sold will not be taken back",
      primaryColor: "#c0392b",
      secondaryColor: "#333333",
      layoutPreset: "akm",
      bankName: "HDFC Bank",
      accountNumber: "50100012345678",
      ifsc: "HDFC0001234",
      accountHolder: "Anas Khan",
      pan: "ABCDE1234F",
    }
  );

  const handleChange = (field: keyof QuotationTemplate, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // If layout preset changes, update default colors if they haven't been manually set much
      if (field === "layoutPreset") {
        const preset = PRESETS.find(p => p.id === value);
        if (preset) {
          next.primaryColor = preset.defaultPrimary;
          next.secondaryColor = preset.defaultSecondary;
        }
      }
      return next;
    });
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      if (initialData?.id) {
        await updateTemplate(initialData.id, formData);
      } else {
        await createTemplate(formData as any);
      }
      router.push("/quotations");
      router.refresh();
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please check all fields.");
    } finally {
      setIsSaving(false);
    }
  }

  // Mock props for template preview
  const mockTemplateProps = useMemo<TemplateProps>(() => {
    return {
      mode: "quotation" as const,
      isReadOnly: true,
      items: [
        { description: "Industrial Shifting Services", rate: 50000, qty: 1, taxed: "0%", amount: 50000 },
        { description: "Packing and Loading Charges", rate: 5000, qty: 1, taxed: "0%", amount: 5000 },
      ],
      subtotal: 55000,
      setSubtotal: () => { },
      clientName: "Saraswat Bank",
      setClientName: () => { },
      clientBranch: "Ghatkopar Branch, Mumbai",
      setClientBranch: () => { },
      date: "2026-04-21",
      qtNumber: `${formData.subjectPrefix || "QT-"}037`,
      setDate: () => { },
      subject: "Quotation for Scrap Material Shifting",
      setSubject: () => { },
      terms: formData.terms || "",
      setTerms: () => { },
      accountBankName: formData.bankName || "",
      setAccountBankName: () => { },
      accountNumber: formData.accountNumber || "",
      setAccountNumber: () => { },
      accountIfsc: formData.ifsc || "",
      setAccountIfsc: () => { },
      accountHolder: formData.accountHolder || "",
      setAccountHolder: () => { },
      accountPan: formData.pan || "",
      setAccountPan: () => { },
      updateItem: (idx: number, field: any, value: string) => { },
      handleKeyDown: (e: any, r: number, c: number) => { },
      tableRef: tableRef as any,
      clients: [],
      signatureImage: formData.signatureImage || "/templates/anas-sign.png",
      formatINR: (n: number) => `₹ ${n.toLocaleString("en-IN")}`,
      inputCls: "bg-transparent border-0 w-full",
      primaryColor: formData.primaryColor || undefined,
      secondaryColor: formData.secondaryColor || undefined,
      headerImage: formData.headerImage || undefined,
      templateName: formData.name || undefined,
    };
  }, [formData]);

  const renderPreview = () => {
    const preset = formData.layoutPreset;
    switch (preset) {
      case "akm": return <AKMTemplate {...mockTemplateProps} />;
      case "atk": return <ATKTemplate {...mockTemplateProps} />;
      case "vedant": return <VETemplate {...mockTemplateProps} />;
      case "madhu": return <MadhuTemplate {...mockTemplateProps} />;
      case "kgn": return <KGNTemplate {...mockTemplateProps} />;
      case "energy": return <EnergyTemplate {...mockTemplateProps} />;
      case "vijay": return <VijayTemplate {...mockTemplateProps} />;
      case "ak-enterprises": return <AKEnterpriseTemplate {...mockTemplateProps} />;
      default: return <AKMTemplate {...mockTemplateProps} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F1F3F5] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-sm font-bold text-gray-800">
            {initialData ? "Edit Template" : "New Template Designer"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.name}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Tabs */}
        <div className="w-[80px] flex flex-col bg-white border-r py-8 gap-6 items-center shadow-sm z-20">
          {[
            { id: "general", icon: Layout, label: "Layout" },
            { id: "header", icon: ImageIcon, label: "Branding" },
            { id: "details", icon: Type, label: "Content" },
            { id: "banking", icon: CreditCard, label: "Money" },
            { id: "design", icon: Palette, label: "Style" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-2 transition-all w-full relative group",
                activeTab === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <div className={cn(
                "p-2 rounded-md transition-all",
                activeTab === item.id ? "bg-gray-100" : "group-hover:bg-gray-50"
              )}>
                <item.icon size={18} strokeWidth={2} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-none",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="w-[400px] bg-white border-r overflow-y-auto custom-scrollbar z-10">
          <div className="p-6 space-y-8">
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-6">General Settings</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="h-10 text-sm"
                        placeholder="e.g. Corporate Standard"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Layout Preset</Label>
                      <Select
                        value={formData.layoutPreset || undefined}
                        onValueChange={(val) => handleChange("layoutPreset", val)}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select a layout" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex flex-col justify-start items-start gap-0.5">
                                <span className="font-semibold text-xs">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground">{p.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Choose the base structure for your document.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "header" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-6">Identity & Branding</h2>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => handleChange("companyName", e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    
                    <ImageUpload 
                      label="Header Banner"
                      description="Recommended size: 1400x300px"
                      value={formData.headerImage || ""}
                      onChange={(url) => handleChange("headerImage", url)}
                      onRemove={() => handleChange("headerImage", null)}
                    />

                    <ImageUpload 
                      label="Official Signature"
                      description="Transparent PNG recommended"
                      value={formData.signatureImage || ""}
                      onChange={(url) => handleChange("signatureImage", url)}
                      onRemove={() => handleChange("signatureImage", null)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "design" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-sm font-semibold text-foreground mb-6">Color Schemes</h2>
                <div className="space-y-6">
                  <p className="text-[11px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 leading-relaxed">
                    Changing the colors below will override the default palette of the chosen <b>{formData.layoutPreset}</b> template.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary / Header Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.primaryColor || "#000000"}
                          onChange={(e) => handleChange("primaryColor", e.target.value)}
                          className="w-10 h-10 border border-border rounded-md cursor-pointer overflow-hidden p-0"
                        />
                        <Input
                          type="text"
                          value={formData.primaryColor || ""}
                          onChange={(e) => handleChange("primaryColor", e.target.value)}
                          className="flex-1 font-mono uppercase h-10"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent / Secondary Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.secondaryColor || "#000000"}
                          onChange={(e) => handleChange("secondaryColor", e.target.value)}
                          className="w-10 h-10 border border-border rounded-md cursor-pointer overflow-hidden p-0"
                        />
                        <Input
                          type="text"
                          value={formData.secondaryColor || ""}
                          onChange={(e) => handleChange("secondaryColor", e.target.value)}
                          className="flex-1 font-mono uppercase h-10"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-sm font-semibold text-foreground mb-6">Business Content</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Registered Address</Label>
                    <Textarea
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="text-sm min-h-[100px]"
                      placeholder="Enter company address..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={formData.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} className="h-10 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Terms & Conditions</Label>
                    <Textarea
                      value={formData.terms || ""}
                      onChange={(e) => handleChange("terms", e.target.value)}
                      className="text-sm min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "banking" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-sm font-semibold text-foreground mb-6">Financial & Prefixes</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={formData.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value)} className="h-10 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={formData.accountNumber || ""} onChange={(e) => handleChange("accountNumber", e.target.value)} className="h-10 text-sm font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>IFSC Code</Label>
                      <Input value={formData.ifsc || ""} onChange={(e) => handleChange("ifsc", e.target.value)} className="h-10 text-sm font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN / TAN</Label>
                      <Input value={formData.pan || ""} onChange={(e) => handleChange("pan", e.target.value)} className="h-10 text-sm font-mono" />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="block mb-4 text-xs font-semibold text-muted-foreground uppercase">Document Prefixes</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quotation Prefix</Label>
                        <Input value={formData.subjectPrefix || ""} onChange={(e) => handleChange("subjectPrefix", e.target.value)} className="h-10 text-sm font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label>Invoice Prefix</Label>
                        <Input value={formData.invoicePrefix || ""} onChange={(e) => handleChange("invoicePrefix", e.target.value)} className="h-10 text-sm font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-12 items-center bg-gray-50 relative">
          {/* Main Document Layout */}
          <div className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-xl border border-gray-200 rounded-sm flex flex-col p-8 md:p-12 relative">
            {renderPreview()}
          </div>


        </div>
      </div>
    </div>
  );
}
