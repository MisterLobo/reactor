import { useEffect, useState } from 'react';

export function useDebounce(cb: (...args: any) => void, delay: number) {
  const [debounceValue, setDebounceValue] = useState<(...args: any) => void>(cb);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(cb);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [cb, delay]);
  return debounceValue;
}