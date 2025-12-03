'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useInstance } from '../_hooks/instance';
import { Instance } from '../../instances/_lib/instances.d';
import { InstanceProvider as MainInstanceProvider } from 'ararat-ui-web/context/instance/instance';
import InstanceClass from '../../_lib/instance';

interface InstanceContextValue {
  name: string | null;
  instance: Instance | undefined;
  isLoading: boolean;
  isError: any;
  isValidating: boolean;
  mutate: () => Promise<any>;
}

const InstanceContext = createContext<InstanceContextValue>({
  name: null,
  instance: undefined,
  isLoading: true,
  isError: null,
  isValidating: true,
  mutate: async () => {},
});

function InstanceProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { instance, isLoading, isError, mutate, isValidating } =
    useInstance(name);

  const value: InstanceContextValue = {
    name,
    instance,
    isLoading,
    isError,
    isValidating,
    mutate,
  };
  const [inst, setInst] = useState<InstanceClass | null>(null);

  useEffect(() => {
    if (instance) {
      setInst(new InstanceClass(instance.name));
    }
  }, [instance]);

  return (
    <InstanceContext.Provider value={value}>
      <MainInstanceProvider
        value={{
          instance: inst,
          isLoading,
          isValidating: isValidating,
          isError: null,
        }}
      >
        {children}
      </MainInstanceProvider>
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
