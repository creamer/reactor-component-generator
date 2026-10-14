import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readStorage, writeStorage } from './storage';

const asString = (raw: unknown) => (typeof raw === 'string' ? raw : null);

describe('readStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 JSON을 parse에 통과시켜 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));

    expect(readStorage('k', asString, 'fallback')).toBe('saved');
  });

  it('저장된 값이 없으면 parse를 거치지 않고 기본값을 반환한다', () => {
    const acceptsAnything = (raw: unknown) => String(raw);

    expect(readStorage('missing', acceptsAnything, 'fallback')).toBe('fallback');
  });

  it('저장된 값이 JSON 형식이 아니면 기본값을 반환한다', () => {
    localStorage.setItem('k', '{깨진 값');

    expect(readStorage('k', asString, 'fallback')).toBe('fallback');
  });

  it('parse가 null을 반환하면(모양이 잘못된 값) 기본값을 반환한다', () => {
    localStorage.setItem('k', JSON.stringify(123));

    expect(readStorage('k', asString, 'fallback')).toBe('fallback');
  });

  it('localStorage 접근이 예외를 던져도 기본값을 반환한다', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(readStorage('k', asString, 'fallback')).toBe('fallback');

    spy.mockRestore();
  });
});

describe('writeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('값을 JSON으로 직렬화해 저장한다', () => {
    writeStorage('k', { a: [1, 2] });

    expect(localStorage.getItem('k')).toBe('{"a":[1,2]}');
  });

  it('저장 중 예외(용량 초과 등)가 나도 던지지 않는다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => writeStorage('k', 'v')).not.toThrow();

    spy.mockRestore();
  });
});
