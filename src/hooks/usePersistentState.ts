import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export function usePersistentState<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(() => readStorage(key, parse, fallback));

  useEffect(() => {
    writeStorage(key, state);
  }, [key, state]);

  return [state, setState];
}
