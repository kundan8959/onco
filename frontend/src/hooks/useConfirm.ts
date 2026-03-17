import { useCallback, useRef } from 'react';
import { closeConfirm, openConfirm } from '../store/uiSlice';
import { useAppDispatch } from '../store/hooks';

export function useConfirm() {
  const dispatch = useAppDispatch();
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((payload: { title: string; message: string; confirmText?: string; cancelText?: string }) => {
    dispatch(openConfirm(payload));
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [dispatch]);

  const resolveConfirm = useCallback((value: boolean) => {
    if (resolverRef.current) resolverRef.current(value);
    resolverRef.current = null;
    dispatch(closeConfirm());
  }, [dispatch]);

  return { confirm, resolveConfirm };
}
