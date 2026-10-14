import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/storage';

const ISO = '2026-10-14T04:30:00.000Z';

const storedComponents = [
  { id: '1', prompt: '첫 번째', code: 'render(<A />)', createdAt: ISO },
  { id: '2', prompt: '두 번째', code: 'render(<B />)', createdAt: ISO },
];

function savedComponents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.components) ?? 'null');
}

describe('useComponentGenerator 저장·복원', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('저장된 컴포넌트 목록을 복원하고 createdAt을 Date로 되돌린다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(storedComponents));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(2);
    expect(result.current.components[0].createdAt).toEqual(new Date(ISO));
  });

  it('컴포넌트를 삭제하면 저장소에도 반영한다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(storedComponents));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => {
      result.current.removeComponent('1');
    });

    expect(savedComponents().map((c: { id: string }) => c.id)).toEqual(['2']);
  });

  it('생성에 성공하면 새 컴포넌트를 맨 앞에 두고 저장한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'render(<New />)' }) }),
    );
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(storedComponents));
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('새 프롬프트', undefined, 'google');
    });

    await waitFor(() => expect(savedComponents()).toHaveLength(3));
    expect(savedComponents()[0].prompt).toBe('새 프롬프트');
  });
});
