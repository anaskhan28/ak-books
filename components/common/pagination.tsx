"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  limit: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function Pagination({
  currentPage,
  limit,
  totalCount,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIdx = Math.min(totalCount, currentPage * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border/60">
      {/* Left side: total count info */}
      <div className="text-[13px] text-muted-foreground">
        Total Count: <span className="font-semibold text-foreground">{totalCount}</span>
      </div>

      {/* Right side: limit select + navigation buttons */}
      <div className="flex items-center gap-4">
        {/* Limit select */}
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 px-2 text-[12px] bg-background border border-border rounded-lg text-foreground hover:bg-accent transition-colors outline-none cursor-pointer font-medium"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Range and Navigation */}
        <div className="flex items-center gap-1.5 border border-border rounded-lg p-0.5 bg-background shadow-2xs">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Previous Page"
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="px-2 text-[12px] font-semibold text-foreground min-w-[50px] text-center select-none">
            {startIdx} - {endIdx}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Next Page"
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
