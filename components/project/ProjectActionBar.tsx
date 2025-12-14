"use client";

import { useEffect, useState, useRef } from "react";
import fpPromise from "@fingerprintjs/fingerprintjs";
import { pb } from "@/lib/pocketbase";
import { Share2, Copy, Check, Twitter, Linkedin, Facebook, MessageCircle, BarChart2, X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { submitProjectInteraction } from "@/actions/interactions";

interface InteractionCounts {
  clap: number;
  love: number;
  care: number;
  view: number;
  share: number;
}

interface ProjectActionBarProps {
  projectId: string;
  slug: string;
  title: string;
}

const ICONS = {
    clap: {
        normal: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png",
        max: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Milky%20Way.png"
    },
    love: {
        normal: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png",
        max: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Comet.png"
    },
    care: {
        normal: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Light%20Bulb.png",
        max: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20with%20professions/Man%20Technologist%20Light%20Skin%20Tone.png"
    }
};

const MAX_CLICKS = 5;

export function ProjectActionBar({ projectId, slug, title }: ProjectActionBarProps) {
  const [counts, setCounts] = useState<InteractionCounts>({ clap: 0, love: 0, care: 0, view: 0, share: 0 });
  const [visitorId, setVisitorId] = useState<string>("");
  const [hasInteracted, setHasInteracted] = useState<Record<string, boolean>>({});
  const [userClicks, setUserClicks] = useState<Record<string, number>>({ clap: 0, love: 0, care: 0 });
  
  // Share state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Insight state
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  useEffect(() => {
    const loadFp = async () => {
        try {
            const fp = await fpPromise.load();
            const result = await fp.get();
            const vid = result.visitorId;
            
            setVisitorId(vid);
            localStorage.setItem("visitor_id", vid);
            fetchCounts(vid);
            
            // Track View once
            const viewedKey = `viewed_project_${projectId}_${vid}`;
            if (!sessionStorage.getItem(viewedKey)) {
                trackInteraction("view", vid);
                sessionStorage.setItem(viewedKey, "true");
            }
        } catch (error) {
            console.error("Failed to load fingerprint:", error);
            let vid = localStorage.getItem("visitor_id");
            if (!vid) {
                vid = crypto.randomUUID();
                localStorage.setItem("visitor_id", vid);
            }
            setVisitorId(vid);
            fetchCounts(vid);
        }
    };

    loadFp();
    
    // Load local click counts
    const storedClicks = localStorage.getItem(`project_clicks_${projectId}`);
    if (storedClicks) {
        setUserClicks(JSON.parse(storedClicks));
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
            setIsShareOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [projectId]);

  async function trackInteraction(type: string, vid: string = visitorId) {
      if (!vid) return;
      try {
        const result = await submitProjectInteraction({
            project: projectId,
            type: type,
            visitor_id: vid,
        });
        if (result.error) {
            console.error(`Failed to track ${type}:`, result.error);
        }
      } catch (err) {
          console.error(`Failed to track ${type}:`, err);
      }
  }

  async function fetchCounts(currentVisitorId: string = visitorId) {
    try {
        const records = await pb.collection("project_interactions").getFullList({
            filter: `project="${projectId}"`,
        });
        
        const newCounts = { clap: 0, love: 0, care: 0, view: 0, share: 0 };
        const userInteractions: Record<string, boolean> = {};
        const myClicks: Record<string, number> = { clap: 0, love: 0, care: 0 };

        records.forEach((rec) => {
            if (rec.type in newCounts) {
                newCounts[rec.type as keyof InteractionCounts]++;
            }
            if (rec.visitor_id === currentVisitorId) {
                userInteractions[rec.type] = true;
                if (rec.type in myClicks) {
                    myClicks[rec.type as keyof typeof myClicks]++;
                }
            }
        });

        setCounts(newCounts);
        setHasInteracted(userInteractions);
        setUserClicks(myClicks);
    } catch (error) {
        console.error("Failed to fetch project interactions:", error);
    }
  }

  async function handleInteraction(type: "clap" | "love" | "care", e: React.MouseEvent) {
    if (!visitorId) return;
    
    // Check limit
    if ((userClicks[type] || 0) >= MAX_CLICKS) return;

    // Optimistic update
    setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    setHasInteracted((prev) => ({ ...prev, [type]: true }));
    
    // Update local clicks
    const newClicks = { ...userClicks, [type]: (userClicks[type] || 0) + 1 };
    setUserClicks(newClicks);
    localStorage.setItem(`project_clicks_${projectId}`, JSON.stringify(newClicks));

    trackInteraction(type);
  }

  const copyToClipboard = () => {
    const url = `${window.location.origin}/projects/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleShareTrack();
  };

  const handleShareTrack = () => {
      setCounts((prev) => ({ ...prev, share: prev.share + 1 }));
      trackInteraction("share");
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/projects/${slug}` : '';

  return (
    <>
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:right-auto">
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center justify-evenly sm:justify-start gap-0 sm:gap-1 p-2 sm:p-2 sm:pl-4 sm:pr-2 bg-background/95 backdrop-blur-xl border border-foreground/20 rounded-2xl sm:rounded-full shadow-2xl relative w-full sm:w-auto"
        >
            {/* Emoji Reactions */}
            <InteractionButton 
                icon={userClicks.clap >= MAX_CLICKS ? ICONS.clap.max : ICONS.clap.normal} 
                count={counts.clap} 
                active={hasInteracted.clap}
                disabled={userClicks.clap >= MAX_CLICKS}
                color="text-yellow-500"
                bgColor="bg-yellow-500/10"
                onClick={(e: React.MouseEvent) => handleInteraction("clap", e)} 
            />
            <InteractionButton 
                icon={userClicks.love >= MAX_CLICKS ? ICONS.love.max : ICONS.love.normal} 
                count={counts.love} 
                active={hasInteracted.love}
                disabled={userClicks.love >= MAX_CLICKS}
                color="text-red-500"
                bgColor="bg-red-500/10"
                onClick={(e: React.MouseEvent) => handleInteraction("love", e)} 
            />
            <InteractionButton 
                icon={userClicks.care >= MAX_CLICKS ? ICONS.care.max : ICONS.care.normal} 
                count={counts.care} 
                active={hasInteracted.care}
                disabled={userClicks.care >= MAX_CLICKS}
                color="text-violet-500"
                bgColor="bg-violet-500/10"
                onClick={(e: React.MouseEvent) => handleInteraction("care", e)} 
            />

            <div className="w-px h-6 bg-border mx-2 hidden sm:block" />

            {/* Insight Button */}
            <button 
                onClick={() => setIsInsightOpen(true)}
                className="p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
                <BarChart2 className="w-5 h-5" />
            </button>

            {/* Share Button */}
            <div className="relative" ref={shareRef}>
                <button 
                    onClick={() => setIsShareOpen(!isShareOpen)}
                    className={cn(
                        "p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0",
                        isShareOpen && "bg-muted text-foreground"
                    )}
                >
                    <Share2 className="w-5 h-5" />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                    {isShareOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 sm:left-1/2 sm:-translate-x-1/2 w-56 bg-background border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-1"
                        >
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors text-left w-full"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                <span>{copied ? "Copied!" : "Copy Link"}</span>
                            </button>

                            <div className="h-px bg-border/50 my-1 mx-2" />

                            <ShareLink 
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`} 
                                icon={<Twitter size={16} />} 
                                label="X / Twitter" 
                                onClick={handleShareTrack}
                            />
                            <ShareLink 
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} 
                                icon={<Facebook size={16} />} 
                                label="Facebook" 
                                onClick={handleShareTrack}
                            />
                            <ShareLink 
                                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`} 
                                icon={<Linkedin size={16} />} 
                                label="LinkedIn" 
                                onClick={handleShareTrack}
                            />
                            <ShareLink 
                                href={`https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`} 
                                icon={<MessageCircle size={16} />} 
                                label="WhatsApp" 
                                onClick={handleShareTrack}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
        </div>

        {/* Insight Modal */}
        <AnimatePresence>
            {isInsightOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsInsightOpen(false)}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-background border border-border rounded-2xl shadow-2xl p-6 z-[61]"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-mono text-lg font-bold">Project Insights</h2>
                            <button onClick={() => setIsInsightOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center mb-10">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Views</span>
                                <span className="text-2xl font-black">{counts.view}</span>
                            </div>
                             <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Shares</span>
                                <span className="text-2xl font-black">{counts.share}</span>
                            </div>
                             <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Reactions</span>
                                <span className="text-2xl font-black">{counts.clap + counts.love + counts.care}</span>
                            </div>
                        </div>

                         <div className="flex justify-center gap-6">
                            <ReactionStat 
                                icon={<img src={ICONS.clap.normal} alt="Clap" className="w-12 h-12" />} 
                                count={counts.clap} 
                            />
                            <ReactionStat 
                                icon={<img src={ICONS.love.normal} alt="Love" className="w-12 h-12" />} 
                                count={counts.love} 
                            />
                            <ReactionStat 
                                icon={<img src={ICONS.care.normal} alt="Care" className="w-12 h-12" />} 
                                count={counts.care} 
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </>
  );
}

function ReactionStat({ icon, count }: { icon: React.ReactNode; count: number }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-muted/30 rounded-full">
                {icon}
            </div>
            <span className="font-mono font-medium text-sm bg-muted/50 px-3 py-1 rounded-full">
                {count}
            </span>
        </div>
    );
}

function ShareLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={onClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-500/10 text-sm text-foreground/80 hover:text-blue-500 transition-colors"
        >
            {icon}
            <span>{label}</span>
        </a>
    );
}

function InteractionButton({ icon, count, active, disabled, color, bgColor, onClick }: { 
    icon: string; 
    count: number; 
    active: boolean; 
    disabled: boolean; 
    color: string; 
    bgColor: string; 
    onClick: (e: React.MouseEvent) => void 
}) {
    const [localParticles, setLocalParticles] = useState<{id: number, x: number, rotate: number}[]>([]);

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return;
        onClick(e);
        
        const id = Date.now();
        const x = Math.random() * 60 - 30;
        const rotate = Math.random() * 40 - 20;
        
        setLocalParticles(prev => [...prev, { id, x, rotate }]);
        setTimeout(() => {
             setLocalParticles(prev => prev.filter(p => p.id !== id));
        }, 1000);
    };

    return (
        <button 
            onClick={handleClick}
            disabled={disabled}
            className={cn(
                "group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-full transition-all shrink-0",
                active ? bgColor : "hover:bg-muted/50",
                disabled && "opacity-80 cursor-not-allowed bg-muted/20"
            )}
        >
            <div className="relative">
                <span className={cn(
                    "transition-all duration-300 block", 
                    active ? color : "text-muted-foreground group-hover:text-foreground",
                    disabled ? "scale-110 saturate-[1.5]" : "scale-100"
                )}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={icon}
                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center w-8 h-8"
                        >
                            <img src={icon} alt="icon" className="w-full h-full object-contain block" />
                        </motion.div>
                    </AnimatePresence>
                </span>

                {/* Floating Particles */}
                <AnimatePresence>
                    {localParticles.map((p) => (
                         <motion.div
                            key={p.id}
                            initial={{ y: 0, x: 0, opacity: 1, scale: 0.5, rotate: 0 }}
                            animate={{ y: -80, x: p.x, opacity: 0, scale: 1.5, rotate: p.rotate }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                        >
                            <img src={icon} alt="float" className="w-8 h-8 object-contain block" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <span className="absolute -bottom-8 text-[10px] font-mono font-medium text-foreground bg-background border border-border px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {count}
            </span>
        </button>
    );
}
