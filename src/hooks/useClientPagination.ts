import React from 'react';

export interface UseClientPaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  resetDeps?: React.DependencyList;
}

export interface UseClientPaginationResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  pagedItems: T[];
  setPage: (newPage: number) => void;
  setPageSize: (newPageSize: number) => void;
  resetPage: () => void;
}

export function useClientPagination<T>(
  items: T[],
  options: UseClientPaginationOptions = {}
): UseClientPaginationResult<T> {
  const { initialPage = 1, initialPageSize = 10, resetDeps } = options;

  const [page, setPageState] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  // Auto-reset to page 1 whenever external dependencies (search term, filter) change
  React.useEffect(() => {
    if (resetDeps && resetDeps.length > 0) {
      setPageState(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps ?? []);

  const pagedItems = React.useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const setPage = React.useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setPageSize = React.useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    setPageState(1);
  }, []);

  const resetPage = React.useCallback(() => {
    setPageState(1);
  }, []);

  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
    pagedItems,
    setPage,
    setPageSize,
    resetPage,
  };
}
