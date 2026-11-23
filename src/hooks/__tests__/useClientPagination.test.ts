import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useClientPagination } from '../useClientPagination';

describe('useClientPagination', () => {
  const items = Array.from({ length: 45 }, (_, i) => ({ id: i + 1 }));

  it('slices items to active page size', () => {
    const { result } = renderHook(() => useClientPagination(items, { initialPageSize: 10 }));

    expect(result.current.pagedItems.length).toBe(10);
    expect(result.current.pagedItems[0].id).toBe(1);
    expect(result.current.pagedItems[9].id).toBe(10);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(5);
  });

  it('navigates page and updates slice', () => {
    const { result } = renderHook(() => useClientPagination(items, { initialPageSize: 10 }));

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.pagedItems.length).toBe(10);
    expect(result.current.pagedItems[0].id).toBe(11);
    expect(result.current.page).toBe(2);
  });

  it('changes page size and resets page to 1', () => {
    const { result } = renderHook(() => useClientPagination(items, { initialPageSize: 10 }));

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.setPageSize(25);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.pagedItems.length).toBe(25);
  });

  it('automatically resets page to 1 when resetDeps change', () => {
    let searchTerm = 'foo';
    const { result, rerender } = renderHook(
      ({ search }) => useClientPagination(items, { initialPageSize: 10, resetDeps: [search] }),
      { initialProps: { search: searchTerm } }
    );

    act(() => {
      result.current.setPage(4);
    });
    expect(result.current.page).toBe(4);

    searchTerm = 'bar';
    rerender({ search: searchTerm });

    expect(result.current.page).toBe(1);
  });
});
