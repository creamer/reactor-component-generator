import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

const asString = (raw: unknown) => (typeof raw === 'string' ? raw : null);

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 있으면 그 값으로 시작한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));

    const { result } = renderHook(() => usePersistentState('k', asString, 'fallback'));

    expect(result.current[0]).toBe('saved');
  });

  it('값이 바뀌면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', asString, 'fallback'));

    act(() => {
      result.current[1]('changed');
    });

    expect(localStorage.getItem('k')).toBe('"changed"');
  });

  it('파싱에 실패한 저장값은 마운트만으로 덮어쓰지 않는다', () => {
    localStorage.setItem('k', JSON.stringify(123));

    const { result } = renderHook(() => usePersistentState('k', asString, 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(localStorage.getItem('k')).toBe('123');
  });
});
