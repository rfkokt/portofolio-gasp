"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface ProgressEvent {
  type: "start" | "step" | "processing" | "completed" | "done" | "error";
  message: string;
  completed?: number;
}

interface GenerationState {
  isGenerating: boolean;
  progress: ProgressEvent[];
  completed: number;
  total: number;
  startedAt: number;
}

const STORAGE_KEY = "blog-generation-state";

export function BlogGenerationNotification() {
  const pathname = usePathname();
  const isPostsPage = pathname === "/cms/posts";
  
  const [state, setState] = useState<GenerationState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Listen for storage changes
  useEffect(() => {
    const checkState = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed: GenerationState = JSON.parse(stored);
          // Only show if generating and less than 15 mins old
          if (parsed.isGenerating && Date.now() - parsed.startedAt < 900000) {
            setState(parsed);
            setDismissed(false);
          } else if (!parsed.isGenerating && parsed.completed > 0) {
            // Keep showing completion message for a bit
            setState(parsed);
          } else {
            setState(null);
          }
        } catch (e) {
          setState(null);
        }
      } else {
        setState(null);
      }
    };

    checkState();
    
    // Poll for updates
    const interval = setInterval(checkState, 1000);
    
    // Listen for storage events from other tabs
    window.addEventListener("storage", checkState);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkState);
    };
  }, []);

  // Don't show on posts page (uses inline panel) or if dismissed
  if (isPostsPage || !state || dismissed) return null;

  const lastMessage = state.progress[state.progress.length - 1];

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-background border border-border rounded-lg shadow-xl overflow-hidden min-w-80">
        {/* Header */}
        <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {state.isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-sm font-medium text-foreground">
              {state.isGenerating ? "Generating Blogs..." : "Generation Complete!"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {state.completed}/{state.total}
            </span>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setDismissed(true)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${state.total > 0 ? (state.completed / state.total) * 100 : 0}%` }}
          />
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="p-3 space-y-2 text-xs max-h-32 overflow-y-auto">
            {state.progress.slice(-5).map((p, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-2 ${
                  p.type === "error" ? "text-red-500" :
                  p.type === "completed" ? "text-emerald-500" :
                  "text-muted-foreground"
                }`}
              >
                {p.type === "completed" && <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                {p.type === "error" && <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                <span className="break-words">{p.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Last message preview when collapsed */}
        {!expanded && lastMessage && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {lastMessage.message}
          </div>
        )}

        {/* View in posts page link */}
        <div className="p-2 border-t border-border bg-muted/20">
          <Link
            href="/cms/posts"
            className="block text-center text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            View in Blog Posts →
          </Link>
        </div>
      </div>
    </div>
  );
}
