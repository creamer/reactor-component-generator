export const MAX_PROMPT_LENGTH = 500;

export interface PromptValidation {
  valid: boolean;
  error?: string;
}

// 이모지 같은 서로게이트 쌍이 2자로 계산되지 않도록 코드포인트 기준으로 센다.
export function countChars(text: string): number {
  return [...text].length;
}

export function validatePrompt(prompt: string): PromptValidation {
  if (countChars(prompt.trim()) > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력해주세요.` };
  }
  return { valid: true };
}
