"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = params.get("search") || "";
      
      if (searchTerm === currentSearch) return;

      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to page 1 on search
      router.push(`?${params.toString()}`);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, router, searchParams]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9 pr-4 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-foreground w-[240px] h-[40px]"
      />
    </div>
  );
}
