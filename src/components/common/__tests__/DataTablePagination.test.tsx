import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTablePagination } from '../DataTablePagination';

describe('DataTablePagination', () => {
  it('renders pagination status with correct item range', () => {
    render(
      <DataTablePagination
        page={1}
        pageSize={10}
        totalItems={45}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Menampilkan 1-10 dari 45 data/i)).toBeInTheDocument();
  });

  it('renders correct range on the last page', () => {
    render(
      <DataTablePagination
        page={5}
        pageSize={10}
        totalItems={45}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Menampilkan 41-45 dari 45 data/i)).toBeInTheDocument();
  });

  it('disables previous and first button on first page and enables next/last button', () => {
    const onPageChange = vi.fn();
    render(
      <DataTablePagination
        page={1}
        pageSize={10}
        totalItems={45}
        onPageChange={onPageChange}
      />
    );

    const firstBtn = screen.getByRole('button', { name: /halaman pertama/i });
    const prevBtn = screen.getByRole('button', { name: /halaman sebelumnya/i });
    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    const lastBtn = screen.getByRole('button', { name: /halaman terakhir/i });

    expect(firstBtn).toBeDisabled();
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();
    expect(lastBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(lastBtn);
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('disables next and last button on last page and enables first/previous button', () => {
    const onPageChange = vi.fn();
    render(
      <DataTablePagination
        page={5}
        pageSize={10}
        totalItems={45}
        onPageChange={onPageChange}
      />
    );

    const firstBtn = screen.getByRole('button', { name: /halaman pertama/i });
    const prevBtn = screen.getByRole('button', { name: /halaman sebelumnya/i });
    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    const lastBtn = screen.getByRole('button', { name: /halaman terakhir/i });

    expect(firstBtn).toBeEnabled();
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeDisabled();
    expect(lastBtn).toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(4);

    fireEvent.click(firstBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageSizeChange when rows per page is changed', () => {
    const onPageSizeChange = vi.fn();
    render(
      <DataTablePagination
        page={1}
        pageSize={10}
        totalItems={45}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByRole('combobox', { name: /baris per halaman/i });
    fireEvent.change(select, { target: { value: '25' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
