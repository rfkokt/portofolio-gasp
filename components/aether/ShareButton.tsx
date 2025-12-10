"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, Twitter, Linkedin, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && !!navigator.share);
    setCurrentUrl(url || window.location.href);
  }, [url]);

  const handleShare = async () => {
    if (isSupported) {
      try {
        await navigator.share({
          title,
          text,
          url: currentUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".share-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative share-container inline-block", className)}>
      <button
        onClick={handleShare}
        className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-border rounded-full hover:bg-foreground hover:text-background transition-all duration-300 backdrop-blur-sm bg-background/50 text-muted-foreground",
            className
        )}
      >
        <Share2 size={14} />
        <span>Share</span>
      </button>

      {/* Desktop Fallback Dropdown */}
      {!isSupported && isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
          
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors text-left w-full"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <div className="h-px bg-border/50 my-1 mx-2" />

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            <Twitter size={16} />
            <span>X / Twitter</span>
          </a>

          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            <Linkedin size={16} />
            <span>LinkedIn</span>
          </a>
          
          <a
            href={`https://wa.me/?text=${encodeURIComponent(title + " " + currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
             <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-circle"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            <span>WhatsApp</span>
          </a>

        </div>
      )}
    </div>
  );
}
