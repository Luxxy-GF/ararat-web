'use client';

import { SWRConfig, type Cache } from 'swr';
import { useEffect, useRef } from 'react';

export default function SwrProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<Map<string, unknown> | null>(null);
  const provider = (initialCache?: Readonly<Cache<unknown>>) => {
    if (!mapRef.current) {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('app-cache') || '[]') as [
            string,
            unknown,
          ][];
          mapRef.current = new Map<string, unknown>(saved);
        } catch {
          mapRef.current = new Map<string, unknown>();
        }
      } else {
        mapRef.current = new Map<string, unknown>();
      }
    }
    if (initialCache && mapRef.current) {
      try {
        for (const [k, v] of initialCache as unknown as Iterable<[string, unknown]>) {
          mapRef.current.set(k, v);
        }
      } catch {}
    }

    return mapRef.current as unknown as Cache<unknown>;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const onBeforeUnload = () => {
      const map = mapRef.current;
      if (!map) return;
      try {
        const appCache = JSON.stringify(Array.from(map.entries()));
        localStorage.setItem('app-cache', appCache);
      } catch {}
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return (
    <SWRConfig
      value={{
        provider,
      }}
    >
      {children}
    </SWRConfig>
  );
}
