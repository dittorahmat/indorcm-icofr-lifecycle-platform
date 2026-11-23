import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  className?: string;
}

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  className = '',
}: DataTablePaginationProps) {
  const { t } = useTranslation('common');
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 border-t border-border/80 bg-background/50 text-xs text-muted-foreground ${className}`}
      data-testid="data-table-pagination"
    >
      <div className="flex items-center gap-2">
        <span>
          {t('pagination.showing', {
            start: startItem,
            end: endItem,
            total: totalItems,
            defaultValue: `Menampilkan ${startItem}-${endItem} dari ${totalItems} data`,
          })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">
              {t('pagination.rows', { defaultValue: 'Baris:' })}
            </span>
            <select
              aria-label={t('pagination.rowsPerPage', { defaultValue: 'Baris per halaman' })}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 min-h-[44px] sm:min-h-0 rounded border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            aria-label={t('pagination.firstPage', { defaultValue: 'Halaman pertama' })}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label={t('pagination.prevPage', { defaultValue: 'Halaman sebelumnya' })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-2 font-medium text-foreground">
            {safePage} / {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label={t('pagination.nextPage', { defaultValue: 'Halaman berikutnya' })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            aria-label={t('pagination.lastPage', { defaultValue: 'Halaman terakhir' })}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
