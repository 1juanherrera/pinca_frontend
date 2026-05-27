import { describe, it, expect } from 'vitest';
import { formatoPesoColombiano, parsePesoColombiano } from './formatters';

describe('formatoPesoColombiano', () => {
  it('formatea un entero como pesos colombianos sin decimales', () => {
    const out = formatoPesoColombiano(48000);
    // Intl puede usar espacios non-breaking; chequeamos los dígitos agrupados.
    expect(out).toMatch(/48\.000/);
    expect(out).not.toMatch(/,/); // sin decimales
  });

  it('formatea 0 correctamente', () => {
    expect(formatoPesoColombiano(0)).toMatch(/0/);
  });

  it('formatea valores grandes con separador de miles', () => {
    expect(formatoPesoColombiano(1500000)).toMatch(/1\.500\.000/);
  });
});

describe('parsePesoColombiano', () => {
  it('devuelve el mismo número si ya es número', () => {
    expect(parsePesoColombiano(48000)).toBe(48000);
  });

  it('parsea string con símbolo, miles y decimales colombianos', () => {
    expect(parsePesoColombiano('$ 48.000,00')).toBe(48000);
  });

  it('parsea string con solo separador de miles', () => {
    expect(parsePesoColombiano('1.500.000')).toBe(1500000);
  });

  it('devuelve 0 para null, undefined o string vacío', () => {
    expect(parsePesoColombiano(null)).toBe(0);
    expect(parsePesoColombiano(undefined)).toBe(0);
    expect(parsePesoColombiano('')).toBe(0);
  });

  it('preserva la parte decimal', () => {
    expect(parsePesoColombiano('1.234,56')).toBeCloseTo(1234.56, 2);
  });
});
