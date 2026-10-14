export const STORAGE_KEYS = {
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export function readStorage<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T,
): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return parse(JSON.parse(stored)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과나 저장소 차단 시에도 앱은 메모리 상태로 계속 동작해야 한다.
  }
}
