"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, CheckCircle2, XCircle, X } from "lucide-react";

interface ProgressEvent {
  type: "start" | "step" | "processing" | "completed" | "done" | "error";
  message: string;
  current?: number;
  total?: number;
  completed?: number;
  title?: string;
  count?: number;
}

interface GenerationState {
  isGenerating: boolean;
  progress: ProgressEvent[];
  completed: number;
  total: number;
  startedAt: number;
}

const STORAGE_KEY = "blog-generation-state";

export function GenerateBlogButton() {
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Restore state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: GenerationState = JSON.parse(stored);
        // Check if generation was in progress (less than 15 mins ago)
        if (state.isGenerating && Date.now() - state.startedAt < 900000) {
          setLoading(true);
          setProgress(state.progress);
          setCompleted(state.completed);
          setTotal(state.total);
          setShowProgress(true);
          
          // Reconnect to SSE
          reconnectToStream(state.total);
        } else {
          // Clear old state
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = (updates: Partial<GenerationState>) => {
    const current = localStorage.getItem(STORAGE_KEY);
    const state: GenerationState = current ? JSON.parse(current) : {
      isGenerating: false,
      progress: [],
      completed: 0,
      total: 0,
      startedAt: Date.now(),
    };
    
    const newState = { ...state, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const clearState = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const reconnectToStream = (targetCount: number) => {
    // Note: SSE doesn't support reconnection to same session
    // Show message that generation is in progress
    setProgress(prev => [...prev, { 
      type: "step", 
      message: "⚠️ Generation in progress on server..." 
    }]);
  };

  const handleGenerate = async () => {
    if (count < 1 || count > 10) {
      setProgress([{ type: "error", message: "Count must be between 1 and 10" }]);
      return;
    }

    setLoading(true);
    setProgress([]);
    setCompleted(0);
    setTotal(count);
    setShowProgress(true);
    
    // Save initial state
    saveState({
      isGenerating: true,
      progress: [],
      completed: 0,
      total: count,
      startedAt: Date.now(),
    });

    try {
      const eventSource = new EventSource(`/api/generate-blog?count=${count}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: ProgressEvent = JSON.parse(event.data);
          
          setProgress((prev) => {
            const newProgress = [...prev, data].slice(-5);
            saveState({ progress: newProgress });
            return newProgress;
          });

          if (data.type === "completed") {
            const newCompleted = data.completed || 0;
            setCompleted(newCompleted);
            saveState({ completed: newCompleted });
          }

          if (data.type === "done" || data.type === "error") {
            eventSource.close();
            setLoading(false);
            saveState({ isGenerating: false });
            
            if (data.type === "done") {
              setTimeout(() => {
                clearState();
                window.location.reload();
              }, 3000);
            }
          }
        } catch (e) {
          console.error("Parse error:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setLoading(false);
        saveState({ isGenerating: false });
        setProgress((prev) => [...prev, { type: "error", message: "Connection lost" }]);
      };

    } catch (error: any) {
      setLoading(false);
      saveState({ isGenerating: false });
      setProgress([{ type: "error", message: error.message || "Something went wrong" }]);
    }
  };

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setLoading(false);
    clearState();
    setProgress((prev) => [...prev, { type: "error", message: "Cancelled by user" }]);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          disabled={loading}
          className="w-[50px] h-[40px] px-2 py-2 border border-border bg-background text-foreground text-center text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
          title="Number of blogs to generate (1-10)"
        />
        {loading ? (
          <button
            onClick={handleCancel}
            className="h-[40px] px-4 py-2 border border-red-500 text-red-500 font-bold text-sm uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors inline-flex items-center gap-2 rounded-md"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            className="h-[40px] px-4 py-2 border border-border text-foreground font-bold text-xs uppercase tracking-wider hover:bg-muted transition-colors inline-flex items-center gap-2 rounded-md bg-background"
          >
            <Sparkles className="w-4 h-4" />
            Generate AI
          </button>
        )}
      </div>

      {/* Progress Panel */}
      {showProgress && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {loading ? "Generating..." : completed > 0 ? "Complete!" : "Stopped"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {completed}/{total} done
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <button 
              onClick={() => setShowProgress(false)}
              className="ml-2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress messages */}
          <div className="p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs">
            {progress.map((p, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-2 ${
                  p.type === "error" ? "text-red-500" :
                  p.type === "completed" ? "text-emerald-500" :
                  p.type === "done" ? "text-emerald-500 font-medium" :
                  "text-muted-foreground"
                }`}
              >
                {p.type === "processing" && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0 mt-0.5" />}
                {p.type === "completed" && <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                {p.type === "done" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                {p.type === "error" && <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                <span className="break-words">{p.message}</span>
              </div>
            ))}
            {loading && progress.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Initializing...</span>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="p-2 border-t border-border bg-muted/20">
              <button
                onClick={() => { setShowProgress(false); clearState(); }}
                className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Floating indicator when panel is closed but still generating */}
      {loading && !showProgress && (
        <button
          onClick={() => setShowProgress(true)}
          className="fixed bottom-4 right-4 px-4 py-2 bg-emerald-500 text-white rounded-full shadow-lg flex items-center gap-2 z-50 hover:bg-emerald-600 transition-colors"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Generating {completed}/{total}</span>
        </button>
      )}
    </div>
  );
}
