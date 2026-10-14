import { describe, it, expect } from 'vitest';
import { validatePrompt, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('정확히 500자인 프롬프트는 유효하다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
    expect(validatePrompt('a'.repeat(500))).toEqual({ valid: true });
  });

  it('500자를 넘으면 유효하지 않고 오류 메시지를 반환한다', () => {
    const result = validatePrompt('a'.repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('프롬프트는 500자 이하로 입력해주세요.');
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    expect(validatePrompt(`  ${'a'.repeat(500)}  `)).toEqual({ valid: true });
  });

  it('이모지 같은 서로게이트 쌍 문자도 1자로 센다', () => {
    expect(validatePrompt('😀'.repeat(500))).toEqual({ valid: true });
    expect(validatePrompt('😀'.repeat(501)).valid).toBe(false);
  });
});
