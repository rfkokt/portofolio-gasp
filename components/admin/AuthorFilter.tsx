"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AuthorFilterProps {
  currentUser?: string;
}

export function AuthorFilter({ currentUser }: AuthorFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAuthor = searchParams.get("author") || "all";
  const [open, setOpen] = useState(false);

  function setAuthor(author: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (author && author !== "all") {
      params.set("author", author);
    } else {
      params.delete("author");
    }
    params.set("page", "1"); // Reset to page 1
    router.push(`?${params.toString()}`);
    setOpen(false);
  }

  const options = [
    { value: "all", label: "All Authors" },
    { value: "AI", label: "AI" },
    ...(currentUser ? [{ value: currentUser, label: `${currentUser} (Me)` }] : []),
  ];

  const selectedLabel = options.find(o => o.value === currentAuthor)?.label || "All Authors";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center justify-between px-3 py-2 border border-border rounded-md text-sm bg-background w-[200px] h-[40px] focus:outline-none focus:ring-1 focus:ring-foreground transition-colors hover:bg-muted/50"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1 bg-background border border-border rounded-md shadow-md">
        {options.map((option) => (
          <div
            key={option.value}
            onClick={() => setAuthor(option.value)}
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
              currentAuthor === option.value ? "bg-accent text-accent-foreground" : ""
            )}
          >
            <span className={cn("mr-2 flex h-3.5 w-3.5 items-center justify-center")}>
              {currentAuthor === option.value && (
                <Check className="h-4 w-4" />
              )}
            </span>
            <span>{option.label}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
