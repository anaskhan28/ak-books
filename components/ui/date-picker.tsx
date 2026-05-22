"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn, formatDateDMY } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  name?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className,
  wrapperClassName,
  name,
}: DatePickerProps) {
  const [inputValue, setInputValue] = useState("");

  // Sync state when external value changes
  useEffect(() => {
    setInputValue(formatDateDMY(value));
  }, [value]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    
    // Auto-parse if valid DD-MM-YYYY typed
    const parts = val.split("-");
    if (parts.length === 3) {
      const d = parts[0];
      const m = parts[1];
      const y = parts[2];
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const iso = `${y}-${m}-${d}`;
        const parsed = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        if (!isNaN(parsed.getTime())) {
          onChange(iso);
        }
      }
    }
  };

  const getSelectedDate = (): Date | undefined => {
    if (!value) return undefined;
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      return isNaN(dateObj.getTime()) ? undefined : dateObj;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  return (
    <div className={cn("relative flex items-center w-full max-w-[16rem]", wrapperClassName)}>
      {name && <input type="hidden" name={name} value={value} />}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 pr-10 text-[14px] text-foreground bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary placeholder:text-muted-foreground/40 font-medium transition-all",
          className
        )}
      />
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-3 text-muted-foreground/50 hover:text-primary transition-colors flex items-center justify-center p-1"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[60]" align="start">
          <Calendar
            mode="single"
            selected={getSelectedDate()}
            onSelect={(d) => {
              if (d) {
                const formattedISO = format(d, "yyyy-MM-dd");
                const formattedDMY = format(d, "dd-MM-yyyy");
                setInputValue(formattedDMY);
                onChange(formattedISO);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
