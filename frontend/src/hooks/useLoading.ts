import { useCallback } from 'react';
import { startLoading, stopLoading } from '../store/uiSlice';
import { useAppDispatch } from '../store/hooks';

export function useLoading() {
  const dispatch = useAppDispatch();

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>) => {
    dispatch(startLoading());
    try {
      return await fn();
    } finally {
      dispatch(stopLoading());
    }
  }, [dispatch]);

  return { withLoading };
}
