import { describe, it, expect } from 'vitest';
import cn from './cn';

describe('cn()', () => {
  it('une strings simples con espacio', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('ignora falsy values (undefined, null, false, "")', () => {
    expect(cn('a', undefined, null, false, '', 'b')).toBe('a b');
  });

  it('respeta el cero como valor válido', () => {
    expect(cn('a', 0, 'b')).toBe('a 0 b');
  });

  it('aplana arrays anidados', () => {
    expect(cn('a', ['b', ['c', 'd']], 'e')).toBe('a b c d e');
  });

  it('toma las keys de objects cuyo valor sea truthy', () => {
    expect(cn({ a: true, b: false, c: 1, d: 0, e: 'yes' })).toBe('a c e');
  });

  it('combina strings + arrays + objects en cualquier orden', () => {
    const out = cn(
      'base',
      ['extra', null],
      { active: true, disabled: false },
      undefined,
      'final',
    );
    expect(out).toBe('base extra active final');
  });

  it('devuelve string vacío sin args', () => {
    expect(cn()).toBe('');
  });
});
