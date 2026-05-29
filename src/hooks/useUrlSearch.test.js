import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import useUrlSearch from './useUrlSearch';

const wrapWithRouter = (initialEntries) => ({ children }) =>
  React.createElement(MemoryRouter, { initialEntries }, children);

describe('useUrlSearch', () => {
  it('devuelve string vacío cuando el param no existe', () => {
    const { result } = renderHook(() => useUrlSearch('q'), {
      wrapper: wrapWithRouter(['/clientes']),
    });
    expect(result.current).toBe('');
  });

  it('lee el valor del query param "q" (sin auto-limpiar)', () => {
    const { result } = renderHook(() => useUrlSearch('q', { clean: false }), {
      wrapper: wrapWithRouter(['/clientes?q=acme']),
    });
    expect(result.current).toBe('acme');
  });

  it('decodifica caracteres URL-encoded', () => {
    const { result } = renderHook(() => useUrlSearch('q', { clean: false }), {
      wrapper: wrapWithRouter(['/clientes?q=hello%20world']),
    });
    expect(result.current).toBe('hello world');
  });

  it('respeta el nombre custom del param', () => {
    const { result } = renderHook(() => useUrlSearch('tab', { clean: false }), {
      wrapper: wrapWithRouter(['/comercial?tab=facturas']),
    });
    expect(result.current).toBe('facturas');
  });

  it('ignora otros params si pedís uno específico', () => {
    const { result } = renderHook(() => useUrlSearch('q'), {
      wrapper: wrapWithRouter(['/x?tab=foo&otro=bar']),
    });
    expect(result.current).toBe('');
  });
});
