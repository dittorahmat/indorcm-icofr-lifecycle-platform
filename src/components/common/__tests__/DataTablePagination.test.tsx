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

  it('disables previous button on first page and enables next button', () => {
    const onPageChange = vi.fn();
    render(
      <DataTablePagination
        page={1}
        pageSize={10}
        totalItems={45}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /halaman sebelumnya/i });
    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables next button on last page and enables previous button', () => {
    const onPageChange = vi.fn();
    render(
      <DataTablePagination
        page={5}
        pageSize={10}
        totalItems={45}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /halaman sebelumnya/i });
    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });

    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(4);
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
