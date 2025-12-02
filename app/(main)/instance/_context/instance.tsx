'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInstance } from '../_hooks/instance';
import { Instance } from '../../instances/_lib/instances.d';

interface InstanceContextValue {
  name: string | null;
  instance: Instance | undefined;
  isLoading: boolean;
  isError: any;
  mutate: () => Promise<any>;
}

const InstanceContext = createContext<InstanceContextValue | undefined>(
  undefined,
);

function InstanceProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { instance, isLoading, isError, mutate } = useInstance(name);

  const value: InstanceContextValue = {
    name,
    instance,
    isLoading,
    isError,
    mutate,
  };

  return (
    <InstanceContext.Provider value={value}>
      {children}
    </InstanceContext.Provider>
  );
}

export function InstanceProvider({ children }: { children: ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <InstanceProviderInner>{children}</InstanceProviderInner>
    </React.Suspense>
  );
}

export function useInstanceContext() {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error('useInstanceContext must be used within InstanceProvider');
  }
  return context;
}
