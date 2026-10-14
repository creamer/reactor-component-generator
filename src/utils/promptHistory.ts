export const MAX_PROMPT_HISTORY = 10;

export function addToPromptHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((item) => item !== prompt)].slice(0, MAX_PROMPT_HISTORY);
}
