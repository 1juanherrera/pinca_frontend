import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useClientPagination from './useClientPagination';

const makeData = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

describe('useClientPagination', () => {
  it('pagina el dataset según perPage', () => {
    const { result } = renderHook(() => useClientPagination(makeData(45), 20));
    expect(result.current.totalItems).toBe(45);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginated).toHaveLength(20);
    expect(result.current.paginated[0].id).toBe(1);
  });

  it('devuelve la página solicitada', () => {
    const { result } = renderHook(() => useClientPagination(makeData(45), 20));
    act(() => result.current.setCurrentPage(2));
    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginated[0].id).toBe(21);
    expect(result.current.paginated).toHaveLength(20);
  });

  it('la última página puede tener menos elementos', () => {
    const { result } = renderHook(() => useClientPagination(makeData(45), 20));
    act(() => result.current.setCurrentPage(3));
    expect(result.current.paginated).toHaveLength(5);
    expect(result.current.paginated[0].id).toBe(41);
  });

  it('clampa la página actual si excede el total de páginas', () => {
    const { result } = renderHook(() => useClientPagination(makeData(10), 20));
    expect(result.current.totalPages).toBe(1);
    act(() => result.current.setCurrentPage(99));
    expect(result.current.currentPage).toBe(1);
  });

  it('maneja un dataset vacío sin romper', () => {
    const { result } = renderHook(() => useClientPagination([], 20));
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginated).toHaveLength(0);
  });
});
