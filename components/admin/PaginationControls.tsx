"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface PaginationControlsProps {
  totalPages: number;
  currentPage: number;
}

export function PaginationControls({
  totalPages,
  currentPage,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  }

  // Determine which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // How many pages to show around current page

    if (totalPages <= 7) {
      // If total pages is small, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Calculate start and end of visible range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if near start or end
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const [goToPageInput, setGoToPageInput] = useState("");

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 w-full">
      {/* Pagination Numbers */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-full hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {pageNumbers.map((page, index) => (
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => goToPage(page)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-foreground text-background"
                  : "hover:bg-foreground/10 text-foreground"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="w-9 h-9 flex items-center justify-center text-muted-foreground">
              {page}
            </span>
          )
        ))}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-full hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Go To Page Input */}
      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-background">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">Go to page</span>
        <div className="h-4 w-px bg-border mx-1" />
        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder={currentPage.toString()}
          value={goToPageInput}
          onChange={(e) => setGoToPageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const page = parseInt(goToPageInput);
              if (!isNaN(page) && page >= 1 && page <= totalPages) {
                goToPage(page);
                setGoToPageInput(""); // Optional: clear after optional
              }
            }
          }}
          className="w-12 text-sm bg-transparent focus:outline-none text-right placeholder:text-muted-foreground/50"
        />
        <button 
          onClick={() => {
            const page = parseInt(goToPageInput);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
              goToPage(page);
              setGoToPageInput(""); 
            }
          }}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
