import { useState, useEffect, useRef, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export function usePersistentState<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(() => readStorage(key, parse, fallback));
  // 세터를 거친 변경만 저장한다. 마운트만으로 쓰면 파싱에 실패한 저장값이 기본값으로 지워진다.
  const changed = useRef(false);

  const setPersisted: Dispatch<SetStateAction<T>> = useCallback((value) => {
    changed.current = true;
    setState(value);
  }, []);

  useEffect(() => {
    if (changed.current) writeStorage(key, state);
  }, [key, state]);

  return [state, setPersisted];
}
