import { toast } from "sonner";
import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

/**
 * Premium alert utility using Sonner.
 * Replaces default window.alert and window.confirm with beautiful, non-blocking toasts.
 */
export const alerts = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },
  /**
   * Promise-based confirmation toast.
   * Usage: if (await alerts.confirm("Delete?")) { ... }
   */
  confirm: (message: string, description?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      toast.custom((t) => (
        <div className="bg-white border border-gray-200 rounded-xl p-5 w-[350px] md:w-[400px] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">
                {message}
              </h3>
              {description && (
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => {
                    toast.dismiss(t);
                    resolve(true);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t);
                    resolve(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 text-[13px] font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}
              className="text-gray-300 hover:text-gray-500 transition-colors -mt-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
      });
    });
  },
};
