"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Upload, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/app/actions/cloudinary";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
  description?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  description,
  className
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64 for the server action
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const result = await uploadImage(base64Data);

      if (!result.success || !result.url) {
        throw new Error(result.error || "Upload failed");
      }

      onChange(result.url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-bold text-gray-700">{label}</label>
          {description && <p className="text-[11px] text-muted-foreground leading-none">{description}</p>}
        </div>
      )}

      <div className="relative">
        {value ? (
          <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-primary/20 bg-primary/5 transition-all">
            <img 
              src={value} 
              alt="Uploaded" 
              className="w-full h-auto max-h-40 object-contain mx-auto p-4"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-lg"
                onClick={onRemove}
              >
                <X size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-white border-0 hover:bg-gray-100"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} className="mr-2" />
                Replace
              </Button>
            </div>
            <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full text-white shadow-sm">
              <Check size={10} strokeWidth={4} />
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-xl border-2 border-dashed transition-all",
              "border-muted hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
              isUploading && "opacity-60 cursor-not-allowed border-primary animate-pulse"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
              isUploading ? "bg-primary/10 text-primary" : "bg-gray-100 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {isUploading ? "Uploading locally..." : "Click to upload image"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG, or WEBP (Max. 5MB)</p>
            </div>
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-[11px] text-destructive font-medium animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
