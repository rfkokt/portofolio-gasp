"use client";

import { useMemo, useState } from 'react';
import { analyzeSeo } from '@/lib/seo-analyzer';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Loader2, Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { optimizeSeoFields } from '@/actions/optimize-seo';

interface SeoScoreCardProps {
    title: string;
    excerpt: string;
    slug: string;
    content: string;
    onOptimize?: (data: { title: string, excerpt: string, slug: string, content?: string, tags?: string[] }) => void;
}

export function SeoScoreCard({ title, excerpt, slug, content, onOptimize }: SeoScoreCardProps) {
    const analysis = useMemo(() => analyzeSeo(title, excerpt, slug, content), [title, excerpt, slug, content]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customInstruction, setCustomInstruction] = useState("");

    const handleOptimize = async (isCustom: boolean = false) => {
        if (!onOptimize) return;
        setOptimizing(true);
        try {
            let instruction = "";
            if (isCustom) {
                instruction = customInstruction;
            } else {
                // Auto mode: Send the actual recommendations/tips found by the analyzer
                // This ensures the AI knows exactly what to fix (e.g., "Use H3 headings")
                // which triggers the content rewrite logic in the backend.
                if (analysis.tips.length > 0) {
                    instruction = analysis.tips.join(". ");
                }
            }
            const result = await optimizeSeoFields(title, excerpt, content, instruction);
            if (result.success && result.data) {
                onOptimize(result.data);
                setIsExpanded(true); 
                setShowCustomInput(false);
                setCustomInstruction("");
            } else {
                console.error("Optimization failed:", result.error);
                alert("Failed to optimize: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Optimization error");
        } finally {
            setOptimizing(false);
        }
    };

    const scoreColor = analysis.score >= 80 ? 'text-green-500' : analysis.score >= 50 ? 'text-yellow-500' : 'text-red-500';
    const progressColor = analysis.score >= 80 ? 'bg-green-500' : analysis.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="w-full rounded-lg border border-border bg-card text-card-foreground shadow-sm">
             <div className="p-6 pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium leading-none tracking-tight">SEO Score</h3>
                        <p className="text-sm text-muted-foreground">Real-time analysis</p>
                    </div>
                    <div className={cn("text-2xl font-bold", scoreColor)}>
                        {analysis.score}/100
                    </div>
                </div>
                
                {/* Optimize Actions */}
                {onOptimize && analysis.score < 100 && (
                    <div className="mt-3 space-y-2">
                        {!showCustomInput ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOptimize(false)}
                                    disabled={optimizing}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                    {optimizing ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3 w-3" />
                                    )}
                                    {optimizing ? "Optimizing..." : "Auto Optimize"}
                                </button>
                                <button
                                    onClick={() => setShowCustomInput(true)}
                                    disabled={optimizing}
                                    className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                    title="Custom Instruction"
                                >
                                    <Settings2 className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 border border-border rounded-md bg-accent/20 space-y-2 animate-in fade-in slide-in-from-top-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Instruction</label>
                                    <button onClick={() => setShowCustomInput(false)} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                <textarea 
                                    value={customInstruction}
                                    onChange={(e) => setCustomInstruction(e.target.value)}
                                    placeholder='e.g., "Make it clickbait", "Professional tone"'
                                    className="w-full text-xs p-2 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                    rows={2}
                                />
                                <button
                                    onClick={() => handleOptimize(true)}
                                    disabled={optimizing || !customInstruction.trim()}
                                    className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                    {optimizing ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3 w-3" />
                                    )}
                                    Generate
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Progress Bar */}
                <div className="h-2 w-full bg-secondary overflow-hidden rounded-full mt-2">
                    <div className={cn("h-full w-full flex-1 transition-all", progressColor)} style={{ transform: `translateX(-${100 - (analysis.score || 0)}%)` }}></div>
                </div>
            </div>
            <div className="p-6 pt-0">
                <div className="flex justify-between items-center mb-4 mt-4">
                     <span className="text-xs text-muted-foreground">
                        {analysis.tips.length === 0 ? "Perfect! No issues found." : `${analysis.tips.length} issues found`}
                     </span>
                     <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                     >
                         {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     </button>
                </div>

                {isExpanded && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        {/* Metrics List */}
                        <div className="space-y-2">
                             <MetricStatus label="Title Length" status={analysis.metrics.titleLength.status} message={analysis.metrics.titleLength.message} />
                             <MetricStatus label="Excerpt" status={analysis.metrics.excerptLength.status} message={analysis.metrics.excerptLength.message} />
                             <MetricStatus label="Content Depth" status={analysis.metrics.contentLength.status} message={analysis.metrics.contentLength.message} />
                             <MetricStatus label="URL Slug" status={analysis.metrics.slugStructure.status} message={analysis.metrics.slugStructure.message} />
                             <MetricStatus label="Headings" status={analysis.metrics.headings.status} message={analysis.metrics.headings.message} />
                        </div>

                        {/* Tips */}
                        {analysis.tips.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Recommendations</h4>
                                <ul className="space-y-1">
                                    {analysis.tips.map((tip, i) => (
                                        <li key={i} className="text-xs flex gap-2 items-start text-muted-foreground">
                                            <AlertCircle className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricStatus({ label, status, message }: { label: string, status: 'good' | 'warning' | 'bad', message: string }) {
    const icon = status === 'good' 
        ? <CheckCircle2 className="h-3 w-3 text-green-500" />
        : <AlertCircle className={cn("h-3 w-3", status === 'warning' ? "text-yellow-500" : "text-red-500")} />;
    
    return (
        <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-medium text-foreground">{label}</span>
            </div>
            <span className="text-muted-foreground">{message}</span>
        </div>
    )
}
