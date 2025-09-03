import { useState, useEffect } from 'react';

export const usePersistedState = <T>(key: string, defaultValue: T) => {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) as T : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};