import { useCallback, useState } from 'react';

type AsyncFn<TArgs extends any[], TResult> = (...args: TArgs) => Promise<TResult>;

export function useApiLoader<TArgs extends any[], TResult>(fn: AsyncFn<TArgs, TResult>) {
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (...args: TArgs) => {
    setLoading(true);
    try {
      return await fn(...args);
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { loading, run, setLoading };
}
