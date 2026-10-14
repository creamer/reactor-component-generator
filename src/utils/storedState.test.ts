import { describe, it, expect } from 'vitest';
import { parseProvider, parsePromptHistory, parseComponents } from './storedState';

describe('parseProvider', () => {
  it('지원하는 프로바이더 문자열은 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
  });

  it('지원하지 않는 값은 null을 반환한다', () => {
    expect(parseProvider('openai')).toBeNull();
    expect(parseProvider(42)).toBeNull();
    expect(parseProvider(null)).toBeNull();
  });
});

describe('parsePromptHistory', () => {
  it('문자열 배열은 그대로 반환한다', () => {
    expect(parsePromptHistory(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parsePromptHistory('a')).toBeNull();
    expect(parsePromptHistory({ 0: 'a' })).toBeNull();
    expect(parsePromptHistory(null)).toBeNull();
  });

  it('문자열이 아닌 항목은 걸러낸다', () => {
    expect(parsePromptHistory(['a', 1, null, { x: 1 }, 'b'])).toEqual(['a', 'b']);
  });
});

describe('parseComponents', () => {
  it('createdAt 문자열을 Date로 복원한다', () => {
    const iso = '2026-10-14T04:30:00.000Z';

    const result = parseComponents([{ id: '1', prompt: 'p', code: 'c', createdAt: iso }]);

    expect(result).toEqual([{ id: '1', prompt: 'p', code: 'c', createdAt: new Date(iso) }]);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parseComponents({ id: '1' })).toBeNull();
    expect(parseComponents('x')).toBeNull();
    expect(parseComponents(null)).toBeNull();
  });

  it('필드가 잘못된 항목은 걸러낸다', () => {
    const iso = '2026-10-14T04:30:00.000Z';
    const valid = { id: '1', prompt: 'p', code: 'c', createdAt: iso };

    const result = parseComponents([
      valid,
      null,
      'text',
      { id: '2', prompt: 'p', createdAt: iso },
      { id: '3', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
      { id: 4, prompt: 'p', code: 'c', createdAt: iso },
    ]);

    expect(result).toEqual([{ ...valid, createdAt: new Date(iso) }]);
  });
});
