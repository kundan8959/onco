import { createContext, ReactNode, useContext, useMemo, useRef, useState } from 'react';

type GlobalLoaderContextValue = {
  loading: boolean;
  pendingCount: number;
  begin: () => void;
  end: () => void;
  track: <T>(promise: Promise<T>) => Promise<T>;
};

const GlobalLoaderContext = createContext<GlobalLoaderContextValue>({
  loading: false,
  pendingCount: 0,
  begin: () => {},
  end: () => {},
  track: async <T,>(promise: Promise<T>) => promise,
});

let externalBegin: (() => void) | null = null;
let externalEnd: (() => void) | null = null;

export function notifyGlobalLoadStart() {
  externalBegin?.();
}

export function notifyGlobalLoadEnd() {
  externalEnd?.();
}

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const pendingRef = useRef(0);

  const begin = () => {
    pendingRef.current += 1;
    setPendingCount(pendingRef.current);
  };

  const end = () => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    setPendingCount(pendingRef.current);
  };

  externalBegin = begin;
  externalEnd = end;

  const value = useMemo<GlobalLoaderContextValue>(() => ({
    loading: pendingCount > 0,
    pendingCount,
    begin,
    end,
    track: async <T,>(promise: Promise<T>) => {
      begin();
      try {
        return await promise;
      } finally {
        end();
      }
    },
  }), [pendingCount]);

  return <GlobalLoaderContext.Provider value={value}>{children}</GlobalLoaderContext.Provider>;
}

export function useGlobalLoader() {
  return useContext(GlobalLoaderContext);
}
