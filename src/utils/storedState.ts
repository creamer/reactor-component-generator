import { PROVIDERS } from '../types';
import type { GeneratedComponent, Provider } from '../types';

export function parseProvider(raw: unknown): Provider | null {
  return PROVIDERS.find((provider) => provider === raw) ?? null;
}

export function parseComponents(raw: unknown): GeneratedComponent[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.flatMap((item): GeneratedComponent[] => {
    if (typeof item !== 'object' || item === null) return [];
    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') return [];
    if (typeof createdAt !== 'string') return [];
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return [];
    return [{ id, prompt, code, createdAt: date }];
  });
}

export function parsePromptHistory(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((item): item is string => typeof item === 'string');
}
