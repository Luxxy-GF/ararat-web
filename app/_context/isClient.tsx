'use client';

import { createContext, ReactNode, useEffect, useState } from 'react';

const IsClientContext = createContext(false);

export function IsClientProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const animationFrame =
      typeof window !== 'undefined' ? window.requestAnimationFrame(() => setIsClient(true)) : null;

    return () => {
      if (animationFrame !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return <IsClientContext value={isClient}>{children}</IsClientContext>;
}

export default IsClientContext;
