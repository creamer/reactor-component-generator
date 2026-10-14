import { describe, it, expect } from 'vitest';
import { addToPromptHistory, MAX_PROMPT_HISTORY } from './promptHistory';

describe('addToPromptHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToPromptHistory(['첫 번째'], '두 번째')).toEqual(['두 번째', '첫 번째']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToPromptHistory(['b', 'a', 'c'], 'a')).toEqual(['a', 'b', 'c']);
  });

  it('최대 개수를 넘으면 가장 오래된 항목부터 버린다', () => {
    const full = Array.from({ length: MAX_PROMPT_HISTORY }, (_, i) => `p${i}`);

    const result = addToPromptHistory(full, 'new');

    expect(result).toHaveLength(MAX_PROMPT_HISTORY);
    expect(result[0]).toBe('new');
    expect(result).not.toContain(`p${MAX_PROMPT_HISTORY - 1}`);
  });
});
