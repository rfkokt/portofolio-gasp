"use client";

import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "default";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && options && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={handleCancel}
        >
          <div 
            className="bg-background border border-border p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full shrink-0 ${
                options.type === "danger" 
                  ? "bg-red-500/10" 
                  : options.type === "warning"
                  ? "bg-yellow-500/10"
                  : "bg-foreground/10"
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  options.type === "danger" 
                    ? "text-red-500" 
                    : options.type === "warning"
                    ? "text-yellow-500"
                    : "text-foreground"
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {options.title || "Confirm"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {options.message}
                </p>
              </div>
              <button 
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border border-border font-bold text-sm uppercase tracking-wider hover:bg-foreground/5 transition-colors"
              >
                {options.cancelText || "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${
                  options.type === "danger"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
